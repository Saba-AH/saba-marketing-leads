import React from 'react';

export type PillTone = 'internal' | 'external' | 'active' | 'inactive';

/** The prototype's tones, resolved with the design system tokens. */
const TONES: Record<PillTone, { container: string; dot: string }> = {
  internal: { container: 'bg-brand-50 text-brand-700', dot: 'bg-brand-600' },
  external: {
    container: 'bg-secondary-100 text-secondary-700',
    dot: 'bg-secondary-700',
  },
  active: {
    container: 'bg-success-50 text-success-700',
    dot: 'bg-success-600',
  },
  inactive: { container: 'bg-gray-200 text-gray-600', dot: 'bg-gray-500' },
};

/** The prototype's status label (`.pill` + `.pill-dot`). */
export function Pill({
  tone,
  children,
}: {
  tone: PillTone;
  children: React.ReactNode;
}): React.JSX.Element {
  const { container, dot } = TONES[tone];
  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] font-bold text-[11.5px] ${container}`}
    >
      <span className={`size-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}
