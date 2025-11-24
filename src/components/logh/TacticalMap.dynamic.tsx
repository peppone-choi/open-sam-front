'use client';

/**
 * Dynamic import wrapper for LOGH TacticalMap
 * Uses Next.js dynamic() for component-level code splitting
 * Note: This component uses Canvas 2D, not Three.js, but we still lazy load for consistency
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

interface TacticalMapProps {
  sessionId: string;
  tacticalMapId: string;
  onClose?: () => void;
}

// Loading component
function TacticalMapLoading() {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-space-panel border border-white/20 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 bg-gray-800/50 backdrop-blur border-b border-white/10">
          <h3 className="text-lg font-bold text-white font-serif">
            Tactical Map <span className="text-sm font-mono text-gray-400">Loading...</span>
          </h3>
        </div>
        <div className="flex items-center justify-center" style={{ height: 600 }}>
          <div className="bg-space-panel/90 text-space-text p-6 rounded border border-white/10 backdrop-blur-sm">
            <div className="font-mono text-lg text-hud-success animate-pulse">
              INITIALIZING TACTICAL SYSTEMS...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic import with loading state
const TacticalMapDynamic = dynamic<TacticalMapProps>(
  () => import('./TacticalMap'),
  {
    loading: () => <TacticalMapLoading />,
    ssr: false, // Disable SSR for canvas
  }
) as ComponentType<TacticalMapProps>;

export default TacticalMapDynamic;
