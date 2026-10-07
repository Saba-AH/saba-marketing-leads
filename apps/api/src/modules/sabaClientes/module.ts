import { Module } from '@nestjs/common';
import { DrizzleSabaClientesReader } from './infrastructure/persistence/DrizzleSabaClientesReader';
import { SABA_CLIENTES_TOKENS } from './tokens';

/** Catálogo de solo lectura de los clientes de Saba: sin casos de uso, exporta el lector. */
@Module({
  providers: [
    {
      provide: SABA_CLIENTES_TOKENS.Reader,
      useClass: DrizzleSabaClientesReader,
    },
  ],
  exports: [SABA_CLIENTES_TOKENS.Reader],
})
export class SabaClientesModule {}
