export type RolStaff = 'admin' | 'cajero' | 'vendedor';

export interface UsuarioSesion {
  id: string;
  correo: string;
  nombre: string;
  rol: RolStaff;
}

const ETIQUETA_ROL: Record<RolStaff, string> = {
  admin: 'Administrador',
  cajero: 'Cajero',
  vendedor: 'Vendedor',
};

export function etiquetaRol(rol: RolStaff): string {
  return ETIQUETA_ROL[rol];
}

/** Iniciales para el avatar: "Angel Hernández" → "AH". */
export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}
