import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca una ruta para saltar el guard de autenticación global cuando exista
 * (p. ej. el health check). Hoy no hay guard: la marca queda puesta para que
 * sumar uno no cierre de golpe las rutas que deben seguir abiertas.
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
