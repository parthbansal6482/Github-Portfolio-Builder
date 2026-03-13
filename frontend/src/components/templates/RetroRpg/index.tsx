import React from 'react';
import type { TemplateProps } from '../types';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import ProjectsSection from './ProjectsSection';
import Dock from './Dock';
import InsightsSection from '../InsightsSection';
import type { InsightTheme } from '../InsightsSection/theme';
import ContributionHeatmap from '../../ContributionHeatmap';

export default function RetroRpgTemplate({ portfolio, username }: TemplateProps) {
    const copy = portfolio.generatedCopy || {
        headline: `Greetings, traveler. I am ${portfolio.githubData.profile.name || username}`,
        about: portfolio.githubData.profile.bio || 'A wandering developer seeking new quests.',
        projectDescriptions: {},
        isFallback: true,
    };

    const { githubData, preferences } = portfolio;
    const accentColor = preferences.accentColor || '#4F6348';

    const insightTheme: InsightTheme = {
        accentColor,
        textColor: '#44403c',
        secondaryTextColor: '#78716c',
        bgColor: '#F2F2EB',
        cardBg: '#FAF9F6',
        cardBorder: '1px solid #d6d3d1',
        fontFamily: '"Playfair Display", serif',
    };

    return (
        <div className="min-h-screen bg-[#F2F2EB] text-stone-800 selection:bg-[#4F6348]/20 selection:text-stone-900 pb-24">
            {/* Inject Google Fonts */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=VT323&display=swap');
        
        .font-pixel {
          font-family: 'VT323', monospace;
        }
        .font-elegant {
          font-family: 'Playfair Display', serif;
        }
      `}} />

            <HeroSection
                headline={copy.headline}
                tagline={preferences.customTagline}
                stats={{
                    level: Math.floor(githubData.profile.publicRepos / 5) || 1,
                    followers: githubData.profile.followers,
                    repos: githubData.profile.publicRepos
                }}
                accentColor={accentColor}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 space-y-24">

                <AboutSection
                    about={copy.about}
                    profile={githubData.profile}
                    accentColor={accentColor}
                />

                {githubData.contributions?.calendar && (
                    <section className="bg-[#FAF9F6] rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-200">
                        <div className="flex items-center space-x-4 mb-8">
                            <h2 className="text-4xl font-pixel text-stone-800 tracking-wider">Activity Log</h2>
                            <div className="h-px flex-grow bg-stone-300"></div>
                            <span className="font-elegant italic text-stone-500">Chapter II</span>
                        </div>
                        <ContributionHeatmap 
                            calendar={githubData.contributions.calendar} 
                            accentColor={accentColor} 
                            theme="light" 
                        />
                    </section>
                )}

                {githubData.pinnedRepos && githubData.pinnedRepos.length > 0 && (
                    <ProjectsSection
                        projects={githubData.pinnedRepos}
                        descriptions={copy.projectDescriptions}
                        accentColor={accentColor}
                    />
                )}

                <InsightsSection data={portfolio.enrichedData} theme={insightTheme} sectionTitle="Chapter III — Developer Insights" />

            </div>

            <Dock accentColor={accentColor} />
        </div>
    );
}
