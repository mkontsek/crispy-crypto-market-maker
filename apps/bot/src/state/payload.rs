use rand::{thread_rng, Rng};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use tracing::error;

use crate::models::{
    EngineStreamPayload, ExchangeHealth, ExchangeOrderResponse, Fill, InventorySnapshot,
    PnLSnapshot, QuoteSnapshot, EXCHANGES,
};
use crate::utils::{
    apply_ratio, chrono_string, normalize_inventory, quote_notional, quote_notional_rate,
};

use super::EngineState;

impl EngineState {
    /// Process fill responses from the exchange and build the stream payload.
    pub fn build_payload(
        &mut self,
        exchange_fills: Vec<ExchangeOrderResponse>,
    ) -> EngineStreamPayload {
        let mut rng = thread_rng();
        let mut quotes = Vec::new();
        let mut fills = Vec::new();
        let mut inventory = Vec::new();
        let mut exchange_health = Vec::new();
        let now = chrono_string();

        // Process fills received from the exchange.
        for fill_resp in exchange_fills {
            if !fill_resp.filled {
                continue;
            }
            let Some(pair) = self.pairs.get_mut(&fill_resp.pair) else {
                continue;
            };

            let taker_buy = fill_resp.side == "sell";
            let fill_price = fill_resp.fill_price;
            let fill_size = fill_resp.fill_size;
            let realized_spread = if taker_buy {
                fill_price - pair.mid
            } else {
                pair.mid - fill_price
            };

            if taker_buy {
                pair.inventory -= fill_size;
            } else {
                pair.inventory += fill_size;
            }

            if fill_resp.adverse_selection {
                self.adverse_fills = self.adverse_fills.saturating_add(1);
            }

            self.fill_seq = self.fill_seq.saturating_add(1);
            self.total_fills = self.total_fills.saturating_add(1);
            self.total_realized_spread += quote_notional(realized_spread, fill_size);

            fills.push(Fill {
                id: format!("fill-{}", self.fill_seq),
                pair: fill_resp.pair.clone(),
                side: if taker_buy { "sell" } else { "buy" }.to_string(),
                price: fill_price,
                size: fill_size,
                mid: pair.mid,
                realized_spread,
                adverse_selection: fill_resp.adverse_selection,
                timestamp: now.clone(),
            });
        }

        for cfg in &self.config.pairs {
            let Some(pair) = self.pairs.get_mut(&cfg.pair) else {
                continue;
            };

            if !cfg.enabled {
                pair.paused = true;
            }

            if pair.paused {
                quotes.push(QuoteSnapshot {
                    pair: cfg.pair.clone(),
                    bid: pair.bid,
                    ask: pair.ask,
                    mid: pair.mid,
                    spread_bps: pair.spread_bps,
                    inventory_skew: pair.inventory_skew,
                    quote_refresh_rate: pair.quote_refresh_rate,
                    volatility: pair.volatility,
                    paused: true,
                    updated_at: now.clone(),
                });
                inventory.push(InventorySnapshot {
                    pair: cfg.pair.clone(),
                    inventory: pair.inventory,
                    normalized_skew: normalize_inventory(pair.inventory, cfg.max_inventory),
                    timestamp: now.clone(),
                });
                continue;
            }

            if pair.inventory.abs() > cfg.max_inventory {
                pair.paused = true;
                error!("inventory limit breached for {}", cfg.pair);
            }

            if cfg.hedging_enabled && pair.inventory.abs() > cfg.hedge_threshold {
                let hedging_cost = quote_notional_rate(pair.mid, pair.inventory.abs(), 1, 10_000);
                self.hedging_costs += hedging_cost;
                pair.inventory = apply_ratio(pair.inventory, 55, 100);
            }

            quotes.push(QuoteSnapshot {
                pair: cfg.pair.clone(),
                bid: pair.bid,
                ask: pair.ask,
                mid: pair.mid,
                spread_bps: pair.spread_bps,
                inventory_skew: pair.inventory_skew,
                quote_refresh_rate: pair.quote_refresh_rate,
                volatility: pair.volatility,
                paused: pair.paused,
                updated_at: now.clone(),
            });

            inventory.push(InventorySnapshot {
                pair: cfg.pair.clone(),
                inventory: pair.inventory,
                normalized_skew: normalize_inventory(pair.inventory, cfg.max_inventory),
                timestamp: now.clone(),
            });

            // Simulate exchange connectivity metrics (bot's perspective of the exchange).
            for exchange in EXCHANGES {
                let feed_staleness_ms = if self.exchange_connected {
                    Decimal::from(rng.gen_range(50..1200)) / dec!(10)
                } else {
                    Decimal::from(rng.gen_range(1800..5000)) / dec!(10)
                };
                exchange_health.push(ExchangeHealth {
                    pair: cfg.pair.clone(),
                    exchange: exchange.to_string(),
                    tick_latency_ms: Decimal::from(rng.gen_range(40..260)) / dec!(10),
                    feed_staleness_ms,
                    connected: feed_staleness_ms < dec!(180),
                });
            }
        }

        let fill_rate = if self.total_quotes == 0 {
            Decimal::ZERO
        } else {
            Decimal::from(self.total_fills) / Decimal::from(self.total_quotes)
        };
        let adverse_selection_rate = if self.total_fills == 0 {
            Decimal::ZERO
        } else {
            Decimal::from(self.adverse_fills) / Decimal::from(self.total_fills)
        };

        let pnl = PnLSnapshot {
            timestamp: now.clone(),
            total_pnl: self.total_realized_spread - self.hedging_costs,
            realized_spread: self.total_realized_spread,
            hedging_costs: self.hedging_costs,
            adverse_selection_rate,
            fill_rate,
        };

        EngineStreamPayload {
            timestamp: now,
            quotes,
            fills,
            inventory,
            pnl,
            exchange_health,
            config: self.config.clone(),
        }
    }
}
