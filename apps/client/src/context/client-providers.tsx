'use client';

import { ThemeProvider } from './next-themes';
import { QueryClient } from './react-query';

interface ClientProvidersProps {
  children: React.ReactNode;
}

/**
 * Browser providers. Server state is managed by React Query from the client.
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <QueryClient>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClient>
  );
}
