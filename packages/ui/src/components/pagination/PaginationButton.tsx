import { buttonVariants } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

type PaginationButtonProps = {
  activo?: boolean;
} & React.ComponentProps<'button'>;

/**
 * Reemplaza al `PaginationLink` de shadcn, que renderiza un `<a>`.
 *
 * Ese componente asume paginación por URL. Acá la página es estado en memoria:
 * no hay destino al que apuntar, así que un ancla sería un enlace falso — el
 * lector de pantalla lo anunciaría como enlace, la barra espaciadora no lo
 * activaría y abrirlo en otra pestaña no llevaría a ninguna parte.
 */
export default function PaginationButton({
  className,
  activo,
  ...props
}: PaginationButtonProps) {
  return (
    <button
      aria-current={activo ? 'page' : undefined}
      className={cn(
        buttonVariants({ variant: activo ? 'outline' : 'ghost', size: 'icon' }),
        className
      )}
      data-active={activo}
      data-slot="pagination-button"
      type="button"
      {...props}
    />
  );
}
