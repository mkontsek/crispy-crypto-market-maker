import type { BotId, Strategy } from '@crispy/shared';
import { create } from 'zustand';

type OptimisticStrategyStore = {
    optimisticStrategyByBot: Record<string, Strategy>;
    getOptimisticStrategy: (botId: BotId) => Strategy | undefined;
    setOptimisticStrategy: (botId: BotId, strategy: Strategy) => void;
    clearOptimisticStrategy: (botId: BotId) => void;
    clearAllOptimisticStrategies: () => void;
};

export const useOptimisticStrategyStore = create<OptimisticStrategyStore>()(
    (set, get) => ({
        optimisticStrategyByBot: {},
        getOptimisticStrategy: (botId) =>
            get().optimisticStrategyByBot[botId],
        setOptimisticStrategy: (botId, strategy) =>
            set((state) => ({
                optimisticStrategyByBot: {
                    ...state.optimisticStrategyByBot,
                    [botId]: strategy,
                },
            })),
        clearOptimisticStrategy: (botId) =>
            set((state) => {
                const nextOptimisticStrategyByBot = {
                    ...state.optimisticStrategyByBot,
                };
                delete nextOptimisticStrategyByBot[botId];
                return {
                    optimisticStrategyByBot: nextOptimisticStrategyByBot,
                };
            }),
        clearAllOptimisticStrategies: () => set({ optimisticStrategyByBot: {} }),
    })
);
