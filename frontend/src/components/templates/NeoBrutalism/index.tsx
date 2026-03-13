'use client';

import React from 'react';
import type { TemplateProps } from '../types';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import ProjectsSection from './ProjectsSection';
import FooterSection from './FooterSection';
import InsightsSection from '../InsightsSection';
import type { InsightTheme } from '../InsightsSection/theme';
import ContributionHeatmap from '../../ContributionHeatmap';

export default function NeoBrutalismTemplate({ portfolio, username }: TemplateProps) {
    const { githubData, preferences, generatedCopy } = portfolio;

    const copy = generatedCopy as any;

    if (!copy) {
        return (
            <div style={{ color: '#000', padding: '40px', textAlign: 'center', background: '#fff', border: '4px solid #000', fontWeight: 'bold' }}>
                PORTFOLIO CONTENT MISSING.
            </div>
        );
    }

    const accentColor = preferences.accentColor || '#ff90e8';

    const insightTheme: InsightTheme = {
        accentColor: '#000',
        textColor: '#000',
        secondaryTextColor: 'rgba(0,0,0,0.6)',
        bgColor: '#fff0f5',
        cardBg: '#fff',
        cardBorder: '4px solid #000',
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#fff0f5',
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

                {githubData.contributions?.calendar && (
                    <section style={{ padding: '40px', background: '#fff', border: '4px solid #000', boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)' }}>
                        <h2 style={{ fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '32px', borderBottom: '4px solid #000', paddingBottom: '16px' }}>
                            ACTIVITY.LOG
                        </h2>
                        <ContributionHeatmap 
                            calendar={githubData.contributions.calendar} 
                            accentColor={accentColor} 
                            theme="light" 
                        />
                    </section>
                )}

                <ProjectsSection pinnedRepos={githubData.pinnedRepos} copy={copy} accentColor={accentColor} />
                <InsightsSection data={portfolio.enrichedData} theme={insightTheme} sectionTitle="DEV.INSIGHTS" />
                <FooterSection profile={githubData.profile} username={username} accentColor={accentColor} />
            </div>
        </div>
    );
}
