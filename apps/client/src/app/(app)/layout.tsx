import Link from 'next/link';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-svh">
      <nav className="border-b px-6 py-3 flex gap-4 text-sm">
        <Link href="/" className="font-semibold">
          Saba Marketing Leads
        </Link>
        <Link href="/leads" className="text-muted-foreground">
          Leads
        </Link>
      </nav>
      {children}
    </div>
  );
}
