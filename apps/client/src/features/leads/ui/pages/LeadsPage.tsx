import { LeadForm } from '../components/LeadForm';
import { LeadsTable } from '../components/LeadsTable';

export function LeadsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-muted-foreground text-sm">
          Contactos interesados, los más recientes primero.
        </p>
      </header>
      <LeadForm />
      <LeadsTable />
    </div>
  );
}
