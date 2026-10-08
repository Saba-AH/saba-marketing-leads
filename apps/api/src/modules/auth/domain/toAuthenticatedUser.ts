import type { AuthenticatedUser } from './AuthSession';
import type { PanelMember } from './panelAccess';

export function toAuthenticatedUser(member: PanelMember): AuthenticatedUser {
  return {
    id: member.id,
    email: member.email,
    name: `${member.name} ${member.lastName}`.trim(),
    role: member.role,
  };
}
