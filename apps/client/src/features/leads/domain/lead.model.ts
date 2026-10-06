export interface Lead {
  id: string;
  nombre: string;
  correo: string;
  origen: string | null;
  createdAt: Date;
}
