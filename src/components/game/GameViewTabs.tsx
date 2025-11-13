'use client';

import React, { useState } from 'react';
import TacticalMapPanel from './TacticalMapPanel';
import BattleLogPanel from './BattleLogPanel';
import MapViewer from './MapViewer';
import styles from './GameViewTabs.module.css';

/**
 * 게임 뷰 탭
 * - 전략 맵
 * - 전술 맵 (로그 오버레이 포함)
 */

export type TabType = 'map' | 'tactical';

interface Props {
  serverID: string;
  generalId?: number;
  cityId?: number;
  cityName?: string;
  mapData: any;
  onCityClick?: (cityId: number) => void;
}

export default function GameViewTabs({ 
  serverID, 
  generalId, 
  cityId, 
  cityName,
  mapData, 
  onCityClick 
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('map');

  return (
    <div className={styles.container}>
      {/* 탭 헤더 */}
      <div className={styles.tabHeader}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'map' ? styles.active : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <span className={styles.tabIcon}>🗺️</span>
          <span className={styles.tabLabel}>전략 맵</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'tactical' ? styles.active : ''}`}
          onClick={() => setActiveTab('tactical')}
        >
          <span className={styles.tabIcon}>⚔️</span>
          <span className={styles.tabLabel}>전술 맵</span>
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className={styles.tabContent}>
        {activeTab === 'map' && (
          <div className={styles.mapWrapper}>
            <MapViewer
              serverID={serverID}
              mapData={mapData}
              myCity={cityId}
              onCityClick={onCityClick}
              isFullWidth={true}
            />
          </div>
        )}

        {activeTab === 'tactical' && (
          <TacticalMapPanel
            serverID={serverID}
            generalId={generalId}
            cityId={cityId}
            cityName={cityName}
          />
        )}
      </div>
    </div>
  );
}
