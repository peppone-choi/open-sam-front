'use client';

import React from 'react';
import styles from './NationBasicCard.module.css';

interface NationBasicCardProps {
  nation: {
    id: number;
    name: string;
    color: string;
    [key: string]: any;
  };
  global: {
    [key: string]: any;
  };
}

function isBrightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

export default function NationBasicCard({ nation, global }: NationBasicCardProps) {
  const textColor = isBrightColor(nation.color) ? 'black' : 'white';

  return (
    <div className={`${styles.nationCardBasic} bg2`}>
      <div
        className={styles.name}
        style={{
          backgroundColor: nation.color,
          color: textColor,
          fontWeight: 'bold',
        }}
      >
        {nation.name}
      </div>
      <div className={`${styles.typeHead} ${styles.tbHead} bg1`}>성향</div>
      <div className={`${styles.typeBody} ${styles.tbBody}`}>-</div>
      <div className={`${styles.c12Head} ${styles.tbHead} bg1`}>-</div>
      <div className={`${styles.c12Body} ${styles.tbBody}`}>-</div>
      <div className={`${styles.c11Head} ${styles.tbHead} bg1`}>-</div>
      <div className={`${styles.c11Body} ${styles.tbBody}`}>-</div>
      <div className={`${styles.popHead} ${styles.tbHead} bg1`}>총 주민</div>
      <div className={`${styles.popBody} ${styles.tbBody}`}>
        {nation.id ? '-' : '해당 없음'}
      </div>
      <div className={`${styles.crewHead} ${styles.tbHead} bg1`}>총 병사</div>
      <div className={`${styles.crewBody} ${styles.tbBody}`}>
        {nation.id ? '-' : '해당 없음'}
      </div>
      <div className={`${styles.goldHead} ${styles.tbHead} bg1`}>국고</div>
      <div className={`${styles.goldBody} ${styles.tbBody}`}>
        {nation.id ? '-' : '해당 없음'}
      </div>
      <div className={`${styles.riceHead} ${styles.tbHead} bg1`}>병량</div>
      <div className={`${styles.riceBody} ${styles.tbBody}`}>
        {nation.id ? '-' : '해당 없음'}
      </div>
    </div>
  );
}
