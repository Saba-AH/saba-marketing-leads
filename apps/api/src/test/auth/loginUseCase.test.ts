import { beforeEach, describe, expect, it } from 'vitest';
import type { LoginCommand } from '../../modules/auth/application/ports/in/LoginPort';
import { LoginUseCase } from '../../modules/auth/application/use-cases/LoginUseCase';
import { CaptchaInvalidoException } from '../../modules/auth/domain/exceptions/CaptchaInvalidoException';
import { CredencialesInvalidasException } from '../../modules/auth/domain/exceptions/CredencialesInvalidasException';
import { CuentaBloqueadaException } from '../../modules/auth/domain/exceptions/CuentaBloqueadaException';
import { DemasiadosIntentosException } from '../../modules/auth/domain/exceptions/DemasiadosIntentosException';
import { SinAccesoException } from '../../modules/auth/domain/exceptions/SinAccesoException';
import type { StaffProfile } from '../../modules/auth/domain/StaffProfile';
import {
  AHORA,
  FakeAuthProvider,
  FakeLoginAttempts,
  perfil,
} from '../support/fakeAuthPorts';

const CORREO = 'angel.hernandez@sabatransporte.com';

function comando(overrides: Partial<LoginCommand> = {}): LoginCommand {
  return {
    correo: CORREO,
    contrasena: 'correcta',
    captchaToken: 'captcha-ok',
    ip: '10.0.0.1',
    userAgent: 'jest',
    ...overrides,
  };
}

describe('LoginUseCase', () => {
  let provider: FakeAuthProvider;
  let attempts: FakeLoginAttempts;
  let perfiles: StaffProfile[];
  let captchaOk: boolean;
  let useCase: LoginUseCase;

  beforeEach(() => {
    provider = new FakeAuthProvider();
    attempts = new FakeLoginAttempts();
    perfiles = [perfil()];
    captchaOk = true;
    provider.register(CORREO, 'u-1', 'correcta');

    useCase = new LoginUseCase(
      provider,
      { verify: async () => captchaOk },
      {
        findByEmail: async (correo) =>
          perfiles.find((p) => p.correo === correo) ?? null,
        findById: async (id) => perfiles.find((p) => p.id === id) ?? null,
      },
      attempts,
      { now: () => AHORA },
      [CORREO]
    );
  });

  it('entrega la sesión y el usuario cuando todo está en regla', async () => {
    const resultado = await useCase.execute(comando());

    expect(resultado.sesion.accessToken).toBe('access-u-1');
    expect(resultado.usuario).toEqual({
      id: 'u-1',
      correo: CORREO,
      nombre: 'Angel Hernández',
      rol: 'admin',
    });
    expect(attempts.attempts).toEqual([
      expect.objectContaining({ success: true, userId: 'u-1', reason: null }),
    ]);
  });

  it('rechaza un CAPTCHA inválido sin tocar las credenciales', async () => {
    captchaOk = false;

    await expect(useCase.execute(comando())).rejects.toThrow(
      CaptchaInvalidoException
    );
    expect(attempts.attempts).toEqual([]);
  });

  it('corta por rate limit cuando la IP acumula 10 fallos', async () => {
    attempts.ipFailures = 10;

    await expect(useCase.execute(comando())).rejects.toThrow(
      DemasiadosIntentosException
    );
    expect(attempts.attempts).toEqual([
      expect.objectContaining({ success: false, reason: 'rate_limited' }),
    ]);
  });

  it('cuenta el fallo de un staff con contraseña mala', async () => {
    await expect(
      useCase.execute(comando({ contrasena: 'mala' }))
    ).rejects.toThrow(CredencialesInvalidasException);

    expect(attempts.lockouts.get('u-1')).toEqual({
      userId: 'u-1',
      failedCount: 1,
      lockedAt: null,
    });
    expect(attempts.attempts).toEqual([
      expect.objectContaining({ reason: 'bad_credentials', userId: 'u-1' }),
    ]);
  });

  it('bloquea la cuenta al quinto fallo consecutivo', async () => {
    attempts.lockouts.set('u-1', {
      userId: 'u-1',
      failedCount: 4,
      lockedAt: null,
    });

    await expect(
      useCase.execute(comando({ contrasena: 'mala' }))
    ).rejects.toThrow(CredencialesInvalidasException);

    expect(attempts.lockouts.get('u-1')).toEqual({
      userId: 'u-1',
      failedCount: 5,
      lockedAt: AHORA,
    });
  });

  it('solo revela el bloqueo si la contraseña era correcta, y cierra esa sesión', async () => {
    attempts.lockouts.set('u-1', {
      userId: 'u-1',
      failedCount: 5,
      lockedAt: AHORA,
    });

    await expect(useCase.execute(comando())).rejects.toThrow(
      CuentaBloqueadaException
    );
    expect(provider.revoked).toEqual(['access-u-1']);

    await expect(
      useCase.execute(comando({ contrasena: 'mala' }))
    ).rejects.toThrow(CredencialesInvalidasException);
    expect(attempts.attempts.map((a) => a.reason)).toEqual([
      'locked',
      'locked',
    ]);
  });

  it('no lleva contador para correos que no son de staff', async () => {
    perfiles = [];

    await expect(
      useCase.execute(comando({ correo: 'nadie@x.com', contrasena: 'mala' }))
    ).rejects.toThrow(CredencialesInvalidasException);
    expect(attempts.lockouts.size).toBe(0);
  });

  it('rechaza a un cliente con contraseña correcta y cierra su sesión', async () => {
    perfiles = [perfil({ rol: 'standard' })];

    await expect(useCase.execute(comando())).rejects.toThrow(
      SinAccesoException
    );
    expect(provider.revoked).toEqual(['access-u-1']);
    expect(attempts.attempts).toEqual([
      expect.objectContaining({ success: false, reason: 'wrong_portal' }),
    ]);
  });

  it('rechaza a un staff que no está en la lista del panel', async () => {
    const otro = 'cajero@sabatransporte.com';
    perfiles = [perfil({ id: 'u-2', correo: otro, rol: 'cajero' })];
    provider.register(otro, 'u-2', 'correcta');

    await expect(useCase.execute(comando({ correo: otro }))).rejects.toThrow(
      SinAccesoException
    );
    expect(provider.revoked).toEqual(['access-u-2']);
  });

  it('reinicia el contador de fallos al entrar bien', async () => {
    attempts.lockouts.set('u-1', {
      userId: 'u-1',
      failedCount: 3,
      lockedAt: null,
    });

    await useCase.execute(comando());

    expect(attempts.lockouts.get('u-1')?.failedCount).toBe(0);
  });
});
