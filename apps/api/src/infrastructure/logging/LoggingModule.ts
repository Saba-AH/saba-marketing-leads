import {
  Global,
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { CorrelationIdMiddleware } from './CorrelationIdMiddleware';
import { StructuredLogger } from './StructuredLogger';

@Global()
@Module({
  providers: [StructuredLogger],
  exports: [StructuredLogger],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // `{*path}`: wildcard for every route in the path-to-regexp syntax Nest 11
    // uses. The old `'*'` works but Nest auto-converts it and logs a WARNING on
    // every startup.
    consumer.apply(CorrelationIdMiddleware).forRoutes('{*path}');
  }
}
