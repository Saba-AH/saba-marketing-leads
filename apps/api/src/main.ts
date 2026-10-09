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
  redactDatabaseUrl,
  resolveDatabaseUrl,
} from './infrastructure/database/databaseUrl';
import { registerUncaughtErrorHandlers } from './infrastructure/logging/registerUncaughtErrorHandlers';
import { StructuredLogger } from './infrastructure/logging/StructuredLogger';
import { ZodValidationPipe } from './shared/pipes/zodValidationPipe';

// `nest start` runs from apps/api (cwd) or from dist/; we cover both.
loadEnv({ path: resolve(process.cwd(), '.env') });
loadEnv({ path: resolve(__dirname, '../.env') });

// Before creating the app: a throw during bootstrap must also land in Error
// Reporting with a trace, not get lost in unstructured stdout.
registerUncaughtErrorHandlers(new StructuredLogger());

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    // The WhatsApp webhook signs the exact bytes of the body.
    rawBody: true,
  });
  // Meta sends the chat history in batches that exceed the 100 kb limit.
  app.useBodyParser('json', { limit: '5mb' });
  app.useLogger(app.get(StructuredLogger));

  // `request.ip` is the IP of the client the BFF forwards, not the BFF's: the
  // login rate limit counts per IP (see TRUST_PROXY_HOPS in .env.example).
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

  // The client uses baseURL .../api + paths /v1/... → /api/v1/health
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ZodValidationPipe());

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  // The client is SSR in its own service, so the browser is the only thing that
  // calls this API: CORS is the real boundary, not a detail.
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

  // For humans in the terminal: the StructuredLogger below emits JSON (what the
  // log aggregator reads) and URLs get lost among the fields.
  const databaseUrl = resolveDatabaseUrl();
  console.log(
    startupBanner({
      port,
      databaseUrl,
      panelUrl: allowedOrigins()[0],
      sabaUrl: process.env.SABA_API_URL,
      color: shouldColor(),
    })
  );

  const logger = app.get(StructuredLogger);
  logger.log(`API escuchando en http://localhost:${port}`, 'Bootstrap');
  logger.log(`Base: ${redactDatabaseUrl(databaseUrl)}`, 'Bootstrap');
}
bootstrap();
