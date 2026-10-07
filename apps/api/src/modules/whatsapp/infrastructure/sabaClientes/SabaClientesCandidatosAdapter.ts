import { Inject, Injectable } from '@nestjs/common';
import type { SabaClientesReaderPort } from '../../../sabaClientes/application/ports/SabaClientesReaderPort';
import { SABA_CLIENTES_TOKENS } from '../../../sabaClientes/tokens';
import type { ClienteSabaReaderPort } from '../../application/ports/out/ClienteSabaReaderPort';

@Injectable()
export class SabaClientesCandidatosAdapter implements ClienteSabaReaderPort {
  constructor(
    @Inject(SABA_CLIENTES_TOKENS.Reader)
    private readonly clientes: SabaClientesReaderPort
  ) {}

  async candidatosPorTelefono(waId: string): Promise<string[]> {
    const candidatos = await this.clientes.buscarPorTelefono(waId);
    return candidatos.map((cliente) => cliente.id);
  }
}
