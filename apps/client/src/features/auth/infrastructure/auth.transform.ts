import type { TUsuarioSesion } from '@repo/schemas';
import type { UsuarioSesion } from '../domain/usuarioSesion.model';

export function toUsuarioSesion(dto: TUsuarioSesion): UsuarioSesion {
  return { id: dto.id, correo: dto.correo, nombre: dto.nombre, rol: dto.rol };
}
