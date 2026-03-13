import React from 'react';
import type { GitHubData } from '@/types';

interface Props {
    profile: GitHubData['profile'];
    username: string;
    accentColor: string;
}

export default function FooterSection({ profile, username, accentColor }: Props) {
    return (
        <footer style={{
            marginTop: '40px',
            padding: '40px',
            background: accentColor,
            border: '4px solid #000',
            boxShadow: '12px 12px 0 0 #000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 900,
            flexWrap: 'wrap',
            gap: '24px'
        }}>
            <div style={{
                background: '#fff',
                padding: '8px 16px',
                border: '3px solid #000',
                transform: 'rotate(1deg)'
            }}>
                © {new Date().getFullYear()} {profile.name || username}
            </div>

            <div style={{ display: 'flex', gap: '24px' }}>
                <a
                    href={`https://github.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: '#000',
                        textDecoration: 'none',
                        background: '#fff',
                        padding: '8px 16px',
                        border: '3px solid #000',
                        boxShadow: '4px 4px 0 0 #000',
                        transition: 'transform 0.1s ease',
                        display: 'inline-block'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                        e.currentTarget.style.boxShadow = '6px 6px 0 0 #000';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translate(0, 0)';
                        e.currentTarget.style.boxShadow = '4px 4px 0 0 #000';
                    }}
                >
                    GITHUB.PROFILE
                </a>

                {profile.blog && (
                    <a
                        href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: '#000',
                            textDecoration: 'none',
                            background: '#fff',
                            padding: '8px 16px',
                            border: '3px solid #000',
                            boxShadow: '4px 4px 0 0 #000',
                            transition: 'transform 0.1s ease',
                            display: 'inline-block'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translate(-2px, -2px)';
                            e.currentTarget.style.boxShadow = '6px 6px 0 0 #000';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translate(0, 0)';
                            e.currentTarget.style.boxShadow = '4px 4px 0 0 #000';
                        }}
                    >
                        PERSONAL.SITE
                    </a>
                )}
            </div>
        </footer>
    );
}
