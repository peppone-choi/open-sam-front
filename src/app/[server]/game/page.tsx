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
import GameBottomBar from '@/components/game/GameBottomBar';
import VersionModal from '@/components/game/VersionModal';
import GlobalMenu from '@/components/game/GlobalMenu';
import { useSocket } from '@/hooks/useSocket';
import { convertLog } from '@/utils/convertLog';
import '@/styles/log.css';
import { makeAccentColors } from '@/types/colorSystem';
import { cn } from '@/lib/utils';

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

  // --- State ---
  const [frontInfo, setFrontInfo] = useState<GetFrontInfoResponse | null>(null);
  const [mapData, setMapData] = useState<GetMapResponse | null>(null);
  const [globalMenu, setGlobalMenu] = useState<any[]>([]);
  const [gameConst, setGameConst] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [reservedReloadKey, setReservedReloadKey] = useState(0);

  const loadingRef = useRef(false);

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

    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [serverID]);

  const reloadAllData = useCallback(async () => {
    await loadData();
    setReservedReloadKey(prev => prev + 1);
  }, [loadData]);

  useEffect(() => {
    if (serverID) loadData();
  }, [serverID, loadData]);

  // --- Socket Events ---
  useEffect(() => {
    if (!socket || !isConnected) return;
    const cleanupTurn = onTurnComplete(() => setTimeout(reloadAllData, 2000));
    const cleanupMonth = onGameEvent('month:changed', (data) => {
        setFrontInfo(prev => prev ? ({...prev, global: {...prev.global, year: data.year, month: data.month}}) : null);
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
    
    // 기본 색상 시스템 생성
    const system = {
      base, 
      isBright: isBrightColor,
      pageBg: '#000000',
      border: withAlpha(base, 0.5),
      borderLight: withAlpha(base, 0.3),
      
      buttonBg: base,
      buttonHover: withAlpha(base, 0.8),
      buttonActive: base,
      buttonText: isBrightColor ? '#000000' : '#ffffff',
      activeBg: base,
      
      text: '#ffffff',
      textMuted: '#a3a3a3', // neutral-400
      textDim: '#737373', // neutral-500
      
      accent: base,
      ...accents,
      
      // Legacy support
      bg: withAlpha(base, 0.1),
    };
    
    return system;
  }, [frontInfo?.nation?.color]);

  const handleMenuClick = (funcCall: string) => {
    if (funcCall === 'showVersion') setIsVersionModalOpen(true);
  };

  const handleCityClick = (cityId: number) => {
    if (serverID && cityId > 0) router.push(`/${serverID}/info/current-city?cityId=${cityId}`);
  };

  const mainControlProps = useMemo(() => {
    if (!frontInfo?.general || !frontInfo?.nation || !frontInfo?.global) return null;
    
    return {
      permission: frontInfo.general.permission || 0,
      showSecret: (frontInfo.general.officerLevel || 0) >= 5, // 5등급 이상 (가정)
      myLevel: frontInfo.general.officerLevel || 0,
      nationLevel: frontInfo.nation.level || 0,
      nationId: frontInfo.nation.id || 0,
      nationColor: frontInfo.nation.color,
      isTournamentApplicationOpen: frontInfo.global.isTournamentApplicationOpen || false,
      isBettingActive: frontInfo.global.isBettingActive || false,
      colorSystem,
    };
  }, [frontInfo, colorSystem]);

  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">{error}</div>;
  if (!frontInfo) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-background-main text-foreground flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Top Bar */}
      <header className="w-full bg-black/60 backdrop-blur border-b border-white/10 shadow-sm px-4 py-2 flex justify-between items-center z-40">
         <div className="flex items-center gap-4">
            <div className="flex flex-col">
               <span className="text-lg font-bold text-white" style={{ color: colorSystem.base }}>
                  {frontInfo.global.year}년 {frontInfo.global.month}월
               </span>
               <span className="text-xs text-gray-400">
                  턴 {frontInfo.global.turnterm}분 / {frontInfo.global.turnTime}
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
            <button onClick={reloadAllData} disabled={loading} className="px-3 py-1.5 text-xs font-bold rounded bg-white/10 hover:bg-white/20 text-white transition-colors">
               갱신
            </button>
            <Link href="/entrance" className="px-3 py-1.5 text-xs font-bold rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors">
               나가기
            </Link>
         </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 w-full max-w-[1920px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 pb-20">
         
         {/* Left Column: Map + Info (9 cols) */}
         <div className="lg:col-span-9 flex flex-col gap-4">
            {/* 1. Map Section */}
            <div className="min-h-[600px] rounded-xl border border-white/10 bg-black/60 shadow-2xl relative flex flex-col">
               {/* Map Header Overlay */}
               <div className="absolute top-0 left-0 right-0 z-10 p-3 flex justify-between pointer-events-none">
                  <div className="bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 pointer-events-auto shadow-lg">
                     <span className="text-xs text-gray-400 mr-2">현재 위치</span>
                     <span className="text-base font-bold text-white">{frontInfo.city?.name}</span>
                  </div>
                  {frontInfo.nation?.notice && (
                     <div className="bg-yellow-900/90 backdrop-blur px-4 py-2 rounded-lg border border-yellow-500/30 max-w-lg pointer-events-auto shadow-lg">
                        <div className="text-[10px] font-bold text-yellow-400 mb-0.5 uppercase tracking-wider">국가 방침</div>
                        <div className="text-sm text-white leading-snug" dangerouslySetInnerHTML={{__html: frontInfo.nation.notice.msg}} />
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

            {/* 2. Info & Logs Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[600px]">
                {/* Info Column */}
                <div className="flex flex-col gap-4">
                   {/* General Card */}
                   {frontInfo.general && frontInfo.nation && (
                      <div className="rounded-xl border border-white/10 bg-background-secondary/40 backdrop-blur shadow-lg overflow-hidden h-fit">
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
                      <div className="rounded-xl border border-white/10 bg-background-secondary/40 backdrop-blur shadow-lg overflow-hidden h-fit">
                         <CityBasicCard 
                           city={frontInfo.city} 
                           cityConstMap={frontInfo.cityConstMap}
                           colorSystem={colorSystem}
                         />
                      </div>
                   )}

                   {/* Nation Card */}
                   {frontInfo.nation && (
                      <div className="rounded-xl border border-white/10 bg-background-secondary/40 backdrop-blur shadow-lg overflow-hidden h-fit">
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
                   <div className="rounded-xl border border-white/10 bg-background-secondary/40 backdrop-blur shadow-lg overflow-hidden flex flex-col flex-1 min-h-[300px]">
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
                            colorSystem={{...colorSystem, accent: colorSystem.base}}
                         />
                      </div>
                   </div>

                   {/* Logs */}
                   <div className="rounded-xl border border-white/10 bg-background-secondary/40 backdrop-blur shadow-lg overflow-hidden flex flex-col flex-1 min-h-[300px]">
                      <div className="px-4 py-2 bg-white/5 border-b border-white/5">
                         <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                            실시간 로그
                         </h3>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                         <div>
                            <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 장수 동향
                            </div>
                            <div className="space-y-1.5">
                               {frontInfo.recentRecord?.general?.slice(0, 10).map((log: any, i: number) => (
                                  <div key={i} className="text-xs text-gray-300 leading-relaxed border-l border-white/10 pl-2" dangerouslySetInnerHTML={{__html: convertLog(log.text)}} />
                               ))}
                            </div>
                         </div>
                         <div>
                            <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> 중원 정세
                            </div>
                            <div className="space-y-1.5">
                               {frontInfo.recentRecord?.global?.slice(0, 5).map((log: any, i: number) => (
                                  <div key={i} className="text-xs text-gray-300 leading-relaxed border-l border-white/10 pl-2" dangerouslySetInnerHTML={{__html: convertLog(log.text)}} />
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
         </div>

         {/* Right Column: Command (3 cols) */}
         <div className="lg:col-span-3 flex flex-col h-full">
            <div className="rounded-xl border border-white/10 bg-background-secondary/60 backdrop-blur shadow-xl flex flex-col h-full min-h-[850px]">
               <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                     명령 예약
                  </h3>
                  <span className="text-[10px] text-gray-500 bg-black/20 px-2 py-0.5 rounded">Auto-Sync</span>
               </div>
               <div className="flex-1 p-0">
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

      <GameBottomBar 
        onRefresh={reloadAllData}
        isLoading={loading}
        nationColor={frontInfo.nation?.color}
        colorSystem={{...colorSystem, accent: colorSystem.base}}
        globalMenu={globalMenu}
        globalInfo={frontInfo.global}
        onMenuClick={handleMenuClick}
        mainControlProps={mainControlProps}
      />
      
      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        gameConst={gameConst}
        version="1.0.0"
      />
    </div>
  );
}
