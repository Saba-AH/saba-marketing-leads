'use client';

import { ThemeProvider } from './next-themes';
import { QueryClient } from './react-query';

interface ClientProvidersProps {
  children: React.ReactNode;
}

/**
 * Providers de navegador. El estado de servidor lo administra React Query desde
 * el cliente.
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <QueryClient>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClient>
  );
}
