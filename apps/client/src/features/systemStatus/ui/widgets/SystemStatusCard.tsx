'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { useSystemStatus } from '../../application/queries/useSystemStatus.query';
import { DependencyRow } from '../components/DependencyRow';

/**
 * Consulta la API desde el navegador con React Query.
 */
export function SystemStatusCard() {
  const { data, isPending, error } = useSystemStatus();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Estado del sistema</CardTitle>
        <CardDescription>API de NestJS, vía el BFF del panel</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending && (
          <p className="text-muted-foreground text-sm">Consultando la API…</p>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            No se pudo contactar la API: {error.message}
          </p>
        )}

        {data && (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              API{' '}
              <span className="font-medium">
                {data.isOperational ? 'operativa' : 'con fallas'}
              </span>{' '}
              · v{data.version} · {data.environment}
            </p>
            <ul className="flex flex-col">
              {data.dependencies.map((dependency) => (
                <DependencyRow key={dependency.name} dependency={dependency} />
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
