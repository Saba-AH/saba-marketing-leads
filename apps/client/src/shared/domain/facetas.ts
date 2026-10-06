/**
 * Filtros derivados de los datos que la tabla ya muestra.
 *
 * Una faceta no declara sus opciones: declara **cómo leer** el valor de un
 * elemento, y de ahí salen tanto las opciones (los valores distintos que
 * existen) como el filtrado (qué elementos tienen el valor elegido). Una sola
 * función para las dos cosas, así no pueden desincronizarse — que es lo que
 * pasa con una lista de opciones escrita a mano.
 */
export interface Faceta<T> {
  id: string;
  label: string;
  /** Pocas opciones cerradas van en chips; lo que crece con los datos, en un select. */
  presentacion: 'chips' | 'select';
  /** Valor o valores del elemento. Vacío = el elemento no participa de la faceta. */
  valoresDe: (elemento: T) => string | readonly string[] | null | undefined;
}

/** Nada elegido. Es el string vacío para que el `<select>` lo represente. */
export const SIN_FILTRO = '';

export type SeleccionDeFiltros = Readonly<Record<string, string>>;

function valoresNormalizados<T>(faceta: Faceta<T>, elemento: T): string[] {
  const crudo = faceta.valoresDe(elemento);
  if (crudo === null || crudo === undefined) {
    return [];
  }
  const lista = typeof crudo === 'string' ? [crudo] : crudo;
  return lista.map((valor) => valor.trim()).filter(Boolean);
}

/**
 * Dos escrituras que solo difieren en mayúsculas son el mismo valor para una
 * persona: "Acme" y "acme" son la misma marca. Comparar tal cual las ofrecía
 * como dos opciones, y elegir una dejaba la otra fuera (#144).
 */
function claveDe(valor: string): string {
  return valor.toLocaleLowerCase('es');
}

/**
 * Los valores distintos que existen hoy, ordenados como los leería una persona.
 *
 * Se agrupan sin distinguir mayúsculas, pero se muestra la **primera forma
 * encontrada**: mostrar "acme" cuando la tabla dice "Acme" sería peor que el
 * problema que esto resuelve.
 */
export function opcionesDeFaceta<T>(
  elementos: readonly T[],
  faceta: Faceta<T>
): string[] {
  const porClave = new Map<string, string>();
  for (const elemento of elementos) {
    for (const valor of valoresNormalizados(faceta, elemento)) {
      const clave = claveDe(valor);
      if (!porClave.has(clave)) {
        porClave.set(clave, valor);
      }
    }
  }
  return [...porClave.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

/** Las facetas se combinan entre sí con AND: cada una acota a la anterior. */
export function aplicarFiltros<T>(
  elementos: readonly T[],
  facetas: readonly Faceta<T>[],
  seleccion: SeleccionDeFiltros
): T[] {
  return elementos.filter((elemento) =>
    facetas.every((faceta) => {
      const elegido = seleccion[faceta.id];
      if (!elegido) {
        return true;
      }
      // Por clave, igual que las opciones: elegir "Acme" tiene que traer
      // también los "acme".
      const buscado = claveDe(elegido);
      return valoresNormalizados(faceta, elemento).some(
        (valor) => claveDe(valor) === buscado
      );
    })
  );
}
