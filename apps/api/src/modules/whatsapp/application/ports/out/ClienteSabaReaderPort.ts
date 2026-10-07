/** Lo que el inbox necesita de Saba: a quién podría pertenecer un teléfono. */
export interface ClienteSabaReaderPort {
  /** Ids de `profiles`, el mejor candidato primero. */
  candidatosPorTelefono(waId: string): Promise<string[]>;
}
