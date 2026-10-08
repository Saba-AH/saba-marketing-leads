import { API } from '@repo/services';
import { reloadIn } from '@/lib/session/reloadIn';
import { loginPathFor } from '@/lib/session/safeNextPath';

let api: API | null = null;

function goToLogin(): void {
  const { pathname, search } = window.location;
  reloadIn(loginPathFor(`${pathname}${search}`));
}

/**
 * API client for the browser. It does not talk to NestJS directly: it goes to
 * the BFF (`/api/backend/*`), which adds the token from the `httpOnly` cookie.
 * On a 401 the session is no longer valid (the BFF deleted the cookies): back
 * to the login.
 */
export function getAPIClient(): API {
  if (!api) {
    api = new API({ baseURL: '/api/backend', onUnauthorized: goToLogin });
  }
  return api;
}
