import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { ApiDb } from '../../infrastructure/database/drizzle.module';

/**
 * Siembra `profiles` y `applications` de Saba en la base de tests. Esas tablas
 * no tienen esquema de Drizzle en este repo (las crea `0002_esquema_saba.sql`),
 * así que va con SQL directo y solo las columnas obligatorias.
 */

export async function crearPerfilSaba(
  db: ApiDb,
  datos: {
    nombre: string;
    apellido?: string;
    telefono?: string | null;
    cedula?: string | null;
  }
): Promise<string> {
  const id = randomUUID();
  await db.execute(sql`
    INSERT INTO public.profiles (id, nombre, apellido, telefono, cedula, email)
    VALUES (${id}, ${datos.nombre}, ${datos.apellido ?? 'Prueba'},
            ${datos.telefono ?? null}, ${datos.cedula ?? null}, ${`${id}@prueba.test`})
  `);
  return id;
}

let productoId: string | undefined;

async function asegurarProducto(db: ApiDb): Promise<string> {
  const { rows } = await db.execute<{ id: string }>(
    sql`SELECT id FROM public.products LIMIT 1`
  );
  if (rows[0]) return rows[0].id;
  productoId = randomUUID();
  await db.execute(sql`
    INSERT INTO public.products (id, model, year, price, weekly_payment, image_url, description)
    VALUES (${productoId}, 'Moto de prueba', 2026, 1000, 20, 'https://ejemplo.test/m.png', 'Prueba')
  `);
  return productoId;
}

export async function crearSolicitudSaba(
  db: ApiDb,
  profileId: string,
  estado: string,
  creadaAt: Date,
  borrada = false
): Promise<string> {
  const id = randomUUID();
  const producto = await asegurarProducto(db);
  await db.execute(sql`
    INSERT INTO public.applications (id, user_id, product_id, status, created_at, deleted_at)
    VALUES (${id}, ${profileId}, ${producto}, ${estado}, ${creadaAt.toISOString()}::timestamptz,
            ${borrada ? new Date().toISOString() : null}::timestamptz)
  `);
  return id;
}
