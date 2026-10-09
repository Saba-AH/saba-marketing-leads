import React from 'react';
import { HomePage } from '@/features/systemStatus/ui/pages/HomePage';
import { databaseDownHandler } from '../mocks/handlers/health.mock';
import { server } from '../mocks/server';
import { render, screen } from '../test-utils/test-utils';

/**
 * Walks the panel's full path: HTTP intercepted by MSW → parsing with the
 * shared @repo/schemas schema → domain model → screen.
 *
 * Queries are case-sensitive: `operativa` is the summary line and `Operativa`
 * the dependency label.
 */
describe('HomePage', () => {
  it('shows the API as operational and its dependencies', async () => {
    render(<HomePage />);

    expect(await screen.findByText('operativa')).toBeInTheDocument();
    expect(await screen.findByText('Base de datos')).toBeInTheDocument();
    expect(await screen.findByText('Operativa')).toBeInTheDocument();
    expect(await screen.findByText('2 ms')).toBeInTheDocument();
  });

  it('tells apart a dependency that is down from an unreachable API', async () => {
    server.use(databaseDownHandler);

    render(<HomePage />);

    expect(await screen.findByText('con fallas')).toBeInTheDocument();
    expect(await screen.findByText('Caída')).toBeInTheDocument();
    expect(screen.queryByText(/no se pudo contactar/i)).not.toBeInTheDocument();
  });
});
