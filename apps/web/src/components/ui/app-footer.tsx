import type { FC } from 'react';

const CURRENT_YEAR = new Date().getFullYear();

export const AppFooter: FC = () => (
    <footer className="mt-8 border-t border-slate-800 py-4 text-center text-sm text-slate-500">
        <span>{CURRENT_YEAR}</span>
        <span className="mx-2">·</span>
        <a
            href="https://sabercrown.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-slate-300"
        >
            sabercrown.com
        </a>
        <span className="mx-2">·</span>
        <a
            href="https://github.com/mkontsek/crispy-crypto-market-maker"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-slate-300"
        >
            GitHub
        </a>
    </footer>
);
