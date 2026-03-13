'use client';

import React from 'react';
import type { InsightTheme } from './theme';
import type { CommitPatterns as CPType } from '@/types';

interface Props {
    data: CPType;
    theme: InsightTheme;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export default function CommitPatternsCard({ data, theme }: Props) {
    const dayValues = DAYS.map(d => data.byDayOfWeek[d]);
    const maxDay = Math.max(...dayValues, 1);

    // Group hours into 6 buckets: Early Morning, Morning, Midday, Afternoon, Evening, Night
    const hourBuckets = [
        { label: '12AM–4AM', hours: ['0', '1', '2', '3'] },
        { label: '4AM–8AM', hours: ['4', '5', '6', '7'] },
        { label: '8AM–12PM', hours: ['8', '9', '10', '11'] },
        { label: '12PM–4PM', hours: ['12', '13', '14', '15'] },
        { label: '4PM–8PM', hours: ['16', '17', '18', '19'] },
        { label: '8PM–12AM', hours: ['20', '21', '22', '23'] },
    ];

    const bucketValues = hourBuckets.map(b =>
        b.hours.reduce((sum, h) => sum + (data.byHourOfDay[h] || 0), 0)
    );
    const maxBucket = Math.max(...bucketValues, 1);

    return (
        <div style={{
            background: theme.cardBg, border: theme.cardBorder,
            borderRadius: '12px', padding: '24px', fontFamily: theme.fontFamily,
        }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 12px 0' }}>Commit Patterns</h4>
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: theme.textColor, margin: '0 0 20px 0' }}>
                {data.summary}
            </p>

            {/* Day heatmap */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: theme.secondaryTextColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>By Day</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {DAYS.map((day) => {
                        const v = data.byDayOfWeek[day];
                        const opacity = v / maxDay;
                        return (
                            <div key={day} style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{
                                    height: '28px', borderRadius: '4px',
                                    background: theme.accentColor,
                                    opacity: Math.max(0.08, opacity),
                                    transition: 'opacity 0.3s',
                                }} />
                                <span style={{ fontSize: '10px', color: theme.secondaryTextColor, marginTop: '4px', display: 'block' }}>
                                    {day}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Hour buckets */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: theme.secondaryTextColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>By Time of Day (UTC)</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {hourBuckets.map((bucket, i) => {
                        const opacity = bucketValues[i] / maxBucket;
                        return (
                            <div key={bucket.label} style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{
                                    height: '28px', borderRadius: '4px',
                                    background: theme.accentColor,
                                    opacity: Math.max(0.08, opacity),
                                    transition: 'opacity 0.3s',
                                }} />
                                <span style={{ fontSize: '9px', color: theme.secondaryTextColor, marginTop: '4px', display: 'block', lineHeight: 1.2 }}>
                                    {bucket.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Peak badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                    fontSize: '12px', fontWeight: 600, padding: '4px 10px',
                    background: `${theme.accentColor}20`, color: theme.accentColor,
                    borderRadius: '9999px',
                }}>
                    Peak: {data.peakDay}
                </span>
                <span style={{
                    fontSize: '12px', fontWeight: 600, padding: '4px 10px',
                    background: `${theme.accentColor}20`, color: theme.accentColor,
                    borderRadius: '9999px',
                }}>
                    {data.peakHour}:00 UTC
                </span>
            </div>
        </div>
    );
}
