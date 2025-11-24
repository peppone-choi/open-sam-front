'use client';

import { useEffect, useRef, useState } from 'react';
import SteeringPanel from './SteeringPanel';
import { useGin7Store } from '@/stores/gin7Store';
import type { Gin7EnergyProfile } from '@/types/gin7';

// SteeringPanel 에서 사용하는 키와 Gin7EnergyProfile 매핑
const SYSTEM_KEYS = ['BEAM', 'GUN', 'SHIELD', 'ENGINE', 'WARP', 'SENSOR'] as const;
type SystemKey = (typeof SYSTEM_KEYS)[number];

const KEY_MAP: Record<SystemKey, keyof Gin7EnergyProfile> = {
  BEAM: 'beam',
  GUN: 'gun',
  SHIELD: 'shield',
  ENGINE: 'engine',
  WARP: 'warp',
  SENSOR: 'sensor',
};

export default function TacticalSteeringPanel() {
  const tactical = useGin7Store((s) => s.tactical);
  const updateEnergy = useGin7Store((s) => s.updateEnergy);
  const loading = useGin7Store((s) => s.loading);
  const sessionSnapshot = useGin7Store((s) => s.sessionSnapshot);
  const [initial, setInitial] = useState<Record<SystemKey, number> | null>(null);
  const lastSentRef = useRef<Record<SystemKey, number> | null>(null);

  const isClockPaused = !!sessionSnapshot?.clock?.manuallyPaused;
  const isTacticalPhase = sessionSnapshot?.clock?.phase === 'tactical';
  const disabled = loading || !tactical || !isTacticalPhase || isClockPaused;


  // Gin7 전술 에너지 프로필을 SteeringPanel 분포로 변환
  useEffect(() => {
    if (tactical?.energy) {
      const e = tactical.energy;
      const dist: Record<SystemKey, number> = {
        BEAM: e.beam,
        GUN: e.gun,
        SHIELD: e.shield,
        ENGINE: e.engine,
        WARP: e.warp,
        SENSOR: e.sensor,
      };
      setInitial(dist);
      lastSentRef.current = dist;
    }
  }, [tactical?.energy]);

  const handleDistributionChange = async (dist: Record<SystemKey, number>) => {
    const prev = lastSentRef.current;
    lastSentRef.current = dist;
    if (!prev) return;

    // 값이 실제로 변경된 키만 Gin7 스토어로 전파
    await Promise.all(
      (Object.keys(dist) as SystemKey[]).map(async (key) => {
        if (dist[key] !== prev[key]) {
          const energyKey = KEY_MAP[key];
          await updateEnergy(energyKey, dist[key]);
        }
      }),
    );
  };

  if (!initial) {
    // 아직 전술 상태를 불러오기 전에는 기본 패널만 표시하되, 전술 상태가 없으면 비활성화
    return <SteeringPanel disabled={loading || !tactical} />;
  }
 
  return (
    <SteeringPanel
      initialDistribution={initial}
      onDistributionChange={handleDistributionChange}
      disabled={disabled}
    />
  );

}
