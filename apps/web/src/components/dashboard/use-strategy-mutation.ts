import type { BotId, Strategy } from '@crispy/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type QuotesCacheData = { strategy: Strategy } & Record<string, unknown>;

type StrategyMutationResult = {
    strategy?: Strategy;
} & Record<string, unknown>;

const optimisticStrategyByBot = new Map<BotId, Strategy>();

export function applyOptimisticStrategy<T extends { strategy: Strategy }>(
    botId: BotId,
    data: T
): T {
    const optimistic = optimisticStrategyByBot.get(botId);
    if (!optimistic) {
        return data;
    }
    if (data.strategy === optimistic) {
        optimisticStrategyByBot.delete(botId);
        return data;
    }
    return { ...data, strategy: optimistic };
}

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
            return (await response.json()) as StrategyMutationResult;
        },
        onMutate: async (strategy: Strategy) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData<QuotesCacheData>(queryKey);
            optimisticStrategyByBot.set(botId, strategy);
            queryClient.setQueryData<QuotesCacheData>(queryKey, (old) =>
                old ? { ...old, strategy } : old
            );
            return { previous };
        },
        onError: (_err, _strategy, context) => {
            optimisticStrategyByBot.delete(botId);
            if (context?.previous !== undefined) {
                queryClient.setQueryData(queryKey, context.previous);
            }
        },
        onSuccess: (data, strategy) => {
            const confirmed = data.strategy ?? strategy;
            optimisticStrategyByBot.set(botId, confirmed);
            queryClient.setQueryData<QuotesCacheData>(queryKey, (old) =>
                old ? { ...old, strategy: confirmed } : old
            );
            queryClient.invalidateQueries({ queryKey });
        },
    });
}
