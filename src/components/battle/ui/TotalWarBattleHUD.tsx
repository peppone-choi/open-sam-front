'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BattleMinimap, { type MinimapUnit } from './BattleMinimap';
import TotalWarUnitCard, {
  UnitCardDeck,
  type TotalWarSquad,
  type TWFormationType,
  type TWStanceType,
} from './TotalWarUnitCard';
import TotalWarBattleLog, {
  BattleLogToast,
  BattleLogSummary,
  type BattleLogEntry,
} from './TotalWarBattleLog';
import styles from './TotalWarBattleHUD.module.css';

// ===== 타입 정의 =====
export interface TeamStats {
  name: string;
  totalSoldiers: number;
  aliveSoldiers: number;
  kills: number;
  color: string;
}

export interface BattleState {
  phase: 'preparing' | 'running' | 'paused' | 'ended';
  battleTime: number; // ms
  speed: number;
  winner?: 'attacker' | 'defender' | null;
}

// ★ 전황 점수
export interface BattleScore {
  attackerScore: number;  // 0~100
  defenderScore: number;  // 0~100
  momentum: number;       // -100~100
}

export interface TotalWarBattleHUDProps {
  // 전투 상태
  battleState: BattleState;
  
  // ★ 전황 점수
  battleScore?: BattleScore;
  
  // 팀 정보
  attackerStats: TeamStats;
  defenderStats: TeamStats;
  
  // 부대 목록
  squads: TotalWarSquad[];
  selectedSquadId: string | null;
  
  // 미니맵 데이터
  mapSize: { width: number; height: number };
  viewBox: { x: number; z: number; width: number; height: number };
  
  // 전투 로그
  logs: BattleLogEntry[];
  
  // 이벤트 핸들러
  onSquadSelect?: (squadId: string | null) => void;
  onFormationChange?: (squadId: string, formation: TWFormationType) => void;
  onStanceChange?: (squadId: string, stance: TWStanceType) => void;
  onAbilityUse?: (squadId: string, abilityId: string) => void;
  onCameraMove?: (x: number, z: number) => void;
  
  // 전투 컨트롤
  onStartBattle?: () => void;
  onPauseBattle?: () => void;
  onResumeBattle?: () => void;
  onSpeedChange?: (speed: number) => void;
  
  // UI 옵션
  showMinimap?: boolean;
  showUnitCard?: boolean;
  showBattleLog?: boolean;
  showUnitDeck?: boolean;
  showTopHUD?: boolean;
  minimapSize?: number;
}

