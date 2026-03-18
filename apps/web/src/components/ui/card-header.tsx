import type { FC } from 'react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export const CardHeader: FC<React.ComponentProps<'header'>> = ({ className, ...props }) => (
  <header className={cn('border-b border-slate-800 p-4', className)} {...props} />
);
