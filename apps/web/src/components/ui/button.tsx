import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'danger';
};

export function Button({
  className,
  variant = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'default' && 'bg-cyan-400 text-slate-950 hover:bg-cyan-300',
        variant === 'outline' && 'border border-slate-700 bg-slate-900 hover:bg-slate-800',
        variant === 'danger' && 'bg-red-500 text-white hover:bg-red-400',
        className
      )}
      {...props}
    />
  );
}
