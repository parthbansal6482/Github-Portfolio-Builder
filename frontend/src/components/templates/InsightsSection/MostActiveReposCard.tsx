'use client';

import React from 'react';
import type { InsightTheme } from './theme';
import type { ActiveRepo } from '@/types';

interface Props {
    data: ActiveRepo[];
    theme: InsightTheme;
}

const QUALITY_COLORS: Record<string, string> = {
    'Excellent': '#22c55e',
    'Good': '#0ea5e9',
    'Average': '#eab308',
    'Needs improvement': '#f97316',
    'Poor': '#ef4444',
};

export default function MostActiveReposCard({ data, theme }: Props) {
    if (!data || data.length === 0) {
        return (
            <div style={{
                background: theme.cardBg, border: theme.cardBorder,
                borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
            }}>
                <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 12px 0' }}>Most Active Repos</h4>
                <p style={{ color: theme.secondaryTextColor, fontSize: '14px', margin: 0 }}>No recent commit activity found</p>
            </div>
        );
    }

    return (
        <div style={{
            background: theme.cardBg, border: theme.cardBorder,
            borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
        }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 16px 0' }}>Most Active Repos</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.slice(0, 6).map((repo, idx) => (
                    <a
                        key={repo.name}
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', borderRadius: '8px',
                            background: `${theme.accentColor}08`,
                            textDecoration: 'none', color: 'inherit',
                            transition: 'background 0.2s',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span style={{ fontSize: '13px', color: theme.textColor, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {idx < 3 && repo.qualityScore !== undefined && repo.qualityLabel && (
                                <span style={{
                                    fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                                    borderRadius: '9999px',
                                    background: `${QUALITY_COLORS[repo.qualityLabel] || theme.accentColor}20`,
                                    color: QUALITY_COLORS[repo.qualityLabel] || theme.accentColor,
                                }}>
                                    {repo.qualityLabel}
                                </span>
                            )}
                            <span style={{ fontSize: '12px', color: theme.secondaryTextColor, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                {repo.commitCount} commits
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
