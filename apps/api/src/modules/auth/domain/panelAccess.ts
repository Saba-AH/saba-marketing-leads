import type { TStaffRole } from '@repo/schemas';
import { isStaffRole, type StaffProfile } from './StaffProfile';

/**
 * Who, besides having a staff role, can get into this panel. Being Saba staff
 * is not enough: the panel is for marketing. This is the only place where it
 * is decided: the module injects it (`AUTH_TOKENS.PanelAllowedEmails`) into the
 * login and into the guard on every request.
 */
export const PANEL_ALLOWED_EMAILS: readonly string[] = [
  'angel.hernandez@sabatransporte.com',
];

export type PanelMember = StaffProfile & { role: TStaffRole };

export function canEnterPanel(
  profile: StaffProfile,
  allowedEmails: readonly string[]
): profile is PanelMember {
  return (
    isStaffRole(profile.role) &&
    allowedEmails.includes(profile.email.trim().toLowerCase())
  );
}
