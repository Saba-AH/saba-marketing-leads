import { Search } from 'lucide-react';
import React from 'react';

/** The prototype's empty state (`.empty-state`). */
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.JSX.Element {
  return (
    <div className="px-5 py-12 text-center text-gray-500">
      <Search
        aria-hidden="true"
        className="mx-auto mb-2.5 size-10 text-gray-300"
      />
      <div className="mb-1 font-bold text-gray-700 text-sm">{title}</div>
      <div className="text-[12.5px]">{description}</div>
    </div>
  );
}
