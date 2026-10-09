import { HttpResponse, http } from 'msw';
import React from 'react';
import { LoginPage } from '@/features/auth/ui/pages/LoginPage';
import { server } from '../mocks/server';
import { render, screen, userEvent, waitFor } from '../test-utils/test-utils';

const replace = jest.fn();
const resetCaptcha = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

// Cloudflare does not load in jsdom: the widget hands over a token directly.
jest.mock('@/features/auth/ui/hooks/useTurnstile', () => ({
  useTurnstile: () => ({
    containerRef: { current: null },
    token: 'captcha-ok',
    reset: resetCaptcha,
  }),
}));

const LOGIN_URL = 'http://localhost/api/session/login';

async function enter(email: string, password: string): Promise<void> {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Correo electrónico'), email);
  await user.type(screen.getByLabelText('Contraseña'), password);
  await user.click(screen.getByRole('button', { name: 'Ingresar al panel' }));
}

function loginResponds(status: number, body: Record<string, unknown>): void {
  server.use(http.post(LOGIN_URL, () => HttpResponse.json(body, { status })));
}

describe('LoginPage', () => {
  beforeEach(() => {
    replace.mockClear();
    resetCaptcha.mockClear();
  });

  it('logs in and goes back to the requested route', async () => {
    let sent: unknown;
    server.use(
      http.post(LOGIN_URL, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({
          success: true,
          data: {
            user: {
              id: 'u-1',
              email: 'angel.hernandez@sabatransporte.com',
              name: 'Angel Hernández',
              role: 'admin',
              permissions: ['marketing:access'],
            },
          },
        });
      })
    );
    render(<LoginPage next="/chats" />);

    await enter('Angel.Hernandez@sabatransporte.com', '12345678');

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/chats'));
    expect(sent).toEqual({
      email: 'angel.hernandez@sabatransporte.com',
      password: '12345678',
      captchaToken: 'captcha-ok',
    });
  });

  it('shows the error, clears the password and asks for another CAPTCHA', async () => {
    loginResponds(401, {
      success: false,
      error: 'Credenciales inválidas. Verifica tu correo y contraseña.',
      code: 'AUTH_INVALID_CREDENTIALS',
    });
    render(<LoginPage next="/" />);

    await enter('angel.hernandez@sabatransporte.com', 'mala');

    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent('Credenciales inválidas');
    expect(notice.className).toContain('bg-error-100');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    expect(resetCaptcha).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows the account lockout as a warning', async () => {
    loginResponds(423, {
      success: false,
      error: 'Tu cuenta fue bloqueada por intentos fallidos.',
      code: 'AUTH_ACCOUNT_LOCKED',
    });
    render(<LoginPage next="/" />);

    await enter('angel.hernandez@sabatransporte.com', '12345678');

    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent('bloqueada');
    expect(notice.className).toContain('bg-warning-50');
  });

  it('validates before calling the server', async () => {
    const called = jest.fn();
    server.use(
      http.post(LOGIN_URL, () => {
        called();
        return HttpResponse.json({});
      })
    );
    const user = userEvent.setup();
    render(<LoginPage next="/" />);

    await user.click(screen.getByRole('button', { name: 'Ingresar al panel' }));

    expect(
      await screen.findByText('El correo no es válido.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('La contraseña es obligatoria.')
    ).toBeInTheDocument();
    expect(called).not.toHaveBeenCalled();
  });
});
