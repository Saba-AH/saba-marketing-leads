import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticateRequestUseCase } from './application/use-cases/AuthenticateRequestUseCase';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
import { LogoutUseCase } from './application/use-cases/LogoutUseCase';
import { RefreshSessionUseCase } from './application/use-cases/RefreshSessionUseCase';
import { PANEL_ALLOWED_EMAILS } from './domain/panelAccess';
import { loadAuthConfig } from './infrastructure/authConfig';
import { GoTrueAuthProvider } from './infrastructure/external/GoTrueAuthProvider';
import { JoseAccessTokenVerifier } from './infrastructure/external/JoseAccessTokenVerifier';
import { SystemClock } from './infrastructure/external/SystemClock';
import { TurnstileCaptchaVerifier } from './infrastructure/external/TurnstileCaptchaVerifier';
import { DrizzleActiveSessionReader } from './infrastructure/persistence/DrizzleActiveSessionReader';
import { DrizzleLoginAttempts } from './infrastructure/persistence/DrizzleLoginAttempts';
import { DrizzleStaffDirectory } from './infrastructure/persistence/DrizzleStaffDirectory';
import { AuthController } from './infrastructure/web/AuthController';
import { AuthGuard } from './infrastructure/web/AuthGuard';
import { MeController } from './infrastructure/web/MeController';
import { AUTH_TOKENS } from './tokens';

@Module({
  controllers: [AuthController, MeController],
  providers: [
    { provide: AUTH_TOKENS.Config, useFactory: () => loadAuthConfig() },
    { provide: AUTH_TOKENS.Clock, useClass: SystemClock },
    { provide: AUTH_TOKENS.PanelAllowedEmails, useValue: PANEL_ALLOWED_EMAILS },
    { provide: AUTH_TOKENS.AuthProvider, useClass: GoTrueAuthProvider },
    {
      provide: AUTH_TOKENS.CaptchaVerifier,
      useClass: TurnstileCaptchaVerifier,
    },
    {
      provide: AUTH_TOKENS.AccessTokenVerifier,
      useClass: JoseAccessTokenVerifier,
    },
    { provide: AUTH_TOKENS.StaffDirectory, useClass: DrizzleStaffDirectory },
    { provide: AUTH_TOKENS.LoginAttempts, useClass: DrizzleLoginAttempts },
    {
      provide: AUTH_TOKENS.ActiveSessionReader,
      useClass: DrizzleActiveSessionReader,
    },
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
    // limit cuts in before a query is spent validating the session.
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
