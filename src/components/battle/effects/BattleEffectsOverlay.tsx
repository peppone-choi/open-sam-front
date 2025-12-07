'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  SkillCutInProps,
  DamageFloaterProps,
  StatusOverlayProps,
  Position,
  DamageType,
  StatusEffectType,
} from './types';
import SkillCutIn from './SkillCutIn';
import { DamageFloater, DamageFloaterManager, DamageFloaterManagerRef } from './DamageFloater';
import { StatusOverlay } from './StatusOverlay';
import styles from './BattleEffectsOverlay.module.css';

/**
 * BattleEffectsOverlay - 전투 이펙트 통합 오버레이
 * 
 * React Portal을 사용하여 전투 맵 위에 이펙트를 렌더링합니다.
 * 스킬 컷인, 데미지 플로터, 상태 이상 효과를 통합 관리합니다.
 */

interface ActiveSkillCutIn extends SkillCutInProps {
  id: string;
}

interface ActiveStatus {
  id: string;
  type: StatusEffectType;
  position: Position;
  duration: number;
}

export interface BattleEffectsOverlayRef {
  // 스킬 컷인
  showSkillCutIn: (props: Omit<SkillCutInProps, 'onComplete'>) => Promise<void>;
  
  // 데미지
  showDamage: (value: number, position: Position, type?: DamageType) => void;
  showCriticalDamage: (value: number, position: Position) => void;
  showHeal: (value: number, position: Position) => void;
  showMiss: (position: Position) => void;
  showMultipleDamages: (damages: Array<{ value: number; position: Position; type?: DamageType }>) => void;
  
  // 상태 이상
  showStatus: (type: StatusEffectType, position: Position, duration?: number) => string;
  hideStatus: (id: string) => void;
  
  // 유틸리티
  clearAll: () => void;
}

interface BattleEffectsOverlayProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  onRef?: (ref: BattleEffectsOverlayRef) => void;
}

export function BattleEffectsOverlay({
  containerRef,
  onRef,
}: BattleEffectsOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  // 활성 이펙트 상태
  const [activeSkillCutIn, setActiveSkillCutIn] = useState<ActiveSkillCutIn | null>(null);
  const [activeStatuses, setActiveStatuses] = useState<ActiveStatus[]>([]);
  
  // 데미지 매니저 ref
  const damageManagerRef = useRef<DamageFloaterManagerRef | null>(null);
  
  // ID 카운터
  const idCounter = useRef(0);
  const generateId = useCallback((prefix: string) => {
    idCounter.current += 1;
    return `${prefix}_${idCounter.current}_${Date.now()}`;
  }, []);

  // 마운트 처리
  useEffect(() => {
    setMounted(true);
    
    // 포털 컨테이너 설정
    if (containerRef?.current) {
      setPortalContainer(containerRef.current);
    } else {
      setPortalContainer(document.body);
    }
  }, [containerRef]);

  // 스킬 컷인 표시
  const showSkillCutIn = useCallback(
    (props: Omit<SkillCutInProps, 'onComplete'>): Promise<void> => {
      return new Promise(resolve => {
        const id = generateId('skill');
        setActiveSkillCutIn({
          ...props,
          id,
          onComplete: () => {
            setActiveSkillCutIn(null);
            resolve();
          },
        });
      });
    },
    [generateId]
  );

  // 데미지 표시 함수들
  const showDamage = useCallback(
    (value: number, position: Position, type: DamageType = 'normal') => {
      damageManagerRef.current?.addDamage({ value, position, type });
    },
    []
  );

  const showCriticalDamage = useCallback(
    (value: number, position: Position) => {
      damageManagerRef.current?.addDamage({ value, position, type: 'critical' });
    },
    []
  );

  const showHeal = useCallback(
    (value: number, position: Position) => {
      damageManagerRef.current?.addDamage({ value, position, type: 'heal' });
    },
    []
  );

  const showMiss = useCallback(
    (position: Position) => {
      damageManagerRef.current?.addDamage({ value: 0, position, type: 'miss' });
    },
    []
  );

  const showMultipleDamages = useCallback(
    (damages: Array<{ value: number; position: Position; type?: DamageType }>) => {
      const floaters = damages.map((d, i) => ({
        value: d.value,
        position: d.position,
        type: d.type || 'normal' as DamageType,
        delay: i * 0.1,
      }));
      damageManagerRef.current?.addMultipleDamages(floaters);
    },
    []
  );

  // 상태 이상 표시
  const showStatus = useCallback(
    (type: StatusEffectType, position: Position, duration: number = 2000): string => {
      const id = generateId('status');
      setActiveStatuses(prev => [...prev, { id, type, position, duration }]);
      
      // 자동 제거
      setTimeout(() => {
        setActiveStatuses(prev => prev.filter(s => s.id !== id));
      }, duration);
      
      return id;
    },
    [generateId]
  );

  const hideStatus = useCallback((id: string) => {
    setActiveStatuses(prev => prev.filter(s => s.id !== id));
  }, []);

  // 모두 지우기
  const clearAll = useCallback(() => {
    setActiveSkillCutIn(null);
    setActiveStatuses([]);
    damageManagerRef.current?.clear();
  }, []);

  // Ref 전달
  useEffect(() => {
    onRef?.({
      showSkillCutIn,
      showDamage,
      showCriticalDamage,
      showHeal,
      showMiss,
      showMultipleDamages,
      showStatus,
      hideStatus,
      clearAll,
    });
  }, [
    onRef,
    showSkillCutIn,
    showDamage,
    showCriticalDamage,
    showHeal,
    showMiss,
    showMultipleDamages,
    showStatus,
    hideStatus,
    clearAll,
  ]);

  if (!mounted || !portalContainer) {
    return null;
  }

  const overlayContent = (
    <div className={styles.overlayContainer}>
      {/* 스킬 컷인 레이어 */}
      <AnimatePresence>
        {activeSkillCutIn && (
          <SkillCutIn
            key={activeSkillCutIn.id}
            {...activeSkillCutIn}
          />
        )}
      </AnimatePresence>

      {/* 데미지 플로터 레이어 */}
      <DamageFloaterManager
        onRef={ref => {
          damageManagerRef.current = ref;
        }}
      />

      {/* 상태 이상 레이어 */}
      <AnimatePresence>
        {activeStatuses.map(status => (
          <StatusOverlay
            key={status.id}
            type={status.type}
            position={status.position}
            duration={status.duration}
          />
        ))}
      </AnimatePresence>
    </div>
  );

  // React Portal로 렌더링
  return createPortal(overlayContent, portalContainer);
}

/**
 * useBattleEffects - 전투 이펙트 훅
 * 
 * 컴포넌트에서 쉽게 이펙트를 사용할 수 있는 훅
 */
export function useBattleEffects() {
  const [overlay, setOverlay] = useState<BattleEffectsOverlayRef | null>(null);

  const OverlayComponent = useCallback(
    ({ containerRef }: { containerRef?: React.RefObject<HTMLElement | null> }) => (
      <BattleEffectsOverlay
        containerRef={containerRef}
        onRef={setOverlay}
      />
    ),
    []
  );

  return {
    overlay,
    OverlayComponent,
  };
}

export default BattleEffectsOverlay;

