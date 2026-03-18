import { describe, expect, it } from 'vitest';

import type { ExchangeHealth, InventorySnapshot, MMConfig, PnLSnapshot, QuoteSnapshot } from '@crispy/shared';

import { deriveAlerts } from '../alert-service';

const baseParams = {
  health: [] as ExchangeHealth[],
  inventory: [] as InventorySnapshot[],
  config: null,
  pnl: null,
  killSwitchEngaged: false,
  quotes: [] as QuoteSnapshot[],
};

describe('deriveAlerts', () => {
  it('returns no alerts when everything is healthy', () => {
    expect(deriveAlerts(baseParams)).toEqual([]);
  });

  it('adds a critical alert when kill switch is engaged', () => {
    const alerts = deriveAlerts({ ...baseParams, killSwitchEngaged: true });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ id: 'kill-switch', severity: 'critical' });
  });

  it('adds a critical alert for disconnected exchange health entries', () => {
    const health: ExchangeHealth[] = [
      { exchange: 'Binance' as const, pair: 'BTC/USDT', connected: false, tickLatencyMs: '0', feedStalenessMs: '0' },
    ];
    const alerts = deriveAlerts({ ...baseParams, health });
    expect(alerts.some((a) => a.id === 'exchange-disconnect' && a.severity === 'critical')).toBe(true);
  });

  it('adds a warning alert for stale feeds (>2000ms)', () => {
    const health: ExchangeHealth[] = [
      { exchange: 'Binance' as const, pair: 'BTC/USDT', connected: true, tickLatencyMs: '0', feedStalenessMs: '3000' },
    ];
    const alerts = deriveAlerts({ ...baseParams, health });
    expect(alerts.some((a) => a.id === 'feed-stale' && a.severity === 'warning')).toBe(true);
  });

  it('does not alert for feed staleness below threshold', () => {
    const health: ExchangeHealth[] = [
      { exchange: 'Binance' as const, pair: 'BTC/USDT', connected: true, tickLatencyMs: '0', feedStalenessMs: '1000' },
    ];
    const alerts = deriveAlerts({ ...baseParams, health });
    expect(alerts.some((a) => a.id === 'feed-stale')).toBe(false);
  });

  it('adds a critical inventory alert when ratio exceeds 90%', () => {
    const config: MMConfig = { pairs: [{ pair: 'BTC/USDT', maxInventory: '10', baseSpreadBps: '10', volatilityMultiplier: '1', inventorySkewSensitivity: '0.5', quoteRefreshIntervalMs: 500, hedgeThreshold: '5', hedgeExchange: 'Binance', enabled: true, hedgingEnabled: true }] };
    const inventory: InventorySnapshot[] = [{ pair: 'BTC/USDT', inventory: '9.5', normalizedSkew: '0', timestamp: '0' }];
    const alerts = deriveAlerts({ ...baseParams, config, inventory });
    expect(alerts.some((a) => a.id === 'inv-crit-BTC/USDT' && a.severity === 'critical')).toBe(true);
  });

  it('adds a warning inventory alert when ratio is between 75% and 90%', () => {
    const config: MMConfig = { pairs: [{ pair: 'BTC/USDT', maxInventory: '10', baseSpreadBps: '10', volatilityMultiplier: '1', inventorySkewSensitivity: '0.5', quoteRefreshIntervalMs: 500, hedgeThreshold: '5', hedgeExchange: 'Binance', enabled: true, hedgingEnabled: true }] };
    const inventory: InventorySnapshot[] = [{ pair: 'BTC/USDT', inventory: '8', normalizedSkew: '0', timestamp: '0' }];
    const alerts = deriveAlerts({ ...baseParams, config, inventory });
    expect(alerts.some((a) => a.id === 'inv-warn-BTC/USDT' && a.severity === 'warning')).toBe(true);
  });

  it('adds warning for high adverse selection rate', () => {
    const pnl: PnLSnapshot = { timestamp: '0', totalPnl: '0', realizedSpread: '0', hedgingCosts: '0', adverseSelectionRate: '0.5', fillRate: '0.1' };
    const alerts = deriveAlerts({ ...baseParams, pnl });
    expect(alerts.some((a) => a.id === 'adverse-high' && a.severity === 'warning')).toBe(true);
  });

  it('adds warning for very low fill rate', () => {
    const pnl: PnLSnapshot = { timestamp: '0', totalPnl: '0', realizedSpread: '0', hedgingCosts: '0', adverseSelectionRate: '0', fillRate: '0.005' };
    const alerts = deriveAlerts({ ...baseParams, pnl });
    expect(alerts.some((a) => a.id === 'fill-low' && a.severity === 'warning')).toBe(true);
  });

  it('adds warning when all pairs are paused and kill switch is not engaged', () => {
    const quotes: QuoteSnapshot[] = [
      { pair: 'BTC/USDT' as const, bid: '0', ask: '0', mid: '0', spreadBps: '0', inventorySkew: '0', quoteRefreshRate: '0', volatility: '0', paused: true, updatedAt: '' },
    ];
    const alerts = deriveAlerts({ ...baseParams, quotes });
    expect(alerts.some((a) => a.id === 'all-paused' && a.severity === 'warning')).toBe(true);
  });

  it('does not add all-paused warning when kill switch is engaged', () => {
    const quotes: QuoteSnapshot[] = [
      { pair: 'BTC/USDT' as const, bid: '0', ask: '0', mid: '0', spreadBps: '0', inventorySkew: '0', quoteRefreshRate: '0', volatility: '0', paused: true, updatedAt: '' },
    ];
    const alerts = deriveAlerts({ ...baseParams, quotes, killSwitchEngaged: true });
    expect(alerts.some((a) => a.id === 'all-paused')).toBe(false);
  });
});
