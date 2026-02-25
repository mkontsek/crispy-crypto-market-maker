import type { Metadata } from 'next';

import './styles/index.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    metadataBase: new URL('https://c2m2.sabercrown.com'),
    title: 'Crispy Crypto Market Maker - Professional Trading Dashboard',
    description:
        'Professional crypto market maker dashboard. Advanced trading tools, real-time market data, and intelligent order execution for crypto traders.',
    openGraph: {
        type: 'website',
        url: 'https://c2m2.sabercrown.com/',
        title: 'Crispy Crypto Market Maker - Professional Trading Dashboard',
        description:
            'Professional crypto market maker dashboard. Advanced trading tools, real-time market data, and intelligent order execution for crypto traders.',
        images: [
            {
                url: 'https://c2m2.sabercrown.com/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Crispy Crypto Market Maker - Professional Trading Dashboard',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Crispy Crypto Market Maker - Professional Trading Dashboard',
        description:
            'Professional crypto market maker dashboard. Advanced trading tools, real-time market data, and intelligent order execution for crypto traders.',
        images: ['https://c2m2.sabercrown.com/og-image.jpg'],
    },
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon.ico', type: 'image/x-icon' },
        ],
        apple: [
            {
                url: '/favicon.svg',
                sizes: '180x180',
                type: 'image/svg+xml',
            },
        ],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className="antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
