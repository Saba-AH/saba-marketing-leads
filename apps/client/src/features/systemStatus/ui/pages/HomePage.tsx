import { SystemStatusCard } from '../widgets/SystemStatusCard';

export function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Saba Marketing Leads</h1>
        <p className="text-muted-foreground text-sm">
          Panel interno · estado del sistema
        </p>
      </header>
      <SystemStatusCard />
    </div>
  );
}
