'use client';

/**
 * BattleLog - 전투 이벤트 로그 컴포넌트
 * 실시간 전투 이벤트 표시, 자동 스크롤, 타입별 색상
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoxelBattleStore } from '@/stores/voxelBattleStore';
import {
  selectEvents,
  selectElapsedTime,
} from '@/stores/voxelBattleSelectors';
import type { BattleEvent, BattleEventType } from '@/stores/voxelBattleTypes';
import styles from './styles/overlay.module.css';

// ============================================================================
// 타입 정의
// ============================================================================

export interface BattleLogProps {
  /** 최대 표시 이벤트 수 */
  maxVisible?: number;
  /** 추가 클래스명 */
  className?: string;
  /** 초기 접힌 상태 */
  defaultCollapsed?: boolean;
}

// ============================================================================
// 이벤트 포맷팅
// ============================================================================

interface EventFormatted {
  icon: string;
  message: string;
  className: string;
}

const EVENT_ICONS: Record<BattleEventType, string> = {
  battle_start: '⚔️',
  battle_end: '🏆',
  unit_killed: '💀',
  squad_routing: '🏃',
  squad_rallied: '🔥',
  squad_destroyed: '☠️',
  general_skill: '✨',
  morale_change: '💫',
  formation_change: '📐',
};

function formatEvent(event: BattleEvent): EventFormatted {
  switch (event.type) {
    case 'battle_start':
      return {
        icon: EVENT_ICONS.battle_start,
        message: '전투가 시작되었습니다!',
        className: styles.logTypeBattleStart,
      };

    case 'battle_end':
      const winnerText = event.winner === 'attacker' ? '공격측' : event.winner === 'defender' ? '방어측' : '무승부';
      return {
        icon: EVENT_ICONS.battle_end,
        message: `전투 종료! ${winnerText} 승리!`,
        className: styles.logTypeBattleEnd,
      };

    case 'unit_killed':
      return {
        icon: EVENT_ICONS.unit_killed,
        message: '병사가 전사했습니다',
        className: styles.logTypeUnitKilled,
      };

    case 'squad_routing':
      return {
        icon: EVENT_ICONS.squad_routing,
        message: `부대가 패주를 시작합니다!`,
        className: styles.logTypeSquadRouting,
      };

    case 'squad_rallied':
      return {
        icon: EVENT_ICONS.squad_rallied,
        message: '부대가 사기를 회복했습니다!',
        className: styles.logTypeSquadRallied,
      };

    case 'squad_destroyed':
      return {
        icon: EVENT_ICONS.squad_destroyed,
        message: '부대가 전멸했습니다!',
        className: styles.logTypeSquadDestroyed,
      };

    case 'general_skill':
      return {
        icon: EVENT_ICONS.general_skill,
        message: `${event.generalName}이(가) '${event.skill}'을(를) 발동합니다!`,
        className: styles.logTypeGeneralSkill,
      };

    case 'morale_change':
      const direction = event.newMorale > event.oldMorale ? '상승' : '하락';
      return {
        icon: EVENT_ICONS.morale_change,
        message: `사기가 ${direction}했습니다 (${Math.round(event.oldMorale)} → ${Math.round(event.newMorale)})`,
        className: styles.logTypeMoraleChange,
      };

    case 'formation_change':
      return {
        icon: EVENT_ICONS.formation_change,
        message: `진형 변경: ${event.oldFormation} → ${event.newFormation}`,
        className: '',
      };

    default:
      return {
        icon: '📋',
        message: '알 수 없는 이벤트',
        className: '',
      };
  }
}