// ===== 유틸 함수 =====
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ===== 서브 컴포넌트 =====
function TopHUD({
  attackerStats,
  defenderStats,
  battleTime,
  battleState,
  battleScore,
}: {
  attackerStats: TeamStats;
  defenderStats: TeamStats;
  battleTime: number;
  battleState: BattleState['phase'];
  battleScore?: BattleScore;
}) {
  const attackerRatio = attackerStats.totalSoldiers > 0
    ? (attackerStats.aliveSoldiers / attackerStats.totalSoldiers) * 100
    : 0;
  const defenderRatio = defenderStats.totalSoldiers > 0
    ? (defenderStats.aliveSoldiers / defenderStats.totalSoldiers) * 100
    : 0;

  return (
    <div className={styles.topHud}>
      {/* 공격측 */}
      <div className={styles.teamPanel}>
        <div
          className={styles.teamBanner}
          style={{ borderColor: attackerStats.color }}
        >
          <span className={styles.teamName}>{attackerStats.name}</span>
          <div className={styles.teamSoldiers}>
            <span className={styles.soldierCount}>
              {attackerStats.aliveSoldiers.toLocaleString()}
            </span>
            <span className={styles.soldierTotal}>
              / {attackerStats.totalSoldiers.toLocaleString()}
            </span>
          </div>
          <div className={styles.teamBarTrack}>
            <motion.div
              className={styles.teamBarFill}
              style={{ backgroundColor: attackerStats.color }}
              animate={{ width: `${attackerRatio}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className={styles.killCount}>
            💀 처치: {attackerStats.kills}
          </span>
        </div>
      </div>

      {/* 중앙 시계 + 전황 게이지 */}
      <div className={styles.centerPanel}>
        <div className={styles.battleTimer}>
          <span className={styles.timerIcon}>⏱</span>
          <span className={styles.timerValue}>{formatTime(battleTime)}</span>
        </div>
        
        {/* ★ 전황 게이지 (줄다리기) */}
        {battleScore && (
          <div className={styles.battleScoreContainer}>
            <div className={styles.battleScoreBar}>
              <motion.div
                className={styles.attackerScoreFill}
                style={{ backgroundColor: attackerStats.color }}
                animate={{ width: `${battleScore.attackerScore}%` }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className={styles.defenderScoreFill}
                style={{ backgroundColor: defenderStats.color }}
                animate={{ width: `${battleScore.defenderScore}%` }}
                transition={{ duration: 0.3 }}
              />
              <div className={styles.battleScoreCenter}>
                <span className={styles.momentumIndicator}>
                  {battleScore.momentum > 10 ? '▶▶' : battleScore.momentum < -10 ? '◀◀' : '◆'}
                </span>
              </div>
            </div>
            <div className={styles.battleScoreLabels}>
              <span style={{ color: attackerStats.color }}>
                {Math.round(battleScore.attackerScore)}
              </span>
              <span className={styles.battleScoreTitle}>전황</span>
              <span style={{ color: defenderStats.color }}>
                {Math.round(battleScore.defenderScore)}
              </span>
            </div>
          </div>
        )}
        
        {battleState !== 'running' && (
          <span
            className={`${styles.battleStateTag} ${styles[battleState]}`}
          >
            {battleState === 'preparing' && '배치 중'}
            {battleState === 'paused' && '일시정지'}
            {battleState === 'ended' && '전투 종료'}
          </span>
        )}
      </div>

      {/* 방어측 */}
      <div className={styles.teamPanel}>
        <div
          className={styles.teamBanner}
          style={{ borderColor: defenderStats.color }}
        >
          <span className={styles.teamName}>{defenderStats.name}</span>
          <div className={styles.teamSoldiers}>
            <span className={styles.soldierCount}>
              {defenderStats.aliveSoldiers.toLocaleString()}
            </span>
            <span className={styles.soldierTotal}>
              / {defenderStats.totalSoldiers.toLocaleString()}
            </span>
          </div>
          <div className={styles.teamBarTrack}>
            <motion.div
              className={styles.teamBarFill}
              style={{ backgroundColor: defenderStats.color }}
              animate={{ width: `${defenderRatio}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className={styles.killCount}>
            💀 처치: {defenderStats.kills}
          </span>
        </div>
      </div>
    </div>
  );
}

function BattleControls({
  battleState,
  speed,
  onStart,
  onPause,
  onResume,
  onSpeedChange,
}: {
  battleState: BattleState['phase'];
  speed: number;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onSpeedChange?: (speed: number) => void;
}) {
  return (
    <div className={styles.battleControls}>
      {battleState === 'preparing' && (
        <button className={styles.startBtn} onClick={onStart}>
          <span className={styles.btnIcon}>⚔️</span>
          <span className={styles.btnText}>전투 시작</span>
        </button>
      )}

      {battleState === 'running' && (
        <button className={styles.pauseBtn} onClick={onPause}>
          <span className={styles.btnIcon}>⏸️</span>
          <span className={styles.btnText}>일시정지</span>
        </button>
      )}

      {battleState === 'paused' && (
        <button className={styles.resumeBtn} onClick={onResume}>
          <span className={styles.btnIcon}>▶️</span>
          <span className={styles.btnText}>재개</span>
        </button>
      )}

      {(battleState === 'running' || battleState === 'paused') && (
        <div className={styles.speedControl}>
          <span className={styles.speedLabel}>속도:</span>
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
      )}
    </div>
  );
}

function VictoryBanner({ winner }: { winner: 'attacker' | 'defender' }) {
  return (
    <motion.div
      className={styles.victoryOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={styles.victoryBanner}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
      >
        <span className={styles.victoryIcon}>🏆</span>
        <span className={styles.victoryText}>
          {winner === 'attacker' ? '공격측' : '방어측'} 승리!
        </span>
        <div className={styles.victoryGlow} />
      </motion.div>
    </motion.div>
  );
}

// ===== 메인 컴포넌트 =====
export default function TotalWarBattleHUD({
  battleState,
  battleScore,
  attackerStats,
  defenderStats,
  squads,
  selectedSquadId,
  mapSize,
  viewBox,
  logs,
  onSquadSelect,
  onFormationChange,
  onStanceChange,
  onAbilityUse,
  onCameraMove,
  onStartBattle,
  onPauseBattle,
  onResumeBattle,
  onSpeedChange,
  showMinimap = true,
  showUnitCard = true,
  showBattleLog = true,
  showUnitDeck = true,
  showTopHUD = true,
  minimapSize = 200,
}: TotalWarBattleHUDProps) {
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [recentLogs, setRecentLogs] = useState<BattleLogEntry[]>([]);

  // 선택된 부대
  const selectedSquad = useMemo(
    () => squads.find(s => s.id === selectedSquadId) || null,
    [squads, selectedSquadId]
  );

  // 아군 부대만 (부대 덱용)
  const allySquads = useMemo(
    () => squads.filter(s => s.teamId === 'attacker' && s.aliveSoldiers > 0),
    [squads]
  );

  // 미니맵용 유닛 데이터 변환
  const minimapUnits: MinimapUnit[] = useMemo(
    () =>
      squads.map(squad => ({
        id: squad.id,
        x: 0, // 실제 위치는 상위 컴포넌트에서 제공해야 함
        z: 0,
        teamId: squad.teamId,
        isSelected: squad.id === selectedSquadId,
        category: squad.category,
        aliveSoldiers: squad.aliveSoldiers,
        totalSoldiers: squad.totalSoldiers,
      })),
    [squads, selectedSquadId]
  );

  // 이벤트 핸들러
  const handleFormationChange = useCallback(
    (formation: TWFormationType) => {
      if (selectedSquadId && onFormationChange) {
        onFormationChange(selectedSquadId, formation);
      }
    },
    [selectedSquadId, onFormationChange]
  );

  const handleStanceChange = useCallback(
    (stance: TWStanceType) => {
      if (selectedSquadId && onStanceChange) {
        onStanceChange(selectedSquadId, stance);
      }
    },
    [selectedSquadId, onStanceChange]
  );

  const handleAbilityUse = useCallback(
    (abilityId: string) => {
      if (selectedSquadId && onAbilityUse) {
        onAbilityUse(selectedSquadId, abilityId);
      }
    },
    [selectedSquadId, onAbilityUse]
  );

  const handleLogDismiss = useCallback((logId: string) => {
    setRecentLogs(prev => prev.filter(l => l.id !== logId));
  }, []);

  return (
    <div className={styles.hudContainer}>
      {/* 상단 HUD */}
      {showTopHUD && (
        <TopHUD
          attackerStats={attackerStats}
          defenderStats={defenderStats}
          battleTime={battleState.battleTime}
          battleState={battleState.phase}
          battleScore={battleScore}
        />
      )}

      {/* 좌측 전투 로그 */}
      {showBattleLog && (
        <div className={styles.leftPanel}>
          <TotalWarBattleLog
            logs={logs}
            currentTime={battleState.battleTime}
            collapsed={logCollapsed}
            onToggleCollapse={() => setLogCollapsed(!logCollapsed)}
            maxHeight={350}
          />
        </div>
      )}

      {/* 우측 선택 유닛 카드 */}
      {showUnitCard && (
        <div className={styles.rightPanel}>
          <AnimatePresence mode="wait">
            <TotalWarUnitCard
              key={selectedSquadId || 'empty'}
              squad={selectedSquad}
              onFormationChange={handleFormationChange}
              onStanceChange={handleStanceChange}
              onAbilityUse={handleAbilityUse}
              showAbilities={true}
            />
          </AnimatePresence>
        </div>
      )}

      {/* 우하단 미니맵 */}
      {showMinimap && (
        <BattleMinimap
          mapSize={mapSize}
          viewBox={viewBox}
          units={minimapUnits}
          selectedUnitId={selectedSquadId}
          size={minimapSize}
          onCameraMove={onCameraMove}
          onUnitClick={(unitId) => onSquadSelect?.(unitId)}
        />
      )}

      {/* 하단 부대 덱 */}
      {showUnitDeck && allySquads.length > 0 && (
        <div className={styles.bottomPanel}>
          <UnitCardDeck
            squads={allySquads}
            selectedSquadId={selectedSquadId}
            onSquadSelect={(id) => onSquadSelect?.(id)}
          />
        </div>
      )}

      {/* 하단 중앙 전투 컨트롤 */}
      <BattleControls
        battleState={battleState.phase}
        speed={battleState.speed}
        onStart={onStartBattle}
        onPause={onPauseBattle}
        onResume={onResumeBattle}
        onSpeedChange={onSpeedChange}
      />

      {/* 로그 토스트 (중요 이벤트) */}
      {recentLogs.length > 0 && (
        <BattleLogToast logs={recentLogs} onDismiss={handleLogDismiss} />
      )}

      {/* 승리 배너 */}
      <AnimatePresence>
        {battleState.winner && (
          <VictoryBanner winner={battleState.winner} />
        )}
      </AnimatePresence>

      {/* 단축키 도움말 */}
      <div className={styles.helpPanel}>
        <p>좌클릭: 부대 선택 | 우클릭: 이동/공격 명령</p>
        <p>마우스 휠: 줌 | 드래그: 회전</p>
      </div>
    </div>
  );
}

// ===== 간소화 버전 (모바일/데모용) =====
export function TotalWarBattleHUDCompact({
  attackerStats,
  defenderStats,
  battleTime,
  selectedSquad,
  onFormationChange,
  onStanceChange,
}: {
  attackerStats: TeamStats;
  defenderStats: TeamStats;
  battleTime: number;
  selectedSquad: TotalWarSquad | null;
  onFormationChange?: (formation: TWFormationType) => void;
  onStanceChange?: (stance: TWStanceType) => void;
}) {
  return (
    <div className={styles.compactHud}>
      {/* 상단 요약 */}
      <div className={styles.compactTop}>
        <span style={{ color: attackerStats.color }}>
          {attackerStats.aliveSoldiers}
        </span>
        <span className={styles.compactTime}>{formatTime(battleTime)}</span>
        <span style={{ color: defenderStats.color }}>
          {defenderStats.aliveSoldiers}
        </span>
      </div>

      {/* 선택 부대 */}
      {selectedSquad && (
        <TotalWarUnitCard
          squad={selectedSquad}
          onFormationChange={onFormationChange}
          onStanceChange={onStanceChange}
          compact
        />
      )}
    </div>
  );
}


