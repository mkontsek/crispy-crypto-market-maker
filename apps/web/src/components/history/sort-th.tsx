'use client';

import type { FC } from 'react';

import type { SortDir } from '@/lib/use-table-sort';

type SortThProps = {
    label: string;
    col: string;
    activeCol: string;
    dir: SortDir;
    onSort: (col: string) => void;
    className?: string;
};

export const SortTh: FC<SortThProps> = ({
    label,
    col,
    activeCol,
    dir,
    onSort,
    className,
}) => {
    const isActive = col === activeCol;
    const sortByCol = () => onSort(col);
    return (
        <th
            className={`cursor-pointer select-none ${className ?? ''}`}
            onClick={sortByCol}
            aria-sort={
                isActive
                    ? dir === 'asc'
                        ? 'ascending'
                        : 'descending'
                    : 'none'
            }
        >
            <span className="inline-flex items-center gap-1">
                {label}
                <span
                    className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-600'}`}
                    aria-hidden="true"
                >
                    {isActive ? (dir === 'asc' ? '↑' : '↓') : '↕'}
                </span>
            </span>
        </th>
    );
};
