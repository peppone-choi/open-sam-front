'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { BattleState, BattleUnit, BattleLogEntry } from './TurnBasedBattleMap';
import styles from './BattleControls.module.css';

// ===== Props 타입 =====
interface BattleControlsProps {
  battleState: BattleState;
  selectedUnit: BattleUnit | null;
  onMove?: () => void;
  onAttack?: () => void;
  onWait?: () => void;
  onEndTurn?: () => void;
  onAutoPlay?: () => void;
  onSpeedChange?: (speed: number) => void;
  isAutoPlaying?: boolean;
  speed?: number;
}

interface BattleLogPanelProps {
  logs: BattleLogEntry[];
  maxHeight?: number;
}

// ===== 로그 아이콘 매핑 =====
const LOG_ICONS: Record<string, string> = {
  phase: '🏁',
  move: '🚶',
  attack: '⚔️',
  damage: '💥',
  critical: '⭐',
  evade: '💨',
  death: '💀',
  info: 'ℹ️',
};

// ===== 로그 색상 매핑 =====
const LOG_COLORS: Record<string, string> = {
  phase: '#ffd700',
  move: '#4287f5',
  attack: '#ff6b6b',
  damage: '#ff4444',
  critical: '#ffd700',
  evade: '#87ceeb',
  death: '#888',
  info: '#aaa',
};

