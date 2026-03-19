import type { FC } from 'react';
import type { Metadata } from 'next';

import './globals.css';
import { AppFooter } from '@/components/ui/app-footer';
import { Providers } from './providers';

const metadataBase = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : new URL('http://localhost:3008');

export const metadata: Metadata = {
    metadataBase,
    title: 'Crispy Crypto Market Maker',
    description: 'Market making control plane for simulated crypto venues.',
    openGraph: {
        title: 'Crispy Crypto Market Maker',
        description: 'Market making control plane for simulated crypto venues.',
        images: ['/og-image.jpg'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Crispy Crypto Market Maker',
        description: 'Market making control plane for simulated crypto venues.',
        images: ['/og-image.jpg'],
    },
};

type RootLayoutProps = Readonly<{ children: React.ReactNode }>;

const RootLayout: FC<RootLayoutProps> = ({ children }) => {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
                <AppFooter />
            </body>
        </html>
    );
};

export default RootLayout;
