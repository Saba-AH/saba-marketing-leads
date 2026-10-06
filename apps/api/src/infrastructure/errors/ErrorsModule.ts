import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './DomainExceptionFilter';
import { HttpExceptionFilter } from './HttpExceptionFilter';

@Module({
  providers: [
    // Orden importa, e invertido: `RouterExceptionFilters.create()` hace
    // `filters.reverse()` antes de resolver — el primero cuyo `@Catch()`
    // matchee es el que corre. Para que DomainExceptionFilter (específico)
    // se pruebe antes que HttpExceptionFilter (`@Catch()` sin tipo, siempre
    // matchea), acá va provisto DESPUÉS.
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class ErrorsModule {}