// ===== 전투 로그 패널 =====
export function BattleLogPanel({ logs, maxHeight = 200 }: BattleLogPanelProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 10;
    setAutoScroll(isAtBottom);
  }, []);

  // 로그 텍스트 파싱 (컬러 태그 지원)
  const parseLogText = (text: string): React.ReactNode => {
    const colorMap: Record<string, string> = {
      'Y': '#ffcc00',
      'C': '#00ccff',
      'R': '#ff4444',
      'G': '#44ff44',
      'M': '#ff44ff',
      'S': '#ff8800',
      'W': '#ffffff',
      'B': '#4488ff',
    };

    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const match = remaining.match(/<([YCRGMSWB])>(.*?)<\/>/);
      if (match) {
        const index = match.index!;
        if (index > 0) {
          parts.push(<span key={key++}>{remaining.substring(0, index)}</span>);
        }
        const color = colorMap[match[1]] || '#ffffff';
        parts.push(
          <span key={key++} style={{ color }}>
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
  };

  return (
    <div className={`${styles.logPanel} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.logHeader}>
        <span className={styles.logTitle}>📜 전투 로그</span>
        <div className={styles.logControls}>
          <button
            className={`${styles.logBtn} ${autoScroll ? styles.active : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
            title="자동 스크롤"
          >
            ⬇️
          </button>
          <button
            className={styles.logBtn}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? '축소' : '확대'}
          >
            {isExpanded ? '📥' : '📤'}
          </button>
        </div>
      </div>
      <div
        ref={logContainerRef}
        className={styles.logContainer}
        style={{ maxHeight: isExpanded ? 400 : maxHeight }}
        onScroll={handleScroll}
      >
        {logs.length === 0 ? (
          <div className={styles.emptyLog}>전투 로그가 없습니다.</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.id || index}
              className={`${styles.logEntry} ${styles[`log_${log.type}`]}`}
              style={{ borderLeftColor: LOG_COLORS[log.type] || '#666' }}
            >
              <span className={styles.logIcon}>{LOG_ICONS[log.type] || '•'}</span>
              <span className={styles.logText}>{parseLogText(log.text)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ===== 메인 컨트롤 패널 =====
export default function BattleControls({
  battleState,
  selectedUnit,
  onMove,
  onAttack,
  onWait,
  onEndTurn,
  onAutoPlay,
  onSpeedChange,
  isAutoPlaying = false,
  speed = 1,
}: BattleControlsProps) {
  const canAct = selectedUnit && !selectedUnit.hasActed && battleState.phase === 'player';
  const canMove = selectedUnit && !selectedUnit.hasMoved && battleState.phase === 'player';

  // 유닛 통계
  const allyUnits = battleState.units.filter(u => !u.isEnemy);
  const enemyUnits = battleState.units.filter(u => u.isEnemy);
  const allyAlive = allyUnits.filter(u => u.hp > 0).length;
  const enemyAlive = enemyUnits.filter(u => u.hp > 0).length;

  return (
    <div className={styles.controlsPanel}>
      {/* 전투 상태 요약 */}
      <div className={styles.battleSummary}>
        <div className={styles.teamSummary}>
          <div className={`${styles.teamBox} ${styles.ally}`}>
            <span className={styles.teamLabel}>아군</span>
            <span className={styles.teamCount}>
              {allyAlive}/{allyUnits.length}
            </span>
          </div>
          <div className={styles.vsBox}>VS</div>
          <div className={`${styles.teamBox} ${styles.enemy}`}>
            <span className={styles.teamLabel}>적군</span>
            <span className={styles.teamCount}>
              {enemyAlive}/{enemyUnits.length}
            </span>
          </div>
        </div>
      </div>

      {/* 선택된 유닛 정보 (간략) */}
      {selectedUnit && (
        <div className={styles.selectedInfo}>
          <div className={styles.selectedName}>{selectedUnit.generalName}</div>
          <div className={styles.selectedStatus}>
            {selectedUnit.hasMoved && <span className={styles.statusBadge}>이동완료</span>}
            {selectedUnit.hasActed && <span className={styles.statusBadge}>행동완료</span>}
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className={styles.actionSection}>
        <div className={styles.actionRow}>
          <button
            className={`${styles.actionBtn} ${styles.moveBtn}`}
            onClick={onMove}
            disabled={!canMove}
          >
            <span className={styles.btnIcon}>🚶</span>
            <span className={styles.btnText}>이동</span>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.attackBtn}`}
            onClick={onAttack}
            disabled={!canAct}
          >
            <span className={styles.btnIcon}>⚔️</span>
            <span className={styles.btnText}>공격</span>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.waitBtn}`}
            onClick={onWait}
            disabled={!selectedUnit}
          >
            <span className={styles.btnIcon}>⏸️</span>
            <span className={styles.btnText}>대기</span>
          </button>
        </div>
      </div>

      {/* 턴 컨트롤 */}
      <div className={styles.turnSection}>
        <button
          className={`${styles.turnBtn} ${styles.endTurnBtn}`}
          onClick={onEndTurn}
          disabled={battleState.phase !== 'player'}
        >
          <span className={styles.btnIcon}>⏭️</span>
          <span className={styles.btnText}>턴 종료</span>
        </button>
        <button
          className={`${styles.turnBtn} ${styles.autoBtn} ${isAutoPlaying ? styles.active : ''}`}
          onClick={onAutoPlay}
        >
          <span className={styles.btnIcon}>{isAutoPlaying ? '⏹️' : '▶️'}</span>
          <span className={styles.btnText}>{isAutoPlaying ? '중지' : '자동 전투'}</span>
        </button>
      </div>

      {/* 속도 조절 */}
      <div className={styles.speedSection}>
        <span className={styles.speedLabel}>속도:</span>
        <div className={styles.speedButtons}>
          {[0.5, 1, 2, 4].map(s => (
            <button
              key={s}
              className={`${styles.speedBtn} ${speed === s ? styles.active : ''}`}
              onClick={() => onSpeedChange?.(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* 전투 로그 */}
      <BattleLogPanel logs={battleState.logs} />

      {/* 승패 표시 */}
      {battleState.winner && (
        <div className={`${styles.winnerOverlay} ${styles[battleState.winner]}`}>
          <div className={styles.winnerText}>
            {battleState.winner === 'player' ? '🏆 승리!' : '💔 패배...'}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 빠른 액션 바 (모바일용) =====
export function QuickActionBar({
  battleState,
  selectedUnit,
  onMove,
  onAttack,
  onWait,
  onEndTurn,
}: {
  battleState: BattleState;
  selectedUnit: BattleUnit | null;
  onMove?: () => void;
  onAttack?: () => void;
  onWait?: () => void;
  onEndTurn?: () => void;
}) {
  const canAct = selectedUnit && !selectedUnit.hasActed && battleState.phase === 'player';
  const canMove = selectedUnit && !selectedUnit.hasMoved && battleState.phase === 'player';

  return (
    <div className={styles.quickBar}>
      <button
        className={`${styles.quickBtn} ${styles.moveBtn}`}
        onClick={onMove}
        disabled={!canMove}
      >
        🚶
      </button>
      <button
        className={`${styles.quickBtn} ${styles.attackBtn}`}
        onClick={onAttack}
        disabled={!canAct}
      >
        ⚔️
      </button>
      <button
        className={`${styles.quickBtn} ${styles.waitBtn}`}
        onClick={onWait}
        disabled={!selectedUnit}
      >
        ⏸️
      </button>
      <button
        className={`${styles.quickBtn} ${styles.endTurnBtn}`}
        onClick={onEndTurn}
        disabled={battleState.phase !== 'player'}
      >
        ⏭️
      </button>
    </div>
  );
}

// ===== 전투 결과 모달 =====
export function BattleResultModal({
  winner,
  allyStats,
  enemyStats,
  onClose,
  onReplay,
}: {
  winner: 'player' | 'enemy';
  allyStats: { total: number; alive: number; killed: number };
  enemyStats: { total: number; alive: number; killed: number };
  onClose?: () => void;
  onReplay?: () => void;
}) {
  return (
    <div className={styles.resultModal}>
      <div className={styles.resultContent}>
        <div className={`${styles.resultHeader} ${styles[winner]}`}>
          <span className={styles.resultIcon}>{winner === 'player' ? '🏆' : '💔'}</span>
          <span className={styles.resultTitle}>
            {winner === 'player' ? '승리!' : '패배...'}
          </span>
        </div>

        <div className={styles.resultStats}>
          <div className={styles.statColumn}>
            <div className={styles.statHeader}>아군</div>
            <div className={styles.statItem}>
              <span>생존</span>
              <span className={styles.statValue}>{allyStats.alive}/{allyStats.total}</span>
            </div>
            <div className={styles.statItem}>
              <span>격파</span>
              <span className={styles.statValue} style={{ color: '#4caf50' }}>{allyStats.killed}</span>
            </div>
          </div>
          <div className={styles.statColumn}>
            <div className={styles.statHeader}>적군</div>
            <div className={styles.statItem}>
              <span>생존</span>
              <span className={styles.statValue}>{enemyStats.alive}/{enemyStats.total}</span>
            </div>
            <div className={styles.statItem}>
              <span>격파</span>
              <span className={styles.statValue} style={{ color: '#f44336' }}>{enemyStats.killed}</span>
            </div>
          </div>
        </div>

        <div className={styles.resultButtons}>
          <button className={styles.resultBtn} onClick={onReplay}>
            🔄 다시하기
          </button>
          <button className={`${styles.resultBtn} ${styles.primary}`} onClick={onClose}>
            ✓ 확인
          </button>
        </div>
      </div>
    </div>
  );
}




