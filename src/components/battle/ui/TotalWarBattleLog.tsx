'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './TotalWarBattleLog.module.css';

// ===== 타입 정의 =====
export type BattleLogType =
  | 'engagement'    // 부대 교전 시작
  | 'casualty'      // 사상자 발생
  | 'kill'          // 장수 처치
  | 'rout'          // 부대 탈주
  | 'rally'         // 부대 재집결
  | 'ability'       // 특수 능력 사용
  | 'formation'     // 진형 변경
  | 'charge'        // 돌격
  | 'flank'         // 측면 공격
  | 'morale'        // 사기 변동
  | 'destroyed'     // 부대 전멸
  | 'victory'       // 승리
  | 'system';       // 시스템 메시지

export interface BattleLogEntry {
  id: string;
  type: BattleLogType;
  timestamp: number; // 전투 시작부터의 ms
  text: string;
  teamId?: 'attacker' | 'defender';
  squadId?: string;
  importance?: 'low' | 'normal' | 'high' | 'critical';
  details?: {
    attackerName?: string;
    defenderName?: string;
    casualties?: number;
    abilityName?: string;
    moraleChange?: number;
  };
}

export interface TotalWarBattleLogProps {
  logs: BattleLogEntry[];
  currentTime: number;
  onLogClick?: (log: BattleLogEntry) => void;
  maxHeight?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showTimestamps?: boolean;
  filterTypes?: BattleLogType[];
}

// ===== 상수 =====
const LOG_TYPE_CONFIG: Record<BattleLogType, {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
}> = {
  engagement: { icon: '⚔️', color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.15)', label: '교전' },
  casualty: { icon: '💀', color: '#f44336', bgColor: 'rgba(244, 67, 54, 0.15)', label: '피해' },
  kill: { icon: '👑', color: '#e91e63', bgColor: 'rgba(233, 30, 99, 0.15)', label: '처치' },
  rout: { icon: '🏃', color: '#9e9e9e', bgColor: 'rgba(158, 158, 158, 0.15)', label: '탈주' },
  rally: { icon: '📣', color: '#4caf50', bgColor: 'rgba(76, 175, 80, 0.15)', label: '집결' },
  ability: { icon: '✨', color: '#9c27b0', bgColor: 'rgba(156, 39, 176, 0.15)', label: '능력' },
  formation: { icon: '🔄', color: '#2196f3', bgColor: 'rgba(33, 150, 243, 0.15)', label: '진형' },
  charge: { icon: '⚡', color: '#ffc107', bgColor: 'rgba(255, 193, 7, 0.15)', label: '돌격' },
  flank: { icon: '↪️', color: '#ff5722', bgColor: 'rgba(255, 87, 34, 0.15)', label: '측면' },
  morale: { icon: '💪', color: '#673ab7', bgColor: 'rgba(103, 58, 183, 0.15)', label: '사기' },
  destroyed: { icon: '💥', color: '#b71c1c', bgColor: 'rgba(183, 28, 28, 0.15)', label: '전멸' },
  victory: { icon: '🏆', color: '#ffd700', bgColor: 'rgba(255, 215, 0, 0.2)', label: '승리' },
  system: { icon: 'ℹ️', color: '#607d8b', bgColor: 'rgba(96, 125, 139, 0.15)', label: '시스템' },
};

const IMPORTANCE_STYLES: Record<string, { fontSize: string; fontWeight: string }> = {
  low: { fontSize: '11px', fontWeight: 'normal' },
  normal: { fontSize: '12px', fontWeight: 'normal' },
  high: { fontSize: '13px', fontWeight: 'bold' },
  critical: { fontSize: '14px', fontWeight: 'bold' },
};

// ===== 유틸 함수 =====
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function parseLogText(text: string): React.ReactNode {
  // 컬러 태그 파싱: <Y>노란색</>, <R>빨간색</>, <B>파란색</>, <G>녹색</> 등
  const colorMap: Record<string, string> = {
    'Y': '#ffd700',
    'C': '#00ccff',
    'R': '#ff4444',
    'G': '#44ff44',
    'M': '#ff44ff',
    'S': '#ff8800',
    'W': '#ffffff',
    'B': '#4488ff',
    'P': '#aa44ff',
  };

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const match = remaining.match(/<([YCRGMSWBP])>(.*?)<\/>/);
    if (match) {
      const index = match.index!;
      if (index > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, index)}</span>);
      }
      const color = colorMap[match[1]] || '#ffffff';
      parts.push(
        <span key={key++} style={{ color, fontWeight: 'bold' }}>
          {match[2]}
        </span>
      );
      remaining = remaining.substring(index + match[0].length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return <>{parts}</>;
}

