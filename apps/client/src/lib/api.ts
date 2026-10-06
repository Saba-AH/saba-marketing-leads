import { API } from '@repo/services';

let api: API | null = null;

/**
 * Cliente de la API de NestJS.
 *
 * El estado de servidor lo administra React Query desde el navegador, así que
 * este helper se usa en componentes cliente.
 */
export function getAPIClient(token?: string): API {
  const baseURL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api`;
  if (!api) {
    api = new API({ token, baseURL });
  }
  return api;
}
