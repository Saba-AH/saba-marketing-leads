import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DrizzleModule } from '../../infrastructure/database/drizzle.module';
import { ErrorsModule } from '../../infrastructure/errors/ErrorsModule';
import { LoggingModule } from '../../infrastructure/logging/LoggingModule';
import { mobileAppVersions } from '../../modules/mobileAppVersions/infrastructure/persistence/mobileAppVersions.schema';
import { MobileAppVersionsModule } from '../../modules/mobileAppVersions/module';
import { ZodValidationPipe } from '../../shared/pipes/zodValidationPipe';
import {
  closeTestDb,
  getTestDb,
  resetDatabase,
  testDatabaseUrl,
} from '../support/testDatabase';

process.env.DATABASE = testDatabaseUrl();

describe('GET /mobile-app-versions', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggingModule,
        ErrorsModule,
        DrizzleModule,
        MobileAppVersionsModule,
      ],
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
    await getTestDb()
      .insert(mobileAppVersions)
      .values([
        {
          platform: 'ios',
          latestVersion: '1.2.0',
          minSupportedVersion: '1.0.0',
          storeUrl: 'https://apps.apple.com/app/id1',
          isActive: true,
          createdAt: new Date('2026-10-01T00:00:00Z'),
        },
        {
          platform: 'android',
          latestVersion: '1.3.0',
          storeUrl: 'https://play.google.com/store/apps/details?id=x',
          createdAt: new Date('2026-10-02T00:00:00Z'),
        },
      ]);
  });

  it('lists all of them, most recent first', async () => {
    const response = await request(app.getHttpServer()).get(
      '/mobile-app-versions'
    );

    expect(response.status).toBe(200);
    expect(
      response.body.data.map((v: { platform: string }) => v.platform)
    ).toEqual(['android', 'ios']);
    expect(response.body.data[0]).toMatchObject({
      latestVersion: '1.3.0',
      minSupportedVersion: null,
      isActive: false,
    });
  });

  it('filters by platform', async () => {
    const response = await request(app.getHttpServer()).get(
      '/mobile-app-versions?platform=ios'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].latestVersion).toBe('1.2.0');
  });

  it('answers 400 with an invalid platform', async () => {
    const response = await request(app.getHttpServer()).get(
      '/mobile-app-versions?platform=windows'
    );

    expect(response.status).toBe(400);
  });

  it('the database rejects a platform outside the CHECK', async () => {
    await expect(
      getTestDb().execute(
        "INSERT INTO mobile_app_versions (platform, latest_version, store_url) VALUES ('windows', '1', 'x')"
      )
    ).rejects.toThrow();
  });
});
