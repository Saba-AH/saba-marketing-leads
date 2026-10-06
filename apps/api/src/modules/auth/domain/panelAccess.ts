import type { TStaffRole } from '@repo/schemas';
import { isStaffRole, type StaffProfile } from './StaffProfile';

/**
 * Quiénes, además de tener rol de staff, pueden entrar a este panel. Ser staff
 * de Saba no alcanza: el panel es de marketing. Es el único lugar donde se
 * decide: el módulo la inyecta (`AUTH_TOKENS.PanelAllowedEmails`) en el login
 * y en el guard de cada petición.
 */
export const PANEL_ALLOWED_EMAILS: readonly string[] = [
  'angel.hernandez@sabatransporte.com',
];

export type PanelMember = StaffProfile & { rol: TStaffRole };

export function canEnterPanel(
  profile: StaffProfile,
  allowedEmails: readonly string[]
): profile is PanelMember {
  return (
    isStaffRole(profile.rol) &&
    allowedEmails.includes(profile.correo.trim().toLowerCase())
  );
}
