'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI, type GetFrontInfoResponse, type GetMapResponse } from '@/lib/api/sammo';
import MapViewer from '@/components/game/MapViewer';
import CityBasicCard from '@/components/cards/CityBasicCard';
import NationBasicCard from '@/components/cards/NationBasicCard';
import GeneralBasicCard from '@/components/cards/GeneralBasicCard';
import MainControlBar from '@/components/game/MainControlBar';
import PartialReservedCommand from '@/components/game/PartialReservedCommand';
import GameInfoPanel from '@/components/game/GameInfoPanel';
import MessagePanel from '@/components/game/MessagePanel';
import GlobalMenu from '@/components/game/GlobalMenu';
import { useSocket } from '@/hooks/useSocket';
import styles from './page.module.css';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;

  const [frontInfo, setFrontInfo] = useState<GetFrontInfoResponse | null>(null);
  const [mapData, setMapData] = useState<GetMapResponse | null>(null);
  const [globalMenu, setGlobalMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Socket.IO 연결
  const { socket, isConnected, onGameEvent, onGeneralEvent, onTurnComplete } = useSocket({
    sessionId: serverID,
    autoConnect: true
  });

  // 데이터 로드 함수
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [frontInfoData, mapDataResponse, menuData] = await Promise.all([
        SammoAPI.GeneralGetFrontInfo({
          serverID,
          lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          lastGeneralRecordID: 0,
          lastWorldHistoryID: 0,
        }),
        SammoAPI.GlobalGetMap({ 
          serverID,
          neutralView: 0,
          showMe: 1,
        }),
        SammoAPI.GlobalGetMenu({ serverID }).catch(() => ({ success: true, menu: [] })),
      ]);

      // 캐릭터가 없으면 에러 메시지 표시
      if (!frontInfoData.success || !frontInfoData.general || !frontInfoData.general.no) {
        setError('캐릭터가 없습니다. 캐릭터를 생성해주세요.');
        return;
      }

      setFrontInfo(frontInfoData);
      setMapData(mapDataResponse);
      if (menuData && menuData.success) {
        setGlobalMenu(menuData.menu || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [serverID]);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Socket.IO 이벤트 리스너
  useEffect(() => {
    if (!socket || !isConnected) return;

    // 턴 완료 이벤트
    const cleanupTurnComplete = onTurnComplete((data) => {
      console.log('턴 완료:', data);
      // 게임 상태 새로고침
      loadData();
    });

    // 월 변경 이벤트
    const cleanupMonthChanged = onGameEvent('month:changed', (data) => {
      console.log('월 변경:', data);
      // 게임 상태 새로고침
      loadData();
    });

    // 장수 업데이트 이벤트
    const cleanupGeneralUpdate = onGeneralEvent('updated', (data) => {
      console.log('장수 업데이트:', data);
      // 현재 장수 정보가 업데이트된 장수인 경우에만 새로고침
      if (frontInfo?.general?.no === data.generalId) {
        loadData();
      }
    });

    // 게임 상태 업데이트 이벤트
    const cleanupGameStatus = onGameEvent('status', (data) => {
      console.log('게임 상태 업데이트:', data);
      // 게임 정보만 업데이트
      if (frontInfo) {
        setFrontInfo(prev => prev ? {
          ...prev,
          global: {
            ...prev.global,
            year: data.year,
            month: data.month,
            lastExecuted: data.lastExecuted
          }
        } : null);
      }
    });

    return () => {
      cleanupTurnComplete();
      cleanupMonthChanged();
      cleanupGeneralUpdate();
      cleanupGameStatus();
    };
  }, [socket, isConnected, onTurnComplete, onGameEvent, onGeneralEvent, frontInfo, loadData]);

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
          <div style={{ marginBottom: '1rem' }}>
            {error || '데이터를 불러올 수 없습니다.'}
          </div>
          {(error?.includes('캐릭터') || error?.includes('장수')) && (
            <Link 
              href={`/${serverID}/join`}
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ff6b00',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              캐릭터 생성하기
            </Link>
          )}
        </div>
      </div>
    );
  }

  const showSecret = frontInfo.general.permission >= 1 || frontInfo.general.officerLevel >= 2;

  return (
    <div className={styles.container}>
      {/* 헤더 패널 */}
      <div className={styles.headerPanel}>
        <div className={styles.commonToolbar}>
          {globalMenu.length > 0 && (
            <GlobalMenu
              menu={globalMenu}
              globalInfo={frontInfo.global}
            />
          )}
        </div>
        <GameInfoPanel
          frontInfo={frontInfo}
          serverName={serverID}
          serverLocked={frontInfo.global.isLocked}
          lastExecuted={new Date(frontInfo.global.lastExecuted)}
        />
      </div>

      {/* 메인 게임 보드 */}
      <div className={styles.contentWrapper}>
        <div className={styles.ingameBoardWrapper}>
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
          {frontInfo.general ? (
            <PartialReservedCommand
              generalID={frontInfo.general.no}
              serverID={serverID}
            />
          ) : (
            <div className={styles.commandPadPlaceholder}>
              <div className={styles.header}>
                <h4>명령 목록</h4>
              </div>
              <div className={styles.content}>
                <div>장수 정보를 불러오는 중...</div>
              </div>
            </div>
          )}
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
              nationId={frontInfo.nation.id}
              isTournamentApplicationOpen={frontInfo.global.isTournamentApplicationOpen}
              isBettingActive={frontInfo.global.isBettingActive}
            />
          )}
        </div>
        </div>
      </div>
      </div>

      {/* 메시지 패널 */}
      <div className={styles.messagePanelZone}>
        <MessagePanel
          generalID={frontInfo.general.no}
          generalName={frontInfo.general.name}
          nationID={frontInfo.nation?.id || 0}
          permissionLevel={frontInfo.general.permission}
        />
      </div>
    </div>
  );
}
