import React from 'react';
import type { TemplateProps } from '../types';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import ProjectsSection from './ProjectsSection';
import Dock from './Dock';

export default function RetroRpgTemplate({ portfolio, username }: TemplateProps) {
    // Extract data. If generation failed/is still basic, fallback to raw Github data.
    const copy = portfolio.generatedCopy || {
        headline: `Greetings, traveler. I am ${portfolio.githubData.profile.name || username}`,
        about: portfolio.githubData.profile.bio || 'A wandering developer seeking new quests.',
        projectDescriptions: {},
        isFallback: true,
    };

    const { githubData, preferences } = portfolio;

    // Theme rules for Retro RPG
    // Background: Cream/Parchment #F2F2EB
    // Accents: Sage Green #4F6348, Forest Green
    // Typography: VT323 (Pixel serif-esque), Playfair Display (Elegant serif)

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
                accentColor={preferences.accentColor || '#4F6348'}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 space-y-24">

                <AboutSection
                    about={copy.about}
                    profile={githubData.profile}
                    accentColor={preferences.accentColor || '#4F6348'}
                />

                {githubData.pinnedRepos && githubData.pinnedRepos.length > 0 && (
                    <ProjectsSection
                        projects={githubData.pinnedRepos}
                        descriptions={copy.projectDescriptions}
                        accentColor={preferences.accentColor || '#4F6348'}
                    />
                )}

            </div>

            <Dock accentColor={preferences.accentColor || '#4F6348'} />
        </div>
    );
}
