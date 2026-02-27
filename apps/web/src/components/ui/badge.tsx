import { cn } from '@/lib/utils';

export function Badge({
  className,
  tone = 'default',
  children,
}: {
  className?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}) {
  return (
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
}