function formatTimestamp(elapsedMs: number, eventTimestamp: number): string {
  // 실제 게임 시간 기준으로 포맷팅 (초 단위)
  const seconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function BattleLog({
  maxVisible = 50,
  className,
  defaultCollapsed = false,
}: BattleLogProps) {
  const events = useVoxelBattleStore(selectEvents);
  const elapsedTime = useVoxelBattleStore(selectElapsedTime);
  const listRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [autoScroll, setAutoScroll] = useState(true);

  // 최근 이벤트만 표시 (단, unit_killed는 너무 많으면 제한)
  const filteredEvents = useMemo(() => {
    // unit_killed 이벤트는 최근 5개만 표시
    const unitKilledEvents = events.filter(e => e.type === 'unit_killed').slice(-5);
    const otherEvents = events.filter(e => e.type !== 'unit_killed');
    
    // 다른 이벤트와 최근 unit_killed 합치기
    const combined = [...otherEvents, ...unitKilledEvents]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-maxVisible);
    
    return combined;
  }, [events, maxVisible]);

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && listRef.current && !collapsed) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [filteredEvents, autoScroll, collapsed]);

  // 스크롤 이벤트 핸들러 (수동 스크롤 시 자동 스크롤 비활성화)
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  }, []);

  // 접기/펼치기 토글
  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  return (
    <div className={`${styles.battleLogContainer} ${className ?? ''}`}>
      <motion.div
        className={styles.battleLogPanel}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* 헤더 */}
        <div className={styles.battleLogHeader}>
          <span className={styles.battleLogTitle}>전투 로그</span>
          <button
            className={styles.battleLogCollapseBtn}
            onClick={toggleCollapse}
            title={collapsed ? '펼치기' : '접기'}
          >
            {collapsed ? '▼' : '▲'}
          </button>
        </div>

        {/* 로그 목록 */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              ref={listRef}
              className={styles.battleLogList}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onScroll={handleScroll}
            >
              {filteredEvents.length === 0 ? (
                <div className={styles.battleLogItem}>
                  <span className={styles.logMessage} style={{ color: 'var(--overlay-text-muted)' }}>
                    전투 이벤트가 없습니다
                  </span>
                </div>
              ) : (
                filteredEvents.map((event, index) => {
                  const formatted = formatEvent(event);
                  return (
                    <motion.div
                      key={event.id}
                      className={styles.battleLogItem}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                    >
                      <span className={styles.logTimestamp}>
                        {formatTimestamp(elapsedTime, event.timestamp)}
                      </span>
                      <span className={styles.logIcon}>{formatted.icon}</span>
                      <span className={`${styles.logMessage} ${formatted.className}`}>
                        {formatted.message}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 토스트 스타일 로그 (중요 이벤트용)
// ============================================================================

export function BattleLogToast({
  events,
  maxVisible = 3,
  duration = 4000,
}: {
  events: BattleEvent[];
  maxVisible?: number;
  duration?: number;
}) {
  const [visibleEvents, setVisibleEvents] = useState<BattleEvent[]>([]);

  useEffect(() => {
    // 중요 이벤트만 필터링
    const importantEvents = events.filter(
      e =>
        e.type === 'battle_start' ||
        e.type === 'battle_end' ||
        e.type === 'squad_destroyed' ||
        e.type === 'general_skill'
    );

    setVisibleEvents(importantEvents.slice(-maxVisible));

    // 자동 제거 타이머
    const timers = importantEvents.map(event =>
      setTimeout(() => {
        setVisibleEvents(prev => prev.filter(e => e.id !== event.id));
      }, duration)
    );

    return () => timers.forEach(clearTimeout);
  }, [events, maxVisible, duration]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
        zIndex: 150,
      }}
    >
      <AnimatePresence>
        {visibleEvents.map(event => {
          const formatted = formatEvent(event);
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'var(--overlay-bg-solid)',
                border: '1px solid var(--overlay-border)',
                borderRadius: 8,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <span style={{ fontSize: 20 }}>{formatted.icon}</span>
              <span
                className={formatted.className}
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                {formatted.message}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// 전투 요약 (결과 화면용)
// ============================================================================

export function BattleLogSummary({ events }: { events: BattleEvent[] }) {
  const summary = useMemo(() => {
    const kills = events.filter(e => e.type === 'unit_killed').length;
    const routing = events.filter(e => e.type === 'squad_routing').length;
    const destroyed = events.filter(e => e.type === 'squad_destroyed').length;
    const skills = events.filter(e => e.type === 'general_skill').length;

    return { kills, routing, destroyed, skills };
  }, [events]);

  return (
    <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
      <span>💀 전사: {summary.kills}</span>
      <span>🏃 패주: {summary.routing}</span>
      <span>☠️ 전멸: {summary.destroyed}</span>
      <span>✨ 스킬: {summary.skills}</span>
    </div>
  );
}





