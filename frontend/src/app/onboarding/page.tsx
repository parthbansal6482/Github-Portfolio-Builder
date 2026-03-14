'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { generateCopy, fetchGitHubData, ApiRequestError } from '@/lib/api';
import type { UserPreferences } from '@/types';

import neoBrutalismPreview from '@/assets/neo-brutalism.png';
import glassmorphismPreview from '@/assets/glassmorphism.png';
import retroRpgPreview from '@/assets/retrorpg.png';

type Step = 'template' | 'vibe' | 'color' | 'layout' | 'role' | 'input';

const STEPS: Step[] = ['template', 'vibe', 'color', 'layout', 'role', 'input'];

const TEMPLATE_OPTIONS = [
  {
    id: 'default' as const,
    name: 'Default',
    description: 'Clean, minimal portfolio with adaptive dark/light mode and smooth animations.',
    previewImage: null,
    accentColor: '#6366f1',
    emoji: '✨',
  },
  {
    id: 'neo-brutalism' as const,
    name: 'Neo-Brutalism',
    description: 'Bold, unapologetic design with thick borders, loud colors, and raw energy.',
    previewImage: neoBrutalismPreview,
    accentColor: '#ff90e8',
    emoji: '⚡',
  },
  {
    id: 'glassmorphism' as const,
    name: 'Glassmorphism',
    description: 'Frosted-glass panels over a dark canvas with electric cyan accents and ambient glow.',
    previewImage: glassmorphismPreview,
    accentColor: '#00E5FF',
    emoji: '🔮',
  },
  {
    id: 'retro-rpg' as const,
    name: 'Retro RPG',
    description: 'Quest-inspired parchment layout with pixel accents, levels, and a tavern vibe.',
    previewImage: retroRpgPreview,
    accentColor: '#4F6348',
    emoji: '🗡️',
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    templateId: 'default',
    vibe: 'minimal',
    accentColor: '#6366f1',
    layout: 'grid',
    role: 'frontend',
    highlights: [],
    lookingForJob: false,
    customTagline: null,
  });

  const [highlightsText, setHighlightsText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GitHub sync — runs in background on mount so github_data is ready before generate
  const [syncStatus, setSyncStatus] = useState<'pending' | 'done' | 'error'>('pending');
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    fetchGitHubData()
      .then(() => setSyncStatus('done'))
      .catch((err) => {
        console.error('Background GitHub sync failed:', err);
        setSyncStatus('error');
      });
  }, []);

  const step = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (!isLastStep) setCurrentStepIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStepIndex > 0) setCurrentStepIndex((prev) => prev - 1);
  };

  const handleFinish = async () => {
    if (syncStatus === 'error') {
      setError('Failed to sync your GitHub data. Please refresh and try again.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const finalPrefs: UserPreferences = {
        ...preferences,
        highlights: highlightsText.split('\n').filter((s) => s.trim().length > 0),
      };
      await generateCopy(finalPrefs);
      router.push('/review');
    } catch (err) {
      console.error('Failed to generate portfolio:', err);
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while generating your portfolio.');
      }
      setIsGenerating(false);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f0f23',
      color: '#fff',
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    }}>
      {/* Header / Progress bar */}
      <header style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Customize Workspace</h1>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            Step {currentStepIndex + 1} of {STEPS.length}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '600px', width: '100%' }}>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          {step === 'template' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>Choose a Template</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>Pick the visual design for your portfolio. You can always change it later.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {TEMPLATE_OPTIONS.map((t) => {
                  const isSelected = preferences.templateId === t.id;
                  return (
                    <label
                      key={t.id}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        borderRadius: '16px', overflow: 'hidden',
                        border: isSelected ? `2.5px solid ${t.accentColor}` : '1.5px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.22s ease',
                        boxShadow: isSelected ? `0 0 18px 2px ${t.accentColor}44` : 'none',
                        position: 'relative',
                      }}
                    >
                      <input
                        type="radio"
                        name="templateId"
                        value={t.id}
                        checked={isSelected}
                        onChange={() => updatePreference('templateId', t.id)}
                        style={{ display: 'none' }}
                      />

                      {/* Preview image / placeholder */}
                      <div style={{
                        position: 'relative', width: '100%', paddingBottom: '60%',
                        background: '#1a1a2e', overflow: 'hidden', flexShrink: 0,
                      }}>
                        {t.previewImage ? (
                          <Image
                            src={t.previewImage}
                            alt={`${t.name} preview`}
                            fill
                            sizes="(max-width: 600px) 50vw, 280px"
                            style={{ objectFit: 'cover', objectPosition: 'top' }}
                          />
                        ) : (
                          /* Default template placeholder */
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, #0f0f23 0%, #1e1e3f 50%, #6366f1 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '40px',
                          }}>
                            {t.emoji}
                          </div>
                        )}

                        {/* Selected checkmark overlay */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute', top: '10px', right: '10px',
                            width: '26px', height: '26px', borderRadius: '50%',
                            background: t.accentColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                          }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M3 7l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '14px 16px 16px' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          marginBottom: '6px',
                        }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em' }}>{t.name}</span>
                        </div>
                        <p style={{
                          fontSize: '12px', color: 'rgba(255,255,255,0.48)',
                          lineHeight: 1.5, margin: 0,
                        }}>
                          {t.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'vibe' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>What&apos;s your vibe?</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>This defines the writing style of your headline and about section.</p>

              <div style={{ display: 'grid', gap: '12px' }}>
                {(['minimal', 'dark', 'warm', 'corporate', 'hacker'] as const).map((v) => (
                  <label key={v} style={{
                    display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '12px',
                    border: preferences.vibe === v ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                    background: preferences.vibe === v ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <input
                      type="radio"
                      name="vibe"
                      value={v}
                      checked={preferences.vibe === v}
                      onChange={() => updatePreference('vibe', v)}
                      style={{ marginRight: '16px', accentColor: '#6366f1' }}
                    />
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{v}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 'color' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>Choose an accent color</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>Pick a primary color for buttons and highlights.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'].map((c) => (
                  <label key={c} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '60px', borderRadius: '12px', background: c,
                    border: preferences.accentColor === c ? '4px solid #fff' : '4px solid transparent',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <input
                      type="radio"
                      name="accentColor"
                      value={c}
                      checked={preferences.accentColor === c}
                      onChange={() => updatePreference('accentColor', c)}
                      style={{ display: 'none' }}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 'layout' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>Select a layout</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>How should your portfolio be structured?</p>
              <div style={{ display: 'grid', gap: '12px' }}>
                {(['grid', 'list', 'casestudy', 'timeline'] as const).map((l) => (
                  <label key={l} style={{
                    display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '12px',
                    border: preferences.layout === l ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                    background: preferences.layout === l ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <input
                      type="radio"
                      name="layout"
                      value={l}
                      checked={preferences.layout === l}
                      onChange={() => updatePreference('layout', l)}
                      style={{ marginRight: '16px', accentColor: '#6366f1' }}
                    />
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{l}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 'role' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>What is your primary role?</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>This defines how the AI will position your skills.</p>
              <div style={{ display: 'grid', gap: '12px' }}>
                {(['frontend', 'backend', 'fullstack', 'ml', 'devops', 'student'] as const).map((r) => (
                  <label key={r} style={{
                    display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '12px',
                    border: preferences.role === r ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                    background: preferences.role === r ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={preferences.role === r}
                      onChange={() => updatePreference('role', r)}
                      style={{ marginRight: '16px', accentColor: '#6366f1' }}
                    />
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{r}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 'input' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>Any specific highlights?</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>Tell us anything you specifically want to emphasize in your about section (Optional, one per line).</p>
              <textarea
                value={highlightsText}
                onChange={(e) => setHighlightsText(e.target.value)}
                placeholder="e.g. Next.js and React ecosystem expert&#10;Open source contributor to tRPC"
                rows={5}
                style={{
                  width: '100%', padding: '16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontSize: '16px', outline: 'none', resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
              />
            </div>
          )}

        </div>
      </main>

      {/* Footer Navigation */}
      <footer style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '600px', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isGenerating}
            style={{
              padding: '12px 24px', borderRadius: '8px', fontWeight: 500,
              background: 'transparent', color: currentStepIndex === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
              border: 'none', cursor: currentStepIndex === 0 || isGenerating ? 'not-allowed' : 'pointer'
            }}
          >
            Back
          </button>

          {isLastStep ? (
            <button
              onClick={handleFinish}
              disabled={isGenerating || syncStatus === 'pending'}
              style={{
                padding: '12px 32px', borderRadius: '8px', fontWeight: 600,
                background: (isGenerating || syncStatus === 'pending') ? 'rgba(99, 102, 241, 0.5)' : '#6366f1',
                color: '#fff', border: 'none', cursor: (isGenerating || syncStatus === 'pending') ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              {isGenerating
                ? 'Generating with AI...'
                : syncStatus === 'pending'
                  ? 'Syncing GitHub...'
                  : 'Finish & Generate'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              style={{
                padding: '12px 32px', borderRadius: '8px', fontWeight: 600,
                background: '#fff', color: '#000', border: 'none',
                cursor: 'pointer'
              }}
            >
              Next
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
