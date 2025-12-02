/**
 * LOGH Tactical Battle Utilities
 * 캔버스 렌더링 유틸리티 함수
 */

import {
  Position,
  Camera,
  Formation,
  Fleet,
  Faction,
  FACTION_COLORS,
  FACTION_SHIP_COLORS,
  COLORS,
  MAP_SIZE,
} from './types';

// ===== 좌표 변환 =====

/**
 * 월드 좌표 -> 스크린 좌표 변환
 */
export function worldToScreen(
  worldPos: Position,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
): Position {
  return {
    x: (worldPos.x - camera.x) * camera.zoom + canvasWidth / 2,
    y: (worldPos.y - camera.y) * camera.zoom + canvasHeight / 2,
  };
}

/**
 * 스크린 좌표 -> 월드 좌표 변환
 */
export function screenToWorld(
  screenPos: Position,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
): Position {
  return {
    x: (screenPos.x - canvasWidth / 2) / camera.zoom + camera.x,
    y: (screenPos.y - canvasHeight / 2) / camera.zoom + camera.y,
  };
}

// ===== 우주 배경 렌더링 =====

/**
 * 별 생성 (시드 기반 고정 위치)
 */
export function generateStars(count: number, seed: number = 12345): Position[] {
  const stars: Position[] = [];
  let rng = seed;
  
  const pseudoRandom = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };
  
  for (let i = 0; i < count; i++) {
    stars.push({
      x: pseudoRandom() * MAP_SIZE,
      y: pseudoRandom() * MAP_SIZE,
    });
  }
  
  return stars;
}

/**
 * 우주 배경 렌더링
 */
