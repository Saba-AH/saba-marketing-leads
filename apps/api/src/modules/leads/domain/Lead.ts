/** Lead tal como vive en el dominio. Ver `@repo/schemas` para el contrato. */
export interface Lead {
  id: string;
  nombre: string;
  correo: string;
  origen: string | null;
  createdAt: Date;
}

/** Insumo de `crear`: valores planos, ya validados en el borde. */
export interface DatosLead {
  nombre: string;
  correo: string;
  origen?: string;
}
