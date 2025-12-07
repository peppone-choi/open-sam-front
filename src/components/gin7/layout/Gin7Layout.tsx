'use client';

import { ReactNode, useState } from 'react';
import TopBar from './TopBar';
import SideMenu from './SideMenu';
import { TutorialProvider } from '../tutorial';

interface Gin7LayoutProps {
  children: ReactNode;
}

export default function Gin7Layout({ children }: Gin7LayoutProps) {
  const [sideMenuCollapsed, setSideMenuCollapsed] = useState(false);

  return (
    <TutorialProvider>
      <div className="min-h-screen bg-space-bg text-foreground font-sans">
        {/* Top Bar */}
        <TopBar />

        <div className="flex">
          {/* Side Menu */}
          <SideMenu 
            collapsed={sideMenuCollapsed} 
            onToggle={() => setSideMenuCollapsed(!sideMenuCollapsed)} 
          />

          {/* Main Content Area */}
          <main 
            className={`flex-1 transition-all duration-300 ${
              sideMenuCollapsed ? 'ml-16' : 'ml-64'
            }`}
          >
            <div className="p-4 md:p-6 min-h-[calc(100vh-56px)]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TutorialProvider>
  );
}

