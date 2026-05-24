import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1d4ed8',
};

export const metadata: Metadata = {
  title: 'HotelScope — ホテル料金市場調査',
  description: 'ホテル土地仕入れ判断のための周辺料金市場調査システム',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HotelScope',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'HotelScope — ホテル料金市場調査',
    description: 'ホテル土地仕入れ判断のための周辺料金市場調査システム',
    type: 'website',
    locale: 'ja_JP',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} h-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
