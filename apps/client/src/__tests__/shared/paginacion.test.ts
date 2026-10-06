import {
  ELEMENTOS_POR_PAGINA,
  paginasVisibles,
  totalDePaginas,
} from '@/shared/domain/paginacion';

describe('totalDePaginas', () => {
  it('una lista vacía sigue siendo una página, no cero', () => {
    // Con cero páginas no habría dónde mostrar el estado vacío.
    expect(totalDePaginas(0)).toBe(1);
  });

  it('una lista que entra justa no abre una página de más', () => {
    expect(totalDePaginas(ELEMENTOS_POR_PAGINA)).toBe(1);
    expect(totalDePaginas(ELEMENTOS_POR_PAGINA + 1)).toBe(2);
  });
});

describe('paginasVisibles', () => {
  it('con pocas páginas las muestra todas, sin elipsis', () => {
    expect(paginasVisibles(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('en el medio de muchas, recorta a ambos lados', () => {
    expect(paginasVisibles(10, 20)).toEqual([
      1,
      'elipsis',
      9,
      10,
      11,
      'elipsis',
      20,
    ]);
  });

  it('cerca del principio no pone una elipsis que oculte una sola página', () => {
    expect(paginasVisibles(2, 20)).toEqual([1, 2, 3, 'elipsis', 20]);
  });

  it('cerca del final, igual', () => {
    expect(paginasVisibles(19, 20)).toEqual([1, 'elipsis', 18, 19, 20]);
  });

  it('el ancho del control no crece con los datos', () => {
    const enMil = paginasVisibles(500, 1000);
    expect(enMil.length).toBeLessThanOrEqual(7);
  });
});
