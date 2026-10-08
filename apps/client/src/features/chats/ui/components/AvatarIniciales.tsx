import { cn } from '@repo/ui/lib/utils';
import { UserRound } from 'lucide-react';
import React from 'react';
import { iniciales } from '../../domain/chat.model';

const TAMANOS = {
  sm: 'size-10 text-sm',
  lg: 'size-20 text-2xl',
} as const;

/** Círculo con las iniciales, como en WhatsApp; sin letras (solo teléfono), un ícono. */
export function AvatarIniciales({
  nombre,
  tamano = 'sm',
}: {
  nombre: string;
  tamano?: keyof typeof TAMANOS;
}): React.JSX.Element {
  const letras = iniciales(nombre);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground',
        TAMANOS[tamano]
      )}
    >
      {letras ?? <UserRound className="size-1/2" />}
    </span>
  );
}
