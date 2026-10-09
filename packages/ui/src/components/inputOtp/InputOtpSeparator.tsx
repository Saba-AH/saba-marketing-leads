'use client';

import { MinusIcon } from 'lucide-react';
import * as React from 'react';

function InputOtpSeparator({ ...props }: React.ComponentProps<'div'>) {
  return (
    // The dash between digit groups is decorative: announcing it as `separator`
    // only adds noise for the screen reader.
    <div data-slot="input-otp-separator" aria-hidden="true" {...props}>
      <MinusIcon />
    </div>
  );
}

export default InputOtpSeparator;
