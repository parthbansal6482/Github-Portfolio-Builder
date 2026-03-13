// Protected layout for onboarding — redirects to login if no session
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function OnboardingLayout({
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
