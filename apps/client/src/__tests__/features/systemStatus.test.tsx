import React from 'react';
import { HomePage } from '@/features/systemStatus/ui/pages/HomePage';
import { databaseDownHandler } from '../mocks/handlers/health.mock';
import { server } from '../mocks/server';
import { render, screen } from '../test-utils/test-utils';

/**
 * Recorre el camino completo del panel: HTTP interceptado por MSW → parseo con
 * el esquema compartido de @repo/schemas → modelo de dominio → pantalla.
 *
 * Las consultas distinguen mayúscula: `operativa` es la línea de resumen y
 * `Operativa` la etiqueta de la dependencia.
 */
describe('HomePage', () => {
  it('muestra la API operativa y sus dependencias', async () => {
    render(<HomePage />);

    expect(await screen.findByText('operativa')).toBeInTheDocument();
    expect(await screen.findByText('Base de datos')).toBeInTheDocument();
    expect(await screen.findByText('Operativa')).toBeInTheDocument();
    expect(await screen.findByText('2 ms')).toBeInTheDocument();
  });

  it('distingue una dependencia caída de una API inalcanzable', async () => {
    server.use(databaseDownHandler);

    render(<HomePage />);

    expect(await screen.findByText('con fallas')).toBeInTheDocument();
    expect(await screen.findByText('Caída')).toBeInTheDocument();
    expect(screen.queryByText(/no se pudo contactar/i)).not.toBeInTheDocument();
  });
});
