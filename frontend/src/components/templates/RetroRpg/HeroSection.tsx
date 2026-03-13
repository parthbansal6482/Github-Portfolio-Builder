import React from 'react';

interface HeroSectionProps {
    headline: string;
    tagline: string | null;
    stats: {
        level: number;
        followers: number;
        repos: number;
    };
    accentColor: string;
}

export default function HeroSection({ headline, tagline, stats, accentColor }: HeroSectionProps) {
    return (
        <section className="relative min-h-[70vh] flex flex-col items-center justify-center p-6 pt-24 overflow-hidden bg-stone-900">

            {/* Background Pixel Art Placeholder (Using a generic landscape pattern since we don't have an asset) */}
            <div
                className="absolute inset-0 z-0 opacity-30 bg-cover bg-center"
                style={{
                    backgroundImage: `url('https://hrsht.me/images/Hero.png')`, // A moody forest
                    filter: 'contrast(2.0) saturate(0.8) sepia(0.5)'
                }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#F2F2EB] via-transparent to-black/80 z-0"></div>

            <div className="relative z-10 text-center mb-16 max-w-4xl mx-auto drop-shadow-lg">
                <h1 className="text-5xl md:text-7xl font-pixel text-white tracking-widest leading-tight">
                    {headline}
                </h1>
                {tagline && (
                    <p className="mt-6 text-2xl md:text-3xl text-stone-200 font-elegant italic font-light drop-shadow">
                        "{tagline}"
                    </p>
                )}
            </div>

            {/* Glassmorphic "Choose Your Path" Cards */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-white transition-transform hover:-translate-y-2">
                    <span className="font-pixel text-xl mb-2" style={{ color: '#F2F2EB' }}>Lv. {stats.level}</span>
                    <span className="font-elegant italic text-sm text-stone-300">Current Level</span>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-white transition-transform hover:-translate-y-2">
                    <span className="font-pixel text-xl mb-2" style={{ color: '#F2F2EB' }}>{stats.repos}</span>
                    <span className="font-elegant italic text-sm text-stone-300">Quests Completed</span>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-white transition-transform hover:-translate-y-2">
                    <span className="font-pixel text-xl mb-2" style={{ color: '#F2F2EB' }}>{stats.followers}</span>
                    <span className="font-elegant italic text-sm text-stone-300">Guild Members</span>
                </div>
            </div>

        </section>
    );
}
