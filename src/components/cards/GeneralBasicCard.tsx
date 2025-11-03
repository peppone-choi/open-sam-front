'use client';

import React from 'react';
import SammoBar from '../game/SammoBar';
import styles from './GeneralBasicCard.module.css';

interface GeneralBasicCardProps {
  general: {
    no: number;
    name: string;
    officerLevel: number;
    officerLevelText: string;
    [key: string]: any;
  };
  nation: {
    id: number;
    name: string;
    color: string;
    [key: string]: any;
  };
  troopInfo?: any;
}

function isBrightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

export default function GeneralBasicCard({ general, nation }: GeneralBasicCardProps) {
  const textColor = isBrightColor(nation.color) ? '#000' : '#fff';

  return (
    <div className={`${styles.generalCardBasic} bg2`}>
      <div className={styles.generalIcon}></div>
      <div
        className={styles.generalName}
        style={{
          color: textColor,
          backgroundColor: nation.color,
        }}
      >
        {general.name} 【 {general.officerLevelText} 】 
      </div>
      <div className="bg1">통솔</div>
      <div>
        <div style={{ display: 'flex' }}>
          <div>{general.leadership || '-'}</div>
          <div style={{ flex: 1, marginLeft: '0.5rem' }}>
            <SammoBar height={10} percent={0} />
          </div>
        </div>
      </div>
      <div className="bg1">무력</div>
      <div>{general.strength || '-'}</div>
      <div className="bg1">지력</div>
      <div>{general.intel || '-'}</div>
    </div>
  );
}
