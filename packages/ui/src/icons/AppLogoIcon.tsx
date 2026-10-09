import type React from 'react';

/**
 * The app's logomark (placeholder: replace with the real logo) from the
 * prototype. It inherits the color through `currentColor` so it works the same
 * in the sidebar (brand purple) as over the login's dark panel (white).
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
