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
            { success: false, error: 'x', code: 'AUTH_INVALID_SESSION' },
            { status: 401 }
          )
    )
  );
}

describe('middleware', () => {
  it('sends to the login without a session, remembering where it was going', async () => {
    const response = await middleware(panelRequest('/chats?id=1'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3002/login?next=%2Fchats%3Fid%3D1'
    );
  });

  it('lets through with a valid access token', async () => {
    const response = await middleware(
      panelRequest('/', { cookies: { saba_session: 'access-1' } })
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('renews the session if only the refresh token is left', async () => {
    refreshResponds(true);

    const response = await middleware(
      panelRequest('/', { cookies: { saba_refresh: 'refresh-1' } })
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
    const cookies = setCookies(response);
    expect(cookies.get('saba_session')).toMatch(/access-2.*HttpOnly/i);
    expect(cookies.get('saba_refresh')).toMatch(/refresh-2.*SameSite=strict/i);
    // The in-flight request also carries the new token.
    expect(response.headers.get('x-middleware-request-cookie')).toContain(
      'saba_session=access-2'
    );
  });

  it('ends the session if the refresh token is no longer valid', async () => {
    refreshResponds(false);

    const response = await middleware(
      panelRequest('/leads', { cookies: { saba_refresh: 'refresh-viejo' } })
    );

    expect(response.headers.get('location')).toContain('/login?next=%2Fleads');
    expect(setCookies(response).get('saba_refresh')).toMatch(
      /Expires=Thu, 01 Jan 1970/
    );
  });

  it('answers 401 instead of redirecting API calls', async () => {
    const response = await middleware(panelRequest('/api/backend/v1/me'));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: 'AUTH_INVALID_SESSION',
    });
  });

  it('takes whoever already has a session out of the login', async () => {
    const response = await middleware(
      panelRequest('/login', { cookies: { saba_session: 'access-1' } })
    );

    expect(response.headers.get('location')).toBe('http://localhost:3002/');
  });
});
