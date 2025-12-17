'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI, type GetFrontInfoResponse, type GetMapResponse } from '@/lib/api/sammo';
import GameViewTabs from '@/components/game/GameViewTabs';
import GeneralBasicCard from '@/components/cards/GeneralBasicCard';
import CityBasicCard from '@/components/cards/CityBasicCard';
import NationBasicCard from '@/components/cards/NationBasicCard';
import PartialReservedCommand from '@/components/game/PartialReservedCommand';
import MessagePanel from '@/components/game/MessagePanel';
import CommandMenuPanel from '@/components/game/CommandMenuPanel';
import VersionModal from '@/components/game/VersionModal';
import GlobalMenu from '@/components/game/GlobalMenu';
import GameInfoPanel from '@/components/game/GameInfoPanel';
import GameBottomBar from '@/components/game/GameBottomBar';
import { useSocket } from '@/hooks/useSocket';
import { convertLog } from '@/utils/convertLog';
import '@/styles/log.css';
import { makeAccentColors } from '@/types/colorSystem';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { useGameSessionStore } from '@/stores/gameSessionStore';

// --- Color Utilities ---
function normalizeHexColor(hex?: string): string {
  if (!hex) return '#2563EB';
  let value = hex.trim();
  if (!value.startsWith('#')) value = `#${value}`;
  if (value.length === 4) {
    value = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return value.toUpperCase();
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = normalizeHexColor(hex).slice(1);
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, '0');
  return `#${normalized}${a}`;
}

