import { Button } from '@repo/ui/components/button';
import { ArrowDown } from 'lucide-react';
import React from 'react';

export function BotonIrAlFinal({
  nuevos,
  onClick,
}: {
  nuevos: number;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      aria-label={
        nuevos > 0
          ? `Ir a los mensajes más nuevos (${nuevos} sin ver)`
          : 'Ir a los mensajes más nuevos'
      }
      className="absolute right-4 bottom-4 h-10 gap-1 rounded-full border px-3 shadow-md"
    >
      {nuevos > 0 && <span className="font-semibold text-xs">{nuevos}</span>}
      <ArrowDown aria-hidden="true" className="size-4" />
    </Button>
  );
}
