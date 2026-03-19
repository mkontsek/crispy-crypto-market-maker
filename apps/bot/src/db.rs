use sqlx::PgPool;
use tracing::{error, warn};
use uuid::Uuid;

use crate::models::EngineStreamPayload;

/// Demo retention guardrail: each append-only table keeps at most this many rows.
const MAX_ROWS_PER_TABLE: i64 = 50_000;

/// Returns the configured bot ID from the `BOT_ID` environment variable.
/// Falls back to `"bot"` if the variable is unset or empty.
pub fn bot_id() -> String {
    std::env::var("BOT_ID")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "bot".to_string())
}

/// Write a system log entry to the database.
/// `level` must be one of `"info"`, `"warn"`, or `"error"`.
/// Errors are logged via tracing but never propagated — DB failures must not disrupt the bot.
pub async fn write_system_log(pool: &PgPool, bot_id: &str, level: &str, message: &str) {
    if !matches!(level, "info" | "warn" | "error") {
        warn!("[db] write_system_log: invalid level '{level}' — skipping");
        return;
    }
    if let Err(err) = sqlx::query(
        r#"INSERT INTO "SystemLog" (id, "botId", level, message) VALUES ($1, $2, $3::"LogLevel", $4)"#,
    )
    .bind(Uuid::new_v4().to_string())
    .bind(bot_id)
    .bind(level)
    .bind(message)
    .execute(pool)
    .await
    {
        warn!("[db] write_system_log error: {err}");
    }

    if let Err(err) = prune_oldest_rows(pool, "SystemLog").await {
        warn!("[db] prune SystemLog error: {err}");
    }
}

/// Convert a `rust_decimal::Decimal` to `f64`, logging a warning on failure.
fn dec_to_f64(value: rust_decimal::Decimal, field: &str) -> f64 {
    f64::try_from(value).unwrap_or_else(|err| {
        warn!("[db] decimal conversion failed for field '{field}': {err} — storing 0.0");
        0.0
    })
}

/// Connect to Postgres using the `DATABASE_URL` environment variable.
/// Returns `None` if the variable is unset or empty, or if the connection fails.
pub async fn connect_from_env() -> Option<PgPool> {
    let url = std::env::var("DATABASE_URL")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())?;

    match PgPool::connect(&url).await {
        Ok(pool) => {
            tracing::info!("db: connected to postgres");
            Some(pool)
        }
        Err(err) => {
            warn!("db: failed to connect to postgres — DB writes disabled: {err}");
            None
        }
    }
}

/// Write fills, quotes, inventory, and PnL for a single tick to the database.
/// Errors are logged but never propagate — DB failures must not crash the bot.
pub async fn persist_payload(pool: &PgPool, bot_id: &str, payload: &EngineStreamPayload) {
    let mut tasks: Vec<tokio::task::JoinHandle<()>> = Vec::new();

    if !payload.fills.is_empty() {
        let pool = pool.clone();
        let bot_id = bot_id.to_string();
        let fills = payload.fills.clone();
        tasks.push(tokio::spawn(async move {
            if let Err(err) = write_fills(&pool, &bot_id, &fills).await {
                error!("[db] write_fills error: {err}");
            }
        }));
    }

    if !payload.quotes.is_empty() {
        let pool = pool.clone();
        let bot_id = bot_id.to_string();
        let quotes = payload.quotes.clone();
        tasks.push(tokio::spawn(async move {
            if let Err(err) = write_quotes(&pool, &bot_id, &quotes).await {
                error!("[db] write_quotes error: {err}");
            }
        }));
    }

    if !payload.inventory.is_empty() {
        let pool = pool.clone();
        let bot_id = bot_id.to_string();
        let inventory = payload.inventory.clone();
        tasks.push(tokio::spawn(async move {
            if let Err(err) = write_inventory(&pool, &bot_id, &inventory).await {
                error!("[db] write_inventory error: {err}");
            }
        }));
    }

    {
        let pool = pool.clone();
        let bot_id = bot_id.to_string();
        let pnl = payload.pnl.clone();
        tasks.push(tokio::spawn(async move {
            if let Err(err) = write_pnl(&pool, &bot_id, &pnl).await {
                error!("[db] write_pnl error: {err}");
            }
        }));
    }

    {
        let pool = pool.clone();
        tasks.push(tokio::spawn(async move {
            let tables = ["Fill", "Quote", "Inventory", "PnLSnapshot"];
            for table in tables {
                if let Err(err) = prune_oldest_rows(&pool, table).await {
                    warn!("[db] prune {table} error: {err}");
                }
            }
        }));
    }

    for task in tasks {
        let _ = task.await;
    }
}

