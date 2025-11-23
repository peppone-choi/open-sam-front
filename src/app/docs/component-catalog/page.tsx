'use client';

import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function ComponentCatalogPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background-main text-foreground p-8 space-y-12">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-4xl font-bold mb-2">Gin7 Design System Catalog</h1>
        <p className="text-foreground-muted">Core components and tokens for the Legend of Galactic Heroes UI.</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="font-mono text-sm">Current Theme: <span className="font-bold uppercase text-accent">{theme}</span></span>
          <button 
            onClick={toggleTheme}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded border border-white/20 text-sm font-mono"
          >
            Toggle Faction Theme
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif text-empire-gold">01. Colors & Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Empire */}
          <div className="space-y-2">
            <div className="h-20 w-full bg-empire rounded border border-white/10"></div>
            <div className="font-mono text-xs">empire.DEFAULT (Silver)</div>
          </div>
          <div className="space-y-2">
            <div className="h-20 w-full bg-empire-gold rounded border border-white/10"></div>
            <div className="font-mono text-xs">empire.gold</div>
          </div>
          <div className="space-y-2">
            <div className="h-20 w-full bg-empire-blue rounded border border-white/10"></div>
            <div className="font-mono text-xs">empire.blue</div>
          </div>
          
          {/* Alliance */}
          <div className="space-y-2">
            <div className="h-20 w-full bg-alliance rounded border border-white/10"></div>
            <div className="font-mono text-xs">alliance.DEFAULT (Olive)</div>
          </div>
          <div className="space-y-2">
            <div className="h-20 w-full bg-alliance-light rounded border border-white/10"></div>
            <div className="font-mono text-xs">alliance.light (Beige)</div>
          </div>
           <div className="space-y-2">
            <div className="h-20 w-full bg-alliance-red rounded border border-white/10"></div>
            <div className="font-mono text-xs">alliance.red</div>
          </div>

          {/* HUD */}
          <div className="space-y-2">
            <div className="h-20 w-full bg-hud-alert rounded border border-white/10"></div>
            <div className="font-mono text-xs">hud.alert</div>
          </div>
          <div className="space-y-2">
            <div className="h-20 w-full bg-hud-success rounded border border-white/10"></div>
            <div className="font-mono text-xs">hud.success</div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif text-empire-gold">02. Typography</h2>
        <div className="space-y-6 border border-white/10 p-6 rounded bg-background-secondary/50">
          <div>
            <p className="text-sm text-foreground-muted mb-1">Heading (Serif / Sans based on Theme)</p>
            <div className={`text-4xl font-bold ${theme === 'empire' ? 'font-serif' : 'font-sans'}`}>
              The Galactic History
            </div>
          </div>
          <div>
            <p className="text-sm text-foreground-muted mb-1">Body Text</p>
            <p className="max-w-2xl text-foreground">
              In AD 2801 the Galactic Federation was formed, resulting in political power moving away from the planet Earth (now named Terra) and the Space Era calendar replacing the Gregorian calendar, with 2801 AD being now 1 SE.
            </p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted mb-1">Data / HUD (Monospace)</p>
            <div className="font-mono text-hud-success bg-black/50 inline-block p-2 border border-white/10 rounded">
              COORD: 104.22, 591.00 <br/>
              STATUS: NORMAL <br/>
              ENERGY: 98.4%
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif text-empire-gold">03. UI Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card */}
          <div className="bg-background-secondary border border-white/20 p-6 rounded shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-2">Standard Panel</h3>
            <p className="text-sm text-foreground-muted mb-4">Used for main content areas.</p>
            <button className={`px-4 py-2 rounded font-bold text-white transition-colors ${theme === 'empire' ? 'bg-empire-blue border border-empire-gold text-empire-gold hover:bg-empire-blue/80' : 'bg-alliance-red hover:bg-alliance-red/80'}`}>
              Primary Action
            </button>
          </div>

          {/* Alert */}
          <div className="bg-hud-alert/10 border border-hud-alert p-4 rounded flex items-start gap-3">
             <div className="text-hud-alert font-bold text-xl">⚠️</div>
             <div>
               <h4 className="font-bold text-hud-alert">Critical Warning</h4>
               <p className="text-sm text-foreground/80">Enemy fleet detected in Sector 4.</p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
