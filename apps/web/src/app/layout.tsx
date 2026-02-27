import type { Metadata } from 'next';

import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
