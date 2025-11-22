'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './TacticalMapPanel.module.css';
import { ThreeTacticalMapEngine } from '@/lib/tactical/threeTacticalMap';
import type { UnitInstance, UnitVisualConfig } from '@/lib/tactical/isoTacticalMap';


/**
 * 삼국지 전술맵 패널
 * - 전투 중: 실시간 전투 상황 표시
 * - 평화: 평화로운 성 이미지 표시
 */

interface BattleUnit {
  generalId: number;
  generalName: string;
  troops: number;
  maxTroops: number;
  position?: { x: number; y: number };
  velocity?: { x: number; y: number };
  facing?: number;
  unitType?: number;
  morale?: number;
  hp: number;
  maxHp: number;
  side: 'attacker' | 'defender';
}
 
interface BattleParticipant {

  generalId: number;
  role: 'FIELD_COMMANDER' | 'SUB_COMMANDER' | 'STAFF';
  controlledUnitGeneralIds?: number[];
}

interface BattleMapInfo {
  width: number;
  height: number;
}
 
interface BattleState {
  battleId: string;
  status: 'deploying' | 'in_progress' | 'completed';
  attackerUnits: BattleUnit[];
  defenderUnits: BattleUnit[];
  currentTurn: number;
  terrain: string;
  participants?: BattleParticipant[];
  map?: BattleMapInfo;
}


interface LogEntry {
  id: number;
  text: string;
  type: 'action' | 'damage' | 'status' | 'result' | 'general' | 'history';
  timestamp: Date;
}

interface Props {
  serverID: string;
  generalId?: number;
  cityId?: number;
  cityName?: string;
}