export function drawSpaceBackground(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  stars: Position[],
  canvasWidth: number,
  canvasHeight: number
) {
  // 검은 배경 + 그라데이션
  const bgGradient = ctx.createRadialGradient(
    canvasWidth / 2, canvasHeight / 2, 0,
    canvasWidth / 2, canvasHeight / 2, Math.max(canvasWidth, canvasHeight)
  );
  bgGradient.addColorStop(0, '#0f0f2a');
  bgGradient.addColorStop(1, '#050510');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // 성운 1 (보라색)
  const nebula1 = ctx.createRadialGradient(
    canvasWidth * 0.7, canvasHeight * 0.3, 0,
    canvasWidth * 0.7, canvasHeight * 0.3, 400
  );
  nebula1.addColorStop(0, 'rgba(100, 50, 150, 0.15)');
  nebula1.addColorStop(0.5, 'rgba(80, 40, 120, 0.08)');
  nebula1.addColorStop(1, 'transparent');
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // 성운 2 (파란색)
  const nebula2 = ctx.createRadialGradient(
    canvasWidth * 0.2, canvasHeight * 0.7, 0,
    canvasWidth * 0.2, canvasHeight * 0.7, 350
  );
  nebula2.addColorStop(0, 'rgba(30, 80, 150, 0.12)');
  nebula2.addColorStop(0.5, 'rgba(20, 60, 120, 0.06)');
  nebula2.addColorStop(1, 'transparent');
  ctx.fillStyle = nebula2;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // 별 렌더링
  stars.forEach((star, i) => {
    const screenPos = worldToScreen(star, camera, canvasWidth, canvasHeight);
    
    // 화면 밖이면 스킵
    if (screenPos.x < -10 || screenPos.x > canvasWidth + 10 ||
        screenPos.y < -10 || screenPos.y > canvasHeight + 10) {
      return;
    }
    
    const size = (i % 3) + 0.5;
    const brightness = 0.3 + (i % 7) / 10;
    const twinkle = Math.sin(Date.now() / 1000 + i) * 0.1;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness + twinkle})`;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, size * camera.zoom * 0.5 + 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ===== 그리드 렌더링 =====

/**
 * 전술 그리드 렌더링
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number = 1000
) {
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
  ctx.lineWidth = 1;
  
  const offsetX = canvasWidth / 2 - camera.x * camera.zoom;
  const offsetY = canvasHeight / 2 - camera.y * camera.zoom;
  
  // 세로선
  for (let x = 0; x <= MAP_SIZE; x += gridSize) {
    const screenX = x * camera.zoom + offsetX;
    if (screenX >= -10 && screenX <= canvasWidth + 10) {
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, canvasHeight);
      ctx.stroke();
    }
  }
  
  // 가로선
  for (let y = 0; y <= MAP_SIZE; y += gridSize) {
    const screenY = y * camera.zoom + offsetY;
    if (screenY >= -10 && screenY <= canvasHeight + 10) {
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvasWidth, screenY);
      ctx.stroke();
    }
  }
  
  // 중앙선 강조
  const centerX = MAP_SIZE / 2 * camera.zoom + offsetX;
  const centerY = MAP_SIZE / 2 * camera.zoom + offsetY;
  
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, canvasHeight);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvasWidth, centerY);
  ctx.stroke();
}

// ===== 진형별 모양 =====

/**
 * 진형에 따른 함대 모양 포인트 반환
 */
export function getFormationShape(formation: Formation, size: number): Position[] {
  switch (formation) {
    case 'fishScale': // 어린 - 뾰족한 삼각형
      return [
        { x: size * 1.2, y: 0 },
        { x: -size * 0.6, y: size * 0.7 },
        { x: -size * 0.3, y: 0 },
        { x: -size * 0.6, y: -size * 0.7 },
      ];
      
    case 'craneWing': // 학익 - 양날개
      return [
        { x: size * 0.5, y: 0 },
        { x: -size * 0.3, y: size * 0.3 },
        { x: -size * 1.0, y: size * 0.8 },
        { x: -size * 0.5, y: 0 },
        { x: -size * 1.0, y: -size * 0.8 },
        { x: -size * 0.3, y: -size * 0.3 },
      ];
      
    case 'circular': // 방원 - 원형 (8각형으로 근사)
      const points: Position[] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        points.push({
          x: Math.cos(angle) * size * 0.8,
          y: Math.sin(angle) * size * 0.8,
        });
      }
      return points;
      
    case 'arrowhead': // 봉시 - 화살촉
      return [
        { x: size * 1.5, y: 0 },
        { x: size * 0.2, y: size * 0.4 },
        { x: -size * 0.5, y: size * 0.5 },
        { x: -size * 0.3, y: 0 },
        { x: -size * 0.5, y: -size * 0.5 },
        { x: size * 0.2, y: -size * 0.4 },
      ];
      
    case 'longSnake': // 장사 - 긴 선
      return [
        { x: size * 1.2, y: 0 },
        { x: size * 0.4, y: size * 0.2 },
        { x: -size * 0.8, y: size * 0.15 },
        { x: -size * 0.8, y: -size * 0.15 },
        { x: size * 0.4, y: -size * 0.2 },
      ];
      
    default:
      // 기본 삼각형
      return [
        { x: size, y: 0 },
        { x: -size * 0.5, y: size * 0.5 },
        { x: -size * 0.5, y: -size * 0.5 },
      ];
  }
}

// ===== 함대 렌더링 =====

/**
 * 함대 렌더링
 */
export function drawFleet(
  ctx: CanvasRenderingContext2D,
  fleet: Fleet,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  isSelected: boolean,
  showAttackRange: boolean = false
) {
  const screenPos = worldToScreen(fleet.tacticalPosition, camera, canvasWidth, canvasHeight);
  
  // 화면 밖 컬링
  const margin = 100;
  if (screenPos.x < -margin || screenPos.x > canvasWidth + margin ||
      screenPos.y < -margin || screenPos.y > canvasHeight + margin) {
    return;
  }
  
  // 크기 계산 (함선 수에 비례)
  const baseSize = Math.max(8, Math.min(40, fleet.totalShips / 500));
  const size = baseSize * Math.max(0.5, camera.zoom);
  
  // 진영 색상
  const factionColor = FACTION_COLORS[fleet.faction];
  
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate((fleet.tacticalPosition.heading * Math.PI) / 180);
  
  // 사정거리 원 (선택 시)
  if (showAttackRange && isSelected) {
    ctx.rotate(-(fleet.tacticalPosition.heading * Math.PI) / 180);
    const rangeRadius = fleet.attackRange * camera.zoom;
    ctx.fillStyle = COLORS.attackRange;
    ctx.beginPath();
    ctx.arc(0, 0, rangeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `${factionColor}66`;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.rotate((fleet.tacticalPosition.heading * Math.PI) / 180);
  }
  
  // 이동 목표선
  if (fleet.targetPosition && fleet.isMoving) {
    ctx.rotate(-(fleet.tacticalPosition.heading * Math.PI) / 180);
    const targetScreen = worldToScreen(fleet.targetPosition, camera, canvasWidth, canvasHeight);
    const dx = targetScreen.x - screenPos.x;
    const dy = targetScreen.y - screenPos.y;
    
    ctx.strokeStyle = COLORS.moveTarget;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(dx, dy);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 목표 지점 마커
    ctx.fillStyle = COLORS.moveTarget;
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.rotate((fleet.tacticalPosition.heading * Math.PI) / 180);
  }
  
  // 진형에 따른 모양
  const shape = getFormationShape(fleet.formation, size);
  
  // 함선 색상 (진한 톤)
  const shipColor = FACTION_SHIP_COLORS[fleet.faction];
  
  // 글로우 효과
  ctx.shadowColor = factionColor;
  ctx.shadowBlur = isSelected ? 20 : 10;
  
  // 함대 모양 그리기 (함선 색상 사용)
  ctx.fillStyle = shipColor;
  ctx.strokeStyle = isSelected ? COLORS.selection : factionColor;
  ctx.lineWidth = isSelected ? 3 : 1.5;
  
  ctx.beginPath();
  shape.forEach((point, i) => {
    if (i === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // 선택 링
  if (isSelected) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = COLORS.selection;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size + 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // 기함 표시
  if (fleet.isFlagship) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, -size - 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
  
  // 라벨 (줌 레벨에 따라)
  if (camera.zoom > 0.05) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e0e0e0';
    ctx.font = `${Math.max(10, 12 * camera.zoom)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(fleet.name, screenPos.x, screenPos.y + size + 18);
    
    // HP 바
    const barWidth = size * 2;
    const barHeight = 3;
    const barX = screenPos.x - barWidth / 2;
    const barY = screenPos.y + size + 22;
    const hpRatio = fleet.hp / fleet.maxHp;
    
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = hpRatio > 0.6 ? COLORS.hpHigh : hpRatio > 0.3 ? COLORS.hpMid : COLORS.hpLow;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  }
}

