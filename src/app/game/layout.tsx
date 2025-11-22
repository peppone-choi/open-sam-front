'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import JobCardDeck from '@/components/logh/JobCardDeck';
import { COMMON_TEXT, LAYOUT_TEXT } from '@/constants/uiText';

interface GameAppShellProps {
  children: React.ReactNode;
}

export default function GameAppShell({ children }: GameAppShellProps) {
  const pathname = usePathname();

  const navItems = [
    { label: LAYOUT_TEXT.nav.strategy, path: '/game/strategy', icon: '🗺️' },
    { label: LAYOUT_TEXT.nav.office, path: '/game/office', icon: '🏛️' },
    { label: LAYOUT_TEXT.nav.comm, path: '/game/comm', icon: '📡' },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#050510] text-[#E0E0E0] overflow-hidden font-mono">
      {/* Left System Sidebar (P.18 System Icons) */}
      <aside className="w-16 border-r border-[#101520] bg-[#101520] flex flex-col items-center py-4 gap-6 z-50">
        <div className="text-xs font-bold text-[#9CA3AF] mb-2">{LAYOUT_TEXT.statusBar.systemLabel}</div>
        
        <button className="p-2 hover:bg-[#1E90FF]/20 rounded transition-colors relative group" aria-label={LAYOUT_TEXT.tooltips.messenger}>
          <span className="text-2xl">💬</span>
          <span className="absolute left-full ml-2 bg-black px-2 py-1 text-xs rounded hidden group-hover:block whitespace-nowrap border border-[#333]">
            {LAYOUT_TEXT.tooltips.messenger}
          </span>
        </button>

        <button className="p-2 hover:bg-[#1E90FF]/20 rounded transition-colors relative group" aria-label={LAYOUT_TEXT.tooltips.info}>
          <span className="text-2xl">ℹ️</span>
          <span className="absolute left-full ml-2 bg-black px-2 py-1 text-xs rounded hidden group-hover:block whitespace-nowrap border border-[#333]">
            {LAYOUT_TEXT.tooltips.info}
          </span>
        </button>

        <button className="p-2 hover:bg-[#1E90FF]/20 rounded transition-colors relative group" aria-label={LAYOUT_TEXT.tooltips.mail}>
          <span className="text-2xl">✉️</span>
          {/* Mail Badge (P.15) */}
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EF4444]"></span>
          </span>
        </button>

        <div className="flex-grow" />

        <button className="p-2 hover:bg-[#EF4444]/20 rounded transition-colors" aria-label={COMMON_TEXT.logout}>
          <span className="text-xl">🚪</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col">
        {/* Top Status Bar (Mock) */}
        <header className="h-8 bg-[#101520]/80 border-b border-[#333] flex items-center justify-between px-4 text-xs">
          <div className="flex gap-4">
             <span className="text-[#FFD700]">{LAYOUT_TEXT.statusBar.year}</span>
             <span className="text-[#9CA3AF]">{LAYOUT_TEXT.statusBar.datetime}</span>
          </div>
          <div className="flex gap-4">
             <span className="text-[#10B981]">{LAYOUT_TEXT.statusBar.commandPoint}</span>
             <span>{LAYOUT_TEXT.statusBar.rank}</span>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 relative overflow-hidden">
          {children}
        </div>

        {/* Bottom Dock: Job Authority Cards (P.18 Tab) */}
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 pointer-events-none">
           {/* Navigation Shortcuts (Temporary for Dev) */}
           <div className="pointer-events-auto bg-[#101520] border border-[#333] p-2 rounded flex gap-2 mb-4">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`px-3 py-1 text-xs border border-transparent hover:border-[#1E90FF] ${pathname === item.path ? 'text-[#1E90FF] border-[#1E90FF]' : ''}`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
           </div>

           {/* Job Card Stack Placeholder */}
           <div className="pointer-events-auto w-64 rounded-t-lg">
              <JobCardDeck />
           </div>
        </div>
      </main>
    </div>
  );
}
