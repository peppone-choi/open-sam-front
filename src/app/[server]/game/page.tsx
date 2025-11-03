'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI, type GetFrontInfoResponse, type GetMapResponse } from '@/lib/api/sammo';
import MapViewer from '@/components/game/MapViewer';
import CityBasicCard from '@/components/cards/CityBasicCard';
import NationBasicCard from '@/components/cards/NationBasicCard';
import GeneralBasicCard from '@/components/cards/GeneralBasicCard';
import MainControlBar from '@/components/game/MainControlBar';
import PartialReservedCommand from '@/components/game/PartialReservedCommand';
import styles from './page.module.css';

export default function GamePage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [frontInfo, setFrontInfo] = useState<GetFrontInfoResponse | null>(null);
  const [mapData, setMapData] = useState<GetMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [frontInfoData, mapDataResponse] = await Promise.all([
        SammoAPI.GeneralGetFrontInfo({
          serverID,
          lastNationNoticeDate: new Date().toISOString(),
          lastGeneralRecordID: 0,
          lastWorldHistoryID: 0,
        }),
        SammoAPI.GlobalGetMap({ serverID }),
      ]);

      setFrontInfo(frontInfoData);
      setMapData(mapDataResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
    }
    loadData();
  }, [serverID]);

  function handleCityClick() {
    // 도시 클릭 시 데이터 갱신
    if (serverID) {
      window.location.reload();
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="center" style={{ padding: '2rem' }}>
          서버 갱신 중입니다.
        </div>
      </div>
    );
  }

  if (error || !frontInfo) {
    return (
      <div className={styles.container}>
        <div className="center" style={{ padding: '2rem', color: 'red' }}>
          {error || '데이터를 불러올 수 없습니다.'}
        </div>
      </div>
    );
  }

  const showSecret = frontInfo.general.permission >= 1 || frontInfo.general.officerLevel >= 2;

  return (
    <div className={styles.container}>
      <div id="ingameBoard" className={styles.ingameBoard}>
        <div className={styles.mapView}>
          {mapData && (
            <MapViewer
              serverID={serverID}
              mapData={mapData}
              myCity={frontInfo.general.city}
              onCityClick={handleCityClick}
            />
          )}
        </div>

        <div className={styles.reservedCommandZone}>
          <PartialReservedCommand
            generalID={frontInfo.general.no}
            serverID={serverID}
          />
        </div>

        {frontInfo.city && (
          <div className={styles.cityInfo}>
            <CityBasicCard city={frontInfo.city} />
          </div>
        )}

        {frontInfo.nation && (
          <div className={styles.nationInfo}>
            <NationBasicCard nation={frontInfo.nation} global={frontInfo.global} />
          </div>
        )}

        {frontInfo.general && frontInfo.nation && (
          <div className={styles.generalInfo}>
            <GeneralBasicCard
              general={frontInfo.general}
              nation={frontInfo.nation}
              troopInfo={frontInfo.general.reservedCommand ? undefined : undefined}
            />
          </div>
        )}

        <div className={styles.generalCommandToolbar}>
          {frontInfo.general && frontInfo.nation && (
            <MainControlBar
              permission={frontInfo.general.permission}
              showSecret={showSecret}
              myLevel={frontInfo.general.officerLevel}
              nationLevel={frontInfo.nation.level}
              nationColor={frontInfo.nation.color.substring(1, 7)}
              isTournamentApplicationOpen={frontInfo.global.isTournamentApplicationOpen}
              isBettingActive={frontInfo.global.isBettingActive}
            />
          )}
        </div>
      </div>
    </div>
  );
}
