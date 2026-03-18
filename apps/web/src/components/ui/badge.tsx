import type { FC } from 'react';

import { cn } from '@/lib/utils';

type BadgeProps = {
    className?: string;
    tone?: 'default' | 'success' | 'warning' | 'danger';
    children: React.ReactNode;
};

export const Badge: FC<BadgeProps> = ({
    className,
    tone = 'default',
    children,
}) => (
    <span
        className={cn(
            'inline-flex rounded px-2 py-0.5 text-xs font-medium',
            tone === 'default' && 'bg-slate-800 text-slate-100',
            tone === 'success' && 'bg-emerald-600/30 text-emerald-300',
            tone === 'warning' && 'bg-amber-600/30 text-amber-300',
            tone === 'danger' && 'bg-red-600/30 text-red-300',
            className
        )}
    >
        {children}
    </span>
);
