import type { TDependencyStatus } from '@repo/schemas';
import { cn } from '@repo/ui/lib/utils';
import { DEPENDENCY_STATUS_LABELS } from '../../domain/systemStatus.constants';

const STATUS_CLASSES: Record<TDependencyStatus, string> = {
  up: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  degraded: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  down: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

interface StatusPillProps {
  status: TDependencyStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_CLASSES[status]
      )}
    >
      {DEPENDENCY_STATUS_LABELS[status]}
    </span>
  );
}
