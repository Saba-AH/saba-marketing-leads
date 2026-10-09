import { Module } from '@nestjs/common';
import { loadSabaApiConfig } from '../../infrastructure/saba/sabaApi';
import { HttpSabaCustomersReader } from './infrastructure/external/HttpSabaCustomersReader';
import { SABA_CUSTOMERS_TOKENS } from './tokens';

/** Read-only catalog of Saba customers, served by Saba's own server. */
@Module({
  providers: [
    {
      provide: SABA_CUSTOMERS_TOKENS.Config,
      useFactory: () => loadSabaApiConfig(),
    },
    {
      provide: SABA_CUSTOMERS_TOKENS.Reader,
      useClass: HttpSabaCustomersReader,
    },
  ],
  exports: [SABA_CUSTOMERS_TOKENS.Reader],
})
export class SabaCustomersModule {}
