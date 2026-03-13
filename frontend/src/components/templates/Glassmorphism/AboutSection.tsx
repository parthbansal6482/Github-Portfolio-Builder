import React from 'react';
import type { GitHubData } from '@/types';

interface AboutSectionProps {
    about: string;
    profile: GitHubData['profile'];
    accentColor: string;
}

export default function AboutSection({ about, profile, accentColor }: AboutSectionProps) {
    return (
        <section>
            <div className="flex items-center space-x-4 mb-10">
                <h2 className="text-3xl font-bold text-white font-sans tracking-tight">Overview</h2>
                <div className="h-px flex-grow bg-white/10"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-1 md:col-span-2">
                    {/* Glassmorphic Container: bg-white/5, backdrop-blur-md, 1px subtle border, 12px rounded (rounded-xl) */}
                    <div className="bg-[#1F2833]/40 backdrop-blur-md border border-white/10 rounded-xl p-8 h-full shadow-2xl">
                        <div className="flex items-center space-x-2 mb-6 opacity-70">
                            <span className="font-mono text-xs uppercase tracking-widest" style={{ color: accentColor }}>// Executive Summary</span>
                        </div>
                        <p className="text-lg text-gray-300 leading-relaxed font-light whitespace-pre-wrap">
                            {about}
                        </p>
                    </div>
                </div>

                <div className="col-span-1 space-y-8">
                    <div className="bg-[#1F2833]/40 backdrop-blur-md border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl transition-all duration-300 hover:border-white/20">
                        {/* Glow effect behind avatar */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#00E5FF]/20 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <img
                            src={profile.avatar}
                            alt={profile.name || "Profile Avatar"}
                            className="w-32 h-32 rounded-xl object-cover mb-6 border border-white/10 relative z-10"
                        />
                        <h3 className="text-xl font-bold text-white text-center relative z-10">{profile.name}</h3>
                        {profile.company && (
                            <p className="text-gray-400 mt-2 text-sm text-center font-mono relative z-10">{profile.company}</p>
                        )}
                        {profile.location && (
                            <p className="text-gray-500 mt-1 text-xs text-center font-mono relative z-10 uppercase tracking-widest">{profile.location}</p>
                        )}
                    </div>

                    <div className="bg-[#1F2833]/40 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 rounded-lg bg-black/20 border border-white/5">
                                <span className="block font-mono text-3xl font-bold mb-1" style={{ color: accentColor }}>{profile.followers}</span>
                                <span className="block text-xs text-gray-500 uppercase tracking-widest font-mono">Followers</span>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-black/20 border border-white/5">
                                <span className="block font-mono text-3xl font-bold mb-1" style={{ color: accentColor }}>{profile.publicRepos}</span>
                                <span className="block text-xs text-gray-500 uppercase tracking-widest font-mono">Repos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
