import React from 'react';
import type { TemplateProps } from '../types';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import ProjectsSection from './ProjectsSection';
import FooterSection from './FooterSection';
import InsightsSection from '../InsightsSection';
import type { InsightTheme } from '../InsightsSection/theme';
import ContributionHeatmap from '../../ContributionHeatmap';

export default function GlassmorphismTemplate({ portfolio, username }: TemplateProps) {
    const copy = portfolio.generatedCopy || {
        headline: `Hi, I'm ${portfolio.githubData.profile.name || username}`,
        about: portfolio.githubData.profile.bio || 'A passionate developer.',
        projectDescriptions: {},
        isFallback: true,
    };

    const { githubData, preferences } = portfolio;
    const accentColor = preferences.accentColor || '#00E5FF';

    const insightTheme: InsightTheme = {
        accentColor,
        textColor: '#e5e7eb',
        secondaryTextColor: 'rgba(255,255,255,0.5)',
        bgColor: '#0B0C10',
        cardBg: 'rgba(31,40,51,0.4)',
        cardBorder: '1px solid rgba(255,255,255,0.1)',
        fontFamily: 'system-ui, sans-serif',
    };

    return (
        <div className="min-h-screen bg-[#0B0C10] text-gray-300 font-sans selection:bg-[#00E5FF]/30 selection:text-white">
            {/* Background ambient glow effect */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#00E5FF]/10 rounded-full blur-[120px] mix-blend-screen opacity-40"></div>
                <div className="absolute top-[60%] right-[10%] w-[600px] h-[600px] bg-[#00E5FF]/5 rounded-full blur-[150px] mix-blend-screen opacity-30"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-24 space-y-24 md:space-y-32">
                <HeroSection
                    headline={copy.headline}
                    tagline={preferences.customTagline}
                    accentColor={accentColor}
                />

                <AboutSection
                    about={copy.about}
                    profile={githubData.profile}
                    accentColor={accentColor}
                />

                {githubData.contributions?.calendar && (
                    <div className="bg-[#1F2833]/40 backdrop-blur-md border border-white/10 rounded-xl p-8 shadow-2xl">
                        <div className="flex items-center space-x-2 mb-6 opacity-70">
                            <span className="font-mono text-xs uppercase tracking-widest" style={{ color: accentColor }}>// Activity Log</span>
                        </div>
                        <ContributionHeatmap 
                            calendar={githubData.contributions.calendar} 
                            accentColor={accentColor} 
                            theme="dark" 
                        />
                    </div>
                )}

                {githubData.pinnedRepos && githubData.pinnedRepos.length > 0 && (
                    <ProjectsSection
                        projects={githubData.pinnedRepos}
                        descriptions={copy.projectDescriptions}
                        accentColor={accentColor}
                    />
                )}

                <InsightsSection data={portfolio.enrichedData} theme={insightTheme} />

                <FooterSection
                    username={username}
                    githubUrl={`https://github.com/${username}`}
                    accentColor={accentColor}
                />
            </div>
        </div>
    );
}
