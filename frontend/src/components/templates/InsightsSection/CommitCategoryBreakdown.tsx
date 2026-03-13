'use client';

import React from 'react';
import type { InsightTheme } from './theme';
import type { RepoCommitQuality } from '@/types';

interface Props {
    data: RepoCommitQuality[];
    theme: InsightTheme;
}

const CATEGORY_COLORS: Record<string, string> = {
    feat: '#3b82f6',
    fix: '#ef4444',
    docs: '#a855f7',
    refactor: '#06b6d4',
    test: '#22c55e',
    chore: '#6b7280',
    other: '#94a3b8',
};

const CATEGORY_LABELS: Record<string, string> = {
    feat: 'Feature',
    fix: 'Fix',
    docs: 'Docs',
    refactor: 'Refactor',
    test: 'Test',
    chore: 'Chore',
    other: 'Other',
};

export default function CommitCategoryBreakdown({ data, theme }: Props) {
    if (!data || data.length === 0) return null;

    // Use the best-scoring repo's categories
    const categories = data[0].messageCategories;
    const entries = Object.entries(categories).filter(([, v]) => v > 0);

    if (entries.length === 0) return null;

    return (
        <div style={{
            background: theme.cardBg, border: theme.cardBorder,
            borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
        }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 16px 0' }}>Commit Categories</h4>

            {/* Stacked horizontal bar */}
            <div style={{ width: '100%', height: '20px', borderRadius: '10px', overflow: 'hidden', display: 'flex', marginBottom: '16px' }}>
                {entries.map(([cat, pct]) => (
                    <div
                        key={cat}
                        style={{
                            width: `${pct}%`, height: '100%',
                            background: CATEGORY_COLORS[cat] || '#94a3b8',
                            transition: 'width 0.4s ease',
                        }}
                        title={`${CATEGORY_LABELS[cat] || cat}: ${Math.round(pct)}%`}
                    />
                ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {entries.map(([cat, pct]) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '2px',
                            background: CATEGORY_COLORS[cat] || '#94a3b8',
                        }} />
                        <span style={{ fontSize: '12px', color: theme.secondaryTextColor }}>
                            {CATEGORY_LABELS[cat] || cat} {Math.round(pct)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
