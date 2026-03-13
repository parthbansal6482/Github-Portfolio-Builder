import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PortfolioViewClient from './PortfolioViewClient';
import type { Portfolio } from '@/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

async function getPortfolio(username: string): Promise<Portfolio | null> {
  try {
    // Next.js fetch with ISR revalidation enabled
    // We fetch from the public open route on our backend
    const res = await fetch(`${BACKEND_URL}/api/portfolio/${username}`, {
      next: { tags: [`portfolio-${username}`], revalidate: 3600 }, // Revalidate at most every hour, or on-demand via webhook
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch portfolio: ${res.status}`);
    }

    const data = await res.json();
    return data.portfolio;
  } catch (err) {
    console.error(`Error loading portfolio for ${username}:`, err);
    return null;
  }
}

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const portfolio = await getPortfolio(username);
  
  if (!portfolio) {
    return { title: 'Not Found | GitFolio' };
  }

  const name = portfolio.githubData.profile.name || username;
  const role = portfolio.preferences.role || 'Developer';
  
  return {
    title: `${name} — ${role}`,
    description: portfolio.generatedCopy?.headline || `Check out ${name}'s portfolio on GitFolio.`,
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { username } = await params;
  const portfolio = await getPortfolio(username);

  if (!portfolio) {
    notFound();
  }

  return (
    <PortfolioViewClient portfolio={portfolio} username={username} />
  );
}
