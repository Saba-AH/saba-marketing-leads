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
jest.mock('@/lib/session/reloadIn', () => ({
  reloadIn: (path: string) => assign(path),
}));

beforeAll(() => {
  // jsdom has no matchMedia (the sidebar uses it to detect mobile).
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
    <AppShell defaultOpen sidebarFooter={<UserMenu />}>
      <p>contenido</p>
    </AppShell>
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    pathname = '/';
    assign.mockClear();
  });

  it('shows the general navigation and highlights the current route', () => {
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

  it('shows who holds the session', async () => {
    renderShell();

    expect(await screen.findByText('Angel Hernández')).toBeInTheDocument();
    expect(
      screen.getByText('angel.hernandez@sabatransporte.com')
    ).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('ends the session and goes back to the login', async () => {
    let closed = false;
    server.use(
      http.post('http://localhost/api/session/logout', () => {
        closed = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'));
    expect(closed).toBe(true);
  });
});
