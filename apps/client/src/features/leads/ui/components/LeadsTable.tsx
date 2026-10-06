'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { useLeads } from '../../application/queries/useLeads.query';

export function LeadsTable() {
  const { data: leads, isPending, isError } = useLeads();

  if (isPending) {
    return <p className="text-muted-foreground text-sm">Cargando leads…</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        No se pudieron cargar los leads.
      </p>
    );
  }
  if (leads.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Todavía no hay leads.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Origen</TableHead>
          <TableHead>Creado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>{lead.nombre}</TableCell>
            <TableCell>{lead.correo}</TableCell>
            <TableCell>{lead.origen ?? '—'}</TableCell>
            <TableCell>{lead.createdAt.toLocaleDateString('es')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
