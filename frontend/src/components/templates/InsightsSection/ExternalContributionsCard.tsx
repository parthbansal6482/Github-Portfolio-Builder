'use client';

import React from 'react';
import type { InsightTheme } from './theme';

interface Props {
    prsMerged: number;
    reposContributed: string[];
    theme: InsightTheme;
}

export default function ExternalContributionsCard({ prsMerged, reposContributed, theme }: Props) {
    if (prsMerged === 0) {
        return (
            <div style={{
                background: theme.cardBg, border: theme.cardBorder,
                borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
            }}>
                <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 12px 0' }}>Open Source Contributions</h4>
                <p style={{ color: theme.secondaryTextColor, fontSize: '14px', margin: 0 }}>No external contributions found</p>
            </div>
        );
    }

    return (
        <div style={{
            background: theme.cardBg, border: theme.cardBorder,
            borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
        }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 12px 0' }}>Open Source Contributions</h4>
            <p style={{ fontSize: '28px', fontWeight: 700, color: theme.accentColor, margin: '0 0 4px 0' }}>
                {prsMerged}
            </p>
            <p style={{ fontSize: '14px', color: theme.textColor, margin: '0 0 16px 0' }}>
                PRs merged in external repos
            </p>
            {reposContributed.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {reposContributed.map(repo => (
                        <a
                            key={repo}
                            href={`https://github.com/${repo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                fontSize: '12px', padding: '3px 10px',
                                borderRadius: '9999px', textDecoration: 'none',
                                background: `${theme.accentColor}12`,
                                color: theme.accentColor, fontWeight: 500,
                                transition: 'background 0.2s',
                            }}
                        >
                            {repo}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
