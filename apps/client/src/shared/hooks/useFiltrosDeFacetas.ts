'use client';

import React from 'react';
import {
  aplicarFiltros,
  type Faceta,
  opcionesDeFaceta,
  type SeleccionDeFiltros,
  SIN_FILTRO,
} from '@/shared/domain/facetas';

interface FiltrosDeFacetas<T> {
  /** Opciones disponibles por faceta, derivadas de los datos. */
  opciones: Readonly<Record<string, string[]>>;
  seleccion: SeleccionDeFiltros;
  elegir: (facetaId: string, valor: string) => void;
  limpiar: () => void;
  hayFiltroActivo: boolean;
  filtrados: T[];
}

/**
 * Las opciones salen del conjunto completo, no del ya filtrado: si se
 * recalcularan sobre lo filtrado, elegir "Colombia" dejaría "México" fuera de
 * la lista y no habría forma de cambiar de país sin limpiar antes.
 *
 * `facetas` debe ser una constante de módulo. Declarada en línea sería una
 * referencia nueva en cada render y los memos no servirían de nada.
 */
export function useFiltrosDeFacetas<T>(
  elementos: readonly T[],
  facetas: readonly Faceta<T>[]
): FiltrosDeFacetas<T> {
  const [seleccion, setSeleccion] = React.useState<SeleccionDeFiltros>({});

  const opciones = React.useMemo(() => {
    const porFaceta: Record<string, string[]> = {};
    for (const faceta of facetas) {
      porFaceta[faceta.id] = opcionesDeFaceta(elementos, faceta);
    }
    return porFaceta;
  }, [elementos, facetas]);

  const filtrados = React.useMemo(
    () => aplicarFiltros(elementos, facetas, seleccion),
    [elementos, facetas, seleccion]
  );

  const elegir = React.useCallback((facetaId: string, valor: string): void => {
    setSeleccion((actual) => ({ ...actual, [facetaId]: valor }));
  }, []);

  const limpiar = React.useCallback((): void => setSeleccion({}), []);

  const hayFiltroActivo = Object.values(seleccion).some(
    (valor) => valor !== SIN_FILTRO
  );

  return { opciones, seleccion, elegir, limpiar, hayFiltroActivo, filtrados };
}
