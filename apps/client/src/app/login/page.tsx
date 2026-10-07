import type { Metadata } from 'next';
import { LoginPage } from '@/features/auth/ui/pages/LoginPage';
import { safeNextPath } from '@/lib/session/safeNextPath';

export const metadata: Metadata = {
  title: 'Iniciar sesión · Saba Marketing Leads',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <LoginPage next={safeNextPath(typeof next === 'string' ? next : null)} />
  );
}
