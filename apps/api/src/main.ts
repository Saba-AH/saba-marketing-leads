import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config as loadEnv } from 'dotenv';
import helmet from 'helmet';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { allowedOrigins } from './infrastructure/bootstrap/allowedOrigins';
import {
  shouldColor,
  startupBanner,
} from './infrastructure/bootstrap/startupBanner';
import {
  dbTarget,
  redactDatabaseUrl,
  resolveDatabaseUrl,
} from './infrastructure/database/databaseUrl';
import { registerUncaughtErrorHandlers } from './infrastructure/logging/registerUncaughtErrorHandlers';
import { StructuredLogger } from './infrastructure/logging/StructuredLogger';
import { ZodValidationPipe } from './shared/pipes/zodValidationPipe';

// `nest start` corre desde apps/api (cwd) o desde dist/; cubrimos ambos.
loadEnv({ path: resolve(process.cwd(), '.env') });
loadEnv({ path: resolve(__dirname, '../.env') });

// Antes de crear la app: un throw durante el bootstrap también debe quedar
// en Error Reporting con traza, no perderse en un stdout sin estructura.
registerUncaughtErrorHandlers(new StructuredLogger());

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(StructuredLogger));

  // `request.ip` es la IP del cliente que reenvía el BFF, no la del BFF: el
  // rate limit del login cuenta por IP (ver TRUST_PROXY_HOPS en .env.example).
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

  // El cliente usa baseURL .../api + paths /v1/... → /api/v1/health
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ZodValidationPipe());

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  // El cliente es SSR en su propio servicio, así que el navegador es lo único
  // que llama a esta API: CORS es la frontera real, no un detalle.
  app.enableCors({
    origin: allowedOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Saba Marketing Leads')
    .setDescription('API de saba-marketing-leads')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    useGlobalPrefix: false,
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT) || 8080;
  await app.listen(port);

  // Para humanos en la terminal: el StructuredLogger de abajo emite JSON (lo
  // que lee el agregador de logs) y las URLs se pierden entre los campos.
  const databaseUrl = resolveDatabaseUrl();
  console.log(
    startupBanner({
      port,
      databaseUrl,
      dbTarget: dbTarget(),
      explicitDatabase: Boolean(process.env.DATABASE),
      panelUrl: allowedOrigins()[0],
      studioUrl: process.env.SUPABASE_STUDIO_URL,
      color: shouldColor(),
    })
  );

  const logger = app.get(StructuredLogger);
  logger.log(`API escuchando en http://localhost:${port}`, 'Bootstrap');
  logger.log(
    `Base: ${process.env.DATABASE ? 'DATABASE explícita' : `DB_TARGET=${dbTarget()}`} → ${redactDatabaseUrl(databaseUrl)}`,
    'Bootstrap'
  );
}
bootstrap();