// ===== 서브 컴포넌트 =====
function LogEntry({
  log,
  onClick,
  showTimestamp,
  isNew,
}: {
  log: BattleLogEntry;
  onClick?: () => void;
  showTimestamp: boolean;
  isNew: boolean;
}) {
  const config = LOG_TYPE_CONFIG[log.type];
  const importanceStyle = IMPORTANCE_STYLES[log.importance || 'normal'];

  return (
    <motion.div
      className={`${styles.logEntry} ${log.importance === 'critical' ? styles.critical : ''}`}
      style={{
        borderLeftColor: config.color,
        backgroundColor: config.bgColor,
        ...importanceStyle,
      }}
      onClick={onClick}
      initial={isNew ? { opacity: 0, x: -20, scale: 0.95 } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
    >
      <span className={styles.logIcon}>{config.icon}</span>
      
      {showTimestamp && (
        <span className={styles.logTime}>{formatTime(log.timestamp)}</span>
      )}
      
      <span className={styles.logText}>
        {parseLogText(log.text)}
      </span>
      
      {log.teamId && (
        <span
          className={styles.teamIndicator}
          style={{
            backgroundColor: log.teamId === 'attacker' ? '#4a9eff' : '#ff4a4a',
          }}
        />
      )}
    </motion.div>
  );
}

function FilterButton({
  type,
  isActive,
  onClick,
}: {
  type: BattleLogType;
  isActive: boolean;
  onClick: () => void;
}) {
  const config = LOG_TYPE_CONFIG[type];
  
  return (
    <button
      className={`${styles.filterBtn} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      title={config.label}
      style={{
        borderColor: isActive ? config.color : undefined,
        color: isActive ? config.color : undefined,
      }}
    >
      {config.icon}
    </button>
  );
}

// ===== 메인 컴포넌트 =====
export default function TotalWarBattleLog({
  logs,
  currentTime,
  onLogClick,
  maxHeight = 400,
  collapsed = false,
  onToggleCollapse,
  showTimestamps = true,
  filterTypes,
}: TotalWarBattleLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [localFilters, setLocalFilters] = useState<Set<BattleLogType>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [prevLogCount, setPrevLogCount] = useState(logs.length);

  // 새 로그 감지
  const newLogIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (logs.length > prevLogCount) {
      const newLogs = logs.slice(prevLogCount);
      newLogs.forEach(log => newLogIds.current.add(log.id));
      
      // 3초 후 "new" 상태 제거
      setTimeout(() => {
        newLogs.forEach(log => newLogIds.current.delete(log.id));
      }, 3000);
    }
    setPrevLogCount(logs.length);
  }, [logs.length, prevLogCount]);

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 30;
    setAutoScroll(isAtBottom);
  }, []);

  // 필터 토글
  const toggleFilter = useCallback((type: BattleLogType) => {
    setLocalFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(type)) {
        newFilters.delete(type);
      } else {
        newFilters.add(type);
      }
      return newFilters;
    });
  }, []);

  // 필터링된 로그
  const filteredLogs = logs.filter(log => {
    if (filterTypes && filterTypes.length > 0) {
      return filterTypes.includes(log.type);
    }
    if (localFilters.size > 0) {
      return localFilters.has(log.type);
    }
    return true;
  });

  // 로그 통계
  const logStats = {
    total: logs.length,
    critical: logs.filter(l => l.importance === 'critical').length,
    casualties: logs.filter(l => l.type === 'casualty').reduce(
      (acc, l) => acc + (l.details?.casualties || 0),
      0
    ),
  };

  return (
    <div className={`${styles.container} ${collapsed ? styles.collapsed : ''}`}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>📜 전투 기록</span>
          <span className={styles.logCount}>({filteredLogs.length})</span>
        </div>
        
        <div className={styles.headerRight}>
          <span className={styles.battleTime}>{formatTime(currentTime)}</span>
          
          <button
            className={`${styles.headerBtn} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="필터"
          >
            🔍
          </button>
          
          <button
            className={`${styles.headerBtn} ${autoScroll ? styles.active : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
            title="자동 스크롤"
          >
            ⬇️
          </button>
          
          {onToggleCollapse && (
            <button
              className={styles.headerBtn}
              onClick={onToggleCollapse}
              title={collapsed ? '펼치기' : '접기'}
            >
              {collapsed ? '📤' : '📥'}
            </button>
          )}
        </div>
      </div>

      {/* 필터 바 */}
      <AnimatePresence>
        {showFilters && !collapsed && (
          <motion.div
            className={styles.filterBar}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className={styles.filterButtons}>
              {(Object.keys(LOG_TYPE_CONFIG) as BattleLogType[]).map(type => (
                <FilterButton
                  key={type}
                  type={type}
                  isActive={localFilters.size === 0 || localFilters.has(type)}
                  onClick={() => toggleFilter(type)}
                />
              ))}
            </div>
            <button
              className={styles.clearFilters}
              onClick={() => setLocalFilters(new Set())}
            >
              전체
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 통계 바 (축소 시 표시) */}
      {collapsed && (
        <div className={styles.statsBar}>
          <span>이벤트: {logStats.total}</span>
          <span>중요: {logStats.critical}</span>
          {logStats.casualties > 0 && (
            <span className={styles.casualtyStat}>💀 {logStats.casualties}</span>
          )}
        </div>
      )}

      {/* 로그 목록 */}
      {!collapsed && (
        <div
          ref={containerRef}
          className={styles.logList}
          style={{ maxHeight }}
          onScroll={handleScroll}
        >
          {filteredLogs.length === 0 ? (
            <div className={styles.emptyLog}>
              <span className={styles.emptyIcon}>📋</span>
              <span>전투 기록이 없습니다</span>
            </div>
          ) : (
            filteredLogs.map(log => (
              <LogEntry
                key={log.id}
                log={log}
                onClick={() => onLogClick?.(log)}
                showTimestamp={showTimestamps}
                isNew={newLogIds.current.has(log.id)}
              />
            ))
          )}
        </div>
      )}

      {/* 자동 스크롤 인디케이터 */}
      {!collapsed && !autoScroll && filteredLogs.length > 5 && (
        <button
          className={styles.scrollToBottom}
          onClick={() => {
            setAutoScroll(true);
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }}
        >
          ⬇️ 최신 로그
        </button>
      )}

      {/* 동양적 코너 장식 */}
      <div className={`${styles.corner} ${styles.topLeft}`} />
      <div className={`${styles.corner} ${styles.topRight}`} />
      <div className={`${styles.corner} ${styles.bottomLeft}`} />
      <div className={`${styles.corner} ${styles.bottomRight}`} />
    </div>
  );
}

// ===== 컴팩트 로그 (팝업/토스트 스타일) =====
export function BattleLogToast({
  logs,
  maxItems = 5,
  onDismiss,
}: {
  logs: BattleLogEntry[];
  maxItems?: number;
  onDismiss?: (logId: string) => void;
}) {
  const recentLogs = logs.slice(-maxItems);

  return (
    <div className={styles.toastContainer}>
      <AnimatePresence>
        {recentLogs.map(log => {
          const config = LOG_TYPE_CONFIG[log.type];
          return (
            <motion.div
              key={log.id}
              className={styles.toast}
              style={{ borderLeftColor: config.color }}
              initial={{ opacity: 0, x: -50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <span className={styles.toastIcon}>{config.icon}</span>
              <span className={styles.toastText}>{parseLogText(log.text)}</span>
              {onDismiss && (
                <button
                  className={styles.toastDismiss}
                  onClick={() => onDismiss(log.id)}
                >
                  ✕
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ===== 로그 요약 패널 =====
export function BattleLogSummary({
  logs,
  attackerName = '공격측',
  defenderName = '방어측',
}: {
  logs: BattleLogEntry[];
  attackerName?: string;
  defenderName?: string;
}) {
  const stats = {
    attacker: {
      casualties: 0,
      kills: 0,
      abilities: 0,
      routs: 0,
    },
    defender: {
      casualties: 0,
      kills: 0,
      abilities: 0,
      routs: 0,
    },
  };

  logs.forEach(log => {
    const team = log.teamId;
    if (!team) return;

    if (log.type === 'casualty') {
      const oppositeTeam = team === 'attacker' ? 'defender' : 'attacker';
      stats[oppositeTeam].casualties += log.details?.casualties || 0;
    }
    if (log.type === 'kill') {
      stats[team].kills += 1;
    }
    if (log.type === 'ability') {
      stats[team].abilities += 1;
    }
    if (log.type === 'rout') {
      stats[team].routs += 1;
    }
  });

  return (
    <div className={styles.summaryPanel}>
      <h4 className={styles.summaryTitle}>전투 요약</h4>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryColumn}>
          <span className={styles.teamLabel} style={{ color: '#4a9eff' }}>
            {attackerName}
          </span>
          <div className={styles.summaryStats}>
            <span>💀 {stats.defender.casualties} 처치</span>
            <span>👑 {stats.attacker.kills} 장수</span>
            <span>✨ {stats.attacker.abilities} 능력</span>
            <span>🏃 {stats.defender.routs} 탈주</span>
          </div>
        </div>
        <div className={styles.summaryColumn}>
          <span className={styles.teamLabel} style={{ color: '#ff4a4a' }}>
            {defenderName}
          </span>
          <div className={styles.summaryStats}>
            <span>💀 {stats.attacker.casualties} 처치</span>
            <span>👑 {stats.defender.kills} 장수</span>
            <span>✨ {stats.defender.abilities} 능력</span>
            <span>🏃 {stats.attacker.routs} 탈주</span>
          </div>
        </div>
      </div>
    </div>
  );
}






