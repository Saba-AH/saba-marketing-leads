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
    // `{*path}`: comodín de todas las rutas en la sintaxis de path-to-regexp
    // que usa Nest 11. El viejo `'*'` funciona pero Nest lo auto-convierte y
    // avisa con un WARNING en cada arranque.
    consumer.apply(CorrelationIdMiddleware).forRoutes('{*path}');
  }
}
