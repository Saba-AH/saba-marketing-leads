import { Controller, Get, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ErrorsModule } from '../../infrastructure/errors/ErrorsModule';
import { LoggingModule } from '../../infrastructure/logging/LoggingModule';
import { AuthModule } from '../../modules/auth/module';
import { AUTH_TOKENS } from '../../modules/auth/tokens';
import { RequirePermissions } from '../../shared/decorators/RequirePermissions';
import { ZodValidationPipe } from '../../shared/pipes/zodValidationPipe';
import { agent, FakeSabaAuthGateway } from '../support/fakeSabaAuth';

@Controller('protected')
class ProtectedController {
  @Get()
  @RequirePermissions({ permissions: ['marketing:access'] })
  read(): { ok: true } {
    return { ok: true };
  }
}

describe('Auth (API)', () => {
  let app: INestApplication;
  let saba: FakeSabaAuthGateway;

  beforeAll(async () => {
    saba = new FakeSabaAuthGateway();
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule, ErrorsModule, AuthModule],
      controllers: [ProtectedController],
    })
      .overrideProvider(AUTH_TOKENS.SabaAuthGateway)
      .useValue(saba)
      .overrideProvider(AUTH_TOKENS.CaptchaVerifier)
      .useValue({ verify: async () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    saba.sessions.clear();
  });

  it('logs in and answers /me with the permissions Saba granted', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'Agente@SabaTransporte.com',
        password: 'secret',
        captchaToken: 'captcha',
      })
      .expect(200);
    expect(login.body.data.user.permissions).toEqual(['marketing:access']);

    saba.sessions.set('live', agent());
    const me = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer live')
      .expect(200);
    expect(me.body).toEqual({ success: true, data: agent() });
  });

  it('answers 401 without a session Saba recognizes', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);
    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer unknown')
      .expect(401);
    expect(response.body.code).toBe('AUTH_INVALID_SESSION');
  });

  it('enforces @RequirePermissions with what Saba resolved', async () => {
    saba.sessions.set('with', agent());
    saba.sessions.set('without', agent({ permissions: [] }));

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', 'Bearer with')
      .expect(200);
    const denied = await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', 'Bearer without')
      .expect(403);
    expect(denied.body.code).toBe('AUTH_PERMISSION_DENIED');
  });

  it('a logged out session stops working at once, cache included', async () => {
    saba.sessions.set('bye', agent());
    await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer bye')
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', 'Bearer bye')
      .expect(204);

    await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer bye')
      .expect(401);
  });
});
