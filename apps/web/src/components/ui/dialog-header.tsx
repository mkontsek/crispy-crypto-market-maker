import type { FC } from 'react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export const DialogHeader: FC<React.ComponentProps<'div'>> = ({
    className,
    ...props
}) => (
    <div
        className={cn('mb-4 flex items-center justify-between', className)}
        {...props}
    />
);
