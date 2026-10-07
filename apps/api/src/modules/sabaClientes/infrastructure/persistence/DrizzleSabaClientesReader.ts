import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  type SQL,
  sql,
} from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type { SabaClientesReaderPort } from '../../application/ports/SabaClientesReaderPort';
import {
  type ClienteSaba,
  esSolicitudActiva,
  ordenarCandidatos,
  type ResumenClienteSaba,
  type SolicitudSaba,
  variantesTelefono,
} from '../../domain/ClienteSaba';
import { sabaApplications, sabaProfiles } from './sabaClientesTables';

const LIMITE_BUSQUEDA = 20;
const SOLICITUDES_EN_RESUMEN = 10;

const columnasPerfil = {
  id: sabaProfiles.id,
  nombre: sabaProfiles.nombre,
  apellido: sabaProfiles.apellido,
  telefono: sabaProfiles.telefono,
  cedula: sabaProfiles.cedula,
};

type FilaPerfil = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  cedula: string | null;
};

const soloDigitos = sql`regexp_replace(${sabaProfiles.telefono}, '\\D', '', 'g')`;
// Sin código de país ni 0 inicial: "0414-123" encuentra "+58 414 1234567".
const digitosNacionales = sql`regexp_replace(${soloDigitos}, '^(58|0)', '')`;

function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

@Injectable()
export class DrizzleSabaClientesReader implements SabaClientesReaderPort {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  async buscarPorTelefono(waId: string): Promise<ClienteSaba[]> {
    const variantes = variantesTelefono(waId);
    if (variantes.length === 0) return [];
    // `profiles.telefono` no tiene índice por dígitos (la tabla es de Saba):
    // es un seq scan sobre ~33 k filas, aceptable para un mensaje entrante.
    const perfiles = await this.db
      .select(columnasPerfil)
      .from(sabaProfiles)
      .where(inArray(soloDigitos, variantes));
    return ordenarCandidatos(await this.conSolicitudReciente(perfiles));
  }

  async obtenerResumen(profileId: string): Promise<ResumenClienteSaba | null> {
    const [perfil] = await this.db
      .select(columnasPerfil)
      .from(sabaProfiles)
      .where(eq(sabaProfiles.id, profileId));
    if (!perfil) return null;
    const solicitudes = (await this.solicitudesDe([perfil.id])).slice(
      0,
      SOLICITUDES_EN_RESUMEN
    );
    return {
      ...aCliente(perfil, solicitudes),
      solicitudes,
    };
  }

  async buscar(texto: string): Promise<ClienteSaba[]> {
    const limpio = texto.trim();
    if (limpio.length < 2) return [];
    const patron = `%${escaparLike(limpio)}%`;
    const condiciones: SQL[] = [
      ilike(
        sql`${sabaProfiles.nombre} || ' ' || ${sabaProfiles.apellido}`,
        patron
      ),
      ilike(sabaProfiles.cedula, patron),
    ];
    const digitos = limpio.replace(/\D/g, '').replace(/^(58|0)/, '');
    if (digitos.length >= 4) {
      condiciones.push(sql`${digitosNacionales} like ${`%${digitos}%`}`);
    }
    const perfiles = await this.db
      .select(columnasPerfil)
      .from(sabaProfiles)
      .where(or(...condiciones))
      .orderBy(sabaProfiles.nombre, sabaProfiles.apellido)
      .limit(LIMITE_BUSQUEDA);
    return this.conSolicitudReciente(perfiles);
  }

  private async conSolicitudReciente(
    perfiles: FilaPerfil[]
  ): Promise<ClienteSaba[]> {
    const solicitudes = await this.solicitudesDe(perfiles.map((p) => p.id));
    return perfiles.map((perfil) => aCliente(perfil, solicitudes));
  }

  /** Una sola consulta para todos los perfiles; se agrupan en memoria. */
  private async solicitudesDe(
    profileIds: string[]
  ): Promise<(SolicitudSaba & { profileId: string })[]> {
    if (profileIds.length === 0) return [];
    const filas = await this.db
      .select({
        id: sabaApplications.id,
        profileId: sabaApplications.userId,
        estado: sabaApplications.status,
        creadaAt: sabaApplications.createdAt,
      })
      .from(sabaApplications)
      .where(
        and(
          inArray(sabaApplications.userId, profileIds),
          isNull(sabaApplications.deletedAt)
        )
      )
      .orderBy(desc(sabaApplications.createdAt));
    return filas.map((fila) => ({
      ...fila,
      activa: esSolicitudActiva(fila.estado),
    }));
  }
}

function aCliente(
  perfil: FilaPerfil,
  solicitudes: (SolicitudSaba & { profileId: string })[]
): ClienteSaba {
  // Vienen ordenadas de la más reciente a la más vieja.
  const propias = solicitudes.filter((s) => s.profileId === perfil.id);
  const reciente = propias.find((s) => s.activa) ?? propias[0] ?? null;
  return {
    id: perfil.id,
    nombre: `${perfil.nombre} ${perfil.apellido}`.trim(),
    telefono: perfil.telefono,
    cedula: perfil.cedula,
    solicitudReciente: reciente
      ? {
          id: reciente.id,
          estado: reciente.estado,
          activa: reciente.activa,
          creadaAt: reciente.creadaAt,
        }
      : null,
  };
}