export default function TacticalMapPanel({ serverID, generalId, cityId, cityName }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeEngineRef = useRef<ThreeTacticalMapEngine | null>(null);
  const prevUnitsRef = useRef<Map<number, { troops: number; side: 'attacker' | 'defender'; position?: { x: number; y: number }; unitType?: any }>>(new Map());
 
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  const [isInBattle, setIsInBattle] = useState(false);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  
  const canvasWidth = 740;
  const canvasHeight = 500;

  const myParticipant = React.useMemo(() => {
    if (!battleState || !generalId) return null;
    return battleState.participants?.find((p) => p.generalId === generalId) ?? null;
  }, [battleState, generalId]);

  const myRole = myParticipant?.role ?? null;

  // three 전술맵 엔진 생성/정리
  useEffect(() => {
    if (!isInBattle) {
      if (threeEngineRef.current) {
        threeEngineRef.current.destroy();
        threeEngineRef.current = null;
      }
      return;
    }

    const canvas = threeCanvasRef.current;
    if (!canvas) return;

    const engine = new ThreeTacticalMapEngine({
      canvas,
      width: canvasWidth,
      height: canvasHeight,
      logicalWidth: 40,
      logicalHeight: 40,
    });
    threeEngineRef.current = engine;

    return () => {
      engine.destroy();
      if (threeEngineRef.current === engine) {
        threeEngineRef.current = null;
      }
    };
  }, [isInBattle, canvasWidth, canvasHeight]);

  // 전투 상태 변경 시 three 전술맵 유닛/투사체 동기화
  useEffect(() => {
    const engine = threeEngineRef.current;
    if (!engine || !battleState || !isInBattle) return;

    const mapWidth = battleState.map?.width ?? 800;
    const mapHeight = battleState.map?.height ?? 600;

    const prev = prevUnitsRef.current;
    const curr = new Map<number, BattleUnit>();

    battleState.attackerUnits.forEach((u) => curr.set(u.generalId, { ...u, side: 'attacker' }));
    battleState.defenderUnits.forEach((u) => curr.set(u.generalId, { ...u, side: 'defender' }));

    // 병력 감소 감지 → 투사체 스폰
    curr.forEach((unit, generalId) => {
      const before = prev.get(generalId);
      if (!before) return;
      if (unit.troops >= before.troops || unit.troops <= 0) return;
      if (!unit.position) return;

      // 가장 가까운 적 유닛을 공격자로 추정
      const enemies = [...battleState.attackerUnits, ...battleState.defenderUnits]
        .filter((e) => e.side !== unit.side && e.troops > 0 && e.position);
      if (enemies.length === 0) return;

      let best: BattleUnit | null = null;
      let bestDist = Infinity;
      for (const e of enemies) {
        if (!e.position) continue;
        const dx = e.position.x - unit.position!.x;
        const dy = e.position.y - unit.position!.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) {
          bestDist = d2;
          best = e as any;
        }
      }
      if (!best || !best.position) return;

      const toGrid = worldToGrid(unit.position, unit.side, mapWidth, mapHeight);
      const fromGrid = worldToGrid(best.position, best.side as any, mapWidth, mapHeight);

      // 병종에 따라 아크 타입 추정
      const ut = (best as any).unitType;
      const arcType: 'flat' | 'high' =
        typeof ut === 'string' && (ut === 'ARCHER' || ut === 'WIZARD' || ut === 'SIEGE')
          ? 'high'
          : 'flat';

      const color = best.side === 'attacker' ? 0xffcc66 : 0x66ccff;
      engine.spawnProjectileGrid(fromGrid, toGrid, arcType, color);
    });

    // 현재 상태를 다음 비교를 위해 저장
    const nextPrev = new Map<number, { troops: number; side: 'attacker' | 'defender'; position?: { x: number; y: number }; unitType?: any }>();
    battleState.attackerUnits.forEach((u) => nextPrev.set(u.generalId, { troops: u.troops, side: 'attacker', position: u.position, unitType: u.unitType }));
    battleState.defenderUnits.forEach((u) => nextPrev.set(u.generalId, { troops: u.troops, side: 'defender', position: u.position, unitType: u.unitType }));
    prevUnitsRef.current = nextPrev;

    // 유닛 위치/방향 동기화
    const units = mapBattleStateToUnitInstances(battleState);
    units.forEach((u) => engine.upsertUnit(u));
  }, [battleState, isInBattle]);

 
 
  // Socket.IO
  const { socket, onBattleEvent, onLogUpdate } = useSocket({ sessionId: serverID, autoConnect: true });


  // 전투 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    // 전투 시작 핸들러
    const handleBattleStarted = (data: any) => {
      console.log('[TacticalMap] 전투 시작:', data);
      setIsInBattle(true);
      setBattleState(data);
    };

    // 전투 상태 업데이트 핸들러
    const handleBattleState = (data: any) => {
      console.log('[TacticalMap] 전투 상태 업데이트:', data);
      setBattleState(data);
    };

    // 전투 종료 핸들러
    const handleBattleEnded = (data: any) => {
      console.log('[TacticalMap] 전투 종료:', data);
      setIsInBattle(false);
      // 3초 후 전투 상태 초기화
      setTimeout(() => {
        setBattleState(null);
      }, 3000);
    };

    // 전투 로그 핸들러
    const handleBattleLog = (data: any) => {
      console.log('[TacticalMap] 전투 로그:', data.logText);
      addLog({
        id: Date.now(),
        text: data.logText,
        type: data.logType || 'action',
        timestamp: new Date(data.timestamp)
      });
    };

    // 게임 로그 핸들러
    const cleanupGameLog = onLogUpdate((data) => {
      addLog({
        id: data.logId,
        text: data.logText,
        type: data.logType === 'action' ? 'general' : 'history',
        timestamp: new Date(data.timestamp)
      });
    });

    // 이벤트 리스너 등록
    const cleanupStarted = onBattleEvent('started', handleBattleStarted);
    socket.on('battle:state', handleBattleState);
    const cleanupEnded = onBattleEvent('ended', handleBattleEnded);
    socket.on('battle:log', handleBattleLog);

    return () => {
      cleanupStarted();
      socket.off('battle:state', handleBattleState);
      cleanupEnded();
      socket.off('battle:log', handleBattleLog);
      cleanupGameLog();
    };
  }, [socket, onBattleEvent, onLogUpdate]);

  // 로그 추가 (최대 5개, 5초 후 페이드아웃)
  const addLog = (log: LogEntry) => {
    setRecentLogs(prev => {
      const newLogs = [log, ...prev].slice(0, 5);
      return newLogs;
    });

    // 5초 후 자동 제거
    setTimeout(() => {
      setRecentLogs(prev => prev.filter(l => l.id !== log.id));
    }, 5000);
  };

  // 캔버스 렌더링 (평시: 평화로운 성, 전투 중: three 캔버스 사용)
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    if (!isInBattle) {
      drawPeacefulCity(ctx, canvasWidth, canvasHeight, cityName);
    }
  }, [isInBattle, canvasWidth, canvasHeight, cityName]);

  // 평시 전술맵: 삼6 전투 맵 이미지를 등각 배경으로 사용
  const drawPeacefulCity = (ctx: CanvasRenderingContext2D, width: number, height: number, cityName?: string) => {
    ctx.clearRect(0, 0, width, height);

    const img = new Image();
    img.src = '/images/tactical/sam6-city-1.png';

    img.onload = () => {
      // 배경 톤
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // 이미지 비율 유지하면서 중앙에 배치
      const scale = Math.min(width / img.width, height / img.height) * 0.95;
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const x = (width - drawW) / 2;
      const y = (height - drawH) / 2 + 10;

      ctx.drawImage(img, x, y, drawW, drawH);

      // 도시 이름 / 상태 텍스트
      ctx.textAlign = 'center';
      if (cityName) {
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '700 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(cityName, width / 2, 32);
      }

      ctx.fillStyle = '#9ca3af';
      ctx.font = '500 13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('전투가 없는 평시 상태입니다.', width / 2, 52);
    };
  };

  // 전투 상황 그리기 (쿼터뷰 좌표 기반)
  const drawBattle = (ctx: CanvasRenderingContext2D, width: number, height: number, battle: BattleState) => {
    // 배경 (전투 지형 - 쿼터뷰)
    drawBattleground(ctx, width, height, battle.terrain);

    // 좌표계: 게임 월드 좌표 (0-1000) -> 화면 좌표로 변환
    // 쿼터뷰 변환: x, y -> screenX, screenY
    const worldToScreen = (worldX: number, worldY: number) => {
      // 월드 좌표를 0-1 범위로 정규화
      const normX = worldX / 1000;
      const normY = worldY / 1000;
      
      // 쿼터뷰 투영 (45도 회전)
      const screenX = width * 0.5 + (normX - normY) * width * 0.35;
      const screenY = height * 0.3 + (normX + normY) * height * 0.25;
      
      return { x: screenX, y: screenY };
    };

    // 모든 유닛을 Y 좌표 순으로 정렬 (뒤에서 앞으로 그리기)
    const allUnits = [
      ...battle.attackerUnits.map(u => ({ ...u, side: 'attacker' as const })),
      ...battle.defenderUnits.map(u => ({ ...u, side: 'defender' as const }))
    ];
    
    allUnits.sort((a, b) => {
      const aY = a.position?.y ?? (a.side === 'attacker' ? 300 : 700);
      const bY = b.position?.y ?? (b.side === 'attacker' ? 300 : 700);
      return aY - bY;
    });

    // 유닛 그리기
    allUnits.forEach((unit, index) => {
      const worldX = unit.position?.x ?? (unit.side === 'attacker' ? 300 : 700);
      const worldY = unit.position?.y ?? (unit.side === 'attacker' ? 300 + index * 100 : 700 + index * 100);
      const screen = worldToScreen(worldX, worldY);
      const color = unit.side === 'attacker' ? '#FF4444' : '#4444FF';
      
      drawUnitQuarter(ctx, screen.x, screen.y, unit, color);
    });

    // UI 오버레이
    drawBattleUI(ctx, width, height, battle);
  };

  // 전장 배경 그리기 (쿼터뷰)
  const drawBattleground = (ctx: CanvasRenderingContext2D, width: number, height: number, terrain: string) => {
    // 하늘 그라디언트
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E2FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.4);

    // 지형 (다이아몬드 형태로 쿼터뷰 표현)
    const terrainColor = getTerrainColor(terrain);
    const centerX = width / 2;
    const centerY = height / 2;
    const gridWidth = width * 0.7;
    const gridHeight = height * 0.5;

    ctx.fillStyle = terrainColor;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - gridHeight / 2); // 위
    ctx.lineTo(centerX + gridWidth / 2, centerY); // 오른쪽
    ctx.lineTo(centerX, centerY + gridHeight / 2); // 아래
    ctx.lineTo(centerX - gridWidth / 2, centerY); // 왼쪽
    ctx.closePath();
    ctx.fill();

    // 테두리
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 그리드 라인 (쿼터뷰)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    
    // 가로 그리드
    for (let i = 1; i < 10; i++) {
      const t = i / 10;
      ctx.beginPath();
      ctx.moveTo(
        centerX - gridWidth / 2 * (1 - t),
        centerY + gridHeight / 2 * (t - 0.5) * 2
      );
      ctx.lineTo(
        centerX + gridWidth / 2 * (1 - t),
        centerY + gridHeight / 2 * (t - 0.5) * 2
      );
      ctx.stroke();
    }
    
    // 세로 그리드
    for (let i = 1; i < 10; i++) {
      const t = i / 10;
      ctx.beginPath();
      ctx.moveTo(
        centerX + gridWidth / 2 * (t - 0.5) * 2,
        centerY - gridHeight / 2 * (1 - t)
      );
      ctx.lineTo(
        centerX + gridWidth / 2 * (t - 0.5) * 2,
        centerY + gridHeight / 2 * (1 - t)
      );
      ctx.stroke();
    }
  };

  // 전투 UI 오버레이
  const drawBattleUI = (ctx: CanvasRenderingContext2D, width: number, height: number, battle: BattleState) => {
    // 상단 턴 정보
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width / 2 - 100, 10, 200, 50);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`턴: ${battle.currentTurn}`, width / 2, 40);

    // 상태 정보
    const statusText = battle.status === 'in_progress' ? '⚔️ 전투 진행 중' : 
                       battle.status === 'deploying' ? '📍 배치 중...' : 
                       '🏁 전투 종료';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(statusText, width / 2, 80);
  };

  // 유닛 그리기 (쿼터뷰)
  const drawUnitQuarter = (ctx: CanvasRenderingContext2D, x: number, y: number, unit: BattleUnit, color: string) => {
    const size = 35;
    const shadowOffset = 8;

    // 그림자 (쿼터뷰 바닥)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + size + shadowOffset, size * 0.6, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 유닛 몸체 (타원형, 입체감)
    const bodyGradient = ctx.createRadialGradient(x - size / 3, y - size / 3, 0, x, y, size);
    bodyGradient.addColorStop(0, lightenColor(color, 40));
    bodyGradient.addColorStop(1, color);
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // 테두리
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 투구/갑옷 디테일
    ctx.strokeStyle = darkenColor(color, 30);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - size / 3, size / 2, 0, Math.PI, true);
    ctx.stroke();

    // HP 바 (쿼터뷰 위치 조정)
    const hpBarWidth = 50;
    const hpBarHeight = 6;
    const hpRatio = unit.hp / unit.maxHp;
    const hpBarY = y - size - 15;

    // HP 바 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x - hpBarWidth / 2, hpBarY, hpBarWidth, hpBarHeight);

    // HP 바 (현재 체력)
    const hpColor = hpRatio > 0.6 ? '#00FF00' : hpRatio > 0.3 ? '#FFFF00' : '#FF0000';
    ctx.fillStyle = hpColor;
    ctx.fillRect(x - hpBarWidth / 2, hpBarY, hpBarWidth * hpRatio, hpBarHeight);

    // HP 바 테두리
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - hpBarWidth / 2, hpBarY, hpBarWidth, hpBarHeight);

    // 장수 이름 (배경 포함)
    const nameY = y - size - 28;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - 35, nameY - 12, 70, 16);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(unit.generalName, x, nameY);

    // 병력 수 (유닛 중앙)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(`${unit.troops}`, x, y + 4);
    ctx.fillText(`${unit.troops}`, x, y + 4);
  };

  // 색상 밝게 하기
  const lightenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  // 색상 어둡게 하기
  const darkenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  // 지형 색상
  const getTerrainColor = (terrain: string): string => {
    switch (terrain) {
      case 'PLAINS': return '#90EE90'; // 평지: 연두색
      case 'FOREST': return '#228B22'; // 숲: 진한 녹색
      case 'MOUNTAIN': return '#A0522D'; // 산악: 갈색
      case 'WATER': return '#4682B4'; // 수상: 파랑
      case 'FORTRESS': return '#808080'; // 요새: 회색
      default: return '#F5F5DC'; // 기본: 베이지
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.mapTitle}>
        <span className={styles.mapTitleText}>
          {cityName || '전술맵'}
        </span>
      </div>
      <div className={styles.canvasWrapper}>
        {/* 평화/기본용 2D 캔버스 */}
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{ display: isInBattle ? 'none' : 'block' }}
        />

        {/* 전투 중 three 전술맵 캔버스 */}
        {isInBattle && (
          <canvas ref={threeCanvasRef} className={styles.canvas} />
        )}
        
        {/* 로그 오버레이 (하단, 페이드인/아웃) */}
        {recentLogs.length > 0 && (
          <div className={styles.logOverlay}>
            {recentLogs.map((log, index) => (
              <div 
                key={log.id}
                className={styles.logEntry}
                style={{
                  animation: `fadeInOut 5s ease-in-out`,
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <span 
                  className={styles.logIcon}
                  style={{ 
                    color: getLogColor(log.type) 
                  }}
                >
                  {getLogIcon(log.type)}
                </span>
                <span 
                  className={styles.logText}
                  dangerouslySetInnerHTML={{ __html: formatLogText(log.text) }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {isInBattle && battleState && (
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>전투 ID:</span>
            <span className={styles.infoValue}>{battleState.battleId.substring(0, 8)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>지형:</span>
            <span className={styles.infoValue}>{battleState.terrain}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>공격군:</span>
            <span className={styles.infoValue}>{battleState.attackerUnits.length}부대</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>수비군:</span>
            <span className={styles.infoValue}>{battleState.defenderUnits.length}부대</span>
          </div>
          {myRole && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>역할:</span>
              <span className={styles.infoValue}>
                {myRole === 'FIELD_COMMANDER'
                  ? '총사령관'
                  : myRole === 'SUB_COMMANDER'
                  ? '부장'
                  : '참모'}
              </span>
            </div>
          )}
        </div>
      )}

      {!isInBattle && cityId && (
        <div className={styles.info}>
          <button
            type="button"
            className={styles.joinBattleBtn}
            disabled={joining || !generalId}
            onClick={async () => {
              if (!generalId) return;
              try {
                setJoinError(null);
                setJoining(true);
                const result = await SammoAPI.GetBattleCenter({ serverID });
                const battles = result.battles || [];
                const active = battles.find((b: any) => b.targetCityId === cityId && b.status !== 'completed');
                if (!active) {
                  setJoinError('이 도시에 진행 중인 전투가 없습니다.');
                  return;
                }
                const battleId = active.battleId || active.id;
                router.push(`/${serverID}/battle/${battleId}/three?generalId=${generalId}`);
              } catch (error: any) {
                console.error('[TacticalMap] 전투 참가 실패:', error);
                setJoinError('전투 정보를 불러오는 데 실패했습니다.');
              } finally {
                setJoining(false);
              }
            }}
          >
            {joining ? '전투방 확인 중...' : '현재 도시 전술 전투 참가'}
          </button>
          {joinError && (
            <div className={styles.errorText}>{joinError}</div>
          )}
        </div>
      )}
    </div>
  );
}

// 로그 색상
const getLogColor = (type: string): string => {
  switch (type) {
    case 'action': return '#4A90E2';
    case 'damage': return '#E24A4A';
    case 'status': return '#F5A623';
    case 'result': return '#7ED321';
    case 'general': return '#9013FE';
    case 'history': return '#50E3C2';
    default: return '#4A4A4A';
  }
};

// 로그 아이콘
const getLogIcon = (type: string): string => {
  switch (type) {
    case 'action': return '⚔️';
    case 'damage': return '💥';
    case 'status': return '📊';
    case 'result': return '🏆';
    case 'general': return '👤';
    case 'history': return '📜';
    default: return '📋';
  }
};

// 로그 텍스트 포맷팅
const formatLogText = (text: string): string => {
  return text
    .replace(/<R>(.*?)<\/>/g, '<span style="color: #E24A4A; font-weight: bold;">$1<\/span>')
    .replace(/<B>(.*?)<\/>/g, '<span style="color: #4A90E2; font-weight: bold;">$1<\/span>')
    .replace(/<G>(.*?)<\/>/g, '<span style="color: #7ED321; font-weight: bold;">$1<\/span>')
    .replace(/<Y>(.*?)<\/>/g, '<span style="color: #F5A623; font-weight: bold;">$1<\/span>')
    .replace(/<S>(.*?)<\/>/g, '<span style="color: #9013FE; font-weight: bold;">$1<\/span>')
    .replace(/<1>(.*?)<\/>/g, '<span style="color: #888; font-style: italic;">$1<\/span>');
};

// === BattleState -> UnitInstance 어댑터 ===

const TACTICAL_LOGICAL_WIDTH = 40;
const TACTICAL_LOGICAL_HEIGHT = 40;

function worldToGrid(
  position: { x: number; y: number } | undefined,
  side: 'attacker' | 'defender',
  mapWidth: number,
  mapHeight: number,
): { row: number; col: number } {
  const safeWidth = mapWidth > 0 ? mapWidth : 1;
  const safeHeight = mapHeight > 0 ? mapHeight : 1;

  const defaultX = side === 'attacker' ? safeWidth * 0.25 : safeWidth * 0.75;
  const defaultY = side === 'attacker' ? safeHeight * 0.25 : safeHeight * 0.75;

  const wx = clamp01(((position?.x ?? defaultX) / safeWidth));
  const wy = clamp01(((position?.y ?? defaultY) / safeHeight));

  const col = Math.floor(wx * TACTICAL_LOGICAL_WIDTH);
  const row = Math.floor(wy * TACTICAL_LOGICAL_HEIGHT);

  return { row, col };
}

function mapBattleStateToUnitInstances(state: BattleState): UnitInstance[] {
  const instances: UnitInstance[] = [];
  const mapWidth = state.map?.width ?? 800;
  const mapHeight = state.map?.height ?? 600;

  const convert = (u: BattleUnit): UnitInstance => {
    // world position -> grid
    const { row, col } = worldToGrid(u.position, u.side, mapWidth, mapHeight);

    const role = mapUnitTypeToRole(u.unitType);
    const visual: UnitVisualConfig = {
      id: `voxel-${u.side}-${u.generalId}`,
      role,
      cultureTags: u.side === 'attacker' ? ['Han'] : ['YellowTurban'],
      isElite: u.troops >= u.maxTroops * 0.9,
    };

    const unit: UnitInstance = {
      id: visual.id,
      visual,
      gridPos: { row, col },
    };

    // three 쪽에서 병력/사기/방향/속도 표현에 사용할 수 있도록 메타 정보 부여
    (unit as any).troopsRatio = u.maxTroops > 0 ? u.troops / u.maxTroops : 1;
    (unit as any).morale = u.morale ?? 100;
    (unit as any).facing = u.facing ?? 0;
    if (u.velocity) {
      const speed = Math.sqrt(u.velocity.x * u.velocity.x + u.velocity.y * u.velocity.y);
      (unit as any).speed = speed;
    }

    return unit;
  };

  state.attackerUnits.forEach((u) => instances.push(convert(u)));
  state.defenderUnits.forEach((u) => instances.push(convert(u)));

  return instances;
}

function mapUnitTypeToRole(unitType?: number): UnitVisualConfig['role'] {
  switch (unitType) {
    case 1:
      return 'archer';
    case 2:
      return 'cavalry';
    case 3:
      return 'scholar';
    case 0:
    case 4:
    default:
      return 'infantry';
  }
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
 
