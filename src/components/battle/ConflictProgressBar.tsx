'use client';

/**
 * ConflictProgressBar - 분쟁 진행 바 컴포넌트
 * 
 * 도시 공략 진행 상황을 시각적으로 표시
 * - 도시 HP, 성벽 HP, 성문 HP Bar
 * - 분쟁 참여 국가별 기여도 Bar
 * - 예상 점령 국가 표시
 */

import { useState, useEffect, useCallback } from 'react';
import styles from './ConflictProgressBar.module.css';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface ConflictParticipant {
  nationId: number;
  nationName: string;
  damage: number;
  percentage: number;
  color?: string;
}

export interface BattleProgress {
  cityId: number;
  cityName: string;
  defenderNationId: number;
  defenderNationName: string;
  cityHp: number;
  cityMaxHp: number;
  cityHpPercent: number;
  wallHp: number;
  wallMaxHp: number;
  wallHpPercent: number;
  gateHp: number;
  gateMaxHp: number;
  gateHpPercent: number;
  participants: ConflictParticipant[];
  totalDamage: number;
  isUnderSiege: boolean;
  estimatedConqueror: ConflictParticipant | null;
}

export interface ConflictProgressBarProps {
  /** 전투 진행 데이터 */
  data: BattleProgress | null;
  /** 표시 모드 */
  mode?: 'default' | 'compact' | 'mini';
  /** HP 숨기기 */
  hideHp?: boolean;
  /** 분쟁 정보 숨기기 */
  hideConflict?: boolean;
  /** 추가 클래스 */
  className?: string;
  /** 클릭 핸들러 */
  onClick?: () => void;
}

// =============================================================================
// Icons
// =============================================================================

const SiegeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.siegeIcon}>
    <path 
      d="M12 2L4 6V12C4 16.42 7.4 20.53 12 22C16.6 20.53 20 16.42 20 12V6L12 2Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>
);

const ConflictIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.conflictIcon}>
    <path 
      d="M14.5 4L18 2V7L14.5 9M14.5 4L6 8M14.5 4V9M6 8V22L14.5 18V9M6 8L14.5 9M18 12V17L14.5 18" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// =============================================================================
// Helper Functions
// =============================================================================

