import type { BotId } from '@crispy/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PairActionPayload {
    pair: string;
    action: 'pause' | 'hedge';
    paused?: boolean;
}

export function usePairActionMutation(botId: BotId) {
    const queryClient = useQueryClient();
    const botQuery = encodeURIComponent(botId);

    return useMutation({
        mutationFn: async ({ pair, action, paused }: PairActionPayload) => {
            if (action === 'pause') {
                const response = await fetch(
                    `/api/pairs/${encodeURIComponent(pair)}/pause?botId=${botQuery}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paused }),
                    }
                );
                if (!response.ok)
                    throw new Error('failed to update pair pause status');
                return response.json();
            }
            const response = await fetch(`/api/hedge?botId=${botQuery}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pair }),
            });
            if (!response.ok) throw new Error('failed to hedge pair');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes', botId] });
            queryClient.invalidateQueries({ queryKey: ['inventory', botId] });
            queryClient.invalidateQueries({ queryKey: ['pnl', botId] });
            queryClient.invalidateQueries({ queryKey: ['fills', botId] });
        },
    });
}