async fn prune_oldest_rows(
    pool: &PgPool,
    table: &'static str,
) -> Result<(), sqlx::Error> {
    let query = format!(
        r#"
        WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (ORDER BY "createdAt" DESC, id DESC) AS row_num
            FROM "{table}"
        )
        DELETE FROM "{table}"
        WHERE id IN (
            SELECT id FROM ranked WHERE row_num > $1
        )
        "#
    );

    sqlx::query(&query)
        .bind(MAX_ROWS_PER_TABLE)
        .execute(pool)
        .await?;
    Ok(())
}

async fn write_fills(
    pool: &PgPool,
    bot_id: &str,
    fills: &[crate::models::Fill],
) -> Result<(), sqlx::Error> {
    for fill in fills {
        sqlx::query(
            r#"
            INSERT INTO "Fill" (id, "botId", pair, side, price, size, "midAtFill", "realizedSpread", "adverseSelection")
            VALUES ($1, $2, $3, $4::"Side", $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO NOTHING
            "#,
        )
        .bind(fill.id.to_string())
        .bind(bot_id)
        .bind(&fill.pair)
        .bind(fill.side.as_str())
        .bind(dec_to_f64(fill.price, "fill.price"))
        .bind(dec_to_f64(fill.size, "fill.size"))
        .bind(dec_to_f64(fill.mid, "fill.mid"))
        .bind(dec_to_f64(fill.realized_spread, "fill.realized_spread"))
        .bind(fill.adverse_selection)
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn write_quotes(
    pool: &PgPool,
    bot_id: &str,
    quotes: &[crate::models::QuoteSnapshot],
) -> Result<(), sqlx::Error> {
    for quote in quotes {
        sqlx::query(
            r#"
            INSERT INTO "Quote" (id, "botId", pair, bid, ask, mid, "spreadBps", "inventorySkew", "quoteRefreshRate")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            "#,
        )
        .bind(Uuid::new_v4().to_string())
        .bind(bot_id)
        .bind(&quote.pair)
        .bind(dec_to_f64(quote.bid, "quote.bid"))
        .bind(dec_to_f64(quote.ask, "quote.ask"))
        .bind(dec_to_f64(quote.mid, "quote.mid"))
        .bind(dec_to_f64(quote.spread_bps, "quote.spread_bps"))
        .bind(dec_to_f64(quote.inventory_skew, "quote.inventory_skew"))
        .bind(dec_to_f64(quote.quote_refresh_rate, "quote.quote_refresh_rate"))
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn write_inventory(
    pool: &PgPool,
    bot_id: &str,
    inventory: &[crate::models::InventorySnapshot],
) -> Result<(), sqlx::Error> {
    for snap in inventory {
        sqlx::query(
            r#"
            INSERT INTO "Inventory" (id, "botId", pair, inventory, "normalizedSkew")
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(Uuid::new_v4().to_string())
        .bind(bot_id)
        .bind(&snap.pair)
        .bind(dec_to_f64(snap.inventory, "inventory.inventory"))
        .bind(dec_to_f64(snap.normalized_skew, "inventory.normalized_skew"))
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn write_pnl(
    pool: &PgPool,
    bot_id: &str,
    pnl: &crate::models::PnLSnapshot,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO "PnLSnapshot" (id, "botId", "totalPnl", "realizedSpread", "hedgingCosts", "adverseSelectionRate", "fillRate")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        "#,
    )
    .bind(Uuid::new_v4().to_string())
    .bind(bot_id)
    .bind(dec_to_f64(pnl.total_pnl, "pnl.total_pnl"))
    .bind(dec_to_f64(pnl.realized_spread, "pnl.realized_spread"))
    .bind(dec_to_f64(pnl.hedging_costs, "pnl.hedging_costs"))
    .bind(dec_to_f64(pnl.adverse_selection_rate, "pnl.adverse_selection_rate"))
    .bind(dec_to_f64(pnl.fill_rate, "pnl.fill_rate"))
    .execute(pool)
    .await?;
    Ok(())
}
