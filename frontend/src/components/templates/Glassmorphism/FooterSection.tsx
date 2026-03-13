import React from 'react';

interface FooterSectionProps {
    username: string;
    githubUrl: string;
    accentColor: string;
}

export default function FooterSection({ username, githubUrl, accentColor }: FooterSectionProps) {
    return (
        <footer className="mt-32 pt-12 pb-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-gray-500 font-mono text-sm">
            <div className="mb-4 md:mb-0">
                <span className="opacity-70">© {new Date().getFullYear()} </span>
                <span className="font-bold text-gray-300">{username}</span>
            </div>

            <div className="flex items-center space-x-6">
                <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors relative group"
                >
                    <span className="relative z-10">GitHub</span>
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-current group-hover:w-full transition-all duration-300" style={{ backgroundColor: accentColor }}></span>
                </a>
                <a
                    href="#" // Add mailto or linkedIn if available in future data models
                    className="hover:text-white transition-colors relative group"
                >
                    <span className="relative z-10">Contact</span>
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-current group-hover:w-full transition-all duration-300" style={{ backgroundColor: accentColor }}></span>
                </a>
            </div>

            <div className="hidden md:flex items-center space-x-2 opacity-50">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }}></span>
                <span className="text-xs uppercase tracking-widest">System Optimal</span>
            </div>
        </footer>
    );
}
