import React from 'react';

/** A block of the contact card, like the sections of WhatsApp's "Contact info". */
export function CardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-2 rounded-lg border p-3"
    >
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {title}
      </h4>
      {children}
    </section>
  );
}
