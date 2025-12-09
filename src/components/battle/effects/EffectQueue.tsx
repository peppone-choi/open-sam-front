'use client';

import React, { useReducer, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import type {
  QueuedEffect,
  EffectManagerState,
  EffectManagerAction,
  EffectPriority,
  SkillCutInProps,
  DamageFloaterProps,
  StatusOverlayProps,
} from './types';
import SkillCutIn from './SkillCutIn';
import { DamageFloater } from './DamageFloater';
import { StatusOverlay } from './StatusOverlay';

// ===== Reducer =====
function effectReducer(
  state: EffectManagerState,
  action: EffectManagerAction
): EffectManagerState {
  switch (action.type) {
    case 'ADD_EFFECT': {
      // 우선순위에 따라 삽입
      const newQueue = [...state.queue];
      const priorityOrder: EffectPriority[] = ['immediate', 'high', 'normal', 'low'];
      const insertIndex = newQueue.findIndex(
        e => priorityOrder.indexOf(e.priority) > priorityOrder.indexOf(action.effect.priority)
      );
      if (insertIndex === -1) {
        newQueue.push(action.effect);
      } else {
        newQueue.splice(insertIndex, 0, action.effect);
      }
      return { ...state, queue: newQueue };
    }

    case 'ADD_EFFECTS': {
      const newQueue = [...state.queue, ...action.effects];
      // 우선순위 정렬
      const priorityOrder: EffectPriority[] = ['immediate', 'high', 'normal', 'low'];
      newQueue.sort((a, b) => 
        priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
      );
      return { ...state, queue: newQueue };
    }

    case 'REMOVE_EFFECT':
      return {
        ...state,
        queue: state.queue.filter(e => e.id !== action.id),
        activeEffects: state.activeEffects.filter(e => e.id !== action.id),
      };

    case 'CLEAR_ALL':
      return { ...state, queue: [], activeEffects: [] };

    case 'CLEAR_GROUP':
      return {
        ...state,
        queue: state.queue.filter(e => e.groupId !== action.groupId),
        activeEffects: state.activeEffects.filter(e => e.groupId !== action.groupId),
      };

    case 'START_PROCESSING':
      return { ...state, isProcessing: true };

    case 'STOP_PROCESSING':
      return { ...state, isProcessing: false };

    case 'PAUSE':
      return { ...state, isPaused: true };

    case 'RESUME':
      return { ...state, isPaused: false };

    case 'PROCESS_NEXT': {
      if (state.queue.length === 0 || state.isPaused) {
        return state;
      }
      
      // 병렬 재생 그룹 처리
      const nextEffect = state.queue[0];
      let effectsToActivate: QueuedEffect[] = [nextEffect];
      let remainingQueue = state.queue.slice(1);

      // 같은 그룹의 parallel 이펙트 찾기
      if (nextEffect.groupId && nextEffect.playMode === 'parallel') {
        const parallelEffects = remainingQueue.filter(
          e => e.groupId === nextEffect.groupId && e.playMode === 'parallel'
        );
        effectsToActivate = [nextEffect, ...parallelEffects];
        remainingQueue = remainingQueue.filter(
          e => !(e.groupId === nextEffect.groupId && e.playMode === 'parallel')
        );
      }

      return {
        ...state,
        queue: remainingQueue,
        activeEffects: [...state.activeEffects, ...effectsToActivate],
      };
    }

    case 'EFFECT_COMPLETE':
      return {
        ...state,
        activeEffects: state.activeEffects.filter(e => e.id !== action.id),
      };

    default:
      return state;
  }
}

// ===== Context =====
interface EffectQueueContextValue {
  state: EffectManagerState;
  addSkillCutIn: (props: Omit<SkillCutInProps, 'onComplete'>, options?: EffectOptions) => string;
  addDamage: (props: Omit<DamageFloaterProps, 'id'>, options?: EffectOptions) => string;
  addDamages: (damages: Omit<DamageFloaterProps, 'id'>[], options?: EffectOptions) => string[];
  addStatus: (props: StatusOverlayProps, options?: EffectOptions) => string;
  clearAll: () => void;
  clearGroup: (groupId: string) => void;
  pause: () => void;
  resume: () => void;
}

interface EffectOptions {
  priority?: EffectPriority;
  groupId?: string;
  playMode?: 'sequential' | 'parallel';
}

const EffectQueueContext = createContext<EffectQueueContextValue | null>(null);

// ===== Hook =====
export function useEffectQueue() {
  const context = useContext(EffectQueueContext);
  if (!context) {
    throw new Error('useEffectQueue must be used within an EffectQueueProvider');
  }
  return context;
}

// ===== Provider Component =====
interface EffectQueueProviderProps {
  children: React.ReactNode;
  autoProcess?: boolean;
  processInterval?: number;
}

export function EffectQueueProvider({
  children,
  autoProcess = true,
  processInterval = 100,
}: EffectQueueProviderProps) {
  const [state, dispatch] = useReducer(effectReducer, {
    queue: [],
    activeEffects: [],
    isProcessing: false,
    isPaused: false,
  });

  const idCounter = useRef(0);

  // ID 생성
  const generateId = useCallback((prefix: string) => {
    idCounter.current += 1;
    return `${prefix}_${idCounter.current}_${Date.now()}`;
  }, []);

  // 스킬 컷인 추가
  const addSkillCutIn = useCallback(
    (props: Omit<SkillCutInProps, 'onComplete'>, options: EffectOptions = {}) => {
      const id = generateId('skill');
      const effect: QueuedEffect = {
        id,
        type: 'skill_cutin',
        priority: options.priority || 'high',
        data: props,
        playMode: options.playMode || 'sequential',
        groupId: options.groupId,
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_EFFECT', effect });
      return id;
    },
    [generateId]
  );

  // 데미지 추가
  const addDamage = useCallback(
    (props: Omit<DamageFloaterProps, 'id'>, options: EffectOptions = {}) => {
      const id = generateId('damage');
      const effect: QueuedEffect = {
        id,
        type: 'damage',
        priority: options.priority || 'normal',
        data: { ...props, id } as DamageFloaterProps,
        playMode: options.playMode || 'parallel',
        groupId: options.groupId,
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_EFFECT', effect });
      return id;
    },
    [generateId]
  );

  // 여러 데미지 추가
  const addDamages = useCallback(
    (damages: Omit<DamageFloaterProps, 'id'>[], options: EffectOptions = {}) => {
      const groupId = options.groupId || generateId('damage_group');
      const effects: QueuedEffect[] = damages.map((d, i) => {
        const id = generateId('damage');
        return {
          id,
          type: 'damage' as const,
          priority: options.priority || 'normal',
          data: { ...d, id, delay: i * 0.1 } as DamageFloaterProps,
          playMode: 'parallel' as const,
          groupId,
          timestamp: Date.now(),
        };
      });
      dispatch({ type: 'ADD_EFFECTS', effects });
      return effects.map(e => e.id);
    },
    [generateId]
  );

  // 상태 이상 추가
  const addStatus = useCallback(
    (props: StatusOverlayProps, options: EffectOptions = {}) => {
      const id = generateId('status');
      const effect: QueuedEffect = {
        id,
        type: 'status',
        priority: options.priority || 'normal',
        data: props,
        playMode: options.playMode || 'parallel',
        groupId: options.groupId,
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_EFFECT', effect });
      return id;
    },
    [generateId]
  );

  // 클리어 함수들
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const clearGroup = useCallback((groupId: string) => {
    dispatch({ type: 'CLEAR_GROUP', groupId });
  }, []);

  // 일시정지/재개
  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, []);

  const resume = useCallback(() => {
    dispatch({ type: 'RESUME' });
  }, []);

  // 이펙트 완료 핸들러
  const handleEffectComplete = useCallback((id: string) => {
    dispatch({ type: 'EFFECT_COMPLETE', id });
  }, []);

  // 자동 처리
  useEffect(() => {
    if (!autoProcess || state.isPaused) return;

    // 활성 이펙트가 없고 큐에 이펙트가 있으면 다음 처리
    if (state.activeEffects.length === 0 && state.queue.length > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'PROCESS_NEXT' });
      }, processInterval);
      return () => clearTimeout(timer);
    }
  }, [autoProcess, state.queue, state.activeEffects, state.isPaused, processInterval]);

  const contextValue: EffectQueueContextValue = {
    state,
    addSkillCutIn,
    addDamage,
    addDamages,
    addStatus,
    clearAll,
    clearGroup,
    pause,
    resume,
  };

  return (
    <EffectQueueContext.Provider value={contextValue}>
      {children}
      
      {/* 활성 이펙트 렌더링 */}
      <AnimatePresence>
        {state.activeEffects.map(effect => {
          switch (effect.type) {
            case 'skill_cutin':
              return (
                <SkillCutIn
                  key={effect.id}
                  {...(effect.data as SkillCutInProps)}
                  onComplete={() => handleEffectComplete(effect.id)}
                />
              );
            case 'damage':
              return (
                <DamageFloater
                  key={effect.id}
                  {...(effect.data as DamageFloaterProps)}
                />
              );
            case 'status':
              return (
                <StatusOverlay
                  key={effect.id}
                  {...(effect.data as StatusOverlayProps)}
                />
              );
            default:
              return null;
          }
        })}
      </AnimatePresence>
    </EffectQueueContext.Provider>
  );
}

export default EffectQueueProvider;