// ===== 이펙트 렌더링 =====

/**
 * 레이저 이펙트
 */
export function drawLaserEffect(
  ctx: CanvasRenderingContext2D,
  start: Position,
  end: Position,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  progress: number,
  color: string = COLORS.neonRed
) {
  const startScreen = worldToScreen(start, camera, canvasWidth, canvasHeight);
  const endScreen = worldToScreen(end, camera, canvasWidth, canvasHeight);
  
  // 진행률에 따른 알파값
  const alpha = Math.sin(progress * Math.PI);
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  
  ctx.beginPath();
  ctx.moveTo(startScreen.x, startScreen.y);
  ctx.lineTo(
    startScreen.x + (endScreen.x - startScreen.x) * progress,
    startScreen.y + (endScreen.y - startScreen.y) * progress
  );
  ctx.stroke();
  
  ctx.restore();
}

/**
 * 폭발 이펙트
 */
export function drawExplosionEffect(
  ctx: CanvasRenderingContext2D,
  position: Position,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  progress: number,
  maxRadius: number = 50
) {
  const screenPos = worldToScreen(position, camera, canvasWidth, canvasHeight);
  const radius = maxRadius * progress * camera.zoom;
  const alpha = 1 - progress;
  
  ctx.save();
  
  // 외부 링
  const gradient = ctx.createRadialGradient(
    screenPos.x, screenPos.y, 0,
    screenPos.x, screenPos.y, radius
  );
  gradient.addColorStop(0, `rgba(255, 200, 50, ${alpha})`);
  gradient.addColorStop(0.5, `rgba(255, 100, 50, ${alpha * 0.5})`);
  gradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// ===== 유틸리티 =====

/**
 * 두 위치 사이의 거리 계산
 */
export function distance(a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 두 위치 사이의 각도 계산 (도 단위)
 */
export function angle(from: Position, to: Position): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

/**
 * 함대 히트 테스트
 */
export function hitTestFleet(
  screenX: number,
  screenY: number,
  fleet: Fleet,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  hitRadius: number = 30
): boolean {
  const screenPos = worldToScreen(fleet.tacticalPosition, camera, canvasWidth, canvasHeight);
  const dx = screenX - screenPos.x;
  const dy = screenY - screenPos.y;
  return Math.sqrt(dx * dx + dy * dy) < hitRadius * Math.max(0.5, camera.zoom);
}

/**
 * 박스 내 함대 찾기
 */
export function findFleetsInBox(
  fleets: Fleet[],
  boxStart: Position,
  boxEnd: Position
): Fleet[] {
  const minX = Math.min(boxStart.x, boxEnd.x);
  const maxX = Math.max(boxStart.x, boxEnd.x);
  const minY = Math.min(boxStart.y, boxEnd.y);
  const maxY = Math.max(boxStart.y, boxEnd.y);
  
  return fleets.filter(fleet => {
    const pos = fleet.tacticalPosition;
    return pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY;
  });
}

/**
 * HP/사기/보급 상태 색상
 */
export function getStatusColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio > 0.6) return COLORS.hpHigh;
  if (ratio > 0.3) return COLORS.hpMid;
  return COLORS.hpLow;
}

