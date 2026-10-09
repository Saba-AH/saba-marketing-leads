import type { TSessionUser } from '@repo/schemas';
import { HttpResponse, http } from 'msw';
import { BACKEND_URL } from '@/__tests__/mocks/backendUrl';

export const sessionUserFixture: TSessionUser = {
  id: 'u-1',
  email: 'angel.hernandez@sabatransporte.com',
  name: 'Angel Hernández',
  role: 'admin',
  permissions: ['marketing:access'],
};

export const sessionHandlers = [
  http.get(`${BACKEND_URL}/v1/me`, () =>
    HttpResponse.json({ success: true, data: sessionUserFixture })
  ),
  http.post(
    'http://localhost/api/session/logout',
    () => new HttpResponse(null, { status: 204 })
  ),
];
