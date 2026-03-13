import React from 'react';
import type { TemplateProps } from '../types';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import ProjectsSection from './ProjectsSection';
import FooterSection from './FooterSection';

export default function GlassmorphismTemplate({ portfolio, username }: TemplateProps) {
    // Extract data. If generation failed/is still basic, fallback to raw Github data.
    const copy = portfolio.generatedCopy || {
        headline: `Hi, I'm ${portfolio.githubData.profile.name || username}`,
        about: portfolio.githubData.profile.bio || 'A passionate developer.',
        projectDescriptions: {},
        isFallback: true,
    };

    const { githubData, preferences } = portfolio;

    // Theme rules for Glassmorphism
    // Obsidian Background: #0B0C10
    // Electric Cyan Accent: #00E5FF
    // Deep charcoal surface: #1F2833 / white/5

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
                    accentColor={preferences.accentColor || '#00E5FF'}
                />

                <AboutSection
                    about={copy.about}
                    profile={githubData.profile}
                    accentColor={preferences.accentColor || '#00E5FF'}
                />

                {githubData.pinnedRepos && githubData.pinnedRepos.length > 0 && (
                    <ProjectsSection
                        projects={githubData.pinnedRepos}
                        descriptions={copy.projectDescriptions}
                        accentColor={preferences.accentColor || '#00E5FF'}
                    />
                )}

                <FooterSection
                    username={username}
                    githubUrl={`https://github.com/${username}`}
                    accentColor={preferences.accentColor || '#00E5FF'}
                />
            </div>
        </div>
    );
}
