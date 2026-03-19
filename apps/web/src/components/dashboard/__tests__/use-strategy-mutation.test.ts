import type { ReactNode } from 'react';
import { createElement } from 'react';
import type { BotId, Strategy } from '@crispy/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    applyOptimisticStrategy,
    useStrategyMutation,
} from '../use-strategy-mutation';

type QuotesData = {
    strategy: Strategy;
    connected: boolean;
    quotes: unknown[];
    quoteHistory: unknown[];
    exchangeHealth: unknown[];
    config: null;
    killSwitchEngaged: boolean;
    botId: BotId;
    updatedAt: string | null;
};

function createWrapper(client: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client }, children);
    };
}

function baseQuotes(botId: BotId): QuotesData {
    return {
        strategy: 'balanced',
        connected: true,
        quotes: [],
        quoteHistory: [],
        exchangeHealth: [],
        config: null,
        killSwitchEngaged: false,
        botId,
        updatedAt: null,
    };
}

type DeferredFetchResponse = {
    ok: boolean;
    json: () => Promise<{ strategy: Strategy }>;
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useStrategyMutation', () => {
    it('keeps optimistic strategy while stale server payload arrives', async () => {
        const botId = 'bot-1' as BotId;
        const queryKey = ['quotes', botId] as const;
        const queryClient = new QueryClient();
        queryClient.setQueryData(queryKey, baseQuotes(botId));

        let resolveFetch: ((value: DeferredFetchResponse) => void) | undefined;
        vi.stubGlobal(
            'fetch',
            vi.fn().mockImplementation(
                () =>
                    new Promise<DeferredFetchResponse>((resolve) => {
                        resolveFetch = resolve;
                    })
            )
        );

        const { result } = renderHook(() => useStrategyMutation(botId), {
            wrapper: createWrapper(queryClient),
        });
        result.current.mutate('aggressive');

        await waitFor(() => {
            const cached = queryClient.getQueryData<QuotesData>(queryKey);
            expect(cached?.strategy).toBe('aggressive');
        });

        const staleServerData = applyOptimisticStrategy(botId, {
            ...baseQuotes(botId),
            strategy: 'balanced' as Strategy,
        });
        expect(staleServerData.strategy).toBe('aggressive');

        expect(resolveFetch).toBeTypeOf('function');
        resolveFetch?.({
            ok: true,
            json: vi.fn().mockResolvedValue({ strategy: 'aggressive' }),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const postConfirm = applyOptimisticStrategy(botId, {
            ...baseQuotes(botId),
            strategy: 'aggressive' as Strategy,
        });
        expect(postConfirm.strategy).toBe('aggressive');

        const noLongerOverridden = applyOptimisticStrategy(botId, {
            ...baseQuotes(botId),
            strategy: 'balanced' as Strategy,
        });
        expect(noLongerOverridden.strategy).toBe('balanced');
    });

    it('rolls back strategy cache when request fails', async () => {
        const botId = 'bot-2' as BotId;
        const queryKey = ['quotes', botId] as const;
        const queryClient = new QueryClient();
        queryClient.setQueryData(queryKey, baseQuotes(botId));

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

        const { result } = renderHook(() => useStrategyMutation(botId), {
            wrapper: createWrapper(queryClient),
        });
        result.current.mutate('aggressive');

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        const cached = queryClient.getQueryData<QuotesData>(queryKey);
        expect(cached?.strategy).toBe('balanced');

        const afterError = applyOptimisticStrategy(botId, {
            ...baseQuotes(botId),
            strategy: 'balanced' as Strategy,
        });
        expect(afterError.strategy).toBe('balanced');
    });
});
