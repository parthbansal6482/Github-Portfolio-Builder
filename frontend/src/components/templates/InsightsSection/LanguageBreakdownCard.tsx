'use client';

import React from 'react';
import type { InsightTheme } from './theme';
import type { LanguageBreakdown as LBType } from '@/types';

interface Props {
    data: LBType;
    theme: InsightTheme;
}

export default function LanguageBreakdownCard({ data, theme }: Props) {
    const entries = Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);

    if (entries.length === 0) {
        return (
            <div style={{
                background: theme.cardBg, border: theme.cardBorder,
                borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
            }}>
                <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, marginBottom: '16px', margin: 0 }}>Languages Used</h4>
                <p style={{ color: theme.secondaryTextColor, fontSize: '14px', margin: '12px 0 0' }}>No language data available</p>
            </div>
        );
    }

    return (
        <div style={{
            background: theme.cardBg, border: theme.cardBorder,
            borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
        }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, marginBottom: '20px', margin: '0 0 20px 0' }}>Languages Used</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {entries.map(([lang, pct]) => (
                    <div key={lang}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                            <span style={{ color: theme.textColor, fontWeight: 500 }}>{lang}</span>
                            <span style={{ color: theme.secondaryTextColor }}>{Math.round(pct)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: `${theme.accentColor}15`, borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${pct}%`, height: '100%',
                                background: theme.accentColor, borderRadius: '3px',
                                transition: 'width 0.6s ease',
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
