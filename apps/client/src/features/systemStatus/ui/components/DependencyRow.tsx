import { DEPENDENCY_NAME_LABELS } from '../../domain/systemStatus.constants';
import type { Dependency } from '../../domain/systemStatus.model';
import { StatusPill } from './StatusPill';

interface DependencyRowProps {
  dependency: Dependency;
}

export function DependencyRow({ dependency }: DependencyRowProps) {
  return (
    <li className="flex items-center justify-between gap-4 border-b py-2 last:border-b-0">
      <span className="text-sm">
        {DEPENDENCY_NAME_LABELS[dependency.name] ?? dependency.name}
      </span>
      <span className="flex items-center gap-2">
        {dependency.latencyMs !== undefined && (
          <span className="text-muted-foreground text-xs">
            {dependency.latencyMs} ms
          </span>
        )}
        <StatusPill status={dependency.status} />
      </span>
    </li>
  );
}
