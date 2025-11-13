'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import styles from './BattleLogPanel.module.css';

/**
 * 전투 로그 패널
 * - 실시간 전투 로그 표시
 * - 자동 스크롤
 */

interface LogEntry {
  id: number;
  text: string;
  type: 'action' | 'damage' | 'status' | 'result' | 'general' | 'history';
  timestamp: Date;
  generalId?: number;
}

interface Props {
  serverID: string;
  generalId?: number;
}

export default function BattleLogPanel({ serverID, generalId }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'battle' | 'general' | 'global'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Socket.IO
  const { socket, onLogUpdate } = useSocket({ sessionId: serverID, autoConnect: true });

  // 초기 로그 로딩
  useEffect(() => {
    const loadInitialLogs = async () => {
      if (!serverID || !generalId) return;
      
      setIsLoadingLogs(true);
      try {
        // 장수 동향 로드
        const generalLogsRes = await fetch(
          `/api/game/logs/general?sessionId=${serverID}&generalId=${generalId}&limit=100`
        );
        if (generalLogsRes.ok) {
          const data = await generalLogsRes.json();
          if (data.result && data.logs) {
            const generalLogs: LogEntry[] = data.logs.map((log: any) => ({
              id: log.id || Date.now(),
              text: log.text,
              type: 'general',
              timestamp: new Date(log.timestamp),
              generalId: log.generalId
            }));
            setLogs(prev => [...generalLogs, ...prev]);
          }
        }

        // 중원 정세 로드
        const globalLogsRes = await fetch(
          `/api/game/logs/global?sessionId=${serverID}&limit=100`
        );
        if (globalLogsRes.ok) {
          const data = await globalLogsRes.json();
          if (data.result && data.logs) {
            const globalLogs: LogEntry[] = data.logs.map((log: any) => ({
              id: log.id || Date.now(),
              text: log.text,
              type: 'history',
              timestamp: new Date(log.timestamp),
              generalId: 0
            }));
            setLogs(prev => [...globalLogs, ...prev]);
          }
        }

        // 시간순 정렬
        setLogs(prev => prev.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      } catch (error) {
        console.error('로그 로딩 실패:', error);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    loadInitialLogs();
  }, [serverID, generalId]);

  // 로그 업데이트 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    // 전투 로그 핸들러
    const handleBattleLog = (data: any) => {
      const newLog: LogEntry = {
        id: Date.now(),
        text: data.logText,
        type: data.logType || 'action',
        timestamp: new Date(data.timestamp),
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 200)); // 최대 200개
    };

    socket.on('battle:log', handleBattleLog);

    // 일반 게임 로그 (장수동향, 개인기록, 중원정세)
    const cleanupGameLog = onLogUpdate((data) => {
      const newLog: LogEntry = {
        id: data.logId,
        text: data.logText,
        type: data.logType === 'action' ? 'general' : 'history',
        timestamp: new Date(data.timestamp),
        generalId: data.generalId,
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 200));
    });

    return () => {
      socket.off('battle:log', handleBattleLog);
      cleanupGameLog();
    };
  }, [socket, onLogUpdate]);

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  // 로그 필터링
  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'battle') return ['action', 'damage', 'status', 'result'].includes(log.type);
    if (filter === 'general') return log.type === 'general' && log.generalId === generalId;
    if (filter === 'global') return log.type === 'history' && log.generalId === 0;
    return true;
  });

  // 로그 색상
  const getLogColor = (type: string): string => {
    switch (type) {
      case 'action': return '#4A90E2'; // 파랑
      case 'damage': return '#E24A4A'; // 빨강
      case 'status': return '#F5A623'; // 주황
      case 'result': return '#7ED321'; // 초록
      case 'general': return '#9013FE'; // 보라
      case 'history': return '#50E3C2'; // 청록
      default: return '#4A4A4A';
    }
  };

  // 로그 타입 이름
  const getLogTypeName = (type: string): string => {
    switch (type) {
      case 'action': return '행동';
      case 'damage': return '피해';
      case 'status': return '상태';
      case 'result': return '결과';
      case 'general': return '장수';
      case 'history': return '정세';
      default: return '기타';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>📜 게임 로그</h3>
        <div className={styles.controls}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">전체 로그</option>
            <option value="battle">전투 로그</option>
            <option value="general">장수 동향</option>
            <option value="global">중원 정세</option>
          </select>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`${styles.autoScrollBtn} ${autoScroll ? styles.active : ''}`}
            title={autoScroll ? '자동 스크롤 끄기' : '자동 스크롤 켜기'}
          >
            {autoScroll ? '🔽' : '⏸️'}
          </button>
          <button
            onClick={() => setLogs([])}
            className={styles.clearBtn}
            title="로그 지우기"
          >
            🗑️
          </button>
        </div>
      </div>
      <div 
        ref={logContainerRef}
        className={styles.logContainer}
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          // 스크롤이 최상단이면 자동 스크롤 유지, 아니면 끄기
          if (target.scrollTop > 10) {
            setAutoScroll(false);
          }
        }}
      >
        {isLoadingLogs ? (
          <div className={styles.emptyState}>
            <p>⏳ 로그 로딩 중...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>📭 로그가 없습니다</p>
            <p className={styles.emptyHint}>게임 이벤트가 발생하면 여기에 표시됩니다</p>
          </div>
        ) : (
          <div className={styles.logList}>
            {filteredLogs.map((log, index) => (
              <div
                key={`${log.id}-${index}`}
                className={styles.logEntry}
                style={{ borderLeftColor: getLogColor(log.type) }}
              >
                <div className={styles.logHeader}>
                  <span 
                    className={styles.logType}
                    style={{ backgroundColor: getLogColor(log.type) }}
                  >
                    {getLogTypeName(log.type)}
                  </span>
                  <span className={styles.logTime}>
                    {log.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <div 
                  className={styles.logText}
                  dangerouslySetInnerHTML={{ 
                    __html: formatLogText(log.text) 
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <span className={styles.logCount}>
          총 {filteredLogs.length}개 로그 (최대 200개)
        </span>
      </div>
    </div>
  );
}

/**
 * 로그 텍스트 포맷팅
 * - <R>빨강</>, <B>파랑</>, <G>초록</>, <Y>노랑</> 등 색상 태그 변환
 */
function formatLogText(text: string): string {
  return text
    .replace(/<R>(.*?)<\/>/g, '<span style="color: #E24A4A; font-weight: bold;">$1</span>')
    .replace(/<B>(.*?)<\/>/g, '<span style="color: #4A90E2; font-weight: bold;">$1</span>')
    .replace(/<G>(.*?)<\/>/g, '<span style="color: #7ED321; font-weight: bold;">$1</span>')
    .replace(/<Y>(.*?)<\/>/g, '<span style="color: #F5A623; font-weight: bold;">$1</span>')
    .replace(/<S>(.*?)<\/>/g, '<span style="color: #9013FE; font-weight: bold;">$1</span>')
    .replace(/<1>(.*?)<\/>/g, '<span style="color: #888; font-style: italic;">$1</span>');
}
