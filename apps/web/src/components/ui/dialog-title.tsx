import type { FC } from 'react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export const TITLE_ID = 'dialog-title';

export const DialogTitle: FC<React.ComponentProps<'h3'>> = ({ className, ...props }) => (
  <h3
    id={TITLE_ID}
    className={cn('text-sm font-semibold uppercase tracking-wide', className)}
    {...props}
  />
);
