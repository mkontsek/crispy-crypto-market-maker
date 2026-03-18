import type { FC } from 'react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export const DialogContent: FC<React.ComponentProps<'div'>> = ({
    className,
    ...props
}) => (
    <div
        className={cn('space-y-3 text-sm text-slate-300', className)}
        {...props}
    />
);
