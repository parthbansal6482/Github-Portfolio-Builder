'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboard, fetchGitHubData, ApiRequestError } from '@/lib/api';
import type { Portfolio } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { portfolio } = await getDashboard();

      if (!portfolio || !portfolio.githubData) {
        // Initial setup needed — automatically trigger fetch post-login
        handleInitialSync();
      } else if (!portfolio.preferences || !portfolio.generatedCopy) {
        // Has GitHub data but hasn't finished wizard
        router.push('/onboarding');
      } else {
        // Fully set up — show normal dashboard
        setPortfolio(portfolio);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load your profile. Please try again.');
      setLoading(false);
    }
  };

  const handleInitialSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await fetchGitHubData();
      router.push('/onboarding');
    } catch (err) {
      console.error('Initial sync failed:', err);
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Failed to sync with GitHub. Please try again.');
      }
      setSyncing(false);
      setLoading(false);
    }
  };

  if (loading || syncing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
        color: '#fff',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '24px',
        }} />
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
          {syncing ? 'Fetching your GitHub profile...' : 'Loading dashboard...'}
        </h2>
        {syncing && (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
            This might take a few seconds as we analyze your repositories and top languages.
          </p>
        )}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
        color: '#fff',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        padding: '24px',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          maxWidth: '480px',
          width: '100%',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#ef4444', marginBottom: '16px' }}>
            Sync Failed
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '32px', lineHeight: 1.5 }}>
            {error}
          </p>
          <button
            onClick={handleInitialSync}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Final Dashboard UI stub (Task 23 will expand this)
  return (
    <div style={{
      padding: '40px',
      color: '#fff',
      background: '#0f0f23',
      minHeight: '100vh',
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px' }}>Dashboard</h1>
      <pre style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '20px',
        borderRadius: '12px',
        overflowX: 'auto',
      }}>
        {JSON.stringify(portfolio, null, 2)}
      </pre>
    </div>
  );
}
