'use client';

import React from 'react';
import type { InsightTheme } from './theme';
import type { ForkInterest } from '@/types';

interface Props {
    data: ForkInterest[];
    theme: InsightTheme;
}

export default function ForkInterestsSection({ data, theme }: Props) {
    // Hide entirely if no forks
    if (!data || data.length === 0) return null;

    return (
        <div>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 16px 0' }}>Interests &amp; Explorations</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {data.slice(0, 4).map((interest) => (
                    <div
                        key={interest.category}
                        style={{
                            background: theme.cardBg, border: theme.cardBorder,
                            borderRadius: '12px', padding: '20px', fontFamily: theme.fontFamily,
                        }}
                    >
                        <h5 style={{ fontSize: '16px', fontWeight: 600, color: theme.textColor, margin: '0 0 6px 0' }}>
                            {interest.category}
                        </h5>
                        <p style={{ fontSize: '13px', color: theme.secondaryTextColor, lineHeight: 1.5, margin: '0 0 12px 0' }}>
                            {interest.description}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {interest.repos.map(repo => (
                                <a
                                    key={repo}
                                    href={`https://github.com/${repo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontSize: '11px', padding: '3px 8px',
                                        borderRadius: '9999px', textDecoration: 'none',
                                        background: `${theme.accentColor}12`,
                                        color: theme.accentColor, fontWeight: 500,
                                    }}
                                >
                                    {repo}
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
