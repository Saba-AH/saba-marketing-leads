'use client';

import { MinusIcon } from 'lucide-react';
import * as React from 'react';

function InputOtpSeparator({ ...props }: React.ComponentProps<'div'>) {
  return (
    // El guion entre grupos de dígitos es decorativo: anunciarlo como
    // `separator` solo agrega ruido al lector de pantalla.
    <div data-slot="input-otp-separator" aria-hidden="true" {...props}>
      <MinusIcon />
    </div>
  );
}

export default InputOtpSeparator;
