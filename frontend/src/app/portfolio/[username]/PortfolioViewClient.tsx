'use client';

import { useEffect } from 'react';
import type { Portfolio } from '@/types';
import { incrementViewCount } from '@/lib/api';

// Templates
import DefaultTemplate from '@/components/templates/DefaultTemplate';
import NeoBrutalismTemplate from '@/components/templates/NeoBrutalism';

import GlassmorphismTemplate from '@/components/templates/Glassmorphism';

import RetroRpgTemplate from '@/components/templates/RetroRpg';

interface ViewProps {
  portfolio: Portfolio;
  username: string;
}

export default function PortfolioViewClient({ portfolio, username }: ViewProps) {

  // Increment view count on mount
  useEffect(() => {
    // We call the API to increment view count. 
    // The backend uses Postgres to increment the value safely.
    // In a production environment, we'd add deduplication logic (e.g. tracking seen IDs in localStorage) 
    // or IP tracking to avoid spamming the refresh button.
    const hasViewed = sessionStorage.getItem(`viewed_${username}`);

    if (!hasViewed) {
      incrementViewCount(username).catch(err => console.error('Failed to register view', err));
      sessionStorage.setItem(`viewed_${username}`, 'true');
    }
  }, [username]);

  // Route to the appropriate template based on templateId
  const { templateId } = portfolio;

  switch (templateId) {
    case 'neo-brutalism':
      return <NeoBrutalismTemplate portfolio={portfolio} username={username} />;
    case 'glassmorphism':
      return <GlassmorphismTemplate portfolio={portfolio} username={username} />;
    case 'retro-rpg':
      return <RetroRpgTemplate portfolio={portfolio} username={username} />;
    default:
      return <DefaultTemplate portfolio={portfolio} username={username} />;
  }
}
