'use client';

import { Button } from '@repo/ui/components/button';
import { DialogFooter } from '@repo/ui/components/dialog';
import React from 'react';

interface DeleteAction {
  /** Button text, e.g. "Eliminar unidad". */
  label: string;
  /** What is asked before running it. */
  confirmation: string;
  onRemove: () => void;
  deleting?: boolean;
}

interface ModalFooterProps {
  saveLabel: string;
  saving?: boolean;
  onCancel: () => void;
  /** Omitted when creating: only what already exists can be deleted. */
  remove?: DeleteAction;
}

/**
 * The prototype's modal footer (`.modal-foot`): the destructive action on the
 * left with `margin-right:auto`, and Cancel + Save on the right.
 *
 * Confirmation is a second state of the footer itself and not a native
 * `confirm()` as in the prototype: the repo does not allow browser dialogs
 * (criterion from #28).
 */
export function ModalFooter({
  saveLabel,
  saving,
  onCancel,
  remove,
}: ModalFooterProps): React.JSX.Element {
  const [confirming, setConfirming] = React.useState(false);

  if (remove && confirming) {
    return (
      <DialogFooter className="-mx-6 -mb-5 mt-2 border-gray-200 border-t px-6 py-4 sm:justify-between">
        <p className="text-[12.5px] text-gray-600">{remove.confirmation}</p>
        <div className="flex gap-2">
          <Button
            onClick={() => setConfirming(false)}
            type="button"
            variant="ghost"
          >
            Conservar
          </Button>
          <Button
            disabled={remove.deleting}
            onClick={remove.onRemove}
            type="button"
            variant="destructive"
          >
            {remove.deleting ? 'Eliminando…' : 'Sí, eliminar'}
          </Button>
        </div>
      </DialogFooter>
    );
  }

  return (
    <DialogFooter className="-mx-6 -mb-5 mt-2 border-gray-200 border-t px-6 py-4 sm:justify-between">
      {remove ? (
        <Button
          onClick={() => setConfirming(true)}
          type="button"
          variant="destructive"
        >
          {remove.label}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <Button onClick={onCancel} type="button" variant="ghost">
          Cancelar
        </Button>
        <Button disabled={saving} type="submit">
          {saving ? 'Guardando…' : saveLabel}
        </Button>
      </div>
    </DialogFooter>
  );
}
