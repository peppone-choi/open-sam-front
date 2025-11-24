'use client';

/**
 * Dynamic import wrapper for ThreeBattleMap
 * Uses Next.js dynamic() for component-level code splitting
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

interface ThreeBattleMapProps {
  width?: number;
  height?: number;
  mapWidth: number;
  mapHeight: number;
  units: any[];
  myGeneralId: number | null;
  onMoveRequest?: (target: { x: number; y: number }) => void;
  onAttackRequest?: (targetGeneralId: number) => void;
}

// Loading component
function ThreeBattleMapLoading() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 960,
        height: 640,
        border: '1px solid #4b5563',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#020617',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          padding: '16px 24px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 8,
          color: '#e5e7eb',
          fontSize: 16,
          fontWeight: 600,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        Loading 3D Battle Map...
      </div>
    </div>
  );
}

// Dynamic import with loading state
const ThreeBattleMapDynamic = dynamic<ThreeBattleMapProps>(
  () => import('./ThreeBattleMap'),
  {
    loading: () => <ThreeBattleMapLoading />,
    ssr: false, // Disable SSR for Three.js
  }
) as ComponentType<ThreeBattleMapProps>;

export default ThreeBattleMapDynamic;
