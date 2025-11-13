/**
 * 실시간 전투 Canvas 컴포넌트
 * Phase 4 - 프론트엔드 UI
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { BattleUnit, BattleState } from '../../hooks/useBattleSocket';

interface BattleCanvasProps {
  battleState: BattleState | null;
  selectedUnitId: number | null;
  onUnitClick: (unitId: number) => void;
  onMapClick: (x: number, y: number) => void;
  myGeneralId?: number;
}

export function BattleCanvas({
  battleState,
  selectedUnitId,
  onUnitClick,
  onMapClick,
  myGeneralId
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  /**
   * Canvas 렌더링 (매 프레임)
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !battleState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = battleState.map.width;
    canvas.height = battleState.map.height;
    setCanvasSize({ width: battleState.map.width, height: battleState.map.height });

    // 배경 클리어
    ctx.fillStyle = '#2a3f2a'; // 어두운 녹색 (전장)
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 그리드 그리기 (옵션)
    drawGrid(ctx, canvas.width, canvas.height);

    // 성 그리기
    if (battleState.map.castle) {
      drawCastle(ctx, battleState.map.castle);
    }

    // 배치 영역 표시 (디버그용)
    // drawDeploymentZones(ctx);

    // 유닛 그리기
    battleState.attackerUnits.forEach(unit => {
      drawUnit(ctx, unit, 'attacker', selectedUnitId === unit.generalId, myGeneralId === unit.generalId);
    });

    battleState.defenderUnits.forEach(unit => {
      drawUnit(ctx, unit, 'defender', selectedUnitId === unit.generalId, myGeneralId === unit.generalId);
    });

  }, [battleState, selectedUnitId, myGeneralId]);

  /**
   * 그리드 그리기
   */
  function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.strokeStyle = '#3a4f3a';
    ctx.lineWidth = 0.5;

    // 세로선
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 가로선
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  /**
   * 성 그리기
   */
  function drawCastle(ctx: CanvasRenderingContext2D, castle: any) {
    // 성벽 원
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(castle.center.x, castle.center.y, castle.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 성벽 채우기
    ctx.fillStyle = 'rgba(139, 69, 19, 0.2)';
    ctx.fill();

    // 성문 그리기
    castle.gates.forEach((gate: any) => {
      const hpRatio = gate.hp / gate.maxHp;
      
      ctx.fillStyle = hpRatio > 0.5 ? '#654321' : hpRatio > 0.2 ? '#ff8800' : '#ff0000';
      ctx.fillRect(
        gate.position.x - gate.width / 2,
        gate.position.y - gate.height / 2,
        gate.width,
        gate.height
      );

      // 성문 HP 바
      ctx.fillStyle = '#222';
      ctx.fillRect(gate.position.x - 25, gate.position.y - 40, 50, 5);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(gate.position.x - 25, gate.position.y - 40, 50 * hpRatio, 5);

      // 성문 이름
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(gate.id, gate.position.x, gate.position.y - 45);
    });
  }

  /**
   * 유닛 그리기
   */
  function drawUnit(
    ctx: CanvasRenderingContext2D,
    unit: BattleUnit,
    side: 'attacker' | 'defender',
    isSelected: boolean,
    isMine: boolean
  ) {
    const { position, collisionRadius, troops, maxTroops, generalName, facing, targetPosition, isCharging } = unit;

    // 유닛 원형
    ctx.beginPath();
    ctx.arc(position.x, position.y, collisionRadius, 0, Math.PI * 2);
    
    // 색상
    let fillColor = side === 'attacker' ? '#4488ff' : '#ff4444';
    if (isCharging) {
      fillColor = '#ff8800'; // 돌격 중: 주황색
    }
    if (isMine) {
      fillColor = '#00ff00'; // 내 유닛: 녹색
    }
    
    ctx.fillStyle = fillColor;
    ctx.fill();

    // 테두리 (선택 시 강조)
    ctx.strokeStyle = isSelected ? '#ffff00' : '#ffffff';
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.stroke();

    // 방향 표시 (화살표)
    if (facing !== undefined) {
      const angle = (facing * Math.PI) / 180;
      const arrowLength = collisionRadius;
      const endX = position.x + Math.cos(angle) * arrowLength;
      const endY = position.y + Math.sin(angle) * arrowLength;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(position.x, position.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // 화살촉
      const arrowHeadSize = 5;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowHeadSize * Math.cos(angle - Math.PI / 6),
        endY - arrowHeadSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowHeadSize * Math.cos(angle + Math.PI / 6),
        endY - arrowHeadSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }

    // 목표 지점 표시
    if (targetPosition) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(position.x, position.y);
      ctx.lineTo(targetPosition.x, targetPosition.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 목표 지점 X 마크
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(targetPosition.x - 5, targetPosition.y - 5);
      ctx.lineTo(targetPosition.x + 5, targetPosition.y + 5);
      ctx.moveTo(targetPosition.x + 5, targetPosition.y - 5);
      ctx.lineTo(targetPosition.x - 5, targetPosition.y + 5);
      ctx.stroke();
    }

    // HP 바
    const hpRatio = troops / maxTroops;
    const barWidth = collisionRadius * 2;
    const barHeight = 5;
    const barX = position.x - collisionRadius;
    const barY = position.y - collisionRadius - 10;

    // 배경
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // HP
    let hpColor = '#00ff00';
    if (hpRatio < 0.3) hpColor = '#ff0000';
    else if (hpRatio < 0.6) hpColor = '#ffff00';

    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    // 병력 수 텍스트
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${troops}`, position.x, position.y - collisionRadius - 15);

    // 장수 이름
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(generalName, position.x, position.y + collisionRadius + 15);

    // 충돌 반경 표시 (디버그용)
    if (isSelected) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(position.x, position.y, collisionRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * 마우스 클릭 이벤트
   */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !battleState) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // 유닛 클릭 체크
    const allUnits = [...battleState.attackerUnits, ...battleState.defenderUnits];
    for (const unit of allUnits) {
      const dx = unit.position.x - x;
      const dy = unit.position.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= unit.collisionRadius) {
        onUnitClick(unit.generalId);
        return;
      }
    }

    // 빈 공간 클릭 (이동 명령)
    onMapClick(x, y);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
        style={{
          border: '2px solid #444',
          cursor: 'crosshair',
          backgroundColor: '#2a3f2a'
        }}
      />
      
      {/* 상태 표시 */}
      {battleState && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          pointerEvents: 'none'
        }}>
          <div>전투 ID: {battleState.battleId}</div>
          <div>턴: {battleState.currentTurn}</div>
          <div>공격군: {battleState.attackerUnits.length}</div>
          <div>방어군: {battleState.defenderUnits.length}</div>
        </div>
      )}
    </div>
  );
}
