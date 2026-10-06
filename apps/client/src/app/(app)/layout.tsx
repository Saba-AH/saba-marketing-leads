import { cookies } from 'next/headers';
import { UserMenu } from '@/features/auth/ui/widgets/UserMenu';
import { AppShell } from '@/shared/ui/layouts/AppShell';

/** Cookie que escribe el sidebar de shadcn al abrirlo o colapsarlo. */
const SIDEBAR_COOKIE = 'sidebar_state';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarState = (await cookies()).get(SIDEBAR_COOKIE)?.value;
  return (
    <AppShell defaultOpen={sidebarState !== 'false'} pieSidebar={<UserMenu />}>
      {children}
    </AppShell>
  );
}
