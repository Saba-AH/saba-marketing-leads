import {
  aplicarFiltros,
  type Faceta,
  opcionesDeFaceta,
} from '@/shared/domain/facetas';

interface Cliente {
  nombre: string;
  marcas: string[];
}

const MARCA: Faceta<Cliente> = {
  id: 'marca',
  label: 'Marca',
  presentacion: 'select',
  valoresDe: (cliente) => cliente.marcas,
};

const CLIENTES: Cliente[] = [
  { nombre: 'Uno', marcas: ['Acme'] },
  { nombre: 'Dos', marcas: ['acme'] },
  { nombre: 'Tres', marcas: ['  Beta  '] },
  { nombre: 'Cuatro', marcas: [] },
];

describe('opcionesDeFaceta', () => {
  it('agrupa las escrituras que solo difieren en mayúsculas', () => {
    // El índice de la base distingue mayúsculas, así que "Acme" y "acme"
    // pueden convivir como dos marcas — para una persona son la misma (#144).
    expect(opcionesDeFaceta(CLIENTES, MARCA)).toEqual(['Acme', 'Beta']);
  });

  it('muestra la primera forma encontrada, no la minúscula', () => {
    // Mostrar "acme" cuando la tabla dice "Acme" sería peor que el problema.
    const alReves = [CLIENTES[1], CLIENTES[0]] as Cliente[];
    expect(opcionesDeFaceta(alReves, MARCA)).toEqual(['acme']);
  });

  it('recorta espacios y descarta vacíos', () => {
    expect(
      opcionesDeFaceta([{ nombre: 'X', marcas: ['  ', 'Zeta'] }], MARCA)
    ).toEqual(['Zeta']);
  });

  it('un elemento sin valores no aporta opciones', () => {
    expect(opcionesDeFaceta([CLIENTES[3] as Cliente], MARCA)).toEqual([]);
  });
});

describe('aplicarFiltros', () => {
  it('elegir una escritura trae también las otras', () => {
    const filtrados = aplicarFiltros(CLIENTES, [MARCA], { marca: 'Acme' });

    expect(filtrados.map((cliente) => cliente.nombre)).toEqual(['Uno', 'Dos']);
  });

  it('sin selección no filtra nada', () => {
    expect(aplicarFiltros(CLIENTES, [MARCA], {})).toHaveLength(4);
    expect(aplicarFiltros(CLIENTES, [MARCA], { marca: '' })).toHaveLength(4);
  });

  it('las facetas se combinan con AND', () => {
    const nombre: Faceta<Cliente> = {
      id: 'nombre',
      label: 'Nombre',
      presentacion: 'select',
      valoresDe: (cliente) => cliente.nombre,
    };

    const filtrados = aplicarFiltros(CLIENTES, [MARCA, nombre], {
      marca: 'acme',
      nombre: 'Dos',
    });

    expect(filtrados.map((cliente) => cliente.nombre)).toEqual(['Dos']);
  });
});
