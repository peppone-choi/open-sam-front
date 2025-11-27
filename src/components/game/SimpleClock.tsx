'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SimpleClockProps {
  /** 서버 시간 (클라이언트와의 시간차 계산용) */
  serverTime?: Date;
  /** 시간 포맷 (기본: 'HH:mm:ss') */
  timeFormat?: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 시간 포맷팅 함수 (Vue의 formatTime과 동일)
 */
function formatTime(date: Date, format: string): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return format
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day);
}

/**
 * SimpleClock - 서버 시간 기준 실시간 시계
 * Vue의 SimpleClock.vue와 동등한 기능 제공
 * 
 * 서버 시간과 클라이언트 시간의 차이를 계산하여
 * 서버 기준 시간을 실시간으로 표시합니다.
 */
export default function SimpleClock({ 
  serverTime = new Date(), 
  timeFormat = 'HH:mm:ss',
  className = ''
}: SimpleClockProps) {
  const [displayTime, setDisplayTime] = useState('');
  const timeDiffRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 서버 시간과 클라이언트 시간의 차이 계산
  useEffect(() => {
    const clientNow = new Date();
    timeDiffRef.current = serverTime.getTime() - clientNow.getTime();
  }, [serverTime]);

  // 1초마다 시간 업데이트
  useEffect(() => {
    const updateNow = () => {
      const serverNow = new Date(Date.now() + timeDiffRef.current);
      setDisplayTime(formatTime(serverNow, timeFormat));
      
      // 다음 초의 시작에 맞춰 타이머 설정 (정확한 초 단위 업데이트)
      const delay = 1000 - serverNow.getMilliseconds();
      timerRef.current = setTimeout(updateNow, delay);
    };

    // 초기 실행
    updateNow();

    // 클린업
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeFormat]);

  return (
    <span className={`time-zone ${className}`}>
      {displayTime}
    </span>
  );
}

