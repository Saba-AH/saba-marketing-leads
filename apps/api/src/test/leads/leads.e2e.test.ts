import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DrizzleModule } from '../../infrastructure/database/drizzle.module';
import { ErrorsModule } from '../../infrastructure/errors/ErrorsModule';
import { LoggingModule } from '../../infrastructure/logging/LoggingModule';
import { LeadsModule } from '../../modules/leads/module';
import { ZodValidationPipe } from '../../shared/pipes/zodValidationPipe';
import {
  closeTestDb,
  resetDatabase,
  testDatabaseUrl,
} from '../support/testDatabase';

process.env.DATABASE = testDatabaseUrl();

/**
 * Integración contra Postgres real (Supabase local): el índice único del
 * correo y el orden del listado solo existen en la base.
 */
describe('/leads', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule, ErrorsModule, DrizzleModule, LeadsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await closeTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('crea un lead y lo devuelve en el listado', async () => {
    const creado = await request(app.getHttpServer())
      .post('/leads')
      .send({ nombre: 'Ana', correo: 'Ana@Saba.com', origen: 'web' });

    expect(creado.status).toBe(201);
    expect(creado.body.data).toMatchObject({
      nombre: 'Ana',
      correo: 'ana@saba.com',
      origen: 'web',
    });

    const listado = await request(app.getHttpServer()).get('/leads');

    expect(listado.status).toBe(200);
    expect(listado.body.data).toHaveLength(1);
  });

  it('responde 409 con el mensaje de dominio si el correo ya existe', async () => {
    await request(app.getHttpServer())
      .post('/leads')
      .send({ nombre: 'Ana', correo: 'ana@saba.com' });

    const duplicado = await request(app.getHttpServer())
      .post('/leads')
      .send({ nombre: 'Ana bis', correo: 'ANA@saba.com' });

    expect(duplicado.status).toBe(409);
    expect(duplicado.body).toMatchObject({
      success: false,
      code: 'LEADS_CORREO_DUPLICADO',
      error: 'Ya existe un lead con ese correo.',
    });
  });

  it('responde 400 si el body no cumple el contrato', async () => {
    const response = await request(app.getHttpServer())
      .post('/leads')
      .send({ nombre: '', correo: 'no-es-correo' });

    expect(response.status).toBe(400);
  });
});
