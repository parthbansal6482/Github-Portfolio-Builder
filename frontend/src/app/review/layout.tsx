// Protected layout for review — redirects to login if no session
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  return <>{children}</>;
}
