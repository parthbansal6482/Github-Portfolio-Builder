import React from 'react';
import type { PinnedRepo } from '@/types';

interface ProjectsSectionProps {
    projects: PinnedRepo[];
    descriptions: Record<string, string>;
    accentColor: string;
}

export default function ProjectsSection({ projects, descriptions, accentColor }: ProjectsSectionProps) {
    return (
        <section>
            <div className="flex items-center space-x-4 mb-10">
                <h2 className="text-3xl font-bold text-white font-sans tracking-tight">Deployments</h2>
                <div className="h-px flex-grow bg-white/10"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => {
                    const aiDescription = descriptions[project.name];
                    const desc = aiDescription || project.description;

                    return (
                        <a
                            key={project.name}
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block bg-[#1F2833]/40 backdrop-blur-md border border-white/10 rounded-xl p-8 transition-all duration-300 hover:bg-[#1F2833]/60 hover:-translate-y-1 hover:border-[#00E5FF]/30 shadow-2xl relative overflow-hidden"
                        >
                            <div
                                className="absolute top-0 right-0 w-32 h-32 bg-[#00E5FF]/10 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ backgroundColor: accentColor !== '#00E5FF' ? `${accentColor}20` : undefined }}
                            ></div>

                            <div className="flex flex-col h-full relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-2xl font-bold text-white group-hover:text-white transition-colors">
                                        {project.name}
                                    </h3>
                                    <div className="bg-black/30 border border-white/10 px-3 py-1 rounded-full flex items-center space-x-1">
                                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                        </svg>
                                        <span className="text-xs font-mono text-gray-300">{project.stargazerCount}</span>
                                    </div>
                                </div>

                                <p className="text-gray-400 font-light mb-8 flex-grow">
                                    {desc || 'No description provided.'}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 mt-auto pt-6 border-t border-white/5">
                                    {project.primaryLanguage && (
                                        <span className="flex items-center space-x-2 text-xs font-mono">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></span>
                                            <span className="text-gray-300">{project.primaryLanguage}</span>
                                        </span>
                                    )}
                                    {project.topics && project.topics.slice(0, 3).map((topic: string) => (
                                        <span
                                            key={topic}
                                            className="text-[10px] font-mono px-2 py-1 rounded border border-white/5 bg-black/20 text-gray-400"
                                        >
                                            {topic}
                                        </span>
                                    ))}
                                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <svg className="w-5 h-5" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </a>
                    );
                })}
            </div>
        </section>
    );
}
