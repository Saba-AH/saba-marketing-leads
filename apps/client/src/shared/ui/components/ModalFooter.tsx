'use client';

import { Button } from '@repo/ui/components/button';
import { DialogFooter } from '@repo/ui/components/dialog';
import React from 'react';

interface AccionEliminar {
  /** Texto del botón, p. ej. "Eliminar unidad". */
  label: string;
  /** Lo que se pregunta antes de ejecutar. */
  confirmacion: string;
  onEliminar: () => void;
  eliminando?: boolean;
}

interface ModalFooterProps {
  guardarLabel: string;
  guardando?: boolean;
  onCancelar: () => void;
  /** Se omite al crear: solo se elimina lo que ya existe. */
  eliminar?: AccionEliminar;
}

/**
 * Pie de modal del prototipo (`.modal-foot`): la acción destructiva a la
 * izquierda con `margin-right:auto`, y Cancelar + Guardar a la derecha.
 *
 * La confirmación es un segundo estado del propio pie y no un `confirm()`
 * nativo como en el prototipo: el repo no admite diálogos del navegador
 * (criterio de #28).
 */
export function ModalFooter({
  guardarLabel,
  guardando,
  onCancelar,
  eliminar,
}: ModalFooterProps): React.JSX.Element {
  const [confirmando, setConfirmando] = React.useState(false);

  if (eliminar && confirmando) {
    return (
      <DialogFooter className="-mx-6 -mb-5 mt-2 border-gray-200 border-t px-6 py-4 sm:justify-between">
        <p className="text-[12.5px] text-gray-600">{eliminar.confirmacion}</p>
        <div className="flex gap-2">
          <Button
            onClick={() => setConfirmando(false)}
            type="button"
            variant="ghost"
          >
            Conservar
          </Button>
          <Button
            disabled={eliminar.eliminando}
            onClick={eliminar.onEliminar}
            type="button"
            variant="destructive"
          >
            {eliminar.eliminando ? 'Eliminando…' : 'Sí, eliminar'}
          </Button>
        </div>
      </DialogFooter>
    );
  }

  return (
    <DialogFooter className="-mx-6 -mb-5 mt-2 border-gray-200 border-t px-6 py-4 sm:justify-between">
      {eliminar ? (
        <Button
          onClick={() => setConfirmando(true)}
          type="button"
          variant="destructive"
        >
          {eliminar.label}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <Button onClick={onCancelar} type="button" variant="ghost">
          Cancelar
        </Button>
        <Button disabled={guardando} type="submit">
          {guardando ? 'Guardando…' : guardarLabel}
        </Button>
      </div>
    </DialogFooter>
  );
}
