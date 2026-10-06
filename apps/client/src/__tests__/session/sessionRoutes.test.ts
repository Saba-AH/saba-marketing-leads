/**
 * @jest-environment node
 */
import { HttpResponse, http } from 'msw';
import { GET, POST as proxyPost } from '@/app/api/backend/[...path]/route';
import { POST as login } from '@/app/api/session/login/route';
import { POST as logout } from '@/app/api/session/logout/route';
import { server } from '../mocks/server';
import {
  API,
  PANEL,
  panelRequest,
  setCookies,
  tokens,
  usuario,
} from './bffFixtures';

const credenciales = {
  correo: 'angel.hernandez@sabatransporte.com',
  contrasena: '12345678',
  captchaToken: 'captcha',
};

function params(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

describe('POST /api/session/login', () => {
  it('guarda los tokens en cookies httpOnly y solo devuelve el usuario', async () => {
    server.use(
      http.post(`${API}/v1/auth/login`, () =>
        HttpResponse.json({
          success: true,
          data: { sesion: tokens(), usuario },
        })
      )
    );

    const response = await login(
      panelRequest('/api/session/login', {
        method: 'POST',
        body: credenciales,
        origin: PANEL,
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: { usuario } });
    expect(JSON.stringify(body)).not.toContain('access-1');
    const cookies = setCookies(response);
    expect(cookies.get('saba_session')).toMatch(/access-1.*HttpOnly/i);
    expect(cookies.get('saba_refresh')).toMatch(/refresh-1.*HttpOnly/i);
  });

  it('pasa el código de la API (p. ej. cuenta bloqueada) sin crear sesión', async () => {
    server.use(
      http.post(`${API}/v1/auth/login`, () =>
        HttpResponse.json(
          { success: false, error: 'Bloqueada', code: 'AUTH_CUENTA_BLOQUEADA' },
          { status: 423 }
        )
      )
    );

    const response = await login(
      panelRequest('/api/session/login', { method: 'POST', body: credenciales })
    );

    expect(response.status).toBe(423);
    expect(await response.json()).toMatchObject({
      code: 'AUTH_CUENTA_BLOQUEADA',
    });
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('rechaza un POST de otro origen', async () => {
    const response = await login(
      panelRequest('/api/session/login', {
        method: 'POST',
        body: credenciales,
        origin: 'https://evil.com',
      })
    );

    expect(response.status).toBe(403);
  });
});

describe('POST /api/session/logout', () => {
  it('revoca en la API y borra las cookies', async () => {
    let autorizacion: string | null = null;
    server.use(
      http.post(`${API}/v1/auth/logout`, ({ request }) => {
        autorizacion = request.headers.get('authorization');
        return new HttpResponse(null, { status: 204 });
      })
    );

    const response = await logout(
      panelRequest('/api/session/logout', {
        method: 'POST',
        cookies: { saba_session: 'access-1', saba_refresh: 'refresh-1' },
      })
    );

    expect(response.status).toBe(204);
    expect(autorizacion).toBe('Bearer access-1');
    expect(setCookies(response).get('saba_session')).toMatch(
      /Expires=Thu, 01 Jan 1970/
    );
  });
});

describe('/api/backend/*', () => {
  it('agrega el token de la cookie y devuelve la respuesta de la API', async () => {
    let autorizacion: string | null = null;
    server.use(
      http.get(`${API}/v1/me`, ({ request }) => {
        autorizacion = request.headers.get('authorization');
        return HttpResponse.json({ success: true, data: usuario });
      })
    );

    const response = await GET(
      panelRequest('/api/backend/v1/me', {
        cookies: { saba_session: 'access-1' },
      }),
      params(['v1', 'me'])
    );

    expect(response.status).toBe(200);
    expect(autorizacion).toBe('Bearer access-1');
    expect(await response.json()).toEqual({ success: true, data: usuario });
  });

  it('no deja llegar a los endpoints que devuelven tokens', async () => {
    const response = await proxyPost(
      panelRequest('/api/backend/v1/auth/refresh', {
        method: 'POST',
        cookies: { saba_session: 'access-1' },
      }),
      params(['v1', 'auth', 'refresh'])
    );

    expect(response.status).toBe(404);
  });

  it('borra las cookies si la API dice que la sesión ya no vale', async () => {
    server.use(
      http.get(`${API}/v1/me`, () =>
        HttpResponse.json(
          { success: false, error: 'x', code: 'AUTH_SESION_INVALIDA' },
          { status: 401 }
        )
      )
    );

    const response = await GET(
      panelRequest('/api/backend/v1/me', {
        cookies: { saba_session: 'revocado' },
      }),
      params(['v1', 'me'])
    );

    expect(response.status).toBe(401);
    expect(setCookies(response).get('saba_session')).toMatch(
      /Expires=Thu, 01 Jan 1970/
    );
  });
});
