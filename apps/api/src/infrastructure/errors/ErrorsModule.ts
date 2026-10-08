import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './DomainExceptionFilter';
import { HttpExceptionFilter } from './HttpExceptionFilter';

@Module({
  providers: [
    // Order matters, and it is inverted: `RouterExceptionFilters.create()` does
    // `filters.reverse()` before resolving — the first one whose `@Catch()`
    // matches is the one that runs. For DomainExceptionFilter (specific) to be
    // tried before HttpExceptionFilter (untyped `@Catch()`, always matches), it is
    // provided AFTER it here.
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class ErrorsModule {}
