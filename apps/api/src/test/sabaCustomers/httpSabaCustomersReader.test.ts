import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SabaForbiddenException,
  SabaSessionNotRecognizedException,
  SabaUnavailableException,
} from '../../modules/sabaCustomers/domain/exceptions/sabaCustomersExceptions';
import { HttpSabaCustomersReader } from '../../modules/sabaCustomers/infrastructure/external/HttpSabaCustomersReader';

const CONFIG = { apiUrl: 'http://saba.test' };

const sabaCustomer = {
  id: 'p1',
  fullName: 'Ana Pérez',
  idNumber: 'V12345678',
  email: 'ana@correo.com',
  phone: '+58 414 1234567',
  city: 'Caracas',
  source: 'web',
  customerSince: '2026-01-01T00:00:00Z',
  applications: [
    {
      id: 'a1',
      status: 'approved',
      statusLabel: 'Aprobada',
      active: true,
      createdAt: '2026-09-01T00:00:00Z',
      product: 'CF 450MT',
      financedAmount: '1500.50',
      installmentAmount: 40,
      frequency: 'weekly',
    },
  ],
};

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('HttpSabaCustomersReader', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks Saba with the agent session and normalizes the amounts', async () => {
    const fetchMock = vi.fn(async () =>
      reply(200, { ok: true, customers: [sabaCustomer] })
    );
    vi.stubGlobal('fetch', fetchMock);

    const customers = await new HttpSabaCustomersReader(CONFIG).findByPhone(
      '584141234567',
      'agent-token'
    );

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      'http://saba.test/api/admin/marketing/customers/by-phone?phone=584141234567'
    );
    expect(init.headers).toEqual({ Authorization: 'Bearer agent-token' });
    expect(customers[0]).toMatchObject({
      name: 'Ana Pérez',
      idNumber: 'V12345678',
      applications: [
        {
          statusLabel: 'Aprobada',
          financedAmount: 1500.5,
          installmentAmount: 40,
        },
      ],
    });
  });

  it.each([
    [401, SabaSessionNotRecognizedException],
    [403, SabaForbiddenException],
  ])('tells apart a %i from Saba', async (status, exception) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => reply(status, { ok: false }))
    );

    await expect(
      new HttpSabaCustomersReader(CONFIG).findByPhone('5841', 't')
    ).rejects.toBeInstanceOf(exception);
  });

  it('reports Saba as unavailable if it fails, changes its response or is not configured', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => reply(500, { ok: false }))
    );
    await expect(
      new HttpSabaCustomersReader(CONFIG).findByPhone('5841', 't')
    ).rejects.toBeInstanceOf(SabaUnavailableException);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => reply(200, { other: 'shape' }))
    );
    await expect(
      new HttpSabaCustomersReader(CONFIG).findByPhone('5841', 't')
    ).rejects.toBeInstanceOf(SabaUnavailableException);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );
    await expect(
      new HttpSabaCustomersReader(CONFIG).findByPhone('5841', 't')
    ).rejects.toBeInstanceOf(SabaUnavailableException);

    await expect(
      new HttpSabaCustomersReader({ apiUrl: null }).findByPhone('5841', 't')
    ).rejects.toBeInstanceOf(SabaUnavailableException);
  });
});
