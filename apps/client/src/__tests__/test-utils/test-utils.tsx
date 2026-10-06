import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// -----------------------------------------------------------------------------
// Re-exporta React Testing Library y sobreescribe `render` para envolver el
// árbol en los providers globales. Importar este archivo en vez de RTL.
//
// https://testing-library.com/docs/react-testing-library/setup/#custom-render
// -----------------------------------------------------------------------------

/**
 * Un QueryClient nuevo por render: sin reintentos y sin caché compartida entre
 * tests, para que un test no vea lo que dejó el anterior.
 */
function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

type CustomRenderOptions = {
  initialRoute?: string;
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
};

function customRender(ui: React.ReactElement, options?: CustomRenderOptions) {
  const opts = options || {};
  const { initialRoute, renderOptions } = opts;

  if (initialRoute) {
    window.history.pushState({}, 'Initial Route', initialRoute);
  }

  const queryClient = makeTestQueryClient();

  const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <React.Suspense fallback={<div>Loading ...</div>}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </React.Suspense>
  );

  return render(ui, { wrapper: AllProviders, ...renderOptions });
}

export * from '@testing-library/react';
export { customRender as render, userEvent };
