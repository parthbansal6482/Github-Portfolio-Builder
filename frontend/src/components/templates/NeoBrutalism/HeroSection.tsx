import React from 'react';
import type { GitHubData, GeneratedCopy } from '@/types';

interface Props {
    profile: GitHubData['profile'];
    username: string;
    copy: GeneratedCopy;
    accentColor: string;
}

export default function HeroSection({ profile, username, copy, accentColor }: Props) {
    return (
        <section style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '40px',
            marginTop: '40px',
            background: accentColor,
            border: '4px solid #000',
            boxShadow: '12px 12px 0 0 #000',
            padding: '48px',
            borderRadius: '8px',
            flexWrap: 'wrap'
        }}>
            {profile.avatar && (
                <img
                    src={profile.avatar}
                    alt={profile.name}
                    style={{
                        width: '160px',
                        height: '160px',
                        borderRadius: '0',
                        border: '4px solid #000',
                        boxShadow: '6px 6px 0 0 #000',
                        background: '#fff',
                        objectFit: 'cover'
                    }}
                />
            )}
            <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{
                    display: 'inline-block',
                    background: '#fff',
                    border: '3px solid #000',
                    padding: '8px 16px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    marginBottom: '16px',
                    boxShadow: '4px 4px 0 0 #000',
                    transform: 'rotate(-2deg)'
                }}>
                    Hello World
                </div>
                <h1 style={{
                    fontSize: '64px',
                    fontWeight: 900,
                    margin: '0 0 16px 0',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    WebkitTextStroke: '2px #000',
                    color: '#fff',
                    textShadow: '4px 4px 0 #000' // Stroke fallback wrapper 
                }}>
                    {profile.name || username}
                </h1>
                <div style={{
                    background: '#fff',
                    display: 'inline-block',
                    padding: '8px 16px',
                    border: '3px solid #000',
                    boxShadow: '4px 4px 0 0 #000'
                }}>
                    <h2 style={{
                        fontSize: '20px',
                        color: '#000',
                        fontWeight: 700,
                        margin: 0
                    }}>
                        {copy.headline}
                    </h2>
                </div>
            </div>
        </section>
    );
}
