import { API } from '@repo/services';
import { recargarEn } from '@/lib/session/recargarEn';
import { loginPathFor } from '@/lib/session/safeNextPath';

let api: API | null = null;

function goToLogin(): void {
  const { pathname, search } = window.location;
  recargarEn(loginPathFor(`${pathname}${search}`));
}

/**
 * Cliente de la API para el navegador. No habla con NestJS directo: va al BFF
 * (`/api/backend/*`), que agrega el token desde la cookie `httpOnly`. Ante un
 * 401 la sesión ya no sirve (el BFF borró las cookies): de vuelta al login.
 */
export function getAPIClient(): API {
  if (!api) {
    api = new API({ baseURL: '/api/backend', onUnauthorized: goToLogin });
  }
  return api;
}
