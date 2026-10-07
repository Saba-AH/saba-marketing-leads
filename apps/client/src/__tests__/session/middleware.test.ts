/**
 * @jest-environment node
 */
import { HttpResponse, http } from 'msw';
import { middleware } from '@/middleware';
import { server } from '../mocks/server';
import { API, panelRequest, setCookies, tokens } from './bffFixtures';

function refreshResponds(ok: boolean): void {
  server.use(
    http.post(`${API}/v1/auth/refresh`, () =>
      ok
        ? HttpResponse.json({ success: true, data: tokens('2') })
        : HttpResponse.json(
            { success: false, error: 'x', code: 'AUTH_SESION_INVALIDA' },
            { status: 401 }
          )
    )
  );
}

describe('middleware', () => {
  it('manda al login sin sesión, recordando a dónde iba', async () => {
    const response = await middleware(panelRequest('/chats?id=1'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3002/login?next=%2Fchats%3Fid%3D1'
    );
  });

  it('deja pasar con un access token vigente', async () => {
    const response = await middleware(
      panelRequest('/', { cookies: { saba_session: 'access-1' } })
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('renueva la sesión si solo queda el refresh token', async () => {
    refreshResponds(true);

    const response = await middleware(
      panelRequest('/', { cookies: { saba_refresh: 'refresh-1' } })
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
    const cookies = setCookies(response);
    expect(cookies.get('saba_session')).toMatch(/access-2.*HttpOnly/i);
    expect(cookies.get('saba_refresh')).toMatch(/refresh-2.*SameSite=strict/i);
    // La petición en curso también lleva el token nuevo.
    expect(response.headers.get('x-middleware-request-cookie')).toContain(
      'saba_session=access-2'
    );
  });

  it('cierra la sesión si el refresh token ya no sirve', async () => {
    refreshResponds(false);

    const response = await middleware(
      panelRequest('/leads', { cookies: { saba_refresh: 'refresh-viejo' } })
    );

    expect(response.headers.get('location')).toContain('/login?next=%2Fleads');
    expect(setCookies(response).get('saba_refresh')).toMatch(
      /Expires=Thu, 01 Jan 1970/
    );
  });

  it('responde 401 en vez de redirigir a las llamadas de la API', async () => {
    const response = await middleware(panelRequest('/api/backend/v1/me'));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: 'AUTH_SESION_INVALIDA',
    });
  });

  it('saca del login a quien ya tiene sesión', async () => {
    const response = await middleware(
      panelRequest('/login', { cookies: { saba_session: 'access-1' } })
    );

    expect(response.headers.get('location')).toBe('http://localhost:3002/');
  });
});
