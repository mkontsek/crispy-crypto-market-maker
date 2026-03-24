import type { BotId, Strategy } from '@crispy/shared';
import { create } from 'zustand';

// How long to hold the optimistic strategy after selection, giving the bot
// enough time to propagate the new strategy through its tick loop before
// we allow incoming server data to override the displayed value.
export const STRATEGY_LOCK_DURATION_MS = 3_000;

type OptimisticStrategyStore = {
    optimisticStrategyByBot: Record<string, Strategy>;
    strategyLockedUntilByBot: Record<string, number>;
    getOptimisticStrategy: (botId: BotId) => Strategy | undefined;
    isStrategyLocked: (botId: BotId) => boolean;
    setOptimisticStrategy: (botId: BotId, strategy: Strategy) => void;
    clearOptimisticStrategy: (botId: BotId) => void;
    clearAllOptimisticStrategies: () => void;
};

export const useOptimisticStrategyStore = create<OptimisticStrategyStore>()(
    (set, get) => ({
        optimisticStrategyByBot: {},
        strategyLockedUntilByBot: {},
        getOptimisticStrategy: (botId) =>
            get().optimisticStrategyByBot[botId],
        isStrategyLocked: (botId) => {
            const lockedUntil = get().strategyLockedUntilByBot[botId];
            return lockedUntil !== undefined && Date.now() < lockedUntil;
        },
        setOptimisticStrategy: (botId, strategy) =>
            set((state) => ({
                optimisticStrategyByBot: {
                    ...state.optimisticStrategyByBot,
                    [botId]: strategy,
                },
                strategyLockedUntilByBot: {
                    ...state.strategyLockedUntilByBot,
                    [botId]: Date.now() + STRATEGY_LOCK_DURATION_MS,
                },
            })),
        clearOptimisticStrategy: (botId) =>
            set((state) => {
                const nextOptimisticStrategyByBot = {
                    ...state.optimisticStrategyByBot,
                };
                const nextStrategyLockedUntilByBot = {
                    ...state.strategyLockedUntilByBot,
                };
                delete nextOptimisticStrategyByBot[botId];
                delete nextStrategyLockedUntilByBot[botId];
                return {
                    optimisticStrategyByBot: nextOptimisticStrategyByBot,
                    strategyLockedUntilByBot: nextStrategyLockedUntilByBot,
                };
            }),
        clearAllOptimisticStrategies: () =>
            set({ optimisticStrategyByBot: {}, strategyLockedUntilByBot: {} }),
    })
);
