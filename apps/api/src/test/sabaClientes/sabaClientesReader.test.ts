import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { variantesTelefono } from '../../modules/sabaClientes/domain/ClienteSaba';
import { DrizzleSabaClientesReader } from '../../modules/sabaClientes/infrastructure/persistence/DrizzleSabaClientesReader';
import {
  crearPerfilSaba,
  crearSolicitudSaba,
} from '../support/sabaClientesSeed';
import { closeTestDb, getTestDb, resetDatabase } from '../support/testDatabase';

const db = () => getTestDb();
const reader = () => new DrizzleSabaClientesReader(db());

describe('variantesTelefono', () => {
  it('cubre las formas venezolanas en que Saba guarda un número', () => {
    expect(variantesTelefono('584141234567')).toEqual([
      '584141234567',
      '04141234567',
      '4141234567',
    ]);
  });

  it('deja tal cual un número de otro país', () => {
    expect(variantesTelefono('13055550123')).toEqual(['13055550123']);
  });
});

describe('DrizzleSabaClientesReader (contra Postgres)', () => {
  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('buscarPorTelefono', () => {
    it('encuentra el número en cualquiera de sus formatos y pone primero al de solicitud activa', async () => {
      const sinSolicitud = await crearPerfilSaba(db(), {
        nombre: 'Sin',
        telefono: '+58 414-123.45.67',
      });
      const rechazadaReciente = await crearPerfilSaba(db(), {
        nombre: 'Rechazada',
        telefono: '0414 1234567',
      });
      const activaVieja = await crearPerfilSaba(db(), {
        nombre: 'Activa',
        telefono: '4141234567',
      });
      await crearPerfilSaba(db(), { nombre: 'Otro', telefono: '04149999999' });
      await crearSolicitudSaba(
        db(),
        rechazadaReciente,
        'rejected',
        new Date('2026-10-01')
      );
      await crearSolicitudSaba(
        db(),
        activaVieja,
        'pending',
        new Date('2026-01-01')
      );

      const candidatos = await reader().buscarPorTelefono('584141234567');

      expect(candidatos.map((c) => c.id)).toEqual([
        activaVieja,
        rechazadaReciente,
        sinSolicitud,
      ]);
      expect(candidatos[0]?.solicitudReciente).toMatchObject({
        estado: 'pending',
        activa: true,
      });
    });

    it('no devuelve nada si nadie tiene ese número', async () => {
      await crearPerfilSaba(db(), { nombre: 'Otro', telefono: '04149999999' });

      expect(await reader().buscarPorTelefono('584141234567')).toEqual([]);
    });
  });

  describe('obtenerResumen', () => {
    it('trae el perfil con sus solicitudes vigentes, la más reciente primero', async () => {
      const id = await crearPerfilSaba(db(), {
        nombre: 'Ana',
        apellido: 'Pérez',
        telefono: '04141234567',
        cedula: 'V12345678',
      });
      await crearSolicitudSaba(db(), id, 'rejected', new Date('2026-01-01'));
      await crearSolicitudSaba(db(), id, 'approved', new Date('2026-05-01'));
      await crearSolicitudSaba(
        db(),
        id,
        'pending',
        new Date('2026-09-01'),
        true
      );

      const resumen = await reader().obtenerResumen(id);

      expect(resumen).toMatchObject({
        nombre: 'Ana Pérez',
        cedula: 'V12345678',
        solicitudReciente: { estado: 'approved', activa: true },
      });
      expect(resumen?.solicitudes.map((s) => s.estado)).toEqual([
        'approved',
        'rejected',
      ]);
    });
  });

  describe('buscar', () => {
    it('busca por nombre completo, cédula o dígitos del teléfono', async () => {
      const ana = await crearPerfilSaba(db(), {
        nombre: 'Ana',
        apellido: 'Pérez',
        telefono: '+58 414 1234567',
        cedula: 'V12345678',
      });
      await crearPerfilSaba(db(), { nombre: 'Luis', apellido: 'Gómez' });

      for (const texto of ['ana pér', 'V1234', '0414-123']) {
        expect((await reader().buscar(texto)).map((c) => c.id)).toEqual([ana]);
      }
    });

    it('trata % y _ como texto, no como comodines', async () => {
      await crearPerfilSaba(db(), { nombre: 'Ana' });

      expect(await reader().buscar('%%')).toEqual([]);
    });
  });
});
