import type { THealth } from '@repo/schemas';
import { HttpResponse, http } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export const healthyResponse: THealth = {
  status: 'ok',
  uptimeSeconds: 120,
  version: '0.0.0-test',
  environment: 'test',
  timestamp: '2026-08-05T12:00:00.000Z',
  checks: [{ name: 'postgres', status: 'up', latencyMs: 2 }],
};

export const healthHandlers = [
  http.get(`${API_URL}/api/v1/health`, () =>
    HttpResponse.json({ success: true, data: healthyResponse })
  ),
];

/** Sobrescribe el handler por defecto: la base de datos caída. */
export const databaseDownHandler = http.get(`${API_URL}/api/v1/health`, () =>
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
