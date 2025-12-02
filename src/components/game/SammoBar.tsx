'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './SammoBar.module.css';

interface SammoBarProps {
  height: 7 | 8 | 10;
  width?: string;
  percent: number;
  altText?: string;
  barColor?: string; // 바 색상 (국가색)
  animated?: boolean; // 애니메이션 활성화
  showValue?: boolean; // 퍼센트 값 표시
  label?: string; // 라벨 텍스트
}

export default function SammoBar({ 
  height, 
  width, 
  percent, 
  altText, 
  barColor,
  animated = false,
  showValue = false,
  label,
}: SammoBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const tooltipText = altText || `${percent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  
  // 이전 값 추적 (레벨업 효과용)
  const prevPercentRef = useRef(clampedPercent);
  const [isLevelUp, setIsLevelUp] = useState(false);
  
  useEffect(() => {
    // 값이 증가했으면 레벨업 효과
    if (clampedPercent > prevPercentRef.current && prevPercentRef.current > 0) {
      setIsLevelUp(true);
      const timer = setTimeout(() => setIsLevelUp(false), 600);
      return () => clearTimeout(timer);
    }
    prevPercentRef.current = clampedPercent;
  }, [clampedPercent]);

  const barClassName = [
    styles.sammoBarIn,
    animated && styles.animated,
    isLevelUp && styles.levelUp,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={styles.sammoBar}
      style={{
        height: `${height + 2}px`,
        width: width || '100%',
      }}
      title={tooltipText}
    >
      <div
        className={styles.sammoBarBase}
        style={{
          height: `${height}px`,
          backgroundColor: barColor ? `${barColor}20` : undefined,
        }}
      />
      <div
        className={barClassName}
        style={{
          width: `${clampedPercent}%`,
          height: `${height}px`,
          backgroundColor: barColor ? `${barColor}80` : undefined,
          '--target-width': `${clampedPercent}%`,
        } as React.CSSProperties}
      />
      {showValue && (
        <span 
          style={{
            position: 'absolute',
            right: '2px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '8px',
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            zIndex: 1,
          }}
        >
          {Math.round(clampedPercent)}%
        </span>
      )}
    </div>
  );
}




