import { IdCard, Mail, MapPin, Megaphone, Phone } from 'lucide-react';
import React from 'react';
import { CopyButton } from '@/shared/ui/components/CopyButton';
import {
  formatSabaPhone,
  type SabaCustomer,
} from '../../domain/sabaCustomer.model';
import { CardSection } from './CardSection';
import { CustomerDatum } from './CustomerDatum';
import { SabaApplicationItem } from './SabaApplicationItem';

export function SabaCustomerCard({
  customer,
}: {
  customer: SabaCustomer;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <CardSection title="Identificación">
        {customer.idNumber ? (
          <CustomerDatum
            icon={IdCard}
            label="Cédula"
            value={customer.idNumber}
            action={
              <CopyButton value={customer.idNumber} label="Copiar cédula" />
            }
          />
        ) : (
          <p className="text-muted-foreground text-sm">Sin cédula registrada</p>
        )}
      </CardSection>

      {(customer.email || customer.phone) && (
        <CardSection title="Contacto">
          <CustomerDatum icon={Mail} label="Correo" value={customer.email} />
          <CustomerDatum
            icon={Phone}
            label="Teléfono en Saba"
            value={customer.phone ? formatSabaPhone(customer.phone) : null}
          />
        </CardSection>
      )}

      {(customer.city || customer.source) && (
        <CardSection title="Perfil">
          <CustomerDatum icon={MapPin} label="Ciudad" value={customer.city} />
          <CustomerDatum
            icon={Megaphone}
            label="Origen"
            value={customer.source}
          />
        </CardSection>
      )}

      <CardSection title={`Solicitudes (${customer.applications.length})`}>
        {customer.applications.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Todavía no tiene solicitudes.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {customer.applications.map((application) => (
              <SabaApplicationItem
                key={application.id}
                application={application}
              />
            ))}
          </ul>
        )}
      </CardSection>
    </div>
  );
}
