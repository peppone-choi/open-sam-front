'use client';

import React, { useState, useEffect, useRef } from 'react';
import { type GetMapResponse } from '@/lib/api/sammo';
import styles from './MapViewer.module.css';

interface MapViewerProps {
  serverID: string;
  mapData: GetMapResponse;
  myCity?: number;
  onCityClick?: (cityId: number) => void;
}

export default function MapViewer({ serverID, mapData, myCity, onCityClick }: MapViewerProps) {
  const [hideCityName, setHideCityName] = useState(false);
  const [activatedCity, setActivatedCity] = useState<{
    id: number;
    text: string;
    nation: string;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const mapBodyRef = useRef<HTMLDivElement>(null);

  function handleCityClick(cityId: number) {
    if (onCityClick) {
      onCityClick(cityId);
    }
  }

  function handleCityMouseEnter(e: React.MouseEvent, cityId: number) {
    // 툴팁 표시 로직
    setTooltipPosition({ x: e.clientX, y: e.clientY });
    // cityId로 도시 정보 찾기
    setActivatedCity({
      id: cityId,
      text: `도시 ${cityId}`,
      nation: '국가',
    });
  }

  function handleCityMouseLeave() {
    setActivatedCity(null);
  }

  return (
    <div className={`${styles.worldMap} map_detail`}>
      <div className={styles.mapTitle}>
        <span className={styles.mapTitleText}>
          {mapData.year}年 {mapData.month}月
        </span>
      </div>
      <div ref={mapBodyRef} className={styles.mapBody}>
        <div className={styles.mapBglayer1}></div>
        <div className={styles.mapBglayer2}></div>
        <div className={styles.mapBgroad}></div>
        <div className={styles.mapButtonStack}>
          <button
            type="button"
            className={`btn btn-primary btn-sm btn-minimum ${hideCityName ? 'active' : ''}`}
            onClick={() => setHideCityName(!hideCityName)}
          >
            도시명 표기
          </button>
        </div>
        {/* 도시 마커들 */}
      </div>
      {activatedCity && (
        <div
          className={styles.cityTooltip}
          style={{
            display: 'block',
            position: 'fixed',
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 30}px`,
          }}
        >
          <div className={styles.cityName}>{activatedCity.text}</div>
          <div className={styles.nationName}>{activatedCity.nation}</div>
        </div>
      )}
    </div>
  );
}
