'use client';

import type { FC } from 'react';
import * as React from 'react';

import { TITLE_ID } from './dialog-title';

export { DialogContent } from './dialog-content';
export { DialogHeader } from './dialog-header';
export { DialogTitle } from './dialog-title';

type DialogProps = {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

export const Dialog: FC<DialogProps> = ({ open, onClose, children }) => {
    const panelRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<Element | null>(null);

    React.useEffect(() => {
        if (!open) return;
        triggerRef.current = document.activeElement;
        panelRef.current?.focus();

        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeydown);
        return () => {
            document.removeEventListener('keydown', onKeydown);
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
            <div
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={panelRef}
                tabIndex={-1}
                className="relative z-10 w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl outline-none"
            >
                {children}
            </div>
        </div>
    );
};
