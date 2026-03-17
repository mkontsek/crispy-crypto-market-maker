'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

const TITLE_ID = 'dialog-title';

export function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<Element | null>(null);

  React.useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    panelRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      (triggerRef.current as HTMLElement | null)?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl outline-none"
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mb-4 flex items-center justify-between', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      id={TITLE_ID}
      className={cn('text-sm font-semibold uppercase tracking-wide', className)}
      {...props}
    />
  );
}

export function DialogContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('space-y-3 text-sm text-slate-300', className)} {...props} />;
}
