// Custom username picker page — shown when GitHub username is a reserved subdomain
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const RESERVED_SUBDOMAINS = [
  'www', 'api', 'app', 'admin', 'dashboard', 'mail', 'dev',
  'staging', 'blog', 'help', 'support', 'status', 'static', 'assets',
];

export default function ChooseUsernamePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUsername = (value: string): string | null => {
    const cleaned = value.toLowerCase().trim();
    if (cleaned.length < 3) return 'Username must be at least 3 characters';
    if (cleaned.length > 39) return 'Username must be 39 characters or fewer';
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(cleaned)) {
      return 'Only lowercase letters, numbers, and hyphens allowed (cannot start/end with hyphen)';
    }
    if (RESERVED_SUBDOMAINS.includes(cleaned)) {
      return `"${cleaned}" is reserved. Please choose a different username.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/profile/update-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          username: username.toLowerCase().trim(),
          githubUsername: session?.user?.githubUsername,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error?.message || 'Failed to update username');
        setLoading(false);
        return;
      }

      // Success — redirect to onboarding
      router.push('/onboarding');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        padding: '40px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#fff',
          marginBottom: '8px',
        }}>
          Choose your username
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '32px',
          lineHeight: 1.5,
        }}>
          Your GitHub username is reserved by the system. Pick a custom username
          for your portfolio URL.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '8px',
            }}>
              Username
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              border: error
                ? '1px solid rgba(239, 68, 68, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.15)',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="your-username"
                autoFocus
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '15px',
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}
              />
              <span style={{
                padding: '12px 16px',
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}>
                .gitfolio.dev
              </span>
            </div>
          </div>

          {error && (
            <p style={{
              fontSize: '13px',
              color: '#ef4444',
              marginBottom: '16px',
            }}>
              {error}
            </p>
          )}

          <button
            id="submit-username"
            type="submit"
            disabled={loading || !username.trim()}
            style={{
              width: '100%',
              padding: '12px',
              background: loading || !username.trim()
                ? 'rgba(99, 102, 241, 0.3)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading || !username.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
