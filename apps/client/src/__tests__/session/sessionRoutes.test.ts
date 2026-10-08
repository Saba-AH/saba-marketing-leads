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
  PANEL_URL,
  panelRequest,
  setCookies,
  tokens,
  user,
} from './bffFixtures';

const credentials = {
  email: 'angel.hernandez@sabatransporte.com',
  password: '12345678',
  captchaToken: 'captcha',
};

function params(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

describe('POST /api/session/login', () => {
  it('stores the tokens in httpOnly cookies and only returns the user', async () => {
    server.use(
      http.post(`${API}/v1/auth/login`, () =>
        HttpResponse.json({
          success: true,
          data: { session: tokens(), user },
        })
      )
    );

    const response = await login(
      panelRequest('/api/session/login', {
        method: 'POST',
        body: credentials,
        origin: PANEL_URL,
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: { user } });
    expect(JSON.stringify(body)).not.toContain('access-1');
    const cookies = setCookies(response);
    expect(cookies.get('saba_session')).toMatch(/access-1.*HttpOnly/i);
    expect(cookies.get('saba_refresh')).toMatch(/refresh-1.*HttpOnly/i);
  });

  it('passes the API code through (e.g. account locked) without creating a session', async () => {
    server.use(
      http.post(`${API}/v1/auth/login`, () =>
        HttpResponse.json(
          { success: false, error: 'Bloqueada', code: 'AUTH_ACCOUNT_LOCKED' },
          { status: 423 }
        )
      )
    );

    const response = await login(
      panelRequest('/api/session/login', { method: 'POST', body: credentials })
    );

    expect(response.status).toBe(423);
    expect(await response.json()).toMatchObject({
      code: 'AUTH_ACCOUNT_LOCKED',
    });
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('rejects a POST from another origin', async () => {
    const response = await login(
      panelRequest('/api/session/login', {
        method: 'POST',
        body: credentials,
        origin: 'https://evil.com',
      })
    );

    expect(response.status).toBe(403);
  });
});

describe('POST /api/session/logout', () => {
  it('revokes in the API and deletes the cookies', async () => {
    let authorization: string | null = null;
    server.use(
      http.post(`${API}/v1/auth/logout`, ({ request }) => {
        authorization = request.headers.get('authorization');
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
    expect(authorization).toBe('Bearer access-1');
    expect(setCookies(response).get('saba_session')).toMatch(
      /Expires=Thu, 01 Jan 1970/
    );
  });
});

describe('/api/backend/*', () => {
  it('adds the token from the cookie and returns the API response', async () => {
    let authorization: string | null = null;
    server.use(
      http.get(`${API}/v1/me`, ({ request }) => {
        authorization = request.headers.get('authorization');
        return HttpResponse.json({ success: true, data: user });
      })
    );

    const response = await GET(
      panelRequest('/api/backend/v1/me', {
        cookies: { saba_session: 'access-1' },
      }),
      params(['v1', 'me'])
    );

    expect(response.status).toBe(200);
    expect(authorization).toBe('Bearer access-1');
    expect(await response.json()).toEqual({ success: true, data: user });
  });

  it('does not let requests reach the endpoints that return tokens', async () => {
    const response = await proxyPost(
      panelRequest('/api/backend/v1/auth/refresh', {
        method: 'POST',
        cookies: { saba_session: 'access-1' },
      }),
      params(['v1', 'auth', 'refresh'])
    );

    expect(response.status).toBe(404);
  });

  it('deletes the cookies if the API says the session is no longer valid', async () => {
    server.use(
      http.get(`${API}/v1/me`, () =>
        HttpResponse.json(
          { success: false, error: 'x', code: 'AUTH_INVALID_SESSION' },
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
