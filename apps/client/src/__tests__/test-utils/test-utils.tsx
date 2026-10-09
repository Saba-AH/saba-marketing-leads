import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// -----------------------------------------------------------------------------
// Re-exports React Testing Library and overrides `render` to wrap the tree in
// the global providers. Import this file instead of RTL.
//
// https://testing-library.com/docs/react-testing-library/setup/#custom-render
// -----------------------------------------------------------------------------

/**
 * A new QueryClient per render: no retries and no cache shared between tests,
 * so a test does not see what the previous one left behind.
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
