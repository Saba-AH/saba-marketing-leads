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

// Cloudflare no carga en jsdom: el widget entrega un token directo.
jest.mock('@/features/auth/ui/hooks/useTurnstile', () => ({
  useTurnstile: () => ({
    containerRef: { current: null },
    token: 'captcha-ok',
    reset: resetCaptcha,
  }),
}));

const LOGIN_URL = 'http://localhost/api/session/login';

async function ingresar(correo: string, contrasena: string): Promise<void> {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Correo electrónico'), correo);
  await user.type(screen.getByLabelText('Contraseña'), contrasena);
  await user.click(screen.getByRole('button', { name: 'Ingresar al panel' }));
}

function loginResponde(status: number, body: Record<string, unknown>): void {
  server.use(http.post(LOGIN_URL, () => HttpResponse.json(body, { status })));
}

describe('LoginPage', () => {
  beforeEach(() => {
    replace.mockClear();
    resetCaptcha.mockClear();
  });

  it('inicia sesión y vuelve a la ruta pedida', async () => {
    let enviado: unknown;
    server.use(
      http.post(LOGIN_URL, async ({ request }) => {
        enviado = await request.json();
        return HttpResponse.json({
          success: true,
          data: {
            usuario: {
              id: 'u-1',
              correo: 'angel.hernandez@sabatransporte.com',
              nombre: 'Angel Hernández',
              rol: 'admin',
            },
          },
        });
      })
    );
    render(<LoginPage next="/chats" />);

    await ingresar('Angel.Hernandez@sabatransporte.com', '12345678');

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/chats'));
    expect(enviado).toEqual({
      correo: 'angel.hernandez@sabatransporte.com',
      contrasena: '12345678',
      captchaToken: 'captcha-ok',
    });
  });

  it('muestra el error, limpia la contraseña y pide otro CAPTCHA', async () => {
    loginResponde(401, {
      success: false,
      error: 'Credenciales inválidas. Verifica tu correo y contraseña.',
      code: 'AUTH_CREDENCIALES_INVALIDAS',
    });
    render(<LoginPage next="/" />);

    await ingresar('angel.hernandez@sabatransporte.com', 'mala');

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('Credenciales inválidas');
    expect(aviso.className).toContain('bg-error-100');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    expect(resetCaptcha).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('muestra el bloqueo de cuenta como advertencia', async () => {
    loginResponde(423, {
      success: false,
      error: 'Tu cuenta fue bloqueada por intentos fallidos.',
      code: 'AUTH_CUENTA_BLOQUEADA',
    });
    render(<LoginPage next="/" />);

    await ingresar('angel.hernandez@sabatransporte.com', '12345678');

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('bloqueada');
    expect(aviso.className).toContain('bg-warning-50');
  });

  it('valida antes de llamar al servidor', async () => {
    const llamado = jest.fn();
    server.use(
      http.post(LOGIN_URL, () => {
        llamado();
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
    expect(llamado).not.toHaveBeenCalled();
  });
});
