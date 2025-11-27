'use client';

import React, { useState } from 'react';
import { TroopMovement } from '@/types/movement';
import styles from './MovementDetailPanel.module.css';

interface MovementDetailPanelProps {
  movement: TroopMovement;
  onClose: () => void;
  onCancel?: (movementId: string) => Promise<void>;
  onGoToCommandScreen?: (generalId: number) => void; // 커맨드 예약 화면으로 이동
  onTrackOnMap?: (movement: TroopMovement) => void;
  isEditable?: boolean; // 내 장수인 경우만 편집 가능
}

/**
 * 선택된 군대 이동 상세 정보 패널
 */
export default function MovementDetailPanel({
  movement,
  onClose,
  onCancel,
  onGoToCommandScreen,
  onTrackOnMap,
  isEditable = false,
}: MovementDetailPanelProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이동 타입 한글 변환
  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      normal: '일반 이동',
      deploy: '출정',
      forceMarch: '강행군',
      retreat: '퇴각/귀환',
      supply: '보급',
    };
    return labels[type] || type;
  };

  // 상태 한글 변환
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      scheduled: '예약됨',
      marching: '행군 중',
      arriving: '도착 임박',
      completed: '완료',
    };
    return labels[status] || status;
  };

  // 상태별 색상
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      scheduled: '#888',
      marching: '#4488ff',
      arriving: '#ff8800',
      completed: '#44aa44',
    };
    return colors[status] || '#888';
  };

  // 병력 포맷
  const formatTroops = (troops: number): string => {
    return troops.toLocaleString();
  };

  // 이동 취소 처리
  const handleCancel = async () => {
    if (!onCancel) return;
    
    setIsCancelling(true);
    setError(null);
    
    try {
      await onCancel(movement.id);
      onClose();
    } catch (err: any) {
      setError(err.message || '이동 취소에 실패했습니다.');
    } finally {
      setIsCancelling(false);
    }
  };

  // 경로 추적
  const handleTrack = () => {
    onTrackOnMap?.(movement);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div 
          className={styles.header}
          style={{ backgroundColor: movement.nationColor }}
        >
          <div className={styles.headerContent}>
            <div className={styles.generalInfo}>
              {movement.generalIcon && (
                <img 
                  src={movement.generalIcon} 
                  alt={movement.generalName}
                  className={styles.portrait}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div>
                <div className={styles.generalName}>{movement.generalName}</div>
                <div className={styles.nationName}>{movement.nationName}</div>
              </div>
            </div>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
        </div>

        {/* 본문 */}
        <div className={styles.body}>
          {/* 이동 정보 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>📍 이동 정보</div>
            <div className={styles.route}>
              <div className={styles.cityBox}>
                <span className={styles.cityLabel}>출발</span>
                <span className={styles.cityName}>{movement.fromCityName}</span>
              </div>
              <div className={styles.arrow}>→</div>
              <div className={styles.cityBox}>
                <span className={styles.cityLabel}>도착</span>
                <span className={styles.cityName}>{movement.toCityName}</span>
              </div>
            </div>
          </div>

          {/* 상태 정보 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>📊 상태</div>
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>이동 타입</span>
                <span className={styles.statusValue}>{getTypeLabel(movement.type)}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>진행 상태</span>
                <span 
                  className={styles.statusValue}
                  style={{ color: getStatusColor(movement.status) }}
                >
                  {getStatusLabel(movement.status)}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>진행도</span>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${movement.progress || 0}%`,
                        backgroundColor: movement.nationColor,
                      }}
                    />
                  </div>
                  <span className={styles.progressText}>{movement.progress || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 병력 정보 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>⚔️ 병력</div>
            <div className={styles.troopInfo}>
              <div className={styles.troopRow}>
                <span className={styles.troopLabel}>병력 수</span>
                <span className={styles.troopValue}>{formatTroops(movement.troops)}</span>
              </div>
              {movement.crewTypeName && (
                <div className={styles.troopRow}>
                  <span className={styles.troopLabel}>병종</span>
                  <span className={styles.troopValue}>{movement.crewTypeName}</span>
                </div>
              )}
            </div>
          </div>

          {/* 예상 시간 */}
          {(movement.scheduledTurn !== undefined || movement.arrivalTurn !== undefined) && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>⏱️ 시간</div>
              <div className={styles.timeInfo}>
                {movement.scheduledTurn !== undefined && (
                  <div className={styles.timeRow}>
                    <span className={styles.timeLabel}>예약 턴</span>
                    <span className={styles.timeValue}>
                      {movement.scheduledTurn === 0 ? '다음 턴' : `${movement.scheduledTurn}턴 후`}
                    </span>
                  </div>
                )}
                {movement.arrivalTurn !== undefined && (
                  <div className={styles.timeRow}>
                    <span className={styles.timeLabel}>도착 예정</span>
                    <span className={styles.timeValue}>{movement.arrivalTurn}턴</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className={styles.error}>{error}</div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className={styles.footer}>
          <button 
            className={styles.actionButton}
            onClick={handleTrack}
          >
            🔍 지도에서 추적
          </button>
          
          {isEditable && movement.status === 'scheduled' && (
            <>
              {onGoToCommandScreen && (
                <button 
                  className={`${styles.actionButton} ${styles.secondary}`}
                  onClick={() => {
                    onGoToCommandScreen(movement.generalId);
                    onClose();
                  }}
                >
                  📋 커맨드 변경
                </button>
              )}
              
              {onCancel && (
                <button 
                  className={`${styles.actionButton} ${styles.danger}`}
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? '취소 중...' : '❌ 이동 취소'}
                </button>
              )}
            </>
          )}
          
          {/* 이동 중인 경우 안내 */}
          {isEditable && movement.status === 'marching' && (
            <div className={styles.infoMessage}>
              ℹ️ 행군 중인 부대는 수정할 수 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

