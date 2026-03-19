use axum::Json;
use rust_decimal::Decimal;

use crate::{
    models::{ExchangeOrderResponse, OrderSide},
    state::EngineState,
    utils::quote_notional_rate,
};

pub fn update_pair_after_hedge(
    state: &mut EngineState,
    pair: &str,
    order_response: &ExchangeOrderResponse,
) -> Result<(Decimal, Decimal), Json<serde_json::Value>> {
    let Some(pair_state) = state.pairs.get_mut(pair) else {
        return Err(Json(serde_json::json!({ "error": "unknown pair" })));
    };

    let hedge_cost = quote_notional_rate(
        order_response.fill_price,
        order_response.fill_size,
        8,
        100_000,
    );

    if order_response.filled && order_response.side == OrderSide::Sell {
        pair_state.inventory -= order_response.fill_size;
    }

    if order_response.filled && order_response.side == OrderSide::Buy {
        pair_state.inventory += order_response.fill_size;
    }

    Ok((pair_state.inventory, hedge_cost))
}

#[cfg(test)]
mod tests {
    use axum::Json;
    use rust_decimal::Decimal;
    use rust_decimal_macros::dec;

    use crate::{models::{ExchangeOrderResponse, OrderSide}, state::EngineState};

    use super::update_pair_after_hedge;

    fn make_order_response(side: OrderSide, filled: bool, fill_size: Decimal) -> ExchangeOrderResponse {
        ExchangeOrderResponse {
            pair: "BTC/USDT".to_string(),
            side,
            filled,
            fill_price: dec!(100),
            fill_size,
            adverse_selection: false,
        }
    }

    #[test]
    fn update_pair_after_hedge_reduces_inventory_for_sell_fill() {
        let mut state = EngineState::new();
        state
            .pairs
            .get_mut("BTC/USDT")
            .expect("BTC/USDT should exist in EngineState::new()")
            .inventory = dec!(8);

        let order = make_order_response(OrderSide::Sell, true, dec!(6));
        let (inventory_after, hedge_cost) =
            update_pair_after_hedge(&mut state, "BTC/USDT", &order).expect("known pair");

        assert_eq!(inventory_after, dec!(2));
        assert_eq!(state.pairs["BTC/USDT"].inventory, dec!(2));
        assert!(hedge_cost > Decimal::ZERO);
    }

    #[test]
    fn update_pair_after_hedge_increases_inventory_for_buy_fill() {
        let mut state = EngineState::new();
        state
            .pairs
            .get_mut("BTC/USDT")
            .expect("BTC/USDT should exist in EngineState::new()")
            .inventory = dec!(2);

        let order = make_order_response(OrderSide::Buy, true, dec!(3));
        let (inventory_after, _hedge_cost) =
            update_pair_after_hedge(&mut state, "BTC/USDT", &order).expect("known pair");

        assert_eq!(inventory_after, dec!(5));
        assert_eq!(state.pairs["BTC/USDT"].inventory, dec!(5));
    }

    #[test]
    fn update_pair_after_hedge_keeps_inventory_when_not_filled() {
        let mut state = EngineState::new();
        state
            .pairs
            .get_mut("BTC/USDT")
            .expect("BTC/USDT should exist in EngineState::new()")
            .inventory = dec!(8);

        let order = make_order_response(OrderSide::Sell, false, dec!(6));
        let (inventory_after, _hedge_cost) =
            update_pair_after_hedge(&mut state, "BTC/USDT", &order).expect("known pair");

        assert_eq!(inventory_after, dec!(8));
        assert_eq!(state.pairs["BTC/USDT"].inventory, dec!(8));
    }

    #[test]
    fn update_pair_after_hedge_returns_error_for_unknown_pair() {
        let mut state = EngineState::new();
        let order = make_order_response(OrderSide::Sell, true, dec!(1));

        let result = update_pair_after_hedge(&mut state, "UNKNOWN", &order);
        let Err(Json(payload)) = result else {
            panic!("expected unknown pair error");
        };

        assert_eq!(payload["error"].as_str(), Some("unknown pair"));
    }
}
