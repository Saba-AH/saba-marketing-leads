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
 * Integration against real Postgres (docker-compose): the unique index on the
 * email and the list order only exist in the database.
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

  it('creates a lead and returns it in the list', async () => {
    const created = await request(app.getHttpServer())
      .post('/leads')
      .send({ name: 'Ana', email: 'Ana@Saba.com', source: 'web' });

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      name: 'Ana',
      email: 'ana@saba.com',
      source: 'web',
    });

    const listing = await request(app.getHttpServer()).get('/leads');

    expect(listing.status).toBe(200);
    expect(listing.body.data).toHaveLength(1);
  });

  it('answers 409 with the domain message if the email already exists', async () => {
    await request(app.getHttpServer())
      .post('/leads')
      .send({ name: 'Ana', email: 'ana@saba.com' });

    const duplicate = await request(app.getHttpServer())
      .post('/leads')
      .send({ name: 'Ana bis', email: 'ANA@saba.com' });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toMatchObject({
      success: false,
      code: 'LEADS_DUPLICATE_EMAIL',
      error: 'Ya existe un lead con ese correo.',
    });
  });

  it('answers 400 if the body does not meet the contract', async () => {
    const response = await request(app.getHttpServer())
      .post('/leads')
      .send({ name: '', email: 'not-an-email' });

    expect(response.status).toBe(400);
  });
});
