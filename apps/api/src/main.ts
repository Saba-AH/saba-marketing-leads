import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config as loadEnv } from 'dotenv';
import helmet from 'helmet';
import 'reflect-metadata';
import { AppModule } from './app.module';
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

/**
 * Orígenes permitidos. El cliente es SSR en su propio servicio de Cloud Run,
 * así que el navegador es lo único que llama a esta API: CORS es la frontera
 * real, no un detalle de configuración.
 */
function allowedOrigins(): string[] {
  return (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3002')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(StructuredLogger));

  // El cliente usa baseURL .../api + paths /v1/... → /api/v1/health
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ZodValidationPipe());

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

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
  const baseUrl = `http://localhost:${port}`;
  console.log(
    [
      '',
      `  API:     ${baseUrl}/api/v1`,
      `  Swagger: ${baseUrl}/api/docs`,
      `  Health:  ${baseUrl}/api/v1/health`,
      `  Base:    ${redactDatabaseUrl(resolveDatabaseUrl())}`,
      '',
    ].join('\n')
  );

  const logger = app.get(StructuredLogger);
  logger.log(`API escuchando en http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger: http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`Health:  http://localhost:${port}/api/v1/health`, 'Bootstrap');
  // Que quede a la vista contra qué base corre: confundir Docker con
  // Supabase es el error caro.
  logger.log(
    `Base:    ${process.env.DATABASE ? 'DATABASE explícita' : `DB_TARGET=${dbTarget()}`} → ${redactDatabaseUrl(resolveDatabaseUrl())}`,
    'Bootstrap'
  );
}
bootstrap();
