'use client';
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
  // 삼국지 모드(현재 기본)에서는 전술맵 탭을 제거하고 전략맵만 표시
  const activeTab: TabType = 'map';

  return (
    <div className={styles.container}>
      {/* 탭 헤더 제거 (단일 뷰 강제) */}
      {/* <div className={styles.tabHeader}> ... </div> */}

      {/* 탭 컨텐츠 (항상 전략 맵) */}
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
