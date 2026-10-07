import type { Metadata } from 'next';
import { ChatsPage } from '@/features/chats/ui/pages/ChatsPage';

export const metadata: Metadata = { title: 'Chats · Saba Marketing Leads' };

export default function Page() {
  return <ChatsPage />;
}
