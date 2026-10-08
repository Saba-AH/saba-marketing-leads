import { Module } from '@nestjs/common';
import { HttpSabaClientesReader } from './infrastructure/external/HttpSabaClientesReader';
import { loadSabaConfig } from './infrastructure/sabaConfig';
import { SABA_CLIENTES_TOKENS } from './tokens';

/** Catálogo de solo lectura de clientes de Saba, servido por el propio servidor de Saba. */
@Module({
  providers: [
    {
      provide: SABA_CLIENTES_TOKENS.Config,
      useFactory: () => loadSabaConfig(),
    },
    { provide: SABA_CLIENTES_TOKENS.Reader, useClass: HttpSabaClientesReader },
  ],
  exports: [SABA_CLIENTES_TOKENS.Reader],
})
export class SabaClientesModule {}
