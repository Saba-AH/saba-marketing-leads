import { cn } from '@repo/ui/lib/utils';
import React from 'react';
import {
  type ApplicationTone,
  applicationTone,
  formatAmount,
  formatDate,
  formatInstallment,
  type SabaApplication,
} from '../../domain/sabaCustomer.model';

const TONES: Record<ApplicationTone, string> = {
  active: 'bg-primary text-primary-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
  closed: 'bg-muted text-muted-foreground',
  inProgress: 'bg-secondary text-secondary-foreground',
};

export function SabaApplicationItem({
  application,
}: {
  application: SabaApplication;
}): React.JSX.Element {
  const amount = formatAmount(application.financedAmount);
  const installmentAmount = formatInstallment(application);
  return (
    <li className="flex flex-col gap-2 rounded-md bg-muted/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">
            {application.product ?? 'Producto sin nombre'}
          </p>
          <p className="text-muted-foreground text-xs">
            Creada el {formatDate(application.createdAt)}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 font-medium text-xs',
            TONES[applicationTone(application)]
          )}
        >
          {application.statusLabel}
        </span>
      </div>
      {(amount || installmentAmount) && (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {amount && (
            <div>
              <dt className="text-muted-foreground text-xs">Financiado</dt>
              <dd className="font-medium">{amount}</dd>
            </div>
          )}
          {installmentAmount && (
            <div>
              <dt className="text-muted-foreground text-xs">Cuota</dt>
              <dd className="font-medium">{installmentAmount}</dd>
            </div>
          )}
        </dl>
      )}
    </li>
  );
}
