'use client';

import { Button } from '@repo/ui/components/button';
import { Check, Copy } from 'lucide-react';
import React from 'react';

const CONFIRMATION_MS = 2_000;

/** Copies `value` to the clipboard and confirms for a moment ("Copiado"). */
export function CopyButton({
  value,
  label,
}: {
  value: string;
  /** For screen readers: "Copiar cédula". */
  label: string;
}): React.JSX.Element {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Without clipboard permission (http, iframe): the value stays visible to copy by hand.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => void copy()}
      aria-label={copied ? 'Copiado' : label}
      className="h-7 gap-1 px-2 text-xs"
    >
      {copied ? (
        <Check aria-hidden="true" className="size-3.5" />
      ) : (
        <Copy aria-hidden="true" className="size-3.5" />
      )}
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  );
}
