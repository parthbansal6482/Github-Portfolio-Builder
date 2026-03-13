'use client';

import React from 'react';
import type { InsightTheme } from './theme';
import type { WorkingStyle as WSType } from '@/types';

interface Props {
    data: WSType;
    theme: InsightTheme;
}

function Gauge({ value, leftLabel, rightLabel, theme }: { value: number; leftLabel: string; rightLabel: string; theme: InsightTheme }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: theme.secondaryTextColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>{leftLabel}</span>
                <span>{rightLabel}</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: `${theme.accentColor}15`, borderRadius: '4px', position: 'relative' }}>
                <div style={{
                    width: `${value}%`, height: '100%',
                    background: theme.accentColor, borderRadius: '4px',
                    transition: 'width 0.6s ease',
                }} />
                <div style={{
                    position: 'absolute', top: '-3px',
                    left: `calc(${value}% - 7px)`,
                    width: '14px', height: '14px',
                    borderRadius: '50%', background: theme.accentColor,
                    border: `2px solid ${theme.bgColor}`,
                    transition: 'left 0.6s ease',
                }} />
            </div>
        </div>
    );
}

export default function WorkingStyleCard({ data, theme }: Props) {
    return (
        <div style={{
            background: theme.cardBg, border: theme.cardBorder,
            borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
        }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 16px 0' }}>Working Style</h4>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: theme.textColor, margin: '0 0 20px 0' }}>
                {data.summary}
            </p>
            <Gauge value={data.explorationScore} leftLabel="Execution" rightLabel="Exploration" theme={theme} />
            <Gauge value={data.breadthScore} leftLabel="Focused" rightLabel="Broad" theme={theme} />
        </div>
    );
}
