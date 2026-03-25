import type { BotId } from '@crispy/shared';
import type { InventorySnapshot, MMConfig, PnLSnapshot, ExchangeHealth, QuoteSnapshot } from '@crispy/shared';

import { deriveAlerts } from '@/lib/alert-service';
import { sendAlertWebhook } from '@/lib/webhook-notification-service';
import { getRuntimeTopology } from '@/server/runtime-topology';

type AlertDispatchState = {
    exchangeHealth: ExchangeHealth[];
    inventory: InventorySnapshot[];
    config: MMConfig | null;
    pnlHistory: PnLSnapshot[];
    killSwitchEngaged: boolean;
    quotes: QuoteSnapshot[];
    activeAlertIds: Set<string>;
};

/**
 * Compares the current alert set against the previously known active alerts,
 * fires a webhook for newly appeared or resolved alerts, and updates
 * `activeAlertIds` in-place.
 *
 * No-ops when `ALERT_WEBHOOK_URL` is not set.
 */
export function dispatchAlertWebhook(
    botId: BotId,
    timestamp: string,
    state: AlertDispatchState
): void {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) {
        return;
    }

    const currentAlerts = deriveAlerts({
        health: state.exchangeHealth,
        inventory: state.inventory,
        config: state.config,
        pnl: state.pnlHistory[0] ?? null,
        killSwitchEngaged: state.killSwitchEngaged,
        quotes: state.quotes,
    });

    const currentAlertIds = new Set(currentAlerts.map((a) => a.id));
    const previousAlertIds = state.activeAlertIds;

    const newAlerts = currentAlerts.filter((a) => !previousAlertIds.has(a.id));
    const resolvedAlertIds = [...previousAlertIds].filter(
        (id) => !currentAlertIds.has(id)
    );

    state.activeAlertIds = currentAlertIds;

    if (newAlerts.length === 0 && resolvedAlertIds.length === 0) {
        return;
    }

    const botName =
        getRuntimeTopology().bots.find((b) => b.id === botId)?.name ?? botId;

    sendAlertWebhook(webhookUrl, {
        botId,
        botName,
        newAlerts,
        resolvedAlertIds,
        timestamp,
    }).catch((err: unknown) => {
        console.error(`alert webhook failed for ${botId}`, err);
    });
}
