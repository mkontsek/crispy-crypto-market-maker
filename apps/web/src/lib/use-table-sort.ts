import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

export type SortState = {
    col: string;
    dir: SortDir;
};

export function useTableSort<T>(
    rows: T[],
    defaultCol: string,
    defaultDir: SortDir = 'desc',
) {
    const [sort, setSort] = useState<SortState>({
        col: defaultCol,
        dir: defaultDir,
    });

    const toggle = (col: string) => {
        setSort((prev) =>
            prev.col === col
                ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { col, dir: 'asc' },
        );
    };

    const sorted = useMemo(() => {
        return [...rows].sort((a, b) => {
            const av = (a as Record<string, unknown>)[sort.col];
            const bv = (b as Record<string, unknown>)[sort.col];
            const aNull = av == null;
            const bNull = bv == null;
            if (aNull && bNull) return 0;
            if (aNull) return 1;
            if (bNull) return -1;
            let cmp = 0;
            if (typeof av === 'string' && typeof bv === 'string') {
                cmp = av.localeCompare(bv);
            } else if (typeof av === 'number' && typeof bv === 'number') {
                cmp = av - bv;
            } else if (typeof av === 'boolean' && typeof bv === 'boolean') {
                cmp = Number(av) - Number(bv);
            }
            return sort.dir === 'asc' ? cmp : -cmp;
        });
    }, [rows, sort]);

    return { sort, toggle, sorted };
}
