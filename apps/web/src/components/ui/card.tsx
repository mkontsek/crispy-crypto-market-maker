import type { FC } from 'react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export { CardContent } from './card-content';
export { CardHeader } from './card-header';
export { CardTitle } from './card-title';

export const Card: FC<React.ComponentProps<'section'>> = ({ className, ...props }) => (
  <section
    className={cn('rounded-xl border border-slate-800 bg-slate-950/80', className)}
    {...props}
  />
);
