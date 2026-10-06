import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ClientProviders } from '@/context/client-providers';
import './globals.css';

/**
 * La de Saba web, con sus mismos archivos: el Light hace de peso normal, como
 * allá (`saba/src/index.css`).
 */
const antiqueOlive = localFont({
  src: [
    {
      path: './fonts/AntiqueOliveStd-Light.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/AntiqueOliveStd-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-antique-olive',
});

/** Se mantiene solo para bloques monoespaciados. */
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'Saba Marketing Leads',
  description: 'Panel de leads de marketing',
  // Panel interno: nada de esto tiene que aparecer en un buscador.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${antiqueOlive.variable} ${geistMono.variable}`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
