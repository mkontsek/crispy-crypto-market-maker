import type { FC } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type DashboardHeaderNavLinksProps = {
    activePage: 'dashboard' | 'history' | 'monitor';
};

const baseLinkClass =
    'inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border px-3 text-sm font-medium transition';

export const DashboardHeaderNavLinks: FC<DashboardHeaderNavLinksProps> = ({
    activePage,
}) => (
    <div className="flex items-center gap-2">
        <Link
            href="/dashboard"
            aria-current={activePage === 'dashboard' ? 'page' : undefined}
            className={cn(
                baseLinkClass,
                activePage === 'dashboard'
                    ? 'border-cyan-400 bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                    : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
            )}
        >
            Dashboard
        </Link>
        <Link
            href="/history"
            aria-current={activePage === 'history' ? 'page' : undefined}
            className={cn(
                baseLinkClass,
                activePage === 'history'
                    ? 'border-cyan-400 bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                    : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
            )}
        >
            Historical data
        </Link>
        <Link
            href="/monitor"
            aria-current={activePage === 'monitor' ? 'page' : undefined}
            className={cn(
                baseLinkClass,
                activePage === 'monitor'
                    ? 'border-cyan-400 bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                    : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
            )}
        >
            System Monitor
        </Link>
    </div>
);
