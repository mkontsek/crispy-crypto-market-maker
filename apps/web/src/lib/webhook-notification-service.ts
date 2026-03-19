import type { Alert } from './alert-service';

export type AlertWebhookPayload = {
    botId: string;
    botName: string;
    newAlerts: Alert[];
    resolvedAlertIds: string[];
    timestamp: string;
};

/**
 * POSTs an alert webhook payload to the given URL.
 * Throws if the network request fails or the server returns a non-OK status.
 * Callers are expected to catch and log errors.
 */
export async function sendAlertWebhook(
    url: string,
    payload: AlertWebhookPayload
): Promise<void> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`Alert webhook returned HTTP ${response.status}`);
    }
}
