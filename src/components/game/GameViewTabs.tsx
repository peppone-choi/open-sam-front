'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import MapViewer from './MapViewer';
import styles from './GameViewTabs.module.css';

// Voxel 기반 전술맵 (SSR 비활성화)
const VoxelTacticalMapPanel = dynamic(
  () => import('./VoxelTacticalMapPanel'),
  { 
    ssr: false,
    loading: () => (
      <div className={styles.tacticalLoading}>
        <div className={styles.loadingSpinner}></div>
        <p>🎮 전술맵 로딩 중...</p>
      </div>
    )
  }
);

/**
 * 게임 뷰 탭
 * - 전략 맵: 전체 세계 지도 (도시들, 세력 분포)
 * - 전술 맵: 현재 성의 상태 (주둔 부대, 전투 시 실시간 전투)
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

  // 키보드 네비게이션: 좌우 화살표로 탭 전환
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTab(prev => prev === 'map' ? 'tactical' : 'map');
    }
  };

  return (
    <div className={styles.container}>
      {/* 탭 전환 버튼 */}
      <div 
        className={styles.tabHeader}
        role="tablist"
        aria-label="게임 맵 뷰 전환"
      >
        <button 
          role="tab"
          id="tab-map"
          aria-selected={activeTab === 'map'}
          aria-controls="tabpanel-map"
          tabIndex={activeTab === 'map' ? 0 : -1}
          className={`${styles.tabBtn} ${activeTab === 'map' ? styles.active : ''}`}
          onClick={() => setActiveTab('map')}
          onKeyDown={handleKeyDown}
        >
          <span className={styles.tabIcon} aria-hidden="true">🗺️</span>
          <span className={styles.tabLabel}>전략</span>
        </button>
        <button 
          role="tab"
          id="tab-tactical"
          aria-selected={activeTab === 'tactical'}
          aria-controls="tabpanel-tactical"
          tabIndex={activeTab === 'tactical' ? 0 : -1}
          className={`${styles.tabBtn} ${activeTab === 'tactical' ? styles.active : ''}`}
          onClick={() => setActiveTab('tactical')}
          onKeyDown={handleKeyDown}
        >
          <span className={styles.tabIcon} aria-hidden="true">🏯</span>
          <span className={styles.tabLabel}>전술</span>
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className={styles.tabContent}>
        <div 
          role="tabpanel"
          id="tabpanel-map"
          aria-labelledby="tab-map"
          hidden={activeTab !== 'map'}
          className={styles.mapWrapper}
        >
          {activeTab === 'map' && (
            <MapViewer
              serverID={serverID}
              mapData={mapData}
              myCity={cityId}
              onCityClick={onCityClick}
              isFullWidth={true}
            />
          )}
        </div>
        <div 
          role="tabpanel"
          id="tabpanel-tactical"
          aria-labelledby="tab-tactical"
          hidden={activeTab !== 'tactical'}
          className={styles.tacticalWrapper}
        >
          {activeTab === 'tactical' && (
            <VoxelTacticalMapPanel
              serverID={serverID}
              generalId={generalId}
              cityId={cityId}
              cityName={cityName}
            />
          )}
        </div>
      </div>
    </div>
  );
}
