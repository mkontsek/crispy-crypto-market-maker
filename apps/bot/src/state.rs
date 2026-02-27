use std::collections::HashMap;

use rand::{Rng, thread_rng};
use tracing::error;

use crate::models::{
    EXCHANGES, EngineStreamPayload, ExchangeFeedPayload, ExchangeHealth, ExchangeOrderRequest,
    ExchangeOrderResponse, Fill, InventorySnapshot, MMConfig, PAIRS, PairConfig, PnLSnapshot,
    QuoteSnapshot,
};
use crate::utils::{
    apply_ratio, chrono_string, from_price_fp, from_size_fp, normalize_inventory,
    quote_notional_fp, quote_notional_rate_fp, to_price_fp, to_size_fp,
};

#[derive(Clone)]
pub struct PairState {
    pub mid: i64,
    pub bid: i64,
    pub ask: i64,
    pub spread_bps: f64,
    pub inventory: i64,
    pub inventory_skew: i64,
    pub quote_refresh_rate: f64,
    pub volatility: f64,
    pub paused: bool,
}

impl PairState {
    pub fn new(mid: f64) -> Self {
        let mid_fp = to_price_fp(mid);
        Self {
            mid: mid_fp,
            bid: mid_fp,
            ask: mid_fp,
            spread_bps: 10.0,
            inventory: 0,
            inventory_skew: 0,
            quote_refresh_rate: 4.0,
            volatility: 1.0,
            paused: false,
        }
    }
}

pub struct EngineState {
    pub config: MMConfig,
    pub pairs: HashMap<String, PairState>,
    /// Whether the bot is currently connected to the exchange.
    pub exchange_connected: bool,
    pub total_realized_spread: i64,
    pub hedging_costs: i64,
    pub total_quotes: u64,
    pub total_fills: u64,
    pub adverse_fills: u64,
    pub fill_seq: u64,
}

impl EngineState {
    pub fn new() -> Self {
        let mut pairs = HashMap::new();
        pairs.insert("BTC/USDT".to_string(), PairState::new(62_000.0));
        pairs.insert("ETH/USDT".to_string(), PairState::new(3_450.0));
        pairs.insert("SOL/USDT".to_string(), PairState::new(140.0));

        let config = MMConfig {
            pairs: PAIRS
                .iter()
                .map(|pair| PairConfig {
                    pair: (*pair).to_string(),
                    base_spread_bps: 10.0,
                    volatility_multiplier: 1.15,
                    max_inventory: 6.0,
                    inventory_skew_sensitivity: 0.35,
                    quote_refresh_interval_ms: 250,
                    enabled: true,
                    hedging_enabled: true,
                    hedge_threshold: 4.5,
                    hedge_exchange: "Bybit".to_string(),
                })
                .collect(),
        };

        Self {
            config,
            pairs,
            exchange_connected: false,
            total_realized_spread: 0,
            hedging_costs: 0,
            total_quotes: 0,
            total_fills: 0,
            adverse_fills: 0,
            fill_seq: 0,
        }
    }

    /// Called by the exchange WebSocket listener whenever new market data arrives.
    /// Updates mid prices and volatility for each pair from the exchange feed.
    pub fn update_from_exchange(&mut self, feed: ExchangeFeedPayload) {
        self.exchange_connected = true;
        for pair_data in feed.pairs {
            if let Some(pair) = self.pairs.get_mut(&pair_data.pair) {
                pair.mid = pair_data.mid;
                pair.volatility = pair_data.volatility;
            }
        }
    }

    /// Compute MM quotes and return the list of orders to place on the exchange.
    /// Updates bid/ask/spread in PairState based on current exchange prices + MM config.
    pub fn compute_orders(&mut self) -> Vec<ExchangeOrderRequest> {
        let mut orders = Vec::new();

        for cfg in self.config.pairs.clone() {
            let Some(pair) = self.pairs.get_mut(&cfg.pair) else {
                continue;
            };

            if !cfg.enabled {
                pair.paused = true;
            }

            if pair.paused {
                continue;
            }

            let spread_bps =
                cfg.base_spread_bps * (1.0 + cfg.volatility_multiplier * pair.volatility / 10.0);
            let spread_abs = to_price_fp(from_price_fp(pair.mid) * spread_bps / 10_000.0);

            pair.inventory_skew =
                to_price_fp(-from_size_fp(pair.inventory) * cfg.inventory_skew_sensitivity);
            pair.bid = pair.mid - spread_abs / 2 + pair.inventory_skew;
            pair.ask = pair.mid + spread_abs / 2 + pair.inventory_skew;
            pair.spread_bps = spread_bps;
            pair.quote_refresh_rate = 1_000.0 / cfg.quote_refresh_interval_ms as f64;
            self.total_quotes = self.total_quotes.saturating_add(1);

            // Standard order size sent to exchange each tick.
            let order_size = to_size_fp(0.5);
            orders.push(ExchangeOrderRequest {
                pair: cfg.pair.clone(),
                side: "buy".to_string(),
                price: pair.bid,
                size: order_size,
            });
            orders.push(ExchangeOrderRequest {
                pair: cfg.pair.clone(),
                side: "sell".to_string(),
                price: pair.ask,
                size: order_size,
            });
        }

        orders
    }

    /// Process fill responses from the exchange and build the stream payload.
    pub fn build_payload(&mut self, exchange_fills: Vec<ExchangeOrderResponse>) -> EngineStreamPayload {
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
            self.total_realized_spread = self
                .total_realized_spread
                .saturating_add(quote_notional_fp(realized_spread, fill_size));

            fills.push(Fill {
                id: format!("fill-{}", self.fill_seq),
                pair: fill_resp.pair.clone(),
                side: if taker_buy { "sell" } else { "buy" }.to_string(),
                price: fill_price,
                size: fill_size,
                mid_at_fill: pair.mid,
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

            if pair.inventory.abs() > to_size_fp(cfg.max_inventory) {
                pair.paused = true;
                error!("inventory limit breached for {}", cfg.pair);
            }

            if cfg.hedging_enabled && pair.inventory.abs() > to_size_fp(cfg.hedge_threshold) {
                let hedging_cost =
                    quote_notional_rate_fp(pair.mid, pair.inventory.abs(), 1, 10_000);
                self.hedging_costs = self.hedging_costs.saturating_add(hedging_cost);
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
                    rng.gen_range(5.0..120.0)
                } else {
                    rng.gen_range(180.0..500.0)
                };
                exchange_health.push(ExchangeHealth {
                    pair: cfg.pair.clone(),
                    exchange: exchange.to_string(),
                    tick_latency_ms: rng.gen_range(4.0..26.0),
                    feed_staleness_ms,
                    connected: feed_staleness_ms < 180.0,
                });
            }
        }

        let fill_rate = if self.total_quotes == 0 {
            0.0
        } else {
            self.total_fills as f64 / self.total_quotes as f64
        };
        let adverse_selection_rate = if self.total_fills == 0 {
            0.0
        } else {
            self.adverse_fills as f64 / self.total_fills as f64
        };

        let pnl = PnLSnapshot {
            timestamp: now.clone(),
            total_pnl: self.total_realized_spread.saturating_sub(self.hedging_costs),
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

