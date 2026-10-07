import type { TUsuarioSesion } from '@repo/schemas';
import { HttpResponse, http } from 'msw';
import { BACKEND_URL } from '@/__tests__/mocks/backendUrl';

export const usuarioSesionFixture: TUsuarioSesion = {
  id: 'u-1',
  correo: 'angel.hernandez@sabatransporte.com',
  nombre: 'Angel Hernández',
  rol: 'admin',
};

export const sessionHandlers = [
  http.get(`${BACKEND_URL}/v1/me`, () =>
    HttpResponse.json({ success: true, data: usuarioSesionFixture })
  ),
  http.post(
    'http://localhost/api/session/logout',
    () => new HttpResponse(null, { status: 204 })
  ),
];
