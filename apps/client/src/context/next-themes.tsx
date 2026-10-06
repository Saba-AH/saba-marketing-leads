'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    // Siempre claro, como Saba web: sin esto el panel seguía el modo oscuro
    // del sistema operativo. El provider queda para un selector futuro.
    <NextThemesProvider
      attribute="class"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      enableColorScheme
    >
      {children}
    </NextThemesProvider>
  );
}