const getHpBarClass = (percent: number): string => {
  if (percent <= 20) return styles.hpBarDanger;
  if (percent <= 40) return styles.hpBarWarning;
  return '';
};

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`;
  }
  return num.toLocaleString();
};

const getRankClass = (index: number): string => {
  switch (index) {
    case 0: return styles.rank1;
    case 1: return styles.rank2;
    case 2: return styles.rank3;
    default: return styles.rankOther;
  }
};

// =============================================================================
// Component
// =============================================================================

export function ConflictProgressBar({
  data,
  mode = 'default',
  hideHp = false,
  hideConflict = false,
  className,
  onClick
}: ConflictProgressBarProps) {
  if (!data) {
    return (
      <div className={cn(styles.container, styles.noConflict, className)}>
        데이터를 불러오는 중...
      </div>
    );
  }

  const containerClass = cn(
    styles.container,
    mode === 'compact' && styles.compact,
    mode === 'mini' && styles.mini,
    data.isUnderSiege && styles.underSiege,
    className
  );

  return (
    <div className={containerClass} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.cityInfo}>
          {data.isUnderSiege && <SiegeIcon />}
          <span className={styles.cityName}>{data.cityName}</span>
        </div>
        {data.defenderNationId > 0 && (
          <span className={styles.defenderBadge}>{data.defenderNationName}</span>
        )}
      </div>

      {/* HP Section */}
      {!hideHp && (
        <div className={styles.hpSection}>
          {/* City HP */}
          <div className={styles.hpRow}>
            <span className={styles.hpLabel}>방어</span>
            <div className={styles.hpBarContainer}>
              <div 
                className={cn(styles.hpBar, styles.hpBarCity, getHpBarClass(data.cityHpPercent))}
                style={{ width: `${data.cityHpPercent}%` }}
              />
            </div>
            <span className={styles.hpValue}>
              {formatNumber(data.cityHp)} / {formatNumber(data.cityMaxHp)}
            </span>
          </div>

          {/* Wall HP */}
          <div className={styles.hpRow}>
            <span className={styles.hpLabel}>성벽</span>
            <div className={styles.hpBarContainer}>
              <div 
                className={cn(styles.hpBar, styles.hpBarWall, getHpBarClass(data.wallHpPercent))}
                style={{ width: `${data.wallHpPercent}%` }}
              />
            </div>
            <span className={styles.hpValue}>
              {formatNumber(data.wallHp)} / {formatNumber(data.wallMaxHp)}
            </span>
          </div>

          {/* Gate HP */}
          <div className={styles.hpRow}>
            <span className={styles.hpLabel}>성문</span>
            <div className={styles.hpBarContainer}>
              <div 
                className={cn(styles.hpBar, styles.hpBarGate, getHpBarClass(data.gateHpPercent))}
                style={{ width: `${data.gateHpPercent}%` }}
              />
            </div>
            <span className={styles.hpValue}>
              {formatNumber(data.gateHp)} / {formatNumber(data.gateMaxHp)}
            </span>
          </div>
        </div>
      )}

      {/* Conflict Section */}
      {!hideConflict && data.participants.length > 0 && (
        <div className={styles.conflictSection}>
          <div className={styles.conflictHeader}>
            <span className={styles.conflictTitle}>
              <ConflictIcon />
              분쟁 참여국
            </span>
            <span className={styles.totalDamage}>
              총 피해: {formatNumber(data.totalDamage)}
            </span>
          </div>

          <div className={styles.participantList}>
            {data.participants.slice(0, 5).map((participant, index) => (
              <div key={participant.nationId} className={styles.participantRow}>
                <span className={cn(styles.participantRank, getRankClass(index))}>
                  {index + 1}
                </span>
                <div 
                  className={styles.nationColor}
                  style={{ backgroundColor: participant.color || '#666' }}
                />
                <span className={styles.nationName}>{participant.nationName}</span>
                <div className={styles.contributionBarContainer}>
                  <div 
                    className={styles.contributionBar}
                    style={{ 
                      width: `${participant.percentage}%`,
                      backgroundColor: participant.color || '#666'
                    }}
                  />
                </div>
                <span className={styles.contributionPercent}>
                  {participant.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Estimated Winner */}
          {data.estimatedConqueror && (
            <div className={styles.estimatedWinner}>
              <span className={styles.winnerLabel}>예상 점령:</span>
              <div className={styles.winnerNation}>
                <div 
                  className={styles.nationColor}
                  style={{ backgroundColor: data.estimatedConqueror.color || '#ffd700' }}
                />
                {data.estimatedConqueror.nationName}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Conflict Message */}
      {!hideConflict && data.participants.length === 0 && !data.isUnderSiege && (
        <div className={styles.noConflict}>
          현재 분쟁 중인 세력이 없습니다
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ConflictProgressList - 여러 도시의 분쟁 진행 상황 표시
// =============================================================================

export interface ConflictProgressListProps {
  /** 분쟁 도시 목록 */
  conflicts: BattleProgress[];
  /** 표시 모드 */
  mode?: 'default' | 'compact' | 'mini';
  /** 최대 표시 개수 */
  maxItems?: number;
  /** 도시 클릭 핸들러 */
  onCityClick?: (cityId: number) => void;
  /** 추가 클래스 */
  className?: string;
}

export function ConflictProgressList({
  conflicts,
  mode = 'compact',
  maxItems = 5,
  onCityClick,
  className
}: ConflictProgressListProps) {
  const displayConflicts = conflicts.slice(0, maxItems);

  if (conflicts.length === 0) {
    return (
      <div className={cn(styles.container, styles.noConflict, className)}>
        현재 분쟁 중인 도시가 없습니다
      </div>
    );
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {displayConflicts.map((conflict) => (
        <ConflictProgressBar
          key={conflict.cityId}
          data={conflict}
          mode={mode}
          onClick={onCityClick ? () => onCityClick(conflict.cityId) : undefined}
        />
      ))}
      {conflicts.length > maxItems && (
        <div className={styles.noConflict}>
          +{conflicts.length - maxItems}개 더 보기
        </div>
      )}
    </div>
  );
}

// =============================================================================
// useConflictProgress Hook - API 연동
// =============================================================================

export interface UseConflictProgressOptions {
  sessionId: string;
  cityId?: number;
  pollingInterval?: number;
  enabled?: boolean;
}

export function useConflictProgress({
  sessionId,
  cityId,
  pollingInterval = 5000,
  enabled = true
}: UseConflictProgressOptions) {
  const [data, setData] = useState<BattleProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!sessionId || !cityId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/battle/conflict/${sessionId}/${cityId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conflict progress');
      }
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, cityId]);

  useEffect(() => {
    if (!enabled || !sessionId || !cityId) return;

    fetchProgress();

    if (pollingInterval > 0) {
      const interval = setInterval(fetchProgress, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [enabled, sessionId, cityId, pollingInterval, fetchProgress]);

  return { data, loading, error, refetch: fetchProgress };
}

export function useAllConflicts({
  sessionId,
  pollingInterval = 10000,
  enabled = true
}: Omit<UseConflictProgressOptions, 'cityId'>) {
  const [data, setData] = useState<BattleProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConflicts = useCallback(async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/battle/conflict?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conflicts');
      }
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    fetchConflicts();

    if (pollingInterval > 0) {
      const interval = setInterval(fetchConflicts, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [enabled, sessionId, pollingInterval, fetchConflicts]);

  return { data, loading, error, refetch: fetchConflicts };
}

export default ConflictProgressBar;



