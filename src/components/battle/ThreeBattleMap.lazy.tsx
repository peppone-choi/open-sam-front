'use client';

/**
 * Lazy-loaded wrapper for ThreeBattleMap
 * Dynamically imports Three.js to reduce initial bundle size
 */

import React, { useEffect, useRef, useState } from 'react';
import { loadThree, type ThreeModule } from '@/lib/three/loader';

export type Relation = 'self' | 'ally' | 'neutral' | 'enemy';

export interface ThreeBattleUnit {
  id: string;
  generalId: number;
  x: number;
  y: number;
  color: number;
  troops: number;
  maxTroops: number;
  relation: Relation;
}

interface ThreeBattleMapProps {
  width?: number;
  height?: number;
  mapWidth: number;
  mapHeight: number;
  units: ThreeBattleUnit[];
  myGeneralId: number | null;
  onMoveRequest?: (target: { x: number; y: number }) => void;
  onAttackRequest?: (targetGeneralId: number) => void;
}

export default function ThreeBattleMapLazy(props: ThreeBattleMapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [BattleMapComponent, setBattleMapComponent] = useState<React.ComponentType<ThreeBattleMapProps> | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Load Three.js and the component
    Promise.all([
      loadThree(),
      import('./ThreeBattleMap')
    ]).then(([_, module]) => {
      if (cancelled) return;
      setBattleMapComponent(() => module.default);
      setIsLoading(false);
    }).catch((error) => {
      console.error('[ThreeBattleMapLazy] Failed to load:', error);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || !BattleMapComponent) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: props.width || 960,
          height: props.height || 640,
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

  return <BattleMapComponent {...props} />;
}
