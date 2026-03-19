import type { BotId, Strategy } from '@crispy/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useOptimisticStrategyStore } from '@/stores/optimistic-strategy-store';

type QuotesCacheData = { strategy: Strategy } & Record<string, unknown>;

type StrategyMutationResult = {
    strategy?: Strategy;
} & Record<string, unknown>;

export function applyOptimisticStrategy<T extends { strategy: Strategy }>(
    botId: BotId,
    data: T
): T {
    const store = useOptimisticStrategyStore.getState();
    const optimistic = store.getOptimisticStrategy(botId);

    if (!optimistic) {
        return data;
    }

    // Hold the optimistic value for the full lock window so the bot has time
    // to propagate the new strategy before we let server data take over.
    if (!store.isStrategyLocked(botId) && data.strategy === optimistic) {
        store.clearOptimisticStrategy(botId);
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
            useOptimisticStrategyStore
                .getState()
                .setOptimisticStrategy(botId, strategy);
            queryClient.setQueryData<QuotesCacheData>(queryKey, (old) =>
                old ? { ...old, strategy } : old
            );
            return { previous };
        },
        onError: (_err, _strategy, context) => {
            useOptimisticStrategyStore
                .getState()
                .clearOptimisticStrategy(botId);
            if (context?.previous !== undefined) {
                queryClient.setQueryData(queryKey, context.previous);
            }
        },
        onSuccess: (data, strategy) => {
            const confirmed = data.strategy ?? strategy;
            useOptimisticStrategyStore
                .getState()
                .setOptimisticStrategy(botId, confirmed);
            queryClient.invalidateQueries({ queryKey });
        },
    });
}
