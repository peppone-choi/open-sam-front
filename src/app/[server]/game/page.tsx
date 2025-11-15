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
import GameViewTabs from '@/components/game/GameViewTabs';
import { useSocket } from '@/hooks/useSocket';
import { convertLog } from '@/utils/convertLog';
import styles from './page.module.css';
import '@/styles/log.css';
import { makeAccentColors } from '@/types/colorSystem';

// ColorSystem 유틸리티 함수들
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join('');
}

function calculateLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function darkenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(
    rgb.r * (1 - amount),
    rgb.g * (1 - amount),
    rgb.b * (1 - amount)
  );
}

function adjustColorForText(hex: string): string {
  const luminance = calculateLuminance(hex);
  
  if (luminance > 0.5) {
    const darkenAmount = 0.3 + (luminance - 0.5) * 0.6;
    return darkenColor(hex, darkenAmount);
  }
  
  return hex;
}

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
  const { socket, isConnected, onGameEvent, onGeneralEvent, onTurnComplete, onLogUpdate } = useSocket(socketOptions);

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
          lastGeneralRecordID: 0, // 장수동향
          lastPersonalHistoryID: 0, // 개인기록
          lastGlobalHistoryID: 0, // 중원정세
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

      // 디버깅: recentRecord 확인
      console.log('[GamePage] recentRecord:', frontInfoData.recentRecord);

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

  // 새로고침 함수 (모든 데이터 재로드 + 웹소켓 재연결)
  const handleReload = useCallback(async () => {
    if (loadingRef.current) return;
    
    // 웹소켓 재연결
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
    
    // 모든 데이터 재로드
    await loadData();
  }, [socket, loadData]);

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
      console.log('[GamePage] 장수 업데이트 이벤트:', data);
      if (generalIdRef.current === data.generalId) {
        // 부분 업데이트만 수행 (전체 로드 대신)
        if (data.updates && frontInfoRef.current) {
          console.log('[GamePage] 장수 정보 부분 업데이트:', data.updates);
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
          console.log('[GamePage] 장수 정보 전체 로드 예약 (2초 후)');
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

    // 로그 업데이트 이벤트 (실시간 로그 추가)
    const cleanupLogUpdate = onLogUpdate((data) => {
      console.log('[GamePage] 로그 업데이트:', data);
      
      // 장수동향, 개인기록, 중원정세에 실시간으로 추가
      setFrontInfo(prev => {
        if (!prev) return prev;
        
        // convertLog는 표시할 때만 적용 (데이터는 원본 그대로 저장)
        const newLog = {
          id: data.logId,
          text: data.logText,
          timestamp: data.timestamp
        };
        
        // 로그 타입에 따라 적절한 배열에 추가
        if (data.logType === 'action') {
          // 개인기록 (general_id가 현재 장수와 일치, log_type = 'action')
          if (data.generalId === generalIdRef.current) {
            return {
              ...prev,
              recentRecord: {
                ...prev.recentRecord,
                history: [newLog, ...(prev.recentRecord?.history || [])].slice(0, 20)
              }
            };
          }
        } else if (data.logType === 'history') {
          if (data.generalId === 0) {
            // 장수동향 (general_id = 0, log_type = 'history')
            return {
              ...prev,
              recentRecord: {
                ...prev.recentRecord,
                general: [newLog, ...(prev.recentRecord?.general || [])].slice(0, 20) // 최대 20개
              }
            };
          }
        }
        
        return prev;
      });
    });

    return () => {
      cleanupTurnComplete();
      cleanupMonthChanged();
      cleanupGeneralUpdate();
      cleanupGameStatus();
      cleanupLogUpdate();
      // 타임아웃 클리어
      if (turnCompleteTimeout) clearTimeout(turnCompleteTimeout);
      if (monthChangedTimeout) clearTimeout(monthChangedTimeout);
      if (generalUpdateTimeout) clearTimeout(generalUpdateTimeout);
    };
    }, [socket, isConnected, onTurnComplete, onGameEvent, onGeneralEvent, onLogUpdate]);

  // 메모이제이션으로 불필요한 재계산 방지 (조건부 렌더링 전에 호출해야 함)
  const showSecret = useMemo(() => {
    if (!frontInfo?.general) return false;
    return frontInfo.general.permission >= 1 || frontInfo.general.officerLevel >= 2;
  }, [frontInfo?.general?.permission, frontInfo?.general?.officerLevel]);

  const lastExecutedDate = useMemo(() => {
    if (!frontInfo?.global?.lastExecuted) return new Date();
    return new Date(frontInfo.global.lastExecuted);
  }, [frontInfo?.global?.lastExecuted]);

  // 국가색 기반 색상 시스템 (조건부 렌더링 전에 배치)
  // 통일된 디자인: 배경(30) < 테두리(80) < 버튼(A0) < 버튼호버(C0) < 액티브(FF)
  const nationColor = frontInfo?.nation?.color;
  const colorSystem = useMemo(() => {
    // 기본 다크 테마 (국가색 없음 혹은 안전한 기본값)
    if (!nationColor) {
      return {
        // 배경
        pageBg: '#050814',
        // 테두리
        border: '#4b5563',
        borderLight: '#374151',
        // 버튼
        buttonBg: '#2563eb',
        buttonHover: '#1d4ed8',
        buttonActive: '#1e40af',
        buttonText: '#f9fafb',
        activeBg: '#1e40af',
        // 글자색
        text: '#e5e7eb',
        textMuted: '#9ca3af',
        textDim: '#6b7280',
        // 강조색
        accent: '#38bdf8',
        accentBright: '#0ea5e9',
        success: '#22c55e',
        warning: '#facc15',
        error: '#ef4444',
        info: '#38bdf8',
        special: '#a855f7',
      };
    }

    // 국가색 기반 강조색 생성
    const accentColors = makeAccentColors(nationColor);
    const luminance = calculateLuminance(nationColor);

    // 흰색/아주 밝은 국가색: 어두운 배경 고정, 국가색은 포인트로만
    if (luminance >= 0.85) {
      const textBase = '#e5e7eb';
      const buttonBgColor = adjustColorForText(nationColor);

      return {
        pageBg: '#050814',
        border: '#4b5563',
        borderLight: '#374151',
        buttonBg: `${buttonBgColor}E6`,
        buttonHover: `${buttonBgColor}F2`,
        buttonActive: `${buttonBgColor}FF`,
        buttonText: '#f9fafb',
        activeBg: `${buttonBgColor}FF`,
        text: textBase,
        textMuted: '#9ca3af',
        textDim: '#6b7280',
        accent: nationColor,
        accentBright: accentColors.accentBright,
        success: accentColors.success,
        warning: accentColors.warning,
        error: accentColors.error,
        info: accentColors.info,
        special: accentColors.special,
      };
    }

    // 검은색/아주 어두운 국가색: 밝은 배경 고정, 국가색은 포인트로만
    if (luminance <= 0.15) {
      const textBase = '#111827';
      const buttonBgColor = adjustColorForText(nationColor);

      return {
        pageBg: '#f5f5f7',
        border: '#9ca3af',
        borderLight: '#d1d5db',
        buttonBg: `${buttonBgColor}E6`,
        buttonHover: `${buttonBgColor}F2`,
        buttonActive: `${buttonBgColor}FF`,
        buttonText: '#f9fafb',
        activeBg: `${buttonBgColor}FF`,
        text: textBase,
        textMuted: '#6b7280',
        textDim: '#9ca3af',
        accent: nationColor,
        accentBright: accentColors.accentBright,
        success: accentColors.success,
        warning: accentColors.warning,
        error: accentColors.error,
        info: accentColors.info,
        special: accentColors.special,
      };
    }

    // 일반 국가색: 기존 로직을 기반으로 하되 과도한 밝기/채도는 adjustColorForText에 맡김
    const textColor = adjustColorForText(nationColor);
    const buttonBgColor = adjustColorForText(nationColor);

    return {
      pageBg: `${nationColor}30`,
      border: `${nationColor}80`,
      borderLight: `${nationColor}60`,
      buttonBg: `${buttonBgColor}A0`,
      buttonHover: `${buttonBgColor}C0`,
      buttonActive: `${buttonBgColor}FF`,
      buttonText: luminance > 0.5 ? '#111827' : '#f9fafb',
      activeBg: `${buttonBgColor}FF`,
      text: textColor,
      textMuted: `${textColor}C0`,
      textDim: `${textColor}80`,
      accent: nationColor,
      accentBright: accentColors.accentBright,
      success: accentColors.success,
      warning: accentColors.warning,
      error: accentColors.error,
      info: accentColors.info,
      special: accentColors.special,
    };
  }, [nationColor]);

  const gameInfoPanelProps = useMemo(() => {
    if (!frontInfo) return null;
    // 세션 이름이 있으면 사용, 없으면 serverID 사용
    const displayServerName = frontInfo.global.serverName || serverID;
    return {
      frontInfo,
      serverName: displayServerName,
      serverLocked: frontInfo.global.isLocked,
      lastExecuted: lastExecutedDate,
      nationColor: frontInfo.nation?.color,
      colorSystem
    };
  }, [frontInfo, serverID, lastExecutedDate, colorSystem]);

  const mainControlBarProps = useMemo(() => {
    if (!frontInfo?.general || !frontInfo?.nation) return null;
    return {
      permission: frontInfo.general.permission,
      showSecret,
      myLevel: frontInfo.general.officerLevel,
      nationLevel: frontInfo.nation.level,
      nationId: frontInfo.nation.id,
      nationColor: frontInfo.nation.color,
      isTournamentApplicationOpen: frontInfo.global.isTournamentApplicationOpen,
      isBettingActive: frontInfo.global.isBettingActive,
      colorSystem
    };
  }, [
    frontInfo?.general?.permission,
    showSecret,
    frontInfo?.general?.officerLevel,
    frontInfo?.nation?.level,
    frontInfo?.nation?.id,
    frontInfo?.nation?.color,
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

  // body와 html 배경색 설정 (페이지 양쪽 여백도 국가색으로)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = colorSystem.pageBg;
      document.documentElement.style.backgroundColor = colorSystem.pageBg;
      return () => {
        document.body.style.backgroundColor = '';
        document.documentElement.style.backgroundColor = '';
      };
    }
  }, [colorSystem.pageBg]);

  if (error || !frontInfo) {
    return (
      <div className={styles.container}>
        <div className="center" style={{ padding: '2rem', color: 'red' }}>
          <div style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
            ⚠️ {error || '데이터를 불러올 수 없습니다.'}
          </div>
          <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
            {error?.includes('서버') && '서버 연결 상태를 확인해주세요.'}
            {error?.includes('네트워크') && '인터넷 연결을 확인해주세요.'}
            {error?.includes('인증') && '다시 로그인이 필요할 수 있습니다.'}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={handleReload}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '재시도 중...' : '다시 시도'}
            </button>
            {(error?.includes('캐릭터') || error?.includes('장수')) && (
              <Link 
                href={`/${serverID}/join`}
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#28a745',
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
      </div>
    );
  }

  return (
    <div 
      className={styles.container}
    >
      {/* 페이지 상단 컨트롤 바 */}
      <div 
        className={styles.pageControls}
        style={{
          borderColor: colorSystem.border,
        }}
      >
        <div className={styles.pageControlsLeft}>
          <button
            type="button"
            onClick={handleReload}
            className={styles.refreshBtn}
            style={{
              backgroundColor: colorSystem.buttonBg,
              borderColor: colorSystem.border,
              color: colorSystem.buttonText,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorSystem.buttonHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorSystem.buttonBg}
            disabled={loading}
          >
            {loading ? '갱신 중...' : '갱신'}
          </button>
        </div>
        <div className={styles.pageControlsRight}>
          <Link
            href="/entrance"
            className={styles.lobbyBtn}
            style={{
              backgroundColor: colorSystem.buttonBg,
              borderColor: colorSystem.border,
              color: colorSystem.buttonText,
            }}
          >
            로비
          </Link>
        </div>
      </div>

      {/* 헤더 패널 */}
      <div 
        className={styles.headerPanel}
        style={{
          borderColor: colorSystem.border,
          color: colorSystem.text,
        }}
      >
        <div 
          className={styles.commonToolbar}
          style={{
            borderColor: colorSystem.border,
          }}
        >
          {globalMenu.length > 0 && (
          <GlobalMenu
            menu={globalMenu}
            globalInfo={frontInfo.global}
            onMenuClick={handleMenuClick}
            nationColor={nationColor}
            colorSystem={colorSystem}
          />
          )}
        </div>
        {gameInfoPanelProps && <GameInfoPanel {...gameInfoPanelProps} />}
        
        {/* 접속 중인 국가 및 접속자 정보 */}
        {frontInfo.global.onlineNations && (
          <div 
            className={styles.onlineNations} 
            style={{ 
              borderTop: `1px solid ${colorSystem.border}`, 
              padding: '0.5rem 1rem',
              color: colorSystem.text,
            }}
          >
            접속중인 국가: {frontInfo.global.onlineNations}
          </div>
        )}
        {frontInfo.nation && (
          <div 
            className={styles.onlineUsers} 
            style={{ 
              borderTop: `1px solid ${colorSystem.border}`, 
              padding: '0.5rem 1rem',
              color: colorSystem.text,
            }}
          >
            【 접속자 】 {frontInfo.nation.onlineGen || 0}
          </div>
        )}
        
        {/* 국가방침 */}
        {frontInfo.nation && frontInfo.nation.notice && (
          <div 
            className={styles.nationNotice} 
            style={{ 
              borderTop: `1px solid ${colorSystem.border}`, 
              padding: '0.5rem 0',
              color: colorSystem.text,
            }}
          >
            <div style={{ padding: '0 1rem' }}>【 국가방침 】</div>
            <div 
              className={styles.nationNoticeBody}
              style={{ padding: '0.5rem 1rem', color: colorSystem.text }}
              dangerouslySetInnerHTML={{ __html: frontInfo.nation.notice.msg || '' }}
            />
          </div>
        )}
      </div>

      {/* 메인 게임 보드 */}
      <div 
        className={styles.contentWrapper}
        style={{
          borderColor: colorSystem.border,
        }}
      >
        <div className={styles.ingameBoardWrapper}>
          <div id="ingameBoard" className={styles.ingameBoard}>
        <div className={styles.mapView}>
          {mapData && frontInfo.general && (
            <GameViewTabs
              serverID={serverID}
              generalId={frontInfo.general.no}
              cityId={frontInfo.general.city}
              cityName={frontInfo.city?.name}
              mapData={mapData}
              onCityClick={handleCityClick}
            />
          )}
        </div>

        <div id="reservedCommandPanel" className={styles.reservedCommandZone}>
          {frontInfo.general ? (
            <PartialReservedCommand
              generalID={frontInfo.general.no}
              serverID={serverID}
              nationColor={frontInfo.nation?.color}
              colorSystem={colorSystem}
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



        {frontInfo.general && frontInfo.nation && (
          <div 
            className={styles.generalInfo}
            style={{
              borderColor: colorSystem.border,
            }}
          >
            <GeneralBasicCard
              general={frontInfo.general}
              nation={frontInfo.nation}
              troopInfo={frontInfo.general.reservedCommand ? undefined : undefined}
              turnTerm={frontInfo.global.turnterm}
              colorSystem={colorSystem}
            />
          </div>
        )}

        {frontInfo.city && (
          <div 
            className={styles.cityInfo}
            style={{
              borderColor: colorSystem.border,
            }}
          >
            <CityBasicCard city={frontInfo.city} cityConstMap={frontInfo.cityConstMap} colorSystem={colorSystem} />
          </div>
        )}

        {frontInfo.nation && (
          <div 
            className={styles.nationInfo}
            style={{
              borderColor: colorSystem.border,
            }}
          >
            <NationBasicCard 
              nation={frontInfo.nation} 
              global={frontInfo.global} 
              cityConstMap={frontInfo.cityConstMap}
              colorSystem={colorSystem}
            />
          </div>
        )}

        <div className={`${styles.generalCommandToolbar} ${isMenuOpen ? styles.menuOpen : styles.menuClosed}`}>
          {frontInfo.general && frontInfo.nation && mainControlBarProps && (
            <MainControlBar {...mainControlBarProps} />
          )}
        </div>


        </div>
      </div>
      </div>

      {/* 로그/기록 섹션 */}
      {frontInfo.recentRecord && (
        <div 
          className={styles.recordZone}
          style={{
            borderColor: colorSystem.border,
            color: colorSystem.text,
          }}
        >
          <div 
            className={styles.recordColumn}
            style={{
              borderColor: colorSystem.border,
            }}
          >
            <div 
              className={`${styles.recordHeader} bg1`}
              style={{
                borderColor: colorSystem.border,
                backgroundColor: colorSystem.buttonBg,
                color: colorSystem.buttonText,
                fontWeight: 'bold',
              }}
            >
              장수 동향
            </div>
            <div className={styles.recordList} style={{ color: colorSystem.text, backgroundColor: colorSystem.pageBg }}>
              {frontInfo.recentRecord.general && frontInfo.recentRecord.general.length > 0 ? (
                frontInfo.recentRecord.general.map((item, index: number) => {
                  const [id, text] = Array.isArray(item) ? item : [item.id, item.text];
                  return (
                    <div key={id ?? `general-${index}`} className={styles.recordItem} style={{ color: colorSystem.text }} dangerouslySetInnerHTML={{ __html: convertLog(text) }} />
                  );
                })
              ) : (
                <div className={styles.recordEmpty} style={{ color: colorSystem.textMuted }}>아직 기록이 없습니다. 게임을 진행하면 다른 장수들의 활동이 여기에 표시됩니다.</div>
              )}
            </div>
          </div>
          <div 
            className={styles.recordColumn}
            style={{
              borderColor: colorSystem.border,
            }}
          >
            <div 
              className={`${styles.recordHeader} bg1`}
              style={{
                borderColor: colorSystem.border,
                backgroundColor: colorSystem.buttonBg,
                color: colorSystem.buttonText,
                fontWeight: 'bold',
              }}
            >
              개인 기록
            </div>
            <div className={styles.recordList} style={{ color: colorSystem.text, backgroundColor: colorSystem.pageBg }}>
              {frontInfo.recentRecord.history && frontInfo.recentRecord.history.length > 0 ? (
                frontInfo.recentRecord.history.map((item, index: number) => {
                  const [id, text] = Array.isArray(item) ? item : [item.id, item.text];
                  return (
                    <div key={id ?? `history-${index}`} className={styles.recordItem} style={{ color: colorSystem.text }} dangerouslySetInnerHTML={{ __html: convertLog(text) }} />
                  );
                })
              ) : (
                <div className={styles.recordEmpty} style={{ color: colorSystem.textMuted }}>아직 기록이 없습니다. 명령을 실행하면 여기에 결과가 표시됩니다.</div>
              )}
            </div>
          </div>
          <div 
            className={styles.recordColumn}
            style={{
              borderColor: colorSystem.border,
            }}
          >
            <div 
              className={`${styles.recordHeader} bg1`}
              style={{
                borderColor: colorSystem.border,
                backgroundColor: colorSystem.buttonBg,
                color: colorSystem.buttonText,
                fontWeight: 'bold',
              }}
            >
              중원 정세
            </div>
            <div className={styles.recordList} style={{ color: colorSystem.text, backgroundColor: colorSystem.pageBg }}>
              {frontInfo.recentRecord.global && frontInfo.recentRecord.global.length > 0 ? (
                frontInfo.recentRecord.global.map((item, index: number) => {
                  const [id, text] = Array.isArray(item) ? item : [item.id, item.text];
                  return (
                    <div key={id ?? `global-${index}`} className={styles.recordItem} style={{ color: colorSystem.text }} dangerouslySetInnerHTML={{ __html: convertLog(text) }} />
                  );
                })
              ) : (
                <div className={styles.recordEmpty} style={{ color: colorSystem.textMuted }}>아직 기록이 없습니다. 주요 사건이 발생하면 여기에 표시됩니다.</div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* 메시지 패널 */}
      <div className={styles.messagePanelZone}>
        <MessagePanel
          generalID={frontInfo.general.no}
          generalName={frontInfo.general.name}
          nationID={frontInfo.nation?.id || 0}
          permissionLevel={frontInfo.general.permission}
          nationColor={frontInfo.nation?.color}
          colorSystem={colorSystem}
        />
      </div>

      {/* 메시지 패널 후 commonToolbar */}
      <div 
        className={styles.commonToolbar}
        style={{
          borderColor: colorSystem.border,
        }}
      >
        {globalMenu.length > 0 && (
          <GlobalMenu
            menu={globalMenu}
            globalInfo={frontInfo.global}
            onMenuClick={handleMenuClick}
            nationColor={nationColor}
            colorSystem={colorSystem}
          />
        )}
      </div>

      {/* 모바일 전용 하단 바 */}
      <GameBottomBar
        onRefresh={handleReload}
        onToggleMenu={handleToggleMenu}
        isLoading={loading}
        nationColor={nationColor}
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
