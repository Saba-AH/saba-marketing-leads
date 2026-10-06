'use client';

import { Input } from '@repo/ui/components/input';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';

/** Input de contraseña con botón para mostrarla. */
export function CampoContrasena(
  props: Omit<React.ComponentProps<typeof Input>, 'type'>
): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        autoComplete="current-password"
        className="h-11 pr-10"
        placeholder="••••••••"
        type={visible ? 'text' : 'password'}
        {...props}
      />
      <button
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
        disabled={props.disabled}
        onClick={() => setVisible((actual) => !actual)}
        type="button"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
