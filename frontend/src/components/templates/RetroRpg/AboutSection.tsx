import React from 'react';
import type { GitHubData } from '@/types';

interface AboutSectionProps {
    about: string;
    profile: GitHubData['profile'];
    accentColor: string;
}

export default function AboutSection({ about, profile, accentColor }: AboutSectionProps) {
    // Determine if accent color is effectively dark enough, using Sage Green as fallback
    const themeColor = accentColor && accentColor !== '#000000' && accentColor !== '#ffffff'
        ? accentColor
        : '#4F6348';

    return (
        <section id="build-log" className="scroll-mt-24">
            <div className="flex items-center space-x-4 mb-8">
                <h2 className="text-4xl font-pixel text-stone-800 tracking-wider">Build Log</h2>
                <div className="h-px flex-grow bg-stone-300"></div>
                <span className="font-elegant italic text-stone-500">Chapter I</span>
            </div>

            <div className="bg-[#FAF9F6] rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-200 flex flex-col md:flex-row gap-12">

                {/* Avatar Plate */}
                <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="relative">
                        {/* Ornate wrapper effect via double border */}
                        <div className="absolute -inset-2 border border-stone-300 rounded-2xl"></div>
                        <div className="absolute -inset-1 border-2 border-stone-200 rounded-xl"></div>
                        <img
                            src={profile.avatar}
                            alt={profile.name || "Hero"}
                            className="w-40 h-40 object-cover rounded-lg relative z-10 shadow-md grayscale hover:grayscale-0 transition-all duration-700"
                        />
                    </div>
                    <h3 className="mt-8 font-pixel text-2xl text-stone-800 tracking-wide text-center">
                        {profile.name}
                    </h3>
                    <p className="font-elegant italic text-stone-500 text-center mt-1">
                        {profile.company || 'Independent Wanderer'}
                    </p>
                </div>

                {/* Story Text */}
                <div className="flex-grow">
                    <p className="text-xl leading-relaxed text-stone-700 font-elegant">
                        {/* The first letter drop cap effect */}
                        <span className="float-left text-6xl leading-[0.8] pr-2 font-pixel text-stone-900">
                            {about.charAt(0)}
                        </span>
                        {about.slice(1)}
                    </p>
                </div>
            </div>
        </section>
    );
}
