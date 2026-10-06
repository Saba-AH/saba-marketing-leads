import type React from 'react';

/**
 * Isotipo de la app (placeholder: reemplazar por el logo real)
 * del prototipo. Hereda el color con
 * `currentColor` para servir igual en el sidebar (morado de marca) que sobre
 * el panel oscuro del login (blanco).
 */
function AppLogoIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M12 2L22 20H2L12 2Z" />
    </svg>
  );
}

export default AppLogoIcon;
