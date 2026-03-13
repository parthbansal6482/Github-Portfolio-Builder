import React from 'react';

interface HeroSectionProps {
    headline: string;
    tagline: string | null;
    accentColor: string;
}

export default function HeroSection({ headline, tagline, accentColor }: HeroSectionProps) {
    return (
        <section className="min-h-[60vh] flex flex-col justify-center animate-fade-in">
            <div
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 w-fit"
            >
                <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,229,255,0.8)]" style={{ backgroundColor: accentColor }}></span>
                <span className="font-mono text-sm tracking-wider" style={{ color: accentColor }}>
                    SYSTEM ONLINE
                </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight max-w-4xl">
                {headline}
            </h1>

            {tagline && (
                <p className="mt-8 text-xl md:text-2xl text-gray-400 font-light max-w-2xl border-l-2 pl-6" style={{ borderColor: accentColor }}>
                    {tagline}
                </p>
            )}
        </section>
    );
}
