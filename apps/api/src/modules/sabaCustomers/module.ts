import { Module } from '@nestjs/common';
import { HttpSabaCustomersReader } from './infrastructure/external/HttpSabaCustomersReader';
import { loadSabaConfig } from './infrastructure/sabaConfig';
import { SABA_CUSTOMERS_TOKENS } from './tokens';

/** Read-only catalog of Saba customers, served by Saba's own server. */
@Module({
  providers: [
    {
      provide: SABA_CUSTOMERS_TOKENS.Config,
      useFactory: () => loadSabaConfig(),
    },
    {
      provide: SABA_CUSTOMERS_TOKENS.Reader,
      useClass: HttpSabaCustomersReader,
    },
  ],
  exports: [SABA_CUSTOMERS_TOKENS.Reader],
})
export class SabaCustomersModule {}
