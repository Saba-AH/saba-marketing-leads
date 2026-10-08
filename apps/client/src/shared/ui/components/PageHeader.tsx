import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  /** Button bar on the right. */
  actions?: React.ReactNode;
}

/** The prototype's screen header (`.page-header`). */
export function PageHeader({
  title,
  subtitle,
  actions,
}: PageHeaderProps): React.JSX.Element {
  return (
    <div className="mb-[22px] flex items-start justify-between gap-4">
      <div>
        <h1 className="font-extrabold text-2xl text-gray-950 tracking-[-0.01em]">
          {title}
        </h1>
        <p className="mt-1 text-[13.5px] text-gray-500">{subtitle}</p>
      </div>
      {actions && <div className="flex shrink-0 gap-2.5">{actions}</div>}
    </div>
  );
}
