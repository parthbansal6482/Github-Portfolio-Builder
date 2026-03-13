import React from 'react';
import { Home, Scroll, Map, Mail } from 'lucide-react';

interface DockProps {
    accentColor: string;
}

export default function Dock({ accentColor }: DockProps) {

    const themeColor = accentColor && accentColor !== '#000000' && accentColor !== '#ffffff'
        ? accentColor
        : '#4F6348';

    const handleScroll = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <nav className="bg-stone-900/90 backdrop-blur-md border border-stone-700 px-6 py-3 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center space-x-8">

                <button
                    onClick={() => handleScroll('top')}
                    className="text-stone-400 hover:text-white transition-colors relative group flex flex-col items-center"
                    title="Home"
                >
                    <Home className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-pixel tracking-widest uppercase opacity-0 group-hover:opacity-100 absolute -bottom-5 whitespace-nowrap" style={{ color: themeColor }}>Camp</span>
                </button>

                <button
                    onClick={() => handleScroll('build-log')}
                    className="text-stone-400 hover:text-white transition-colors relative group flex flex-col items-center"
                    title="Build Log"
                >
                    <Scroll className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-pixel tracking-widest uppercase opacity-0 group-hover:opacity-100 absolute -bottom-5 whitespace-nowrap" style={{ color: themeColor }}>Log</span>
                </button>

                <button
                    onClick={() => handleScroll('quest-rewards')}
                    className="text-stone-400 hover:text-white transition-colors relative group flex flex-col items-center"
                    title="Quest Rewards"
                >
                    <Map className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-pixel tracking-widest uppercase opacity-0 group-hover:opacity-100 absolute -bottom-5 whitespace-nowrap" style={{ color: themeColor }}>Map</span>
                </button>

                <button
                    className="text-stone-400 hover:text-white transition-colors relative group flex flex-col items-center"
                    title="Send a Message"
                >
                    <Mail className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-pixel tracking-widest uppercase opacity-0 group-hover:opacity-100 absolute -bottom-5 whitespace-nowrap" style={{ color: themeColor }}>Msg</span>
                </button>

            </nav>
        </div>
    );
}
