import React from 'react';
import type { PinnedRepo } from '@/types';

interface ProjectsSectionProps {
    projects: PinnedRepo[];
    descriptions: Record<string, string>;
    accentColor: string;
}

export default function ProjectsSection({ projects, descriptions, accentColor }: ProjectsSectionProps) {
    const themeColor = accentColor && accentColor !== '#000000' && accentColor !== '#ffffff'
        ? accentColor
        : '#4F6348';

    return (
        <section id="quest-rewards" className="scroll-mt-24">
            <div className="flex items-center space-x-4 mb-8">
                <span className="font-elegant italic text-stone-500">Chapter II</span>
                <div className="h-px flex-grow bg-stone-300"></div>
                <h2 className="text-4xl font-pixel text-stone-800 tracking-wider">Quest Rewards</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {projects.map((project) => {
                    const aiDescription = descriptions[project.name];
                    const desc = aiDescription || project.description;

                    return (
                        <a
                            key={project.name}
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block bg-[#FAF9F6] rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden flex flex-col h-full"
                        >
                            {/* Subtle accent hover bar */}
                            <div
                                className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ backgroundColor: themeColor }}
                            ></div>

                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-2xl font-pixel text-stone-900 group-hover:text-stone-700 transition-colors tracking-wide">
                                    {project.name}
                                </h3>
                                <div className="flex items-center space-x-1 opacity-70">
                                    <svg className="w-4 h-4 text-stone-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                    </svg>
                                    <span className="text-sm font-pixel text-stone-600">{project.stargazerCount}</span>
                                </div>
                            </div>

                            <p className="text-stone-600 font-elegant italic leading-relaxed mb-8 flex-grow">
                                {desc || 'A forgotten artifact lacking documentation...'}
                            </p>

                            {/* The "Backpack" (Tech Stack Pills) */}
                            <div className="mt-auto">
                                <h4 className="font-elegant italic text-sm text-stone-400 mb-3">Inventory:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {project.primaryLanguage && (
                                        <span
                                            className="text-xs font-pixel tracking-widest px-3 py-1.5 rounded-full border bg-stone-100 text-stone-700"
                                            style={{ borderColor: themeColor }}
                                        >
                                            {project.primaryLanguage}
                                        </span>
                                    )}
                                    {project.topics && project.topics.slice(0, 3).map((topic: string) => (
                                        <span
                                            key={topic}
                                            className="text-xs font-pixel tracking-widest px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-500 hover:border-stone-400 transition-colors"
                                        >
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </a>
                    );
                })}
            </div>
        </section>
    );
}
