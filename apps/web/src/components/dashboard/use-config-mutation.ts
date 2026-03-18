import type { BotId, MMConfig } from '@crispy/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useConfigMutation(botId: BotId) {
    const queryClient = useQueryClient();
    const botQuery = encodeURIComponent(botId);

    return useMutation({
        mutationFn: async (payload: MMConfig) => {
            const response = await fetch(`/api/config?botId=${botQuery}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('failed to update engine config');
            return response.json();
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['quotes', botId] }),
    });
}
