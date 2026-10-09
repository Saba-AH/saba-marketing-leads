import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { loadSabaApiConfig } from '../../infrastructure/saba/sabaApi';
import { AuthenticateRequestUseCase } from './application/use-cases/AuthenticateRequestUseCase';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
import { LogoutUseCase } from './application/use-cases/LogoutUseCase';
import { RefreshSessionUseCase } from './application/use-cases/RefreshSessionUseCase';
import { loadAuthConfig } from './infrastructure/authConfig';
import { InMemorySessionCache } from './infrastructure/cache/InMemorySessionCache';
import { HttpSabaAuthGateway } from './infrastructure/external/HttpSabaAuthGateway';
import { SystemClock } from './infrastructure/external/SystemClock';
import { TurnstileCaptchaVerifier } from './infrastructure/external/TurnstileCaptchaVerifier';
import { AuthController } from './infrastructure/web/AuthController';
import { AuthGuard } from './infrastructure/web/AuthGuard';
import { MeController } from './infrastructure/web/MeController';
import { PermissionsGuard } from './infrastructure/web/PermissionsGuard';
import { AUTH_TOKENS } from './tokens';

/** Staff login and sessions, owned by Saba and reached through its API. */
@Module({
  controllers: [AuthController, MeController],
  providers: [
    { provide: AUTH_TOKENS.Config, useFactory: () => loadAuthConfig() },
    {
      provide: AUTH_TOKENS.SabaApiConfig,
      useFactory: () => loadSabaApiConfig(),
    },
    { provide: AUTH_TOKENS.Clock, useClass: SystemClock },
    { provide: AUTH_TOKENS.SabaAuthGateway, useClass: HttpSabaAuthGateway },
    {
      provide: AUTH_TOKENS.CaptchaVerifier,
      useClass: TurnstileCaptchaVerifier,
    },
    { provide: AUTH_TOKENS.SessionCache, useClass: InMemorySessionCache },
    LoginUseCase,
    { provide: AUTH_TOKENS.Login, useExisting: LoginUseCase },
    RefreshSessionUseCase,
    { provide: AUTH_TOKENS.RefreshSession, useExisting: RefreshSessionUseCase },
    LogoutUseCase,
    { provide: AUTH_TOKENS.Logout, useExisting: LogoutUseCase },
    AuthenticateRequestUseCase,
    {
      provide: AUTH_TOKENS.AuthenticateRequest,
      useExisting: AuthenticateRequestUseCase,
    },
    // After the ThrottlerGuard (SecurityModule comes first in AppModule): the rate
    // limit cuts in before Saba is asked about the session.
    { provide: APP_GUARD, useClass: AuthGuard },
    // Registered after AuthGuard, so it runs once the user is on the request.
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AuthModule {}
