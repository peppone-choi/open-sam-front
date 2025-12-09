'use client';

import React from 'react';
import MapViewer from './MapViewer';
import styles from './GameViewTabs.module.css';

/**
 * 게임 뷰 - 전략 맵
 * 전체 세계 지도 (도시들, 세력 분포)
 */

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
  cityId, 
  mapData, 
  onCityClick 
}: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.tabContent}>
        <div className={styles.mapWrapper}>
          <MapViewer
            serverID={serverID}
            mapData={mapData}
            myCity={cityId}
            onCityClick={onCityClick}
            isFullWidth={true}
          />
        </div>
      </div>
    </div>
  );
}
