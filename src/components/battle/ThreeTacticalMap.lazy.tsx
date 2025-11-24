'use client';

/**
 * Lazy-loaded wrapper for ThreeTacticalMap
 * Dynamically imports Three.js to reduce initial bundle size
 */

import React, { useEffect, useState } from 'react';
import { loadThree } from '@/lib/three/loader';

interface ThreeTacticalMapProps {
  width?: number;
  height?: number;
}

export default function ThreeTacticalMapLazy(props: ThreeTacticalMapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [TacticalMapComponent, setTacticalMapComponent] = useState<React.ComponentType<ThreeTacticalMapProps> | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Load Three.js and the component
    Promise.all([
      loadThree(),
      import('./ThreeTacticalMap')
    ]).then(([_, module]) => {
      if (cancelled) return;
      setTacticalMapComponent(() => module.default);
      setIsLoading(false);
    }).catch((error) => {
      console.error('[ThreeTacticalMapLazy] Failed to load:', error);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || !TacticalMapComponent) {
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
          Loading 3D Tactical Map...
        </div>
      </div>
    );
  }

  return <TacticalMapComponent {...props} />;
}
