'use client';

import { Button } from '@repo/ui/components/button';
import React from 'react';
import { BrandChip } from './form/BrandChip';
import { Campo } from './form/Campo';
import { CONTROL_CAMPO } from './form/campoClases';

interface CampoDeChipsProps {
  id: string;
  label: string;
  /** Texto de apoyo bajo el campo, cuando necesita explicarse. */
  ayuda?: React.ReactNode;
  valores: string[];
  onChange: (valores: string[]) => void;
  /** Nombre del botón de alta: dos campos de chips en el mismo formulario no
   *  pueden compartir "Agregar" a secas. */
  etiquetaAgregar: string;
  placeholder?: string;
  className?: string;
}

/**
 * Lista editable de textos cortos como chips, con la fila de alta debajo
 * (`.add-inline-row` del prototipo). La usan las Posiciones y los Alias de
 * Entra del modal de Unidad.
 */
export function CampoDeChips({
  id,
  label,
  ayuda,
  valores,
  onChange,
  etiquetaAgregar,
  placeholder,
  className,
}: CampoDeChipsProps): React.JSX.Element {
  const [entrada, setEntrada] = React.useState('');

  function agregar(): void {
    const valor = entrada.trim();
    if (valor && !valores.includes(valor)) {
      onChange([...valores, valor]);
    }
    setEntrada('');
  }

  return (
    <Campo ayuda={ayuda} className={className} htmlFor={id} label={label}>
      {valores.length > 0 ? (
        <div className="mb-1 flex flex-wrap">
          {valores.map((valor) => (
            <BrandChip
              key={valor}
              label={valor}
              onQuitar={() =>
                onChange(valores.filter((actual) => actual !== valor))
              }
            />
          ))}
        </div>
      ) : (
        <p className="mb-2 text-[12px] text-gray-400">
          Aún no hay nada agregado
        </p>
      )}

      <div className="flex gap-2">
        <input
          className={CONTROL_CAMPO}
          id={id}
          onChange={(event) => setEntrada(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              agregar();
            }
          }}
          placeholder={placeholder}
          value={entrada}
        />
        <Button
          aria-label={etiquetaAgregar}
          onClick={agregar}
          size="sm"
          type="button"
          variant="outline"
        >
          Agregar
        </Button>
      </div>
    </Campo>
  );
}
