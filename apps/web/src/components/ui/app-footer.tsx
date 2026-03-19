import type { FC } from 'react';

export const AppFooter: FC = () => (
    <footer className="mt-8 border-t border-slate-800 py-4 text-center text-sm text-slate-500">
        <a
            href="https://sabercrown.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-slate-300"
        >
            sabercrown.com
        </a>
    </footer>
);
