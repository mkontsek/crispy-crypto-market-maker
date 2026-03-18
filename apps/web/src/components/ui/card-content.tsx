import type { FC } from 'react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export const CardContent: FC<React.ComponentProps<'div'>> = ({ className, ...props }) => (
  <div className={cn('p-4', className)} {...props} />
);
