'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import GameBottomBar from '@/components/game/GameBottomBar';
import VersionModal from '@/components/game/VersionModal';
import { useSocket } from '@/hooks/useSocket';
import styles from './page.module.css';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;

  const [frontInfo, setFrontInfo] = useState<GetFrontInfoResponse | null>(null);
  const [mapData, setMapData] = useState<GetMapResponse | null>(null);
  const [globalMenu, setGlobalMenu] = useState<any[]>([]);
  const [gameConst, setGameConst] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // Socket.IO 연결 (옵션 메모이제이션)
  const socketOptions = React.useMemo(
    () => ({ sessionId: serverID, autoConnect: !!serverID }),
    [serverID]
  );
  const { socket, isConnected, onGameEvent, onGeneralEvent, onTurnComplete } = useSocket(socketOptions);

  // 로딩 중복 방지 Ref
  const loadingRef = React.useRef(false);

  // 데이터 로드 함수
  const loadData = useCallback(async () => {
    if (loadingRef.current) return; // 중복 호출 방지
    loadingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);

      const [frontInfoData, mapDataResponse, menuData, constData] = await Promise.all([
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
        SammoAPI.GlobalGetConst().catch(() => ({ result: false, data: null })),
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
      if (constData && constData.result && constData.data) {
        setGameConst(constData.data.gameConst || constData.data.gameSettings);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [serverID]);

  // 초기 데이터 로드
  useEffect(() => {
    if (!serverID) return;
    loadData();
  }, [serverID, loadData]);

  // Ref로 최신 값 추적 (useEffect 의존성 최적화)
  const generalIdRef = React.useRef<number | null>(null);
  const loadDataRef = React.useRef(loadData);
  const frontInfoRef = React.useRef<GetFrontInfoResponse | null>(null);

  useEffect(() => {
    generalIdRef.current = frontInfo?.general?.no ?? null;
    frontInfoRef.current = frontInfo;
  }, [frontInfo?.general?.no, frontInfo]);

  // Socket.IO 이벤트 리스너 (의존성 최소화)
  useEffect(() => {
    if (!socket || !isConnected) return;

    // 턴 완료 이벤트 (디바운스 적용, 더 긴 시간으로 깜빡임 방지)
    let turnCompleteTimeout: NodeJS.Timeout | null = null;
    const cleanupTurnComplete = onTurnComplete(() => {
      if (turnCompleteTimeout) clearTimeout(turnCompleteTimeout);
      turnCompleteTimeout = setTimeout(() => {
        loadDataRef.current?.();
      }, 2000); // 2초 디바운스로 깜빡임 방지
    });

    // 월 변경 이벤트 (디바운스 적용, 더 긴 시간으로 깜빡임 방지)
    let monthChangedTimeout: NodeJS.Timeout | null = null;
    const cleanupMonthChanged = onGameEvent('month:changed', (data) => {
      // 년/월만 부분 업데이트 (전체 로드 방지)
      if (data.year !== undefined && data.month !== undefined) {
        setFrontInfo(prev => {
          if (!prev) return prev;
          // 값이 동일하면 업데이트하지 않음
          if (prev.global.year === data.year && prev.global.month === data.month) {
            return prev;
          }
          return {
            ...prev,
            global: {
              ...prev.global,
              year: data.year,
              month: data.month
            }
          };
        });
      }
      // 전체 데이터는 더 긴 디바운스 후 로드
      if (monthChangedTimeout) clearTimeout(monthChangedTimeout);
      monthChangedTimeout = setTimeout(() => {
        loadDataRef.current?.();
      }, 3000); // 3초 디바운스로 깜빡임 방지
    });

    // 장수 업데이트 이벤트 (부분 업데이트만, 년/월 업데이트 포함)
    let generalUpdateTimeout: NodeJS.Timeout | null = null;
    const cleanupGeneralUpdate = onGeneralEvent('updated', (data) => {
      if (generalIdRef.current === data.generalId) {
        // 부분 업데이트만 수행 (전체 로드 대신)
        if (data.updates && frontInfoRef.current) {
          setFrontInfo(prev => {
            if (!prev || !prev.general) return prev;
            return {
              ...prev,
              general: {
                ...prev.general,
                ...data.updates
              }
            };
          });
        } else {
          // 업데이트 데이터가 없으면 디바운스 후 전체 로드
          if (generalUpdateTimeout) clearTimeout(generalUpdateTimeout);
          generalUpdateTimeout = setTimeout(() => {
            loadDataRef.current?.();
          }, 2000); // 2초 디바운스로 깜빡임 방지
        }
      }
    });
    
    // 게임 상태 업데이트 이벤트 (전역 년/월은 유지, 장수별 년/월은 general 업데이트로 처리)
    // lastExecuted는 턴 실행 시점이므로 고정되어야 함 (Socket 이벤트로 업데이트하지 않음)
    const cleanupGameStatus = onGameEvent('status', (data) => {
      setFrontInfo(prev => {
        if (!prev) return prev;
        // 값이 동일하면 업데이트하지 않음 (무한 루프 방지)
        if (
          prev.global.year === data.year &&
          prev.global.month === data.month
        ) {
          return prev;
        }
        return {
          ...prev,
          global: {
            ...prev.global,
            year: data.year,
            month: data.month
            // lastExecuted는 업데이트하지 않음 (고정된 턴 실행 시점)
          }
        };
      });
    });

    return () => {
      cleanupTurnComplete();
      cleanupMonthChanged();
      cleanupGeneralUpdate();
      cleanupGameStatus();
      // 타임아웃 클리어
      if (turnCompleteTimeout) clearTimeout(turnCompleteTimeout);
      if (monthChangedTimeout) clearTimeout(monthChangedTimeout);
      if (generalUpdateTimeout) clearTimeout(generalUpdateTimeout);
    };
    }, [socket, isConnected, onTurnComplete, onGameEvent, onGeneralEvent]);

  // 메모이제이션으로 불필요한 재계산 방지 (조건부 렌더링 전에 호출해야 함)
  const showSecret = useMemo(() => {
    if (!frontInfo?.general) return false;
    return frontInfo.general.permission >= 1 || frontInfo.general.officerLevel >= 2;
  }, [frontInfo?.general?.permission, frontInfo?.general?.officerLevel]);

  const lastExecutedDate = useMemo(() => {
    if (!frontInfo?.global?.lastExecuted) return new Date();
    return new Date(frontInfo.global.lastExecuted);
  }, [frontInfo?.global?.lastExecuted]);

  const gameInfoPanelProps = useMemo(() => {
    if (!frontInfo) return null;
    // 세션 이름이 있으면 사용, 없으면 serverID 사용
    const displayServerName = frontInfo.global.serverName || serverID;
    return {
      frontInfo,
      serverName: displayServerName,
      serverLocked: frontInfo.global.isLocked,
      lastExecuted: lastExecutedDate
    };
  }, [frontInfo, serverID, lastExecutedDate]);

  const mainControlBarProps = useMemo(() => {
    if (!frontInfo?.general || !frontInfo?.nation) return null;
    return {
      permission: frontInfo.general.permission,
      showSecret,
      myLevel: frontInfo.general.officerLevel,
      nationLevel: frontInfo.nation.level,
      nationId: frontInfo.nation.id,
      isTournamentApplicationOpen: frontInfo.global.isTournamentApplicationOpen,
      isBettingActive: frontInfo.global.isBettingActive
    };
  }, [
    frontInfo?.general?.permission,
    showSecret,
    frontInfo?.general?.officerLevel,
    frontInfo?.nation?.level,
    frontInfo?.nation?.id,
    frontInfo?.global?.isTournamentApplicationOpen,
    frontInfo?.global?.isBettingActive
  ]);

  function handleCityClick(cityId: number) {
    if (serverID && cityId > 0) {
      const url = `/${serverID}/info/current-city?cityId=${cityId}`;
      router.push(url);
    }
  }

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClick = (funcCall: string) => {
    if (funcCall === 'showVersion') {
      setIsVersionModalOpen(true);
    }
  };

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

  return (
    <div className={styles.container}>
      {/* 페이지 상단 컨트롤 바 */}
      <div className={styles.pageControls}>
        <div className={styles.pageControlsLeft}>
          <button
            type="button"
            onClick={loadData}
            className={styles.refreshBtn}
            disabled={loading}
          >
            {loading ? '갱신 중...' : '갱신'}
          </button>
        </div>
        <div className={styles.pageControlsRight}>
          <Link
            href="/entrance"
            className={styles.lobbyBtn}
          >
            로비
          </Link>
        </div>
      </div>

      {/* 헤더 패널 */}
      <div className={styles.headerPanel}>
        <div className={styles.commonToolbar}>
          {globalMenu.length > 0 && (
            <GlobalMenu
              menu={globalMenu}
              globalInfo={frontInfo.global}
              onMenuClick={handleMenuClick}
            />
          )}
        </div>
        {gameInfoPanelProps && <GameInfoPanel {...gameInfoPanelProps} />}
        
        {/* 접속 중인 국가 및 접속자 정보 */}
        {frontInfo.global.onlineNations && (
          <div className={styles.onlineNations} style={{ borderTop: '1px solid #333', padding: '0.5rem 1rem' }}>
            접속중인 국가: {frontInfo.global.onlineNations}
          </div>
        )}
        {frontInfo.nation && (
          <div className={styles.onlineUsers} style={{ borderTop: '1px solid #333', padding: '0.5rem 1rem' }}>
            【 접속자 】 {frontInfo.nation.onlineGen || 0}
          </div>
        )}
        
        {/* 국가방침 */}
        {frontInfo.nation && frontInfo.nation.notice && (
          <div className={styles.nationNotice} style={{ borderTop: '1px solid #333', padding: '0.5rem 0' }}>
            <div style={{ padding: '0 1rem' }}>【 국가방침 】</div>
            <div 
              className={styles.nationNoticeBody}
              style={{ padding: '0.5rem 1rem' }}
              dangerouslySetInnerHTML={{ __html: frontInfo.nation.notice.msg || '' }}
            />
          </div>
        )}
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
              gameConst={gameConst}
            />
          )}
        </div>

        <div id="reservedCommandPanel" className={styles.reservedCommandZone}>
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

        {/* actionMiniPlate: 갱신/로비 버튼 */}
        <div id="actionMiniPlate" className={styles.actionMiniPlate}>
          <div className={styles.actionMiniPlateRow}>
            <button
              type="button"
              onClick={loadData}
              className={`${styles.actionBtn} ${styles.refreshBtn}`}
              disabled={loading}
            >
              {loading ? '갱신 중...' : '갱 신'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/entrance')}
              className={`${styles.actionBtn} ${styles.lobbyBtn}`}
            >
              로비로
            </button>
          </div>
        </div>

        {frontInfo.general && frontInfo.nation && (
          <div className={styles.generalInfo}>
            <GeneralBasicCard
              general={frontInfo.general}
              nation={frontInfo.nation}
              troopInfo={frontInfo.general.reservedCommand ? undefined : undefined}
              turnTerm={frontInfo.global.turnterm}
            />
          </div>
        )}

        {frontInfo.city && (
          <div className={styles.cityInfo}>
            <CityBasicCard city={frontInfo.city} cityConstMap={frontInfo.cityConstMap} />
          </div>
        )}

        {frontInfo.nation && (
          <div className={styles.nationInfo}>
            <NationBasicCard nation={frontInfo.nation} global={frontInfo.global} />
          </div>
        )}

        <div className={`${styles.generalCommandToolbar} ${isMenuOpen ? styles.menuOpen : styles.menuClosed}`}>
          {frontInfo.general && frontInfo.nation && mainControlBarProps && (
            <MainControlBar {...mainControlBarProps} />
          )}
        </div>

        {/* actionMiniPlateSub: 명령으로/갱신/로비 버튼 */}
        <div id="actionMiniPlateSub" className={styles.actionMiniPlateSub}>
          <div className={styles.actionMiniPlateSubRow}>
            <button
              type="button"
              onClick={() => {
                const element = document.getElementById('reservedCommandPanel');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`${styles.actionBtn} ${styles.commandBtn}`}
            >
              명령으로
            </button>
            <button
              type="button"
              onClick={loadData}
              className={`${styles.actionBtn} ${styles.refreshBtn}`}
              disabled={loading}
            >
              {loading ? '갱신 중...' : '갱 신'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/entrance')}
              className={`${styles.actionBtn} ${styles.lobbyBtn}`}
            >
              로비로
            </button>
          </div>
        </div>
        </div>
      </div>
      </div>

      {/* 메시지 패널 전 commonToolbar */}
      <div className={styles.commonToolbar}>
        {globalMenu.length > 0 && (
          <GlobalMenu
            menu={globalMenu}
            globalInfo={frontInfo.global}
            onMenuClick={handleMenuClick}
          />
        )}
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

      {/* 메시지 패널 후 commonToolbar */}
      <div className={styles.commonToolbar}>
        {globalMenu.length > 0 && (
          <GlobalMenu
            menu={globalMenu}
            globalInfo={frontInfo.global}
            onMenuClick={handleMenuClick}
          />
        )}
      </div>

      {/* 모바일 전용 하단 바 */}
      <GameBottomBar
        onRefresh={loadData}
        onToggleMenu={handleToggleMenu}
        isLoading={loading}
      />

      {/* 버전 모달 */}
      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        gameConst={gameConst}
        version="0.1.0"
      />
    </div>
  );
}
