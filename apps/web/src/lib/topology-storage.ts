import { runtimeTopologySchema, type RuntimeTopology } from '@crispy/shared';

const STORAGE_KEY = 'topology';

export function saveTopologyToStorage(topology: RuntimeTopology): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(topology));
    } catch {
        // Ignore errors (private browsing mode, storage quota exceeded, etc.)
    }
}

export function loadTopologyFromStorage(): RuntimeTopology | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = runtimeTopologySchema.safeParse(JSON.parse(raw) as unknown);
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}
