'use client';

import React from 'react';
import type { InsightTheme } from './theme';
import type { SkillCluster } from '@/types';

interface Props {
    data: SkillCluster[];
    theme: InsightTheme;
}

export default function SkillClustersSection({ data, theme }: Props) {
    if (!data || data.length === 0) return null;

    return (
        <div>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: theme.secondaryTextColor, margin: '0 0 16px 0' }}>Skill Clusters</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {data.slice(0, 6).map((cluster) => (
                    <div
                        key={cluster.skillName}
                        style={{
                            background: theme.cardBg, border: theme.cardBorder,
                            borderRadius: '12px', padding: '20px', fontFamily: theme.fontFamily,
                        }}
                    >
                        <h5 style={{ fontSize: '16px', fontWeight: 600, color: theme.textColor, margin: '0 0 12px 0' }}>
                            {cluster.skillName}
                        </h5>

                        {/* Tech pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                            {cluster.technologies.map(tech => (
                                <span
                                    key={tech}
                                    style={{
                                        fontSize: '11px', fontWeight: 500, padding: '3px 8px',
                                        borderRadius: '9999px',
                                        background: `${theme.accentColor}15`,
                                        color: theme.accentColor,
                                    }}
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>

                        {/* Indicators */}
                        <ul style={{ margin: '0 0 12px 0', paddingLeft: '16px', listStyle: 'disc' }}>
                            {cluster.indicators.slice(0, 3).map((ind, i) => (
                                <li key={i} style={{ fontSize: '13px', lineHeight: 1.5, color: theme.secondaryTextColor, marginBottom: '4px' }}>
                                    {ind}
                                </li>
                            ))}
                        </ul>

                        {/* Evidence repos */}
                        {cluster.evidenceRepos.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {cluster.evidenceRepos.map(repo => (
                                    <span
                                        key={repo}
                                        style={{
                                            fontSize: '10px', padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: `${theme.accentColor}08`,
                                            color: theme.secondaryTextColor,
                                        }}
                                    >
                                        {repo}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
