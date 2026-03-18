import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    loadTopologyFromStorage,
    saveTopologyToStorage,
} from '../topology-storage';

const VALID_TOPOLOGY = {
    exchangeWsUrl: 'wss://exchange.example.com/stream',
    exchangeHttpUrl: 'https://exchange.example.com',
    bots: [
        {
            id: 'bot-1',
            name: 'Bot 1',
            wsUrl: 'wss://bot-1.example.com/stream',
            httpUrl: 'https://bot-1.example.com',
        },
    ],
};

function makeLocalStorageMock() {
    const store = new Map<string, string>();
    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
            store.set(key, value);
        },
        removeItem: (key: string) => {
            store.delete(key);
        },
        clear: () => {
            store.clear();
        },
        _store: store,
    };
}

describe('saveTopologyToStorage', () => {
    let localStorageMock: ReturnType<typeof makeLocalStorageMock>;

    beforeEach(() => {
        localStorageMock = makeLocalStorageMock();
        vi.stubGlobal('localStorage', localStorageMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('persists topology to localStorage', () => {
        saveTopologyToStorage(VALID_TOPOLOGY);
        expect(localStorage.getItem('topology')).toBe(
            JSON.stringify(VALID_TOPOLOGY)
        );
    });

    it('does not throw when localStorage.setItem throws', () => {
        localStorageMock.setItem = () => {
            throw new Error('storage unavailable');
        };
        expect(() => saveTopologyToStorage(VALID_TOPOLOGY)).not.toThrow();
    });
});

describe('loadTopologyFromStorage', () => {
    let localStorageMock: ReturnType<typeof makeLocalStorageMock>;

    beforeEach(() => {
        localStorageMock = makeLocalStorageMock();
        vi.stubGlobal('localStorage', localStorageMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns null when nothing is stored', () => {
        expect(loadTopologyFromStorage()).toBeNull();
    });

    it('returns a valid topology after it has been saved', () => {
        saveTopologyToStorage(VALID_TOPOLOGY);
        expect(loadTopologyFromStorage()).toEqual(VALID_TOPOLOGY);
    });

    it('returns null when stored data is invalid JSON', () => {
        localStorageMock._store.set('topology', 'not-json{{{');
        expect(loadTopologyFromStorage()).toBeNull();
    });

    it('returns null when stored data fails schema validation', () => {
        localStorageMock._store.set(
            'topology',
            JSON.stringify({ invalid: true })
        );
        expect(loadTopologyFromStorage()).toBeNull();
    });

    it('does not throw when localStorage.getItem throws', () => {
        localStorageMock.getItem = () => {
            throw new Error('storage unavailable');
        };
        expect(() => loadTopologyFromStorage()).not.toThrow();
        expect(loadTopologyFromStorage()).toBeNull();
    });
});
