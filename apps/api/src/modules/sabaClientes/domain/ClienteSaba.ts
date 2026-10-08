export interface SolicitudSaba {
  id: string;
  estado: string;
  estadoEtiqueta: string;
  activa: boolean;
  creadaAt: string;
  producto: string | null;
  montoFinanciado: number | null;
  cuota: number | null;
  frecuencia: string | null;
}

/** Lo que Saba considera la información importante de un cliente (identidad + solicitudes). */
export interface ClienteSaba {
  id: string;
  nombre: string;
  cedula: string | null;
  correo: string | null;
  telefono: string | null;
  ciudad: string | null;
  origen: string | null;
  clienteDesde: string | null;
  /** Las últimas 5, la más reciente primero. */
  solicitudes: SolicitudSaba[];
}
