import type { BotId, Strategy } from '@crispy/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type QuotesCacheData = { strategy: Strategy } & Record<string, unknown>;

export function useStrategyMutation(botId: BotId) {
    const queryClient = useQueryClient();
    const botQuery = encodeURIComponent(botId);
    const queryKey = ['quotes', botId] as const;

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
        onMutate: async (strategy: Strategy) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData<QuotesCacheData>(queryKey);
            queryClient.setQueryData<QuotesCacheData>(queryKey, (old) =>
                old ? { ...old, strategy } : old
            );
            return { previous };
        },
        onError: (_err, _strategy, context) => {
            if (context?.previous !== undefined) {
                queryClient.setQueryData(queryKey, context.previous);
            }
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey }),
    });
}
