import { describe, expect, it } from 'vitest';
import { AuthenticateRequestUseCase } from '../../modules/auth/application/use-cases/AuthenticateRequestUseCase';
import { LogoutUseCase } from '../../modules/auth/application/use-cases/LogoutUseCase';
import { RefreshSesionUseCase } from '../../modules/auth/application/use-cases/RefreshSesionUseCase';
import { SesionInvalidaException } from '../../modules/auth/domain/exceptions/SesionInvalidaException';
import { SinAccesoException } from '../../modules/auth/domain/exceptions/SinAccesoException';
import type { StaffProfile } from '../../modules/auth/domain/StaffProfile';
import { claims, FakeAuthProvider, perfil } from '../support/fakeAuthPorts';

function authenticate(
  token: { valid: boolean },
  sessionProfile: StaffProfile | null
): AuthenticateRequestUseCase {
  return new AuthenticateRequestUseCase(
    { verify: async () => (token.valid ? claims() : null) },
    { findProfileBySession: async () => sessionProfile },
    ['angel.hernandez@sabatransporte.com']
  );
}

describe('AuthenticateRequestUseCase', () => {
  it('devuelve el usuario de una sesión viva con acceso al panel', async () => {
    const usuario = await authenticate({ valid: true }, perfil()).execute('t');

    expect(usuario).toEqual({
      id: 'u-1',
      correo: 'angel.hernandez@sabatransporte.com',
      nombre: 'Angel Hernández',
      rol: 'admin',
    });
  });

  it('rechaza un token que no verifica', async () => {
    await expect(
      authenticate({ valid: false }, perfil()).execute('t')
    ).rejects.toThrow(SesionInvalidaException);
  });

  it('rechaza un token de una sesión cerrada o revocada', async () => {
    await expect(
      authenticate({ valid: true }, null).execute('t')
    ).rejects.toThrow(SesionInvalidaException);
  });

  it('rechaza a quien perdió el rol de staff con la sesión abierta', async () => {
    await expect(
      authenticate({ valid: true }, perfil({ rol: 'standard' })).execute('t')
    ).rejects.toThrow(SinAccesoException);
  });
});

describe('RefreshSesionUseCase', () => {
  it('entrega tokens nuevos', async () => {
    const sesion = await new RefreshSesionUseCase(
      new FakeAuthProvider()
    ).execute('refresh-valido');

    expect(sesion.accessToken).toBe('access-u-1');
  });

  it('rechaza un refresh token que ya no sirve', async () => {
    await expect(
      new RefreshSesionUseCase(new FakeAuthProvider()).execute('usado')
    ).rejects.toThrow(SesionInvalidaException);
  });
});

describe('LogoutUseCase', () => {
  it('revoca la sesión del token', async () => {
    const provider = new FakeAuthProvider();

    await new LogoutUseCase(provider).execute('access-u-1');

    expect(provider.revoked).toEqual(['access-u-1']);
  });
});
