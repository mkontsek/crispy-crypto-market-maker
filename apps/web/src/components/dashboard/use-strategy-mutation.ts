import type { BotId, Strategy } from '@crispy/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useStrategyMutation(botId: BotId) {
    const queryClient = useQueryClient();
    const botQuery = encodeURIComponent(botId);

    return useMutation({
        mutationFn: async (strategy: Strategy) => {
            const response = await fetch(`/api/strategy?botId=${botQuery}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strategy }),
            });
            if (!response.ok) throw new Error('failed to set strategy');
            return response.json();
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['quotes', botId] }),
    });
}
