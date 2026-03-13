import React from 'react';
import type { PinnedRepo, GeneratedCopy } from '@/types';

interface Props {
    pinnedRepos: PinnedRepo[];
    copy: GeneratedCopy;
    accentColor: string;
}

export default function ProjectsSection({ pinnedRepos, copy, accentColor }: Props) {
    return (
        <section>
            <div style={{
                background: '#000',
                color: '#fff',
                display: 'inline-block',
                padding: '12px 24px',
                border: '4px solid #000',
                boxShadow: `8px 8px 0 0 ${accentColor}`,
                marginBottom: '40px',
                transform: 'rotate(-1deg)'
            }}>
                <h3 style={{
                    fontSize: '32px',
                    textTransform: 'uppercase',
                    fontWeight: 900,
                    margin: 0
                }}>
                    Featured.Work
                </h3>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '32px'
            }}>
                {pinnedRepos.map((repo, idx) => {
                    const description = copy.projectDescriptions[repo.name] || repo.description;
                    // Alternate background colors for brutality
                    const bgColors = ['#fff', '#e0e7ff', '#fef08a', '#bbf7d0', '#ffcdd2', '#c7d2fe'];
                    const cardBg = bgColors[idx % bgColors.length];

                    return (
                        <a
                            key={repo.name}
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex', flexDirection: 'column',
                                textDecoration: 'none', color: '#000',
                                background: cardBg,
                                border: '4px solid #000',
                                borderRadius: '8px',
                                padding: '32px',
                                boxShadow: '8px 8px 0 0 #000',
                                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translate(4px, 4px)';
                                e.currentTarget.style.boxShadow = '4px 4px 0 0 #000';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translate(0, 0)';
                                e.currentTarget.style.boxShadow = '8px 8px 0 0 #000';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '24px', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>{repo.name}</h4>
                            </div>

                            <p style={{ fontSize: '16px', lineHeight: 1.6, fontWeight: 600, margin: '0 0 24px 0', flex: 1 }}>
                                {description}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                {repo.primaryLanguage && (
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        padding: '4px 12px',
                                        background: '#000',
                                        color: '#fff',
                                        border: '2px solid #000'
                                    }}>
                                        {repo.primaryLanguage}
                                    </span>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800 }}>
                                    ★ {repo.stargazerCount}
                                </div>
                            </div>
                        </a>
                    );
                })}
            </div>
        </section>
    );
}
