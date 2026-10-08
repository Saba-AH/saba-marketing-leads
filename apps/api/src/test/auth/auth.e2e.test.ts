import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { localDatabaseUrl } from '../../infrastructure/database/databaseUrl';
import { DrizzleModule } from '../../infrastructure/database/drizzle.module';
import { ErrorsModule } from '../../infrastructure/errors/ErrorsModule';
import { LoggingModule } from '../../infrastructure/logging/LoggingModule';
import { AuthModule } from '../../modules/auth/module';
import { AUTH_TOKENS } from '../../modules/auth/tokens';
import { HealthModule } from '../../modules/health/module';
import { ZodValidationPipe } from '../../shared/pipes/zodValidationPipe';
import {
  createE2EStaff,
  E2E_STAFF,
  removeE2EStaff,
} from '../support/e2eStaffUser';
import { useLocalAuthEnv } from '../support/localSupabase';

// Against the full local stack: GoTrue really issues and revokes sessions and
// `auth.sessions` lives in the stack's database, not the test one. It uses its
// own user (creates and deletes it) and its own panel access list.
process.env.DATABASE = localDatabaseUrl();
useLocalAuthEnv();

describe('auth (contra Supabase local)', () => {
  let app: INestApplication;
  let captchaOk = true;
  const stack = new Pool({ connectionString: localDatabaseUrl() });

  beforeAll(async () => {
    await createE2EStaff(stack);
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggingModule,
        ErrorsModule,
        DrizzleModule,
        AuthModule,
        HealthModule,
      ],
    })
      // Cloudflare is not called from the tests.
      .overrideProvider(AUTH_TOKENS.CaptchaVerifier)
      .useValue({ verify: async () => captchaOk })
      .overrideProvider(AUTH_TOKENS.PanelAllowedEmails)
      .useValue([E2E_STAFF.email])
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await removeE2EStaff(stack);
    await stack.end();
  });

  function login(
    password: string = E2E_STAFF.password,
    email: string = E2E_STAFF.email
  ) {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password, captchaToken: 'x' });
  }

  it('logs in, identifies the user, refreshes and logs out', async () => {
    const input = await login();
    expect(input.status).toBe(200);
    expect(input.body.data.user).toEqual({
      id: E2E_STAFF.id,
      email: E2E_STAFF.email,
      name: 'E2E Auth',
      role: 'admin',
    });
    const { accessToken, refreshToken } = input.body.data.session;

    const me = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(E2E_STAFF.email);

    const renewed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken });
    expect(renewed.status).toBe(200);
    const newAccess = renewed.body.data.accessToken;

    const output = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${newAccess}`);
    expect(output.status).toBe(204);

    // The JWT is still signed and valid, but its session no longer exists.
    const after = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${newAccess}`);
    expect(after.status).toBe(401);
    expect(after.body.code).toBe('AUTH_INVALID_SESSION');

    const reuse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken });
    expect(reuse.status).toBe(401);
  });

  it('answers the same to a nonexistent email as to a wrong password', async () => {
    const response = await login('mala', 'nadie@ejemplo.com');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      code: 'AUTH_INVALID_CREDENTIALS',
    });
  });

  it('rejects the login if the CAPTCHA does not validate', async () => {
    captchaOk = false;
    try {
      const response = await login();
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('AUTH_INVALID_CAPTCHA');
    } finally {
      captchaOk = true;
    }
  });

  it('requires a session on every route that is not public', async () => {
    const withoutToken = await request(app.getHttpServer()).get('/me');
    expect(withoutToken.status).toBe(401);

    const garbage = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer no-es-un-jwt');
    expect(garbage.status).toBe(401);

    const health = await request(app.getHttpServer()).get('/health/live');
    expect(health.status).toBe(200);
  });
});
