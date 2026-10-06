import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import localFont from 'next/font/local';
import { ClientProviders } from '@/context/client-providers';
import './globals.css';

/** Tipografía base del panel. */
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

/** Se mantiene solo para bloques monoespaciados. */
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'Saba Marketing Leads',
  description: 'Panel de leads de marketing',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${manrope.variable} ${geistMono.variable}`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
