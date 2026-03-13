'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboard, saveCopy, publishPortfolio, ApiRequestError } from '@/lib/api';
import type { Portfolio, GeneratedCopy } from '@/types';
import { useSession } from 'next-auth/react';

export default function ReviewPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [copy, setCopy] = useState<GeneratedCopy | null>(null);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const { portfolio: data } = await getDashboard();
      setPortfolio(data);
      
      if (!data.generatedCopy) {
        // If they somehow got here without generating copy, send them back
        router.push('/dashboard');
        return;
      }
      
      // We know it has headline, about, projectDescriptions. 
      // Cast the fallback to GeneratedCopy structure for editing purposes.
      setCopy(data.generatedCopy as GeneratedCopy);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
      setError('Failed to load your generated portfolio.');
      setLoading(false);
    }
  };

  const handleUpdateField = (field: keyof GeneratedCopy, value: string) => {
    if (!copy) return;
    setCopy({ ...copy, [field]: value });
  };

  const handleUpdateProject = (repoName: string, value: string) => {
    if (!copy) return;
    setCopy({
      ...copy,
      projectDescriptions: {
        ...copy.projectDescriptions,
        [repoName]: value,
      },
    });
  };

  const handlePublish = async () => {
    if (!copy || !portfolio) return;
    
    setSaving(true);
    setError(null);
    try {
      // 1. Save the edited copy
      await saveCopy(copy);
      
      // 2. Publish it (sets is_published=true, calls revalidate)
      await publishPortfolio();
      
      // 3. Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to publish portfolio:', err);
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while publishing.');
      }
      setSaving(false);
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

  if (error || !copy) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f0f23', color: '#fff', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', color: '#ef4444', marginBottom: '16px' }}>Error</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>{error || 'Data is missing.'}</p>
          <button onClick={() => router.push('/dashboard')} style={{
            padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: '#fff', 
            borderRadius: '8px', border: 'none', cursor: 'pointer'
          }}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  // Derive the public URL 
  const username = session?.user?.githubUsername || 'your-username';
  const publicUrl = `https://${username}.gitfolio.dev`;

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f23', color: '#fff',
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', 
        position: 'sticky', top: 0, background: 'rgba(15, 15, 35, 0.8)', backdropFilter: 'blur(12px)', zIndex: 10
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Review & Publish</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Make any final edits to your AI-generated copy.</p>
          </div>
          <button
            onClick={handlePublish}
            disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
              background: saving ? 'rgba(99, 102, 241, 0.5)' : '#6366f1',
              color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Publishing...' : 'Publish Portfolio'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px', paddingBottom: '120px' }}>
        
        {/* Fallback Warning */}
        {portfolio?.generatedCopy && 'isFallback' in portfolio.generatedCopy && portfolio.generatedCopy.isFallback && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.5)',
            color: '#fbbf24', padding: '16px', borderRadius: '8px', marginBottom: '32px', fontSize: '14px'
          }}>
            <strong>Note:</strong> The AI generation failed due to high demand, so we've built a basic version for you. Feel free to edit it manually below.
          </div>
        )}

        <div style={{ display: 'grid', gap: '32px' }}>
          
          {/* Headline */}
          <section>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
              Headline
            </label>
            <input
              type="text"
              value={copy.headline}
              onChange={(e) => handleUpdateField('headline', e.target.value)}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '18px', fontWeight: 500, outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </section>

          {/* About */}
          <section>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
              About Me
            </label>
            <textarea
              value={copy.about}
              onChange={(e) => handleUpdateField('about', e.target.value)}
              rows={5}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px', lineHeight: 1.6,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '15px', outline: 'none', resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />

          {/* Projects */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Projects</h2>
            <div style={{ display: 'grid', gap: '24px' }}>
              {Object.entries(copy.projectDescriptions).map(([repoName, description]) => (
                <div key={repoName} style={{
                  background: 'rgba(255,255,255,0.02)', padding: '20px', 
                  borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: '#6366f1' }}>
                    {repoName}
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => handleUpdateProject(repoName, e.target.value)}
                    rows={3}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px', lineHeight: 1.5,
                      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.9)', fontSize: '14px', outline: 'none', resize: 'vertical'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
