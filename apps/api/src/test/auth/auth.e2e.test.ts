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

// Contra el stack local completo: GoTrue emite y revoca sesiones de verdad y
// `auth.sessions` vive en la base del stack, no en la de tests. Usa su propio
// usuario (lo crea y lo borra) y su propia lista de acceso al panel.
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
      // Cloudflare no se llama desde los tests.
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
    contrasena: string = E2E_STAFF.password,
    correo: string = E2E_STAFF.email
  ) {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo, contrasena, captchaToken: 'x' });
  }

  it('inicia sesión, identifica al usuario, renueva y cierra la sesión', async () => {
    const entrada = await login();
    expect(entrada.status).toBe(200);
    expect(entrada.body.data.usuario).toEqual({
      id: E2E_STAFF.id,
      correo: E2E_STAFF.email,
      nombre: 'E2E Auth',
      rol: 'admin',
    });
    const { accessToken, refreshToken } = entrada.body.data.sesion;

    const me = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.correo).toBe(E2E_STAFF.email);

    const renovada = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken });
    expect(renovada.status).toBe(200);
    const nuevoAccess = renovada.body.data.accessToken;

    const salida = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${nuevoAccess}`);
    expect(salida.status).toBe(204);

    // El JWT sigue firmado y vigente, pero su sesión ya no existe.
    const despues = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${nuevoAccess}`);
    expect(despues.status).toBe(401);
    expect(despues.body.code).toBe('AUTH_SESION_INVALIDA');

    const reuso = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken });
    expect(reuso.status).toBe(401);
  });

  it('responde lo mismo a un correo inexistente que a una contraseña mala', async () => {
    const respuesta = await login('mala', 'nadie@ejemplo.com');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toMatchObject({
      success: false,
      code: 'AUTH_CREDENCIALES_INVALIDAS',
    });
  });

  it('rechaza el login si el CAPTCHA no valida', async () => {
    captchaOk = false;
    try {
      const respuesta = await login();
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe('AUTH_CAPTCHA_INVALIDO');
    } finally {
      captchaOk = true;
    }
  });

  it('exige sesión en toda ruta que no sea pública', async () => {
    const sinToken = await request(app.getHttpServer()).get('/me');
    expect(sinToken.status).toBe(401);

    const basura = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer no-es-un-jwt');
    expect(basura.status).toBe(401);

    const health = await request(app.getHttpServer()).get('/health/live');
    expect(health.status).toBe(200);
  });
});
