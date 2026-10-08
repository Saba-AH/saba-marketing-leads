import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SabaNoDisponibleException,
  SabaSinPermisoException,
} from '../../modules/sabaClientes/domain/exceptions/sabaClientesExceptions';
import { HttpSabaClientesReader } from '../../modules/sabaClientes/infrastructure/external/HttpSabaClientesReader';

const CONFIG = { apiUrl: 'http://saba.test' };

const clienteDeSaba = {
  id: 'p1',
  nombre: 'Ana Pérez',
  cedula: 'V12345678',
  correo: 'ana@correo.com',
  telefono: '+58 414 1234567',
  ciudad: 'Caracas',
  origen: 'web',
  clienteDesde: '2026-01-01T00:00:00Z',
  solicitudes: [
    {
      id: 'a1',
      estado: 'approved',
      estadoEtiqueta: 'Aprobada',
      activa: true,
      creadaAt: '2026-09-01T00:00:00Z',
      producto: 'CF 450MT',
      montoFinanciado: '1500.50',
      cuota: 40,
      frecuencia: 'weekly',
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
      responder(200, { ok: true, clientes: [clienteDeSaba] })
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
      'http://saba.test/api/admin/marketing/clientes/por-telefono?telefono=584141234567'
    );
    expect(init.headers).toEqual({ Authorization: 'Bearer token-del-agente' });
    expect(clientes[0]?.solicitudes[0]?.montoFinanciado).toBe(1500.5);
    expect(clientes[0]?.cedula).toBe('V12345678');
  });

  it.each([401, 403])(
    'traduce un %i de Saba a falta de permiso',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => responder(status, { ok: false }))
      );

      await expect(
        new HttpSabaClientesReader(CONFIG).buscarPorTelefono('5841', 't')
      ).rejects.toBeInstanceOf(SabaSinPermisoException);
    }
  );

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
