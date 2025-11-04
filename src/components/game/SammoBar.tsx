'use client';

import React from 'react';
import styles from './SammoBar.module.css';

interface SammoBarProps {
  height: 7 | 10;
  width?: string;
  percent: number;
  altText?: string;
}

export default function SammoBar({ height, width, percent, altText }: SammoBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const tooltipText = altText || `${percent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;

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
        }}
      />
      <div
        className={styles.sammoBarIn}
        style={{
          width: `${clampedPercent}%`,
          height: `${height}px`,
        }}
      />
    </div>
  );
}




