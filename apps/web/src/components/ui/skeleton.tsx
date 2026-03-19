import type { FC } from 'react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export const Skeleton: FC<React.ComponentProps<'div'>> = ({
    className,
    ...props
}) => (
    <div
        className={cn('animate-pulse rounded bg-slate-800', className)}
        {...props}
    />
);
