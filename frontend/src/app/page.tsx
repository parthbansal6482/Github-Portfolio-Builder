'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23] text-white font-sans selection:bg-indigo-500/30">
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 md:px-12 border-b border-white/5 bg-[#0f0f23]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg">
            G
          </div>
          <span className="text-xl font-bold tracking-tight">GitFolio</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
        </nav>
        <button 
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          className="text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-full border border-white/10"
        >
          Sign In
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
        
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            V1.0 is now live
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Turn your GitHub into a <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              stunning portfolio
            </span>
            <br className="hidden md:block" /> in seconds.
          </h1>

          <p className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl leading-relaxed">
            GitFolio uses AI to analyze your GitHub profile, generate a professional biography, and showcase your best projects in a beautiful, customizable layout. Zero configuration required.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
              className="group relative flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-full bg-white px-8 text-black font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <svg height="24" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="24" data-view-component="true" className="fill-current">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
              Get Started with GitHub
              <div className="absolute inset-0 rounded-full bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <p className="mt-6 text-sm text-white/40">
            Free forever. No credit card required.
          </p>

        </div>
        
        {/* Abstract Component Preview UI */}
        <div className="mt-24 w-full max-w-5xl rounded-t-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm relative overflow-hidden hidden md:block aspect-[21/9]">
            <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-black/20">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            
            <div className="mt-10 h-full w-full rounded-lg border border-white/10 bg-[#0a0a1a] shadow-2xl relative overflow-hidden flex">
               {/* Mock UI Sidebar */}
               <div className="w-64 border-r border-white/10 p-6 flex flex-col gap-4">
                 <div className="h-12 w-12 rounded-full bg-white/10 mb-2" />
                 <div className="h-4 w-32 bg-white/20 rounded" />
                 <div className="h-3 w-24 bg-white/10 rounded mb-6" />
                 
                 <div className="space-y-3">
                   <div className="h-3 w-full bg-white/10 rounded" />
                   <div className="h-3 w-5/6 bg-white/10 rounded" />
                   <div className="h-3 w-4/6 bg-white/10 rounded" />
                 </div>
               </div>
               {/* Mock UI Content */}
               <div className="flex-1 p-8">
                 <div className="h-8 w-48 bg-white/20 rounded mb-8" />
                 <div className="grid grid-cols-2 gap-6">
                    <div className="h-32 rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
                      <div className="h-4 w-24 bg-indigo-500/50 rounded" />
                      <div className="space-y-2">
                        <div className="h-2 w-full bg-white/10 rounded" />
                        <div className="h-2 w-2/3 bg-white/10 rounded" />
                      </div>
                    </div>
                    <div className="h-32 rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
                      <div className="h-4 w-32 bg-purple-500/50 rounded" />
                      <div className="space-y-2">
                        <div className="h-2 w-full bg-white/10 rounded" />
                        <div className="h-2 w-3/4 bg-white/10 rounded" />
                      </div>
                    </div>
                 </div>
               </div>
               
               {/* Glow effect on the mock UI */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
            </div>
            
            {/* Fade out bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f0f23] to-transparent" />
        </div>

      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-sm text-white/40 border-t border-white/5 bg-black/20">
        <p>© {new Date().getFullYear()} GitFolio. All rights reserved.</p>
      </footer>

    </div>
  );
}
