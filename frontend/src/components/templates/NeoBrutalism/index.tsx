'use client';

import React from 'react';
import type { TemplateProps } from '../types';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import ProjectsSection from './ProjectsSection';
import FooterSection from './FooterSection';

export default function NeoBrutalismTemplate({ portfolio, username }: TemplateProps) {
    const { githubData, preferences, generatedCopy } = portfolio;

    const copy = generatedCopy && !('fallbackReason' in generatedCopy) && !generatedCopy.isFallback
        ? generatedCopy
        : generatedCopy;

    if (!copy) {
        return (
            <div style={{ color: '#000', padding: '40px', textAlign: 'center', background: '#fff', border: '4px solid #000', fontWeight: 'bold' }}>
                PORTFOLIO CONTENT MISSING.
            </div>
        );
    }

    // Neo-Brutalism uses strong contrasting colors. Using accentColor or default yellow
    const accentColor = preferences.accentColor || '#ff90e8'; // Weird pink base

    return (
        <div style={{
            minHeight: '100vh',
            background: '#fff0f5', // light pink background
            color: '#000',
            fontFamily: '"Space Grotesk", system-ui, sans-serif',
            padding: '40px 24px',
        }}>
            <div style={{
                maxWidth: '1000px',
                margin: '0 auto',
                display: 'flex', flexDirection: 'column', gap: '80px'
            }}>
                <HeroSection profile={githubData.profile} username={username} copy={copy} accentColor={accentColor} />
                <AboutSection copy={copy} />
                <ProjectsSection pinnedRepos={githubData.pinnedRepos} copy={copy} accentColor={accentColor} />
                <FooterSection profile={githubData.profile} username={username} accentColor={accentColor} />
            </div>
        </div>
    );
}
