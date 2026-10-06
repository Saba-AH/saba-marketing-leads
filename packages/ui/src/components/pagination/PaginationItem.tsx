import * as React from 'react';

export default function PaginationItem(props: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}
