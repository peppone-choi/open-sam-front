'use client';

import React, { useEffect, useCallback, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DamageFloaterProps, DamageType } from './types';
import styles from './DamageFloater.module.css';

/**
 * DamageFloater - 데미지 플로팅 텍스트
 * 
 * 유닛 머리 위로 데미지 숫자가 튀어오르는 이펙트
 */
export function DamageFloater({
  id,
  value,
  position,
  type,
  delay = 0,
}: DamageFloaterProps) {
  // 타입별 스타일 설정
  const getTypeConfig = (damageType: DamageType) => {
    switch (damageType) {
      case 'critical':
        return {
          color: '#fbbf24',
          label: 'CRITICAL!',
          scale: 1.6,
          fontSize: '2.5rem',
          glow: '0 0 20px #fbbf24, 0 0 40px #fbbf24',
        };
      case 'heal':
        return {
          color: '#4ade80',
          label: null,
          scale: 1.2,
          fontSize: '1.8rem',
          glow: '0 0 15px #4ade80',
        };
      case 'miss':
        return {
          color: '#9ca3af',
          label: null,
          scale: 1,
          fontSize: '1.5rem',
          glow: 'none',
        };
      case 'fire':
        return {
          color: '#f97316',
          label: '🔥',
          scale: 1.3,
          fontSize: '1.8rem',
          glow: '0 0 20px #f97316, 0 0 40px #ef4444',
        };
      case 'poison':
        return {
          color: '#a855f7',
          label: '☠️',
          scale: 1.2,
          fontSize: '1.8rem',
          glow: '0 0 15px #a855f7',
        };
      case 'true':
        return {
          color: '#ffffff',
          label: 'TRUE DMG',
          scale: 1.4,
          fontSize: '2rem',
          glow: '0 0 20px #fff, 0 0 40px #fff',
        };
      default:
        return {
          color: '#f87171',
          label: null,
          scale: 1,
          fontSize: '1.75rem',
          glow: '0 0 10px #f87171',
        };
    }
  };

  const config = getTypeConfig(type);

  // 텍스트 생성
  const getText = () => {
    if (type === 'miss') return 'MISS!';
    if (type === 'heal') return `+${value}`;
    return typeof value === 'number' ? `-${value}` : value;
  };

  return (
    <motion.div
      key={id}
      className={styles.floater}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      initial={{
        opacity: 0,
        y: 0,
        scale: config.scale * 0.5,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: -80,
        scale: [config.scale * 0.5, config.scale * 1.2, config.scale, config.scale * 0.8],
      }}
      transition={{
        duration: 1.2,
        delay,
        times: [0, 0.1, 0.3, 1],
        ease: 'easeOut',
      }}
    >
      {/* 레이블 (크리티컬, 화염 등) */}
      {config.label && (
        <motion.span
          className={styles.label}
          style={{ color: config.color }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.05 }}
        >
          {config.label}
        </motion.span>
      )}

      {/* 데미지 숫자 */}
      <motion.span
        className={styles.number}
        style={{
          color: config.color,
          fontSize: config.fontSize,
          textShadow: config.glow,
        }}
        animate={
          type === 'critical'
            ? {
                textShadow: [
                  '0 0 20px #fbbf24, 0 0 40px #fbbf24',
                  '0 0 40px #fbbf24, 0 0 80px #fbbf24',
                  '0 0 20px #fbbf24, 0 0 40px #fbbf24',
                ],
              }
            : {}
        }
        transition={{ duration: 0.3, repeat: type === 'critical' ? 3 : 0 }}
      >
        {getText()}
      </motion.span>

      {/* 크리티컬 버스트 이펙트 */}
      {type === 'critical' && (
        <motion.div
          className={styles.criticalBurst}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.5, delay }}
        />
      )}

      {/* 화염 이펙트 */}
      {type === 'fire' && (
        <motion.div
          className={styles.fireEffect}
          animate={{
            y: [0, -10, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 0.3, repeat: 3 }}
        >
          🔥
        </motion.div>
      )}
    </motion.div>
  );
}

// ===== 데미지 플로터 매니저 State =====
interface DamageFloaterManagerState {
  floaters: DamageFloaterProps[];
  idCounter: number;
}

type DamageFloaterAction =
  | { type: 'ADD'; floater: Omit<DamageFloaterProps, 'id'> }
  | { type: 'ADD_MULTIPLE'; floaters: Omit<DamageFloaterProps, 'id'>[] }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' };

function damageFloaterReducer(
  state: DamageFloaterManagerState,
  action: DamageFloaterAction
): DamageFloaterManagerState {
  switch (action.type) {
    case 'ADD': {
      const id = `damage_${state.idCounter}`;
      return {
        floaters: [...state.floaters, { ...action.floater, id }],
        idCounter: state.idCounter + 1,
      };
    }
    case 'ADD_MULTIPLE': {
      const newFloaters = action.floaters.map((f, i) => ({
        ...f,
        id: `damage_${state.idCounter + i}`,
      }));
      return {
        floaters: [...state.floaters, ...newFloaters],
        idCounter: state.idCounter + action.floaters.length,
      };
    }
    case 'REMOVE':
      return {
        ...state,
        floaters: state.floaters.filter(f => f.id !== action.id),
      };
    case 'CLEAR':
      return { floaters: [], idCounter: state.idCounter };
    default:
      return state;
  }
}

/**
 * DamageFloaterManager - 데미지 플로터 관리자
 * 
 * 여러 데미지 숫자를 관리하고 자동으로 제거합니다.
 */
interface DamageFloaterManagerProps {
  onRef?: (manager: DamageFloaterManagerRef) => void;
}

export interface DamageFloaterManagerRef {
  addDamage: (floater: Omit<DamageFloaterProps, 'id'>) => void;
  addMultipleDamages: (floaters: Omit<DamageFloaterProps, 'id'>[]) => void;
  clear: () => void;
}

export function DamageFloaterManager({ onRef }: DamageFloaterManagerProps) {
  const [state, dispatch] = useReducer(damageFloaterReducer, {
    floaters: [],
    idCounter: 0,
  });

  const FLOATER_DURATION = 1500;

  // 데미지 추가
  const addDamage = useCallback((floater: Omit<DamageFloaterProps, 'id'>) => {
    dispatch({ type: 'ADD', floater });
  }, []);

  // 여러 데미지 추가
  const addMultipleDamages = useCallback(
    (floaters: Omit<DamageFloaterProps, 'id'>[]) => {
      dispatch({ type: 'ADD_MULTIPLE', floaters });
    },
    []
  );

  // 모두 지우기
  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  // ref 전달
  useEffect(() => {
    onRef?.({ addDamage, addMultipleDamages, clear });
  }, [onRef, addDamage, addMultipleDamages, clear]);

  // 자동 제거
  useEffect(() => {
    if (state.floaters.length === 0) return;

    const timer = setTimeout(() => {
      const oldestId = state.floaters[0]?.id;
      if (oldestId) {
        dispatch({ type: 'REMOVE', id: oldestId });
      }
    }, FLOATER_DURATION);

    return () => clearTimeout(timer);
  }, [state.floaters]);

  return (
    <div className={styles.managerContainer}>
      <AnimatePresence>
        {state.floaters.map(floater => (
          <DamageFloater key={floater.id} {...floater} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default DamageFloater;