function isBright(hex: string): boolean {
  const c = normalizeHexColor(hex).substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 128;
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  // --- State ---
  const [frontInfo, setFrontInfo] = useState<GetFrontInfoResponse | null>(null);
  const [mapData, setMapData] = useState<GetMapResponse | null>(null);
  const [globalMenu, setGlobalMenu] = useState<any[]>([]);
  const [gameConst, setGameConst] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [reservedReloadKey, setReservedReloadKey] = useState(0);
  const [asyncReady, setAsyncReady] = useState(false); // 서버 갱신 상태

  const loadingRef = useRef(false);
  
  // 투표 알림 상태 (localStorage 기반)
  const [lastVoteState, setLastVoteState] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const key = `state.${serverID}.lastVote`;
    return parseInt(localStorage.getItem(key) ?? '0', 10);
  });
  
  // lastVoteState 변경 시 localStorage 저장
  useEffect(() => {
    if (typeof window === 'undefined' || !serverID) return;
    const key = `state.${serverID}.lastVote`;
    localStorage.setItem(key, lastVoteState.toString());
  }, [lastVoteState, serverID]);

  // --- Socket.IO ---
  const socketOptions = useMemo(() => ({ sessionId: serverID, autoConnect: !!serverID }), [serverID]);
  const { socket, isConnected, onGameEvent, onGeneralEvent, onTurnComplete } = useSocket(socketOptions);

  // --- Data Loading ---
  const loadData = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      const [frontInfoData, mapDataResponse, menuData, constData] = await Promise.all([
        SammoAPI.GeneralGetFrontInfo({
          serverID,
          lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          lastGeneralRecordID: 0,
          lastPersonalHistoryID: 0,
          lastGlobalHistoryID: 0,
        }),
        SammoAPI.GlobalGetMap({ serverID, neutralView: 0, showMe: 1 }),
        SammoAPI.GlobalGetMenu({ serverID }).catch(() => ({ success: true, menu: [] })),
        SammoAPI.GlobalGetConst().catch(() => ({ result: false, data: null })),
      ]);

      if (!frontInfoData.success || !frontInfoData.general?.no) {
        throw new Error('캐릭터 정보를 불러올 수 없습니다.');
      }

      setFrontInfo(frontInfoData);
      setMapData(mapDataResponse);
      if (menuData?.success) setGlobalMenu(menuData.menu || []);
      if (constData?.result) setGameConst(constData.data.gameConst || constData.data.gameSettings);

      // 전역 게임 세션 스토어 업데이트
      useGameSessionStore.getState().setSession({
        serverID,
        generalID: frontInfoData.general?.no ?? null,
        generalName: frontInfoData.general?.name ?? null,
        nationID: frontInfoData.nation?.id ?? null,
        nationName: frontInfoData.nation?.name ?? null,
        officerLevel: frontInfoData.general?.officer_level ?? 0,
        cityID: frontInfoData.general?.city ?? null,
        cityName: frontInfoData.city?.name ?? null,
        year: frontInfoData.global?.year ?? null,
        month: frontInfoData.global?.month ?? null,
        startYear: frontInfoData.global?.startyear ?? null,
        turnTerm: frontInfoData.global?.turnterm ?? null,
      });

      // 투표/설문조사 알림 체크
      if (frontInfoData.global?.lastVoteID) {
        const lastVoteID = frontInfoData.global.lastVoteID;
        const myLastVote = (frontInfoData as any).aux?.myLastVote ?? 0;
        if (lastVoteID > lastVoteState && lastVoteID > myLastVote) {
          setLastVoteState(lastVoteID);
          showToast('새로운 설문조사가 있습니다.', 'warning');
        }
      }
      
      setAsyncReady(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
      showToast(err instanceof Error ? err.message : '데이터 로드 실패', 'error');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [serverID, lastVoteState, showToast]);

  const reloadAllData = useCallback(async () => {
    await loadData();
    setReservedReloadKey(prev => prev + 1);
    showToast('갱신 완료', 'success');
  }, [loadData, showToast]);

  useEffect(() => {
    if (serverID) loadData();
  }, [serverID, loadData]);

  // --- Socket Events ---
  useEffect(() => {
    if (!socket || !isConnected) return;
    const cleanupTurn = onTurnComplete(() => setTimeout(reloadAllData, 2000));
    const cleanupMonth = onGameEvent('month:changed', (data) => {
        setFrontInfo(prev => prev ? ({ ...prev, global: { ...prev.global, year: data.year, month: data.month } }) : null);
        setMapData(prev => prev ? ({ ...prev, year: data.year, month: data.month }) : prev);
        setTimeout(reloadAllData, 3000);
    });
    const cleanupGen = onGeneralEvent('updated', (data) => {
        if (frontInfo?.general?.no === data.generalId) {
            if(data.updates) setFrontInfo(prev => prev ? ({...prev, general: {...prev.general!, ...data.updates}}) : null);
            else setTimeout(reloadAllData, 1000);
        }
    });
    return () => { cleanupTurn(); cleanupMonth(); cleanupGen(); };
  }, [socket, isConnected, onTurnComplete, onGameEvent, onGeneralEvent, reloadAllData, frontInfo?.general?.no]);

  // --- Color System ---
  const colorSystem = useMemo(() => {
    const nationColor = frontInfo?.nation?.color || '#000000';
    const base = normalizeHexColor(nationColor);
    const isBrightColor = isBright(base);
    const accents = makeAccentColors(base);

    return {
      base,
      isBright: isBrightColor,
      pageBg: '#000000',
      border: withAlpha(base, isBrightColor ? 0.35 : 0.5),
      borderLight: withAlpha(base, isBrightColor ? 0.2 : 0.3),

      buttonBg: base,
      buttonHover: withAlpha(base, 0.85),
      buttonActive: base,
      buttonText: isBrightColor ? '#111827' : '#ffffff',
      activeBg: base,

      text: '#f5f5f5',
      textMuted: '#a3a3a3',
      textDim: '#737373',

      accent: base,
      ...accents,

      // Legacy support
      bg: withAlpha(base, 0.1),
    };
  }, [frontInfo?.nation?.color]);

  const lastExecutedDate = useMemo(() => {
    if (!frontInfo?.global?.lastExecuted) return null;
    const normalized = frontInfo.global.lastExecuted.replace(' ', 'T');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [frontInfo?.global?.lastExecuted]);

  const nextTurnTimeLabel = useMemo(() => {
    if (!lastExecutedDate) return '-';
    const term = frontInfo?.global?.turnterm || 0;
    if (!term) return '-';
    const next = new Date(lastExecutedDate.getTime() + term * 60000);
    return next.toLocaleTimeString('ko-KR', { hour12: false });
  }, [lastExecutedDate, frontInfo?.global?.turnterm]);

  const extractLogText = useCallback((entry: any) => {
    if (!entry) return '';
    if (typeof entry === 'string') return entry;
    if (Array.isArray(entry)) return entry[1] || '';
    if (typeof entry === 'object' && 'text' in entry) {
      return typeof entry.text === 'string' ? entry.text : '';
    }
    return String(entry);
  }, []);

  const renderLogList = useCallback((logs: any[] = [], limit = 10) => {
    if (!logs || logs.length === 0) {
      return <div className="text-xs text-gray-500 border-l border-white/10 pl-2">기록이 없습니다.</div>;
    }
    const items: React.ReactNode[] = [];
    const max = Math.min(logs.length, limit);
    for (let i = 0; i < max; i += 1) {
      const log = logs[i];
      const text = extractLogText(log);
      if (!text) continue;
      const key = Array.isArray(log) ? (log[0] ?? i) : i;
      items.push(
        <div
          key={key}
          className="text-xs text-gray-300 leading-relaxed border-l border-white/10 pl-2"
          dangerouslySetInnerHTML={{ __html: convertLog(text) }}
        />
      );
    }
    if (items.length === 0) {
      return <div className="text-xs text-gray-500 border-l border-white/10 pl-2">기록이 없습니다.</div>;
    }
    return items;
  }, [extractLogText]);

  const handleMenuClick = (funcCall: string) => {
    if (funcCall === 'showVersion') setIsVersionModalOpen(true);
  };

  // 도시 클릭 핸들러 (Ctrl+클릭 지원)
  const handleCityClick = useCallback((cityId: number, event?: MouseEvent | React.MouseEvent) => {
    if (!serverID || cityId <= 0) return;
    
    const url = `/${serverID}/info/current-city?cityId=${cityId}`;
    
    // Ctrl+클릭 또는 Cmd+클릭(Mac)인 경우 새 탭에서 열기
    if (event && (event.ctrlKey || event.metaKey)) {
      window.open(url, '_blank');
      return;
    }
    
    router.push(url);
  }, [serverID, router]);

  // 빠른 스크롤 이동 함수
  const scrollToSelector = useCallback((selector: string) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // showSecret 계산 (Vue와 동일한 로직)
  const showSecret = useMemo(() => {
    if (!frontInfo) return false;
    if ((frontInfo.general?.permission ?? 0) >= 1) return true;
    if ((frontInfo.general?.officerLevel ?? 0) >= 2) return true;
    return false;
  }, [frontInfo]);

  const mainControlProps = useMemo(() => {
    if (!frontInfo?.general || !frontInfo?.nation || !frontInfo?.global) return null;
    
    return {
      permission: frontInfo.general.permission || 0,
      showSecret, // Vue와 동일한 로직 적용
      myLevel: frontInfo.general.officerLevel || 0,
      nationLevel: frontInfo.nation.level || 0,
      nationId: frontInfo.nation.id || 0,
      nationColor: frontInfo.nation.color,
      isTournamentApplicationOpen: frontInfo.global.isTournamentApplicationOpen || false,
      isBettingActive: frontInfo.global.isBettingActive || false,
      colorSystem,
    };
  }, [frontInfo, colorSystem, showSecret]);

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white flex-col gap-4">
        <div className="text-red-400 text-lg">{error}</div>
        <button 
          onClick={() => { setError(null); loadData(); }}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }
  
  // 서버 갱신 중 상태 (asyncReady = false)
  if (!asyncReady && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white flex-col gap-4">
        <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full" />
        <div className="text-gray-400">서버 갱신 중입니다...</div>
      </div>
    );
  }
  
  // 데이터 로딩 중
  if (!frontInfo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col gap-4">
        <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full" />
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  const generalLogs = frontInfo.recentRecord?.general ?? [];
  const personalLogs = frontInfo.recentRecord?.history ?? [];
  const globalLogs = frontInfo.recentRecord?.global ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-primary selection:text-white pb-16 lg:pb-0">
      {/* Top GlobalMenu (데스크탑) */}
      <div className="hidden lg:block w-full bg-black/40 border-b border-white/5">
        <div className="max-w-[1920px] mx-auto px-4 py-1">
          <GlobalMenu
            menu={globalMenu}
            globalInfo={frontInfo.global}
            onMenuClick={handleMenuClick}
            nationColor={frontInfo.nation?.color}
            colorSystem={colorSystem}
          />
        </div>
      </div>

      {/* Top Bar */}
      <header className="w-full bg-black/60 backdrop-blur border-b border-white/10 shadow-sm px-4 py-2 flex justify-between items-center z-40">
         <div className="flex items-center gap-4">
            <div className="flex flex-col">
               <span className="text-lg font-bold text-white" style={{ color: colorSystem.accent }}>
                  {frontInfo.global.year}년 {frontInfo.global.month}월
               </span>
                <span className="text-xs text-gray-400">
                  턴 {frontInfo.global.turnterm}분 / 다음 {nextTurnTimeLabel}
                </span>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <div className="flex flex-col">
               <span className="text-xs text-gray-400">{frontInfo.global.serverName}</span>
               <span className={cn("text-sm font-bold", frontInfo.global.isLocked ? "text-red-400" : "text-green-400")}>
                  {frontInfo.global.isLocked ? '정지' : '정상'}
               </span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button onClick={reloadAllData} disabled={loading} className="px-3 py-1.5 text-xs font-bold rounded bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50">
               {loading ? '갱신중...' : '갱신'}
            </button>
            <Link href="/entrance" className="px-3 py-1.5 text-xs font-bold rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors">
               나가기
            </Link>
         </div>
      </header>

      {/* 접속중인 국가 & 접속자 정보 */}
      <div className="w-full bg-black/30 border-b border-white/5 px-4 py-1.5 flex flex-wrap justify-between items-center text-xs gap-2">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">
            접속중인 국가: <span className="text-white font-medium">{frontInfo.global.onlineNations || '-'}</span>
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">
            【 접속자 】 <span className="text-white font-medium">{frontInfo.nation?.onlineGen || '-'}</span>
          </span>
        </div>
        {/* 빠른 스크롤 버튼 (데스크탑) */}
        <div className="hidden md:flex items-center gap-2">
          <button 
            onClick={() => scrollToSelector('#reservedCommandPanel')}
            className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            명령으로
          </button>
          <button 
            onClick={() => scrollToSelector('.mapView')}
            className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            지도
          </button>
          <button 
            onClick={() => scrollToSelector('.messagePanel')}
            className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            메시지
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 w-full max-w-[1920px] mx-auto p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 pb-20">
         
         {/* Left Column: Map + Info (9 cols) */}
         <div className="lg:col-span-9 flex flex-col gap-2 sm:gap-4">
            <GameInfoPanel
              frontInfo={frontInfo}
              serverName={frontInfo.global.serverName || ''}
              serverLocked={frontInfo.global.isLocked}
              lastExecuted={lastExecutedDate || new Date()}
              nationColor={frontInfo.nation?.color}
              colorSystem={colorSystem}
            />
            {/* 1. Map Section - 모바일에서 높이 조정 */}
            <div className="mapView min-h-[350px] sm:min-h-[500px] lg:min-h-[600px] rounded-xl border border-white/10 bg-black/60 shadow-2xl relative flex flex-col">
               {/* Map Header Overlay - 모바일 최적화 */}
               <div className="absolute top-0 left-0 right-0 z-10 p-2 sm:p-3 flex flex-col sm:flex-row justify-between gap-2 pointer-events-none">
                  <div className="bg-black/60 backdrop-blur px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/10 pointer-events-auto shadow-lg inline-flex items-center w-fit">
                     <span className="text-[10px] sm:text-xs text-gray-400 mr-1 sm:mr-2">현재 위치</span>
                     <span className="text-sm sm:text-base font-bold text-white">{frontInfo.city?.name}</span>
                  </div>
                  {frontInfo.nation?.notice && (
                     <div className="bg-yellow-900/90 backdrop-blur px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-yellow-500/30 max-w-full sm:max-w-lg pointer-events-auto shadow-lg">
                        <div className="text-[9px] sm:text-[10px] font-bold text-yellow-400 mb-0.5 uppercase tracking-wider">국가 방침</div>
                        <div className="text-xs sm:text-sm text-white leading-snug line-clamp-2 sm:line-clamp-none" dangerouslySetInnerHTML={{__html: frontInfo.nation.notice.msg}} />
                     </div>
                  )}
               </div>
               
               <div className="flex-1 relative overflow-hidden rounded-xl">
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
            </div>

            {mainControlProps && (
               <CommandMenuPanel
                  serverID={serverID}
                  mainControlProps={mainControlProps}
                  globalMenu={globalMenu}
               />
            )}

            {/* 2. Info & Logs Row - 모바일 반응형 개선 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 min-h-[400px] sm:min-h-[600px]">
                {/* Info Column */}
                <div className="flex flex-col gap-2 sm:gap-4">
                   {/* General Card */}
                   {frontInfo.general && frontInfo.nation && (
                      <div className="generalInfo rounded-lg sm:rounded-xl border border-white/10 bg-gray-900/40 backdrop-blur shadow-lg overflow-hidden h-fit">
                         <GeneralBasicCard
                           general={frontInfo.general}
                           nation={frontInfo.nation}
                           colorSystem={colorSystem}
                           troopInfo={frontInfo.general.troop}
                           turnTerm={frontInfo.global.turnterm}
                         />
                      </div>
                   )}
                   
                   {/* City Card */}
                   {frontInfo.city && (
                      <div className="cityInfo rounded-lg sm:rounded-xl border border-white/10 bg-gray-900/40 backdrop-blur shadow-lg overflow-hidden h-fit">
                         <CityBasicCard 
                           city={frontInfo.city} 
                           cityConstMap={frontInfo.cityConstMap}
                           colorSystem={colorSystem}
                         />
                      </div>
                   )}

                   {/* Nation Card */}
                   {frontInfo.nation && (
                      <div className="nationInfo rounded-xl border border-white/10 bg-gray-900/40 backdrop-blur shadow-lg overflow-hidden h-fit">
                         <NationBasicCard
                           nation={frontInfo.nation}
                           global={frontInfo.global}
                           cityConstMap={frontInfo.cityConstMap}
                           colorSystem={colorSystem}
                         />
                      </div>
                   )}
                </div>

                {/* Logs Column */}
                <div className="flex flex-col gap-4 h-full">
                   {/* Messages */}
                   <div className="messagePanel rounded-xl border border-white/10 bg-gray-900/40 backdrop-blur shadow-lg overflow-hidden flex flex-col flex-1 min-h-[300px]">
                      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center">
                         <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            메시지
                         </h3>
                      </div>
                      <div className="flex-1 overflow-hidden">
                         <MessagePanel
                            generalID={frontInfo.general?.no || 0}
                            generalName={frontInfo.general?.name || ''}
                            nationID={frontInfo.nation?.id || 0}
                            permissionLevel={frontInfo.general?.permission || 0}
                            nationColor={frontInfo.nation?.color}
                            colorSystem={{...colorSystem, accent: colorSystem.accent}}
                         />
                      </div>
                   </div>

                   {/* Logs */}
                   <div className="rounded-xl border border-white/10 bg-gray-900/40 backdrop-blur shadow-lg overflow-hidden flex flex-col flex-1 min-h-[300px]">
                      <div className="px-4 py-2 bg-white/5 border-b border-white/5">
                         <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                            실시간 로그
                         </h3>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                         <div className="PublicRecord">
                            <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 장수 동향
                            </div>
                            <div className="space-y-1.5">
                               {renderLogList(generalLogs, 15)}
                            </div>
                         </div>
                         <div className="GeneralLog">
                            <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 내 기록
                            </div>
                            <div className="space-y-1.5">
                               {renderLogList(personalLogs, 15)}
                            </div>
                         </div>
                         <div className="WorldHistory">
                            <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> 중원 정세
                            </div>
                            <div className="space-y-1.5">
                               {renderLogList(globalLogs, 15)}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
         </div>

         {/* Right Column: Command (3 cols) - 모바일에서는 전체 폭 */}
         <div id="reservedCommandPanel" className="lg:col-span-3 flex flex-col h-full order-first lg:order-none">
            <div className="rounded-lg sm:rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur shadow-xl flex flex-col h-full min-h-[500px] sm:min-h-[700px] lg:min-h-[850px]">
               <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border-b border-white/5 flex justify-between items-center sticky top-0 z-10">
                  <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                     명령 예약
                  </h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] sm:text-[10px] text-gray-500 bg-black/20 px-1.5 sm:px-2 py-0.5 rounded">Auto-Sync</span>
                  </div>
               </div>
               <div className="flex-1 p-0 overflow-auto">
                  {frontInfo.general && (
                     <PartialReservedCommand
                       generalID={frontInfo.general.no}
                       serverID={serverID}
                       nationColor={frontInfo.nation?.color}
                       colorSystem={colorSystem}
                       reloadKey={reservedReloadKey}
                       onGlobalReload={reloadAllData}
                     />
                  )}
               </div>
            </div>
         </div>

      </div>

      {/* Bottom GlobalMenu (데스크탑) */}
      <div className="hidden lg:block w-full bg-black/40 border-t border-white/5 mt-auto">
        <div className="max-w-[1920px] mx-auto px-4 py-1">
          <GlobalMenu
            menu={globalMenu}
            globalInfo={frontInfo.global}
            onMenuClick={handleMenuClick}
            nationColor={frontInfo.nation?.color}
            colorSystem={colorSystem}
          />
        </div>
      </div>

      {/* 모바일 하단바 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <GameBottomBar
          onRefresh={reloadAllData}
          isLoading={loading}
          nationColor={frontInfo.nation?.color}
          colorSystem={colorSystem}
          globalMenu={globalMenu}
          globalInfo={frontInfo.global}
          onMenuClick={handleMenuClick}
          mainControlProps={mainControlProps}
        />
      </div>

      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        gameConst={gameConst}
        version="1.0.0"
      />
    </div>
  );
}
