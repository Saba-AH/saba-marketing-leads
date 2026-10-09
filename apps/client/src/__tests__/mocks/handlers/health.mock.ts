import type { THealth } from '@repo/schemas';
import { HttpResponse, http } from 'msw';
import { BACKEND_URL } from '@/__tests__/mocks/backendUrl';

export const healthyResponse: THealth = {
  status: 'ok',
  uptimeSeconds: 120,
  version: '0.0.0-test',
  environment: 'test',
  timestamp: '2026-08-05T12:00:00.000Z',
  checks: [{ name: 'postgres', status: 'up', latencyMs: 2 }],
};

export const healthHandlers = [
  http.get(`${BACKEND_URL}/v1/health`, () =>
    HttpResponse.json({ success: true, data: healthyResponse })
  ),
];

/** Overrides the default handler: the database is down. */
export const databaseDownHandler = http.get(`${BACKEND_URL}/v1/health`, () =>
  HttpResponse.json(
    {
      success: true,
      data: {
        ...healthyResponse,
        status: 'error',
        checks: [
          {
            name: 'postgres',
            status: 'down',
            detail: 'connection refused',
          },
        ],
      } satisfies THealth,
    },
    { status: 503 }
  )
);
