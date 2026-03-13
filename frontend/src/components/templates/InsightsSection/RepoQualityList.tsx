'use client';

import React, { useState } from 'react';
import type { InsightTheme } from './theme';
import type { RepoCommitQuality } from '@/types';

interface Props {
    data: RepoCommitQuality[];
    theme: InsightTheme;
}

const LABEL_COLORS: Record<string, string> = {
    'Excellent': '#22c55e',
    'Good': '#0ea5e9',
    'Average': '#eab308',
    'Needs improvement': '#f97316',
    'Poor': '#ef4444',
};

export default function RepoQualityList({ data, theme }: Props) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    if (!data || data.length === 0) return null;

    return (
        <div style={{
            background: theme.cardBg, border: theme.cardBorder,
            borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
        }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 16px 0' }}>Per-Repo Breakdown</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.slice(0, 3).map((repo, idx) => {
                    const isExpanded = expandedIdx === idx;
                    const labelColor = LABEL_COLORS[repo.compositeLabel] || theme.accentColor;

                    return (
                        <div key={repo.repoName}>
                            <button
                                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                                    background: `${theme.accentColor}08`, border: 'none',
                                    fontFamily: 'inherit', color: 'inherit', textAlign: 'left',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '13px', color: theme.textColor, fontWeight: 500 }}>{repo.repoName}</span>
                                    <span style={{
                                        fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                                        borderRadius: '9999px',
                                        background: `${labelColor}20`, color: labelColor,
                                    }}>{repo.compositeLabel} ({repo.compositeScore})</span>
                                </div>
                                <span style={{ color: theme.secondaryTextColor, fontSize: '14px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                            </button>

                            {isExpanded && (
                                <div style={{ padding: '12px 12px 4px', fontSize: '13px' }}>
                                    <p style={{ color: theme.secondaryTextColor, margin: '0 0 8px', fontSize: '12px' }}>
                                        Based on {repo.sampleSize} commits
                                    </p>
                                    {repo.aiObservation && (
                                        <p style={{ color: theme.textColor, margin: '0 0 12px', lineHeight: 1.5, fontStyle: 'italic' }}>
                                            {repo.aiObservation}
                                        </p>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                        {[
                                            { label: 'Message Quality', value: repo.messageQuality.label },
                                            { label: 'Atomicity', value: repo.atomicity.label },
                                            { label: 'Fix Ratio', value: repo.fixRatio.label },
                                            { label: 'Test Coverage', value: repo.testCoverage.label },
                                            { label: 'Conventional', value: repo.conventionalCommits.label },
                                        ].map(item => (
                                            <div key={item.label} style={{ fontSize: '12px', color: theme.secondaryTextColor }}>
                                                <span style={{ fontWeight: 500 }}>{item.label}:</span> {item.value}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
