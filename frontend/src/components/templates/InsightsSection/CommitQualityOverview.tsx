'use client';

import React from 'react';
import type { InsightTheme } from './theme';
import type { CommitQualityAnalysis } from '@/types';

interface Props {
    data: CommitQualityAnalysis;
    theme: InsightTheme;
}

const LABEL_COLORS: Record<string, string> = {
    'Excellent': '#22c55e',
    'Good': '#0ea5e9',
    'Average': '#eab308',
    'Needs improvement': '#f97316',
    'Poor': '#ef4444',
};

export default function CommitQualityOverview({ data, theme }: Props) {
    const labelColor = LABEL_COLORS[data.overall.compositeLabel] || theme.accentColor;

    return (
        <div style={{
            background: theme.cardBg, border: theme.cardBorder,
            borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
        }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 20px 0' }}>Commit Quality</h4>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '48px', fontWeight: 800, color: labelColor, lineHeight: 1 }}>
                    {data.overall.compositeScore}
                </span>
                <span style={{
                    fontSize: '14px', fontWeight: 600, padding: '3px 10px',
                    borderRadius: '9999px',
                    background: `${labelColor}20`, color: labelColor,
                }}>
                    {data.overall.compositeLabel}
                </span>
            </div>

            {data.overallSummary && (
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: theme.textColor, margin: '0 0 16px 0' }}>
                    {data.overallSummary}
                </p>
            )}

            <div style={{ fontSize: '12px', color: theme.secondaryTextColor }}>
                <span>Based on analysis of: {data.reposAnalyzed.join(', ')}</span>
                <span style={{ marginLeft: '12px' }}>• {data.totalCommitsSampled} commits analyzed</span>
            </div>
        </div>
    );
}
