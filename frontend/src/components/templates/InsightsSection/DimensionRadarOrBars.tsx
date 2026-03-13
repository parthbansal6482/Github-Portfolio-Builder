'use client';

import React from 'react';
import type { InsightTheme } from './theme';
import type { CommitQualityAnalysis } from '@/types';

interface Props {
    data: CommitQualityAnalysis;
    theme: InsightTheme;
}

const DIMENSIONS = [
    { key: 'messageQualityScore', label: 'Message Quality', weight: '30%' },
    { key: 'atomicityScore', label: 'Atomicity', weight: '20%' },
    { key: 'fixRatioScore', label: 'Fix Ratio', weight: '20%' },
    { key: 'testCoverageScore', label: 'Test Coverage', weight: '15%' },
    { key: 'consistencyScore', label: 'Consistency', weight: '10%' },
    { key: 'conventionalCommitsScore', label: 'Conventional Commits', weight: '5%' },
] as const;

export default function DimensionRadarOrBars({ data, theme }: Props) {
    return (
        <div style={{
            background: theme.cardBg, border: theme.cardBorder,
            borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
        }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 20px 0' }}>Quality Dimensions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {DIMENSIONS.map(({ key, label, weight }) => {
                    const score = data.overall[key];
                    const isConsistency = key === 'consistencyScore';

                    return (
                        <div key={key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: theme.textColor, fontWeight: 500 }}>{label}</span>
                                    <span style={{ fontSize: '10px', color: theme.secondaryTextColor, opacity: 0.7 }}>({weight})</span>
                                </div>
                                <span style={{ color: theme.secondaryTextColor, fontWeight: 500 }}>{score}/100</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: `${theme.accentColor}15`, borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${score}%`, height: '100%',
                                    background: theme.accentColor, borderRadius: '3px',
                                    transition: 'width 0.6s ease',
                                }} />
                            </div>
                            {isConsistency && data.consistencyScoreNote && (
                                <p style={{ fontSize: '11px', color: theme.secondaryTextColor, fontStyle: 'italic', margin: '4px 0 0 0' }}>
                                    ⓘ {data.consistencyScoreNote}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
