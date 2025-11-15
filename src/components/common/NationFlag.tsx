'use client';

import React from 'react';
import { adjustColorForText } from '@/types/colorSystem';
import styles from './NationFlag.module.css';

interface NationFlagProps {
  nation: {
    name: string;
    color?: string;
    flagImage?: string;
    flagTextColor?: string;
    flagBgColor?: string;
    flagBorderColor?: string;
  };
  size?: number; // 깃발 크기 (기본 20px)
  showName?: boolean; // 국가명 표시 여부 (기본 true)
  className?: string;
}

// 배경색 밝기 기반으로 텍스트 색상 자동 결정
// 밝은 배경일 경우 검은색 우선 (가독성 향상)
const getContrastTextColor = (bgColor: string): string => {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // 밝기 계산 (0-255 범위)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  // 밝기 150 이상이면 검은색, 미만이면 흰색 (검은색 우선)
  return brightness >= 150 ? '#000000' : '#ffffff';
};

// 배경색 밝기 기반으로 테두리 색상 자동 결정
// 매우 밝은 배경일 경우 어두운 테두리 (가시성 확보)
const getContrastBorderColor = (bgColor: string): string => {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  // 밝기 200 이상이면 어두운 테두리, 미만이면 밝은 테두리
  return brightness >= 200 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)';
};

export default function NationFlag({ 
  nation, 
  size = 20, 
  showName = true,
  className 
}: NationFlagProps) {
  const originalColor = nation.flagBgColor || nation.color || '#ffffff';
  
  // 밝은 색상이면 자동으로 어둡게 보정
  const flagBgColor = adjustColorForText(originalColor);
  
  // 보정된 배경색은 항상 어두우므로 흰색 글자
  const flagTextColor = nation.flagTextColor || '#ffffff';
  
  const flagBorderColor = nation.flagBorderColor || getContrastBorderColor(flagBgColor);

  return (
    <span className={`${styles.nationFlagContainer} ${className || ''}`}>
      <span 
        className={styles.flagIcon}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: flagBgColor,
          color: flagTextColor,
          borderColor: flagBorderColor,
          fontSize: `${size * 0.6}px`,
          backgroundImage: nation.flagImage ? `url(${nation.flagImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!nation.flagImage && nation.name.charAt(0)}
      </span>
      {showName && <span className={styles.nationName}>{nation.name}</span>}
    </span>
  );
}
