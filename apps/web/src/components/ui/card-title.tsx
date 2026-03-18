import type { FC } from 'react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export const CardTitle: FC<React.ComponentProps<'h2'>> = ({ className, ...props }) => (
  <h2 className={cn('text-sm font-semibold uppercase tracking-wide', className)} {...props} />
);
