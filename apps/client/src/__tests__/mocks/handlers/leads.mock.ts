import type { TLead } from '@repo/schemas';
import { HttpResponse, http } from 'msw';
import { BACKEND_URL } from '@/__tests__/mocks/backendUrl';

export const leadsFixture: TLead[] = [
  {
    id: 'lead-1',
    name: 'Ana Pérez',
    email: 'ana@saba.com',
    source: 'web',
    createdAt: '2026-10-01T12:00:00.000Z',
  },
];

export const leadsHandlers = [
  http.get(`${BACKEND_URL}/v1/leads`, () =>
    HttpResponse.json({ success: true, data: leadsFixture })
  ),
  http.post(`${BACKEND_URL}/v1/leads`, async ({ request }) => {
    const body = (await request.json()) as Pick<TLead, 'name' | 'email'>;
    return HttpResponse.json(
      {
        success: true,
        data: {
          id: 'lead-2',
          name: body.name,
          email: body.email,
          source: null,
          createdAt: '2026-10-02T12:00:00.000Z',
        } satisfies TLead,
      },
      { status: 201 }
    );
  }),
];
