'use client';

import React from 'react';
import styles from './BattleResultLog.module.css';

// 전투 결과 타입 정의
export interface BattleLogEntry {
  id: string;
  type: 'phase' | 'attack' | 'damage' | 'skill' | 'critical' | 'death' | 'result' | 'info';
  text: string;
  timestamp?: string;
}

export interface BattleUnitResult {
  generalId: number;
  generalName: string;
  nationName: string;
  nationColor: string;
  unitType: string;
  crewBefore: number;
  crewAfter: number;
  killed: number;
  dead: number;
  isWinner: boolean;
  isAttacker: boolean;
}

export interface BattleResult {
  battleId: string;
  datetime: string;
  location: string;
  phase: number;
  attacker: BattleUnitResult;
  defender: BattleUnitResult;
  detailLog: BattleLogEntry[];
  resultLog: BattleLogEntry[];
  winner: 'attacker' | 'defender' | 'draw';
}

interface BattleResultLogProps {
  result: BattleResult;
  showDetail?: boolean;
}

// 로그 텍스트 파싱 (PHP 스타일 태그 변환)
function parseLogText(text: string): React.ReactNode {
  // PHP 스타일 컬러 태그 변환: <Y>텍스트</> -> <span style="color:yellow">텍스트</span>
  const colorMap: Record<string, string> = {
    'Y': '#ffcc00',  // 노랑
    'C': '#00ccff',  // 하늘색
    'R': '#ff4444',  // 빨강
    'G': '#44ff44',  // 초록
    'M': '#ff44ff',  // 마젠타
    'S': '#ff8800',  // 주황
    'W': '#ffffff',  // 흰색
    'B': '#4488ff',  // 파랑
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
}

export default function BattleResultLog({ result, showDetail = true }: BattleResultLogProps) {
  const { attacker, defender, detailLog, resultLog, winner, phase, datetime, location } = result;

  return (
    <div className={styles.battleResultContainer}>
      {/* 전투 헤더 */}
      <div className={styles.battleHeader}>
        <div className={styles.battleTitle}>⚔️ 전투 결과</div>
        <div className={styles.battleMeta}>
          <span>{datetime}</span>
          <span className={styles.separator}>|</span>
          <span>{location}</span>
          <span className={styles.separator}>|</span>
          <span>{phase}합</span>
        </div>
      </div>

      {/* 양측 정보 */}
      <div className={styles.unitsContainer}>
        {/* 공격측 */}
        <div className={`${styles.unitCard} ${styles.attacker} ${winner === 'attacker' ? styles.winner : ''}`}>
          <div className={styles.unitHeader}>
            <span className={styles.roleTag}>공격</span>
            {winner === 'attacker' && <span className={styles.winnerTag}>승리</span>}
          </div>
          <div className={styles.generalName} style={{ color: attacker.nationColor }}>
            {attacker.generalName}
          </div>
          <div className={styles.nationName}>{attacker.nationName}</div>
          <div className={styles.unitType}>{attacker.unitType}</div>
          <div className={styles.crewInfo}>
            <div className={styles.crewRow}>
              <span className={styles.crewLabel}>병력</span>
              <span className={styles.crewValue}>
                {attacker.crewBefore.toLocaleString()} → {attacker.crewAfter.toLocaleString()}
              </span>
            </div>
            <div className={styles.crewRow}>
              <span className={styles.crewLabel}>살상</span>
              <span className={styles.killValue}>{attacker.killed.toLocaleString()}</span>
            </div>
            <div className={styles.crewRow}>
              <span className={styles.crewLabel}>손실</span>
              <span className={styles.deadValue}>{attacker.dead.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* VS */}
        <div className={styles.vsContainer}>
          <span className={styles.vsText}>VS</span>
        </div>

        {/* 수비측 */}
        <div className={`${styles.unitCard} ${styles.defender} ${winner === 'defender' ? styles.winner : ''}`}>
          <div className={styles.unitHeader}>
            <span className={styles.roleTag}>수비</span>
            {winner === 'defender' && <span className={styles.winnerTag}>승리</span>}
          </div>
          <div className={styles.generalName} style={{ color: defender.nationColor }}>
            {defender.generalName}
          </div>
          <div className={styles.nationName}>{defender.nationName}</div>
          <div className={styles.unitType}>{defender.unitType}</div>
          <div className={styles.crewInfo}>
            <div className={styles.crewRow}>
              <span className={styles.crewLabel}>병력</span>
              <span className={styles.crewValue}>
                {defender.crewBefore.toLocaleString()} → {defender.crewAfter.toLocaleString()}
              </span>
            </div>
            <div className={styles.crewRow}>
              <span className={styles.crewLabel}>살상</span>
              <span className={styles.killValue}>{defender.killed.toLocaleString()}</span>
            </div>
            <div className={styles.crewRow}>
              <span className={styles.crewLabel}>손실</span>
              <span className={styles.deadValue}>{defender.dead.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 전투 결과 요약 */}
      <div className={styles.resultSummary}>
        <div className={styles.sectionTitle}>📜 전투 결과</div>
        <div className={styles.logContainer}>
          {resultLog.map((log) => (
            <div key={log.id} className={`${styles.logEntry} ${styles[log.type]}`}>
              {parseLogText(log.text)}
            </div>
          ))}
        </div>
      </div>

      {/* 전투 상세 로그 (접기/펼치기) */}
      {showDetail && detailLog.length > 0 && (
        <details className={styles.detailSection}>
          <summary className={styles.detailSummary}>
            📋 전투 상세 기록 ({detailLog.length}줄)
          </summary>
          <div className={styles.logContainer}>
            {detailLog.map((log) => (
              <div key={log.id} className={`${styles.logEntry} ${styles[log.type]}`}>
                {parseLogText(log.text)}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// 전투 결과 목록 컴포넌트
interface BattleResultListProps {
  results: BattleResult[];
  title?: string;
  maxItems?: number;
  onLoadMore?: () => void;
}

export function BattleResultList({ 
  results, 
  title = '전투 기록', 
  maxItems = 10,
  onLoadMore 
}: BattleResultListProps) {
  const displayResults = results.slice(0, maxItems);

  return (
    <div className={styles.battleListContainer}>
      <div className={styles.listHeader}>
        <h3>{title}</h3>
        <span className={styles.count}>{results.length}건</span>
      </div>
      
      {displayResults.length === 0 ? (
        <div className={styles.emptyMessage}>전투 기록이 없습니다.</div>
      ) : (
        <div className={styles.battleList}>
          {displayResults.map((result) => (
            <BattleResultLog key={result.battleId} result={result} showDetail={false} />
          ))}
        </div>
      )}

      {onLoadMore && results.length > maxItems && (
        <button className={styles.loadMoreButton} onClick={onLoadMore}>
          이전 로그 불러오기
        </button>
      )}
    </div>
  );
}




