'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import styles from './TacticalMapPanel.module.css';

/**
 * 삼국지 전술맵 패널
 * - 전투 중: 실시간 전투 상황 표시
 * - 평화: 평화로운 성 이미지 표시
 */

interface BattleUnit {
  generalId: number;
  generalName: string;
  troops: number;
  position?: { x: number; y: number };
  hp: number;
  maxHp: number;
  side: 'attacker' | 'defender';
}

interface BattleState {
  battleId: string;
  status: 'deploying' | 'in_progress' | 'completed';
  attackerUnits: BattleUnit[];
  defenderUnits: BattleUnit[];
  currentTurn: number;
  terrain: string;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [isInBattle, setIsInBattle] = useState(false);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  
  const canvasWidth = 740;
  const canvasHeight = 500;

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

  // 캔버스 렌더링
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 검은 배경만 표시
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // 평화로운 성 그리기 (쿼터뷰)
  const drawPeacefulCity = (ctx: CanvasRenderingContext2D, width: number, height: number, cityName?: string) => {
    // 배경 그라디언트 (하늘)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E2FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // 땅 (쿼터뷰 원근감)
    const groundY = height * 0.65;
    ctx.fillStyle = '#8FBC8F';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // 성벽 (쿼터뷰 사각형)
    const centerX = width / 2;
    const centerY = height * 0.5;
    const wallWidth = 250;
    const wallHeight = 150;
    const wallDepth = 80; // 쿼터뷰 깊이

    // 성벽 앞면 (밝은 색)
    ctx.fillStyle = '#A0826D';
    ctx.beginPath();
    ctx.moveTo(centerX - wallWidth / 2, centerY);
    ctx.lineTo(centerX + wallWidth / 2, centerY);
    ctx.lineTo(centerX + wallWidth / 2, centerY + wallHeight);
    ctx.lineTo(centerX - wallWidth / 2, centerY + wallHeight);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 성벽 오른쪽 면 (어두운 색)
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(centerX + wallWidth / 2, centerY);
    ctx.lineTo(centerX + wallWidth / 2 + wallDepth / 2, centerY - wallDepth / 3);
    ctx.lineTo(centerX + wallWidth / 2 + wallDepth / 2, centerY + wallHeight - wallDepth / 3);
    ctx.lineTo(centerX + wallWidth / 2, centerY + wallHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 성벽 윗면
    ctx.fillStyle = '#B8956A';
    ctx.beginPath();
    ctx.moveTo(centerX - wallWidth / 2, centerY);
    ctx.lineTo(centerX + wallWidth / 2, centerY);
    ctx.lineTo(centerX + wallWidth / 2 + wallDepth / 2, centerY - wallDepth / 3);
    ctx.lineTo(centerX - wallWidth / 2 + wallDepth / 2, centerY - wallDepth / 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 성문
    const gateWidth = 60;
    const gateHeight = 80;
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(centerX - gateWidth / 2, centerY + wallHeight - gateHeight, gateWidth, gateHeight);
    ctx.strokeRect(centerX - gateWidth / 2, centerY + wallHeight - gateHeight, gateWidth, gateHeight);

    // 성문 상단 아치
    ctx.beginPath();
    ctx.arc(centerX, centerY + wallHeight - gateHeight, gateWidth / 2, 0, Math.PI, true);
    ctx.fill();
    ctx.stroke();

    // 망루 (좌)
    const towerSize = 50;
    const towerX1 = centerX - wallWidth / 2 - 20;
    const towerY1 = centerY - 20;
    
    // 망루 앞면
    ctx.fillStyle = '#A0826D';
    ctx.fillRect(towerX1 - towerSize / 2, towerY1, towerSize, towerSize * 1.5);
    ctx.strokeRect(towerX1 - towerSize / 2, towerY1, towerSize, towerSize * 1.5);
    
    // 망루 오른쪽 면
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(towerX1 + towerSize / 2, towerY1);
    ctx.lineTo(towerX1 + towerSize / 2 + 20, towerY1 - 15);
    ctx.lineTo(towerX1 + towerSize / 2 + 20, towerY1 + towerSize * 1.5 - 15);
    ctx.lineTo(towerX1 + towerSize / 2, towerY1 + towerSize * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 망루 지붕 (삼각)
    ctx.fillStyle = '#CD5C5C';
    ctx.beginPath();
    ctx.moveTo(towerX1, towerY1 - 30);
    ctx.lineTo(towerX1 - towerSize / 2 - 5, towerY1);
    ctx.lineTo(towerX1 + towerSize / 2 + 5, towerY1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 망루 (우)
    const towerX2 = centerX + wallWidth / 2 + 20;
    
    ctx.fillStyle = '#A0826D';
    ctx.fillRect(towerX2 - towerSize / 2, towerY1, towerSize, towerSize * 1.5);
    ctx.strokeRect(towerX2 - towerSize / 2, towerY1, towerSize, towerSize * 1.5);
    
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(towerX2 + towerSize / 2, towerY1);
    ctx.lineTo(towerX2 + towerSize / 2 + 20, towerY1 - 15);
    ctx.lineTo(towerX2 + towerSize / 2 + 20, towerY1 + towerSize * 1.5 - 15);
    ctx.lineTo(towerX2 + towerSize / 2, towerY1 + towerSize * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#CD5C5C';
    ctx.beginPath();
    ctx.moveTo(towerX2, towerY1 - 30);
    ctx.lineTo(towerX2 - towerSize / 2 - 5, towerY1);
    ctx.lineTo(towerX2 + towerSize / 2 + 5, towerY1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 깃발 (왼쪽 망루)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(towerX1, towerY1 - 30);
    ctx.lineTo(towerX1, towerY1 - 70);
    ctx.stroke();

    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.moveTo(towerX1, towerY1 - 70);
    ctx.lineTo(towerX1 + 30, towerY1 - 60);
    ctx.lineTo(towerX1, towerY1 - 50);
    ctx.closePath();
    ctx.fill();

    // 도시 이름
    if (cityName) {
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 28px serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(cityName, centerX, centerY - 100);
      ctx.shadowBlur = 0;
    }

    // 평화 문구
    ctx.fillStyle = '#228B22';
    ctx.font = 'bold 22px serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 3;
    ctx.fillText('🕊️ 평화로운 시기입니다 🕊️', width / 2, height - 40);
    ctx.shadowBlur = 0;
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
        <canvas ref={canvasRef} className={styles.canvas} />
        
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
    .replace(/<R>(.*?)<\/>/g, '<span style="color: #E24A4A; font-weight: bold;">$1</span>')
    .replace(/<B>(.*?)<\/>/g, '<span style="color: #4A90E2; font-weight: bold;">$1</span>')
    .replace(/<G>(.*?)<\/>/g, '<span style="color: #7ED321; font-weight: bold;">$1</span>')
    .replace(/<Y>(.*?)<\/>/g, '<span style="color: #F5A623; font-weight: bold;">$1</span>')
    .replace(/<S>(.*?)<\/>/g, '<span style="color: #9013FE; font-weight: bold;">$1</span>')
    .replace(/<1>(.*?)<\/>/g, '<span style="color: #888; font-style: italic;">$1</span>');
};
