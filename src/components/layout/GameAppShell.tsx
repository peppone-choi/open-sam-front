import React from 'react';
import { cn } from '@/lib/utils';

interface GameAppShellProps {
  header?: React.ReactNode;
  subHeader?: React.ReactNode;
  leftColumn?: React.ReactNode;
  mainColumn: React.ReactNode;
  rightColumn?: React.ReactNode;
  footer?: React.ReactNode;
  bottomNav?: React.ReactNode;
}

export default function GameAppShell({
  header,
  subHeader,
  leftColumn,
  mainColumn,
  rightColumn,
  footer,
  bottomNav,
}: GameAppShellProps) {
  const hasSideColumns = Boolean(leftColumn || rightColumn);

  return (
    <div className="min-h-screen bg-background-main text-foreground flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Top Region: Header & SubHeader - Unsticky */}
      {(header || subHeader) && (
        <header className="w-full bg-background-main/80 border-b border-white/10 shadow-sm z-40">
          {header && <div className="w-full">{header}</div>}
          {subHeader && <div className="w-full border-t border-white/5">{subHeader}</div>}
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[1920px] mx-auto p-2 md:p-4 lg:p-6">
        {hasSideColumns ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full">
            {/* Left Column (Desktop: 3 cols) */}
            {leftColumn && (
              <aside className="lg:col-span-3 xl:col-span-2 flex flex-col gap-4 order-2 lg:order-1">
                <div className="space-y-4">
                  {leftColumn}
                </div>
              </aside>
            )}

            {/* Main Column (Fluid) */}
            <main className={cn(
              "flex flex-col gap-4 min-h-[500px] order-1 lg:order-2",
              leftColumn && rightColumn ? "lg:col-span-6 xl:col-span-8" : 
              leftColumn ? "lg:col-span-9 xl:col-span-10" : 
              rightColumn ? "lg:col-span-9 xl:col-span-10" : 
              "lg:col-span-12"
            )}>
              <div className="bg-background-secondary/30 backdrop-blur-sm border border-white/5 rounded-xl p-1 shadow-inner h-full">
                {mainColumn}
              </div>
            </main>

            {/* Right Column (Desktop: 3 cols) */}
            {rightColumn && (
              <aside className="lg:col-span-3 xl:col-span-2 flex flex-col gap-4 order-3 lg:order-3">
                <div className="space-y-4">
                  {rightColumn}
                </div>
              </aside>
            )}
          </div>
        ) : (
          <main className="w-full max-w-5xl mx-auto flex flex-col gap-4">
            <div className="bg-background-secondary/30 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-inner">
              {mainColumn}
            </div>
          </main>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <footer className="w-full py-6 mt-auto border-t border-white/5 bg-background-secondary/20">
          <div className="container mx-auto px-4 text-center text-sm text-foreground-muted">
            {footer}
          </div>
        </footer>
      )}

      {/* Mobile Bottom Nav */}
      {bottomNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          {bottomNav}
        </div>
      )}
    </div>
  );
}
