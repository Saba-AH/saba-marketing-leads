import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SabaNoDisponibleException,
  SabaSesionNoReconocidaException,
  SabaSinPermisoException,
} from '../../modules/sabaClientes/domain/exceptions/sabaClientesExceptions';
import { HttpSabaClientesReader } from '../../modules/sabaClientes/infrastructure/external/HttpSabaClientesReader';

const CONFIG = { apiUrl: 'http://saba.test' };

const clienteDeSaba = {
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

function responder(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('HttpSabaClientesReader', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pregunta a Saba con la sesión del agente y normaliza los montos', async () => {
    const fetchMock = vi.fn(async () =>
      responder(200, { ok: true, customers: [clienteDeSaba] })
    );
    vi.stubGlobal('fetch', fetchMock);

    const clientes = await new HttpSabaClientesReader(CONFIG).buscarPorTelefono(
      '584141234567',
      'token-del-agente'
    );

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      'http://saba.test/api/admin/marketing/customers/by-phone?phone=584141234567'
    );
    expect(init.headers).toEqual({ Authorization: 'Bearer token-del-agente' });
    expect(clientes[0]).toMatchObject({
      nombre: 'Ana Pérez',
      cedula: 'V12345678',
      solicitudes: [
        { estadoEtiqueta: 'Aprobada', montoFinanciado: 1500.5, cuota: 40 },
      ],
    });
  });

  it.each([
    [401, SabaSesionNoReconocidaException],
    [403, SabaSinPermisoException],
  ])('distingue un %i de Saba', async (status, excepcion) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => responder(status, { ok: false }))
    );

    await expect(
      new HttpSabaClientesReader(CONFIG).buscarPorTelefono('5841', 't')
    ).rejects.toBeInstanceOf(excepcion);
  });

  it('avisa que Saba no está disponible si falla, cambia la respuesta o no está configurado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => responder(500, { ok: false }))
    );
    await expect(
      new HttpSabaClientesReader(CONFIG).buscarPorTelefono('5841', 't')
    ).rejects.toBeInstanceOf(SabaNoDisponibleException);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => responder(200, { otra: 'forma' }))
    );
    await expect(
      new HttpSabaClientesReader(CONFIG).buscarPorTelefono('5841', 't')
    ).rejects.toBeInstanceOf(SabaNoDisponibleException);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );
    await expect(
      new HttpSabaClientesReader(CONFIG).buscarPorTelefono('5841', 't')
    ).rejects.toBeInstanceOf(SabaNoDisponibleException);

    await expect(
      new HttpSabaClientesReader({ apiUrl: null }).buscarPorTelefono(
        '5841',
        't'
      )
    ).rejects.toBeInstanceOf(SabaNoDisponibleException);
  });
});
