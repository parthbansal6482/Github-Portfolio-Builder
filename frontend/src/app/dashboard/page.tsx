'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getDashboard, publishPortfolio, unpublishPortfolio, resyncGitHubData } from '@/lib/api';
import type { Portfolio } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/');
    },
  });

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getDashboard();
      setPortfolio(data.portfolio);
    } catch (err: any) {
      if (err?.code === 'NOT_FOUND') {
        // They haven't set up yet
        router.push('/choose-username');
      } else {
        console.error('Failed to load dashboard:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!portfolio) return;
    try {
      if (portfolio.isPublished) {
        await unpublishPortfolio();
        setPortfolio({ ...portfolio, isPublished: false });
      } else {
        await publishPortfolio();
        setPortfolio({ ...portfolio, isPublished: true });
      }
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
      alert('Failed to update publish status. Please try again.');
    }
  };

  const handleResync = async () => {
    setSyncing(true);
    try {
      await resyncGitHubData();
      alert('GitHub data resynced. Please re-generate your portfolio to see changes.');
      router.push('/onboarding');
    } catch (err) {
      console.error('Failed to resync:', err);
      alert('Failed to resync GitHub data.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f0f23', color: '#fff', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif'
      }}>
        <div style={{
          width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!portfolio) return null;

  const username = session?.user?.githubUsername || 'your-username';
  // Note: in a real environment with custom domain, this would be different
  const publicUrl = `http://localhost:3000/portfolio/${username}`; 

  const totalStarCount = portfolio.githubData.allRepos.reduce((acc, repo) => acc + (repo.stargazerCount || 0), 0);

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f23', color: '#fff',
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', 
        background: 'rgba(15, 15, 35, 0.8)', backdropFilter: 'blur(12px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {session?.user?.image ? (
              <img src={session.user.image} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#374151' }} />
            )}
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700 }}>GitFolio Dashboard</h1>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>@{username}</div>
            </div>
          </div>
          <div>
            <Link href="/" style={{ fontSize: '14px', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
              &larr; Back home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
        
        {/* Left Column (Overview & Stats) */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Overview</h2>
          
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Total Views</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{portfolio.viewCount}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Total Stars</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>{totalStarCount}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Public Repos</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>{portfolio.githubData.profile.publicRepos}</div>
            </div>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <Link href="/onboarding" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              textDecoration: 'none', color: '#fff', transition: 'all 0.2s'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Re-configure Portfolio</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Change vibe, role, layout and re-generate AI copy.</div>
              </div>
              <div style={{ color: '#6366f1' }}>&rarr;</div>
            </Link>

            <Link href="/review" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              textDecoration: 'none', color: '#fff', transition: 'all 0.2s'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Edit Copy Manually</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Directly edit the AI generated headline and project blurbs.</div>
              </div>
              <div style={{ color: '#6366f1' }}>&rarr;</div>
            </Link>
          </div>

        </div>

        {/* Right Column (Status & Sync) */}
        <div>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '24px', marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: portfolio.isPublished ? '#10b981' : '#6b7280' }} />
              <div style={{ fontWeight: 500 }}>{portfolio.isPublished ? 'Published' : 'Draft'}</div>
            </div>
            
            {portfolio.isPublished && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Public Link</div>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'block', wordBreak: 'break-all', fontSize: '14px', color: '#6366f1', textDecoration: 'underline'
                }}>
                  {publicUrl}
                </a>
              </div>
            )}

            <button
              onClick={handleTogglePublish}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 600,
                background: portfolio.isPublished ? 'rgba(255,255,255,0.1)' : '#6366f1',
                color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {portfolio.isPublished ? 'Unpublish' : 'Publish Portfolio'}
            </button>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>GitHub Sync</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px', lineHeight: 1.5 }}>
              Last synced: {new Date(portfolio.updatedAt).toLocaleDateString()}
            </p>
            <button
              onClick={handleResync}
              disabled={syncing}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 600,
                background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                cursor: syncing ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
              }}
            >
              {syncing ? 'Syncing...' : 'Resync from GitHub'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
