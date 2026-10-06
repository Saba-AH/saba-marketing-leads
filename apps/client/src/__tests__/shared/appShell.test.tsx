import { HttpResponse, http } from 'msw';
import React from 'react';
import { UserMenu } from '@/features/auth/ui/widgets/UserMenu';
import { AppShell } from '@/shared/ui/layouts/AppShell';
import { server } from '../mocks/server';
import { render, screen, userEvent, waitFor } from '../test-utils/test-utils';

let pathname = '/';
jest.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

const assign = jest.fn();
jest.mock('@/lib/session/recargarEn', () => ({
  recargarEn: (path: string) => assign(path),
}));

beforeAll(() => {
  // jsdom no trae matchMedia (lo usa el sidebar para detectar móvil).
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
});

function renderShell(): void {
  render(
    <AppShell defaultOpen pieSidebar={<UserMenu />}>
      <p>contenido</p>
    </AppShell>
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    pathname = '/';
    assign.mockClear();
  });

  it('muestra la navegación general y marca la ruta actual', () => {
    pathname = '/chats';
    renderShell();

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute(
      'href',
      '/'
    );
    const chats = screen.getByRole('link', { name: 'Chats' });
    expect(chats).toHaveAttribute('href', '/chats');
    expect(chats).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('muestra quién tiene la sesión', async () => {
    renderShell();

    expect(await screen.findByText('Angel Hernández')).toBeInTheDocument();
    expect(
      screen.getByText('angel.hernandez@sabatransporte.com')
    ).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('cierra la sesión y vuelve al login', async () => {
    let cerro = false;
    server.use(
      http.post('http://localhost/api/session/logout', () => {
        cerro = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'));
    expect(cerro).toBe(true);
  });
});
