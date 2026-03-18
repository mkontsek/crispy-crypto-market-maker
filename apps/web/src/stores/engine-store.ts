import type { EngineStreamPayload, QuoteSnapshot } from '@crispy/shared';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type QuoteHistoryEntry = QuoteSnapshot & {
    status: 'filled' | 'expired';
    timestamp: string;
};

type EngineStore = {
    connected: boolean;
    lastPayload: EngineStreamPayload | null;
    quoteHistory: QuoteHistoryEntry[];
    setConnected: (connected: boolean) => void;
    ingestPayload: (payload: EngineStreamPayload) => void;
};

export const useEngineStore = create<EngineStore>()(
    immer((set) => ({
        connected: false,
        lastPayload: null,
        quoteHistory: [],
        setConnected: (connected) =>
            set((state) => {
                state.connected = connected;
            }),
        ingestPayload: (payload) =>
            set((state) => {
                state.connected = true;
                state.lastPayload = payload;

                const filledPairs = new Set(
                    payload.fills.map((fill) => fill.pair)
                );
                const events: QuoteHistoryEntry[] = payload.quotes.map(
                    (quote) => ({
                        ...quote,
                        status: filledPairs.has(quote.pair)
                            ? 'filled'
                            : 'expired',
                        timestamp: payload.timestamp,
                    })
                );

                state.quoteHistory = [...events, ...state.quoteHistory].slice(
                    0,
                    1_000
                );
            }),
    }))
);
