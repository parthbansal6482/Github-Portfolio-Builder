'use client';

import { useEffect } from 'react';
import type { Portfolio } from '@/types';
import { incrementViewCount } from '@/lib/api';

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

  const { githubData, preferences, generatedCopy } = portfolio;
  const { profile, pinnedRepos } = githubData;
  const copy = generatedCopy && !('fallbackReason' in generatedCopy) && !generatedCopy.isFallback 
    ? generatedCopy 
    : generatedCopy; // We'll just use it either way, fallback or not

  if (!copy) {
    return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Portfolio content is missing.</div>;
  }

  // Define visual variables based on preferences
  const bgColor = preferences.vibe === 'dark' || preferences.vibe === 'hacker' || preferences.vibe === 'minimal' ? '#0f0f23' : '#f8fafc';
  const textColor = bgColor === '#0f0f23' ? '#f8fafc' : '#0f172a';
  const secondaryTextColor = bgColor === '#0f0f23' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
  const cardBg = bgColor === '#0f0f23' ? 'rgba(255,255,255,0.03)' : '#ffffff';
  const cardBorder = bgColor === '#0f0f23' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)';
  const accentColor = preferences.accentColor || '#6366f1';

  // Choose font family based on vibe
  let fontFam = 'var(--font-geist-sans), system-ui, sans-serif';
  if (preferences.vibe === 'hacker') fontFam = 'var(--font-geist-mono), monospace';
  if (preferences.vibe === 'corporate') fontFam = 'Inter, system-ui, sans-serif';

  return (
    <div style={{
      minHeight: '100vh',
      background: bgColor,
      color: textColor,
      fontFamily: fontFam,
      padding: '40px 24px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ 
        maxWidth: preferences.layout === 'casestudy' ? '800px' : '1000px', 
        margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '64px'
      }}>
        
        {/* Hero Section */}
        <section style={{ 
          display: 'flex', flexDirection: preferences.layout === 'casestudy' ? 'column' : 'row', 
          alignItems: preferences.layout === 'casestudy' ? 'flex-start' : 'center', 
          gap: '32px', marginTop: '40px'
        }}>
          {profile.avatar && (
            <img 
              src={profile.avatar} 
              alt={profile.name} 
              style={{ 
                width: preferences.layout === 'casestudy' ? '80px' : '120px', 
                height: preferences.layout === 'casestudy' ? '80px' : '120px', 
                borderRadius: preferences.vibe === 'corporate' ? '8px' : '50%',
                border: `2px solid ${accentColor}`
              }} 
            />
          )}
          <div>
            <h1 style={{ 
              fontSize: preferences.layout === 'casestudy' ? '48px' : '40px', 
              fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.1,
              letterSpacing: preferences.vibe === 'minimal' ? '-0.02em' : 'normal'
            }}>
              {profile.name || username}
            </h1>
            <h2 style={{ fontSize: '20px', color: accentColor, fontWeight: 500, margin: 0 }}>
              {copy.headline}
            </h2>
          </div>
        </section>

        {/* About Section */}
        <section>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: secondaryTextColor, marginBottom: '16px' }}>
            About
          </h3>
          <p style={{ 
            fontSize: '18px', lineHeight: 1.7, color: textColor,
            maxWidth: '800px', margin: 0, whiteSpace: 'pre-wrap'
          }}>
            {copy.about}
          </p>
        </section>

        {/* Projects Section */}
        <section>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: secondaryTextColor, marginBottom: '24px' }}>
            Featured Work
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: preferences.layout === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr', 
            gap: '24px' 
          }}>
            {pinnedRepos.map((repo) => {
              const description = copy.projectDescriptions[repo.name] || repo.description;
              
              return (
                <a 
                  key={repo.name} 
                  href={repo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textDecoration: 'none', color: 'inherit',
                    background: cardBg, border: cardBorder, borderRadius: '12px',
                    padding: '24px', transition: 'transform 0.2s ease, border-color 0.2s ease',
                    cursor: 'pointer', outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = bgColor === '#0f0f23' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{repo.name}</h4>
                    {repo.primaryLanguage && (
                      <span style={{ fontSize: '12px', fontWeight: 500, padding: '4px 8px', background: `${accentColor}20`, color: accentColor, borderRadius: 'full' }}>
                        {repo.primaryLanguage}
                      </span>
                    )}
                  </div>
                  
                  <p style={{ fontSize: '15px', lineHeight: 1.6, color: secondaryTextColor, margin: '0 0 20px 0' }}>
                    {description}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: secondaryTextColor }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
                      {repo.stargazerCount}
                    </div>
                    {repo.topics && repo.topics.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', overflow: 'hidden' }}>
                        {repo.topics.slice(0, 3).map(topic => (
                          <span key={topic} style={{ background: 'rgba(128,128,128,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ marginTop: '32px', paddingTop: '32px', borderTop: cardBorder, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: secondaryTextColor }}>
          <div>© {new Date().getFullYear()} {profile.name || username}</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>GitHub Profile</a>
            {profile.blog && (
              <a href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Website</a>
            )}
          </div>
        </footer>

      </div>
    </div>
  );
}
