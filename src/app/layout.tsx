import type { Metadata, Viewport } from 'next';

import { Providers } from '@/app/providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'GoldMiner Control',
  description: 'Monitoring and control dashboard for the MT5 GoldMiner trading system',
  applicationName: 'GoldMiner Control',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'GoldMiner',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  // Lets the layout paint under the notch and home indicator on iOS.
  viewportFit: 'cover',
  themeColor: '#0a0c10',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
