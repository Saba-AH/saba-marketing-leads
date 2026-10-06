import type { AuthenticatedUser } from './AuthSession';
import type { PanelMember } from './panelAccess';

export function toAuthenticatedUser(member: PanelMember): AuthenticatedUser {
  return {
    id: member.id,
    correo: member.correo,
    nombre: `${member.nombre} ${member.apellido}`.trim(),
    rol: member.rol,
  };
}
