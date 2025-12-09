'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { loghApi } from '@/lib/api/logh';
import { COMMON_TEXT } from '@/constants/uiText';

// Types - 삼국지와 유사한 구조
interface Session {
  sessionId: string;
  name: string;
  korName: string;
  color: string;
  exists: boolean;
  enable: boolean;
  status: 'preparing' | 'running' | 'paused' | 'finished' | 'united';
  statusText: string;
  scenarioName: string;
  turn: number;
  year: string;
  currentPlayers: number;
  maxPlayers: number;
  allowNewPlayers: boolean;
  createdAt: string;
  // 캐릭터 정보 (조회 후 추가)
  hasCharacter?: boolean;
  characterName?: string;
  characterFaction?: 'empire' | 'alliance';
  characterRank?: string;
  characterPicture?: string;
  characterImgsvr?: number;
}

interface UserInfo {
  id: string;
  username: string;
  nickname: string;
  grade: string;
  acl: string;
}

// Faction Config
const FACTION_CONFIG = {
  empire: {
    name: '은하제국',
    nameEn: 'Galactic Empire',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    emblem: '🦅',
  },
  alliance: {
    name: '자유혹성동맹',
    nameEn: 'Free Planets Alliance',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    emblem: '🌟',
  },
};

// Star Background Component
function StarField() {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; opacity: number; delay: number }>>([]);
  
  useEffect(() => {
    const generateStars = () => {
      return Array.from({ length: 150 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        delay: Math.random() * 3,
      }));
    };
    setStars(generateStars());
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-[80px]" />
    </div>
  );
}

export default function LoGHEntrancePage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [sessionList, setSessionList] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    try {
      setLoading(true);
      
      // 삼국지와 동일한 패턴: 세션 목록 + 유저 정보 동시 조회
      const [sessionStatus, userInfoData] = await Promise.all([
        loghApi.getSessionList(),
        loghApi.getUserInfo().catch(() => null),
      ]);
      
      if (sessionStatus.result) {
        if (sessionStatus.notice) {
          setNotice(sessionStatus.notice);
        }
        
        const sessions: Session[] = sessionStatus.sessions.map((s) => ({
          ...s,
          hasCharacter: false,
        }));
        
        setSessionList(sessions);
        
        // 유저 정보가 있으면 각 세션에서 캐릭터 정보 조회
        if (userInfoData?.result) {
          const characterChecks = sessions.map(async (session) => {
            try {
              const charInfo = await loghApi.getMyCharacterInfo(session.sessionId);
              
              return {
                sessionId: session.sessionId,
                hasCharacter: charInfo.success && charInfo.hasCharacter,
                characterName: charInfo.character?.name || '',
                characterFaction: charInfo.character?.faction,
                characterRank: charInfo.character?.rank || '',
                characterPicture: charInfo.character?.picture || '',
                characterImgsvr: charInfo.character?.imgsvr || 0,
              };
            } catch (err) {
              return {
                sessionId: session.sessionId,
                hasCharacter: false,
              };
            }
          });
          
          const results = await Promise.all(characterChecks);
          
          setSessionList((prev) =>
            prev.map((session) => {
              const result = results.find((r) => r.sessionId === session.sessionId);
              return {
                ...session,
                hasCharacter: result?.hasCharacter ?? false,
                characterName: result?.characterName || '',
                characterFaction: result?.characterFaction,
                characterRank: result?.characterRank || '',
                characterPicture: result?.characterPicture || '',
                characterImgsvr: result?.characterImgsvr || 0,
              };
            })
          );
        }
      }
      
      if (userInfoData?.result) {
        setUserInfo({
          id: userInfoData.id,
          username: userInfoData.username,
          nickname: userInfoData.nickname,
          grade: userInfoData.grade,
          acl: userInfoData.acl,
        });
        // 관리자 여부 체크 (삼국지와 동일)
        const grade = parseInt(userInfoData.grade) || 0;
        setIsAdmin(grade >= 5 || userInfoData.acl !== '-');
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      showToast('데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleLogout() {
    try {
      localStorage.removeItem('token');
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      router.push('/');
    } catch (err) {
      localStorage.removeItem('token');
      router.push('/');
    }
  }
  
  // 상태별 설정 (삼국지와 동일)
  const statusConfig: Record<string, { color: string; label: string }> = {
    preparing: { color: 'bg-purple-500 text-purple-50', label: '준비중' },
    running: { color: 'bg-green-500 text-green-50', label: '진행중' },
    paused: { color: 'bg-red-500 text-red-50', label: '일시정지' },
    finished: { color: 'bg-gray-500 text-gray-50', label: '종료됨' },
    united: { color: 'bg-yellow-500 text-yellow-50', label: '통일완료' },
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-white relative overflow-x-hidden selection:bg-primary selection:text-white font-sans">
      <StarField />
      
      {/* Nav - 삼국지 entrance와 유사 */}
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <Link 
          href="/game-select" 
          className="text-2xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-cyan-400 hover:opacity-80 transition-opacity"
        >
          LOGH: OpenSAM
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-white">{userInfo?.nickname || '게스트'}</span>
            <span className="text-xs text-gray-500">환영합니다</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-sm text-gray-400 transition-all border border-transparent hover:border-red-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
            {COMMON_TEXT.logout}
          </button>
        </div>
      </nav>
      
      <div className="flex-1 container mx-auto p-4 lg:p-8 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Warning Banner - 삼국지와 동일 */}
        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-4 shadow-lg shadow-red-900/5">
          <div className="p-2 bg-red-500/20 rounded-full shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-400 mb-1">중요 알림</h3>
            <p className="text-sm text-red-200/80 leading-relaxed">
              ★ 1명이 2개 이상의 계정을 사용하거나 타 유저의 턴을 대신 입력하는 것이 적발될 경우 차단 될 수 있습니다.<br/>
              계정은 한번 등록으로 계속 사용합니다. 각 세션 리셋시 캐릭터만 새로 생성하면 됩니다.
            </p>
          </div>
        </div>
        
        {/* Admin Panel - 삼국지와 유사 */}
        {isAdmin && (
          <div className="mb-8 p-6 rounded-xl bg-slate-800/60 backdrop-blur border border-yellow-500/20 shadow-lg shadow-yellow-900/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-yellow-400">관리자 패널</h2>
                <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 font-mono">
                  {COMMON_TEXT.adminBadge}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              <Link 
                href="/logh/admin" 
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-yellow-500 hover:text-black transition-all text-sm font-medium border border-white/5 shadow-sm"
              >
                세션 관리
              </Link>
              <Link 
                href="/logh/admin/players" 
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-yellow-500 hover:text-black transition-all text-sm font-medium border border-white/5 shadow-sm"
              >
                플레이어 관리
              </Link>
              <Link 
                href="/logh/admin/logs" 
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-yellow-500 hover:text-black transition-all text-sm font-medium border border-white/5 shadow-sm"
              >
                로그 조회
              </Link>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">전체 공지사항 수정</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all outline-none text-sm"
                    value={notice}
                    onChange={(e) => setNotice(e.target.value)}
                    placeholder="공지사항을 입력하세요..."
                  />
                  <button
                    className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all text-sm font-medium border border-yellow-500/20"
                    onClick={() => showToast('공지사항 변경 기능은 추후 구현 예정입니다.', 'info')}
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Notice Banner */}
        {notice && (
          <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-slate-800/50 border border-cyan-500/20 flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="p-3 bg-cyan-500/20 rounded-xl shrink-0 text-cyan-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-cyan-400 mb-1">공지사항</h3>
              <p className="text-cyan-100/90 text-lg leading-relaxed font-medium">{notice}</p>
            </div>
          </div>
        )}
        
        {/* Session List Header */}
        <div className="mb-6 flex items-end justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">게임 세션</h2>
            <p className="text-sm text-gray-500">참여할 전장을 선택하세요</p>
          </div>
          <Link
            href="/game-select"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
            </svg>
            게임 선택으로
          </Link>
        </div>
        
        {/* Session Grid - 삼국지 서버 목록과 유사 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-slate-800/40 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : sessionList.length === 0 ? (
          <div className="text-center py-24 rounded-2xl bg-slate-800/20 border border-dashed border-white/10">
            <p className="text-gray-400 text-lg font-medium">현재 운영 중인 세션이 없습니다.</p>
            <p className="text-sm text-gray-600 mt-2">나중에 다시 확인해주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessionList.map((session) => {
              const status = session.status;
              const isRunning = status === 'running';
              const canJoin = (status === 'preparing' || isRunning) && session.allowNewPlayers;
              const currentConfig = statusConfig[status] || statusConfig.finished;
              const factionConfig = session.characterFaction ? FACTION_CONFIG[session.characterFaction] : null;
              
              return (
                <div
                  key={session.sessionId}
                  className={cn(
                    "group relative flex flex-col bg-slate-800/80 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
                    session.hasCharacter && factionConfig
                      ? `${factionConfig.borderColor} hover:shadow-${session.characterFaction === 'empire' ? 'yellow' : 'cyan'}-500/20`
                      : "border-white/10 hover:border-white/20 hover:shadow-primary/10"
                  )}
                >
                  {/* Header Area */}
                  <div className="p-6 pb-4 flex items-start justify-between gap-4 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider", currentConfig.color)}>
                          {session.statusText || currentConfig.label}
                        </span>
                        {session.sessionId === 'logh_main' && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            메인
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-white truncate pr-2 group-hover:text-yellow-400 transition-colors tracking-tight">
                        {session.korName}
                      </h3>
                      <p className="text-sm text-gray-500 truncate mt-1">{session.scenarioName}</p>
                    </div>
                    
                    {/* Character Portrait */}
                    {session.hasCharacter && (
                      <div className={cn(
                        "relative w-14 h-14 rounded-full overflow-hidden border-2 shadow-lg group-hover:scale-110 transition-transform",
                        factionConfig?.borderColor
                      )}>
                        <img
                          src={session.characterPicture ? `/images/logh_portraits/${session.characterImgsvr || 0}/${session.characterPicture}.jpg` : '/images/default_commander.png'}
                          alt={`${session.characterName} 초상`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/default_commander.png';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Session Info */}
                  <div className="px-6 py-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>턴 {session.turn} • {session.year}</span>
                      <span>{session.currentPlayers}/{session.maxPlayers}명</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(session.currentPlayers / session.maxPlayers) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Character Info (if exists) */}
                  {session.hasCharacter && factionConfig && (
                    <div className="px-6 py-2">
                      <div className={cn(
                        "flex items-center gap-2 text-xs bg-black/20 p-2 rounded-lg border",
                        factionConfig.borderColor
                      )}>
                        <span className="text-lg">{factionConfig.emblem}</span>
                        <span className={cn("font-bold", factionConfig.color)}>{session.characterName}</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-gray-400">{session.characterRank}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Area */}
                  <div className="mt-auto p-6 pt-4">
                    <div className="grid grid-cols-1 gap-3">
                      {status === 'finished' || status === 'united' ? (
                        <button disabled className="w-full py-3 rounded-xl bg-white/5 text-white/30 font-medium cursor-not-allowed text-sm border border-white/5">
                          입장 불가
                        </button>
                      ) : session.exists && session.hasCharacter ? (
                        <Link
                          href={`/logh/game?sessionId=${session.sessionId}`}
                          className={cn(
                            "w-full py-3 rounded-xl font-bold text-center text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                            session.characterFaction === 'empire'
                              ? "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white shadow-yellow-900/30"
                              : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/30"
                          )}
                        >
                          <span>접속하기</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                          </svg>
                        </Link>
                      ) : canJoin ? (
                        <>
                          <Link
                            href={`/logh/join?sessionId=${session.sessionId}`}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-center text-sm shadow-lg shadow-purple-900/30 hover:shadow-xl transition-all active:scale-[0.98]"
                          >
                            캐릭터 생성
                          </Link>
                        </>
                      ) : (
                        <button
                          onClick={() => router.push(`/logh/game?sessionId=${session.sessionId}&spectator=true`)}
                          className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                        >
                          관전 모드
                        </button>
                      )}
                      
                      {isAdmin && (
                        <Link
                          href={`/logh/admin/session/${session.sessionId}`}
                          className="w-full py-2 rounded-lg bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700 border border-white/10 transition-colors text-xs text-center"
                        >
                          관리자 모드
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Faction Info & Quick Links */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-white/10 pt-12">
          {/* Faction Info */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" x2="22" y1="12" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              진영 안내
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={cn("p-4 rounded-lg border", FACTION_CONFIG.empire.borderColor, FACTION_CONFIG.empire.bgColor)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{FACTION_CONFIG.empire.emblem}</span>
                  <span className={cn("font-bold", FACTION_CONFIG.empire.color)}>{FACTION_CONFIG.empire.name}</span>
                </div>
                <p className="text-xs text-gray-400">
                  질서와 통일을 추구하는 황금빛 제국. 강력한 군사력과 체계적인 조직력이 특징.
                </p>
              </div>
              <div className={cn("p-4 rounded-lg border", FACTION_CONFIG.alliance.borderColor, FACTION_CONFIG.alliance.bgColor)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{FACTION_CONFIG.alliance.emblem}</span>
                  <span className={cn("font-bold", FACTION_CONFIG.alliance.color)}>{FACTION_CONFIG.alliance.name}</span>
                </div>
                <p className="text-xs text-gray-400">
                  자유와 민주주의를 수호하는 연합체. 개인의 자유와 인권을 최우선으로.
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              바로가기
            </h3>
            <div className="flex flex-col gap-2">
              <Link href="/logh/info/galaxy" className="p-3 rounded-lg bg-slate-800 border border-white/5 hover:border-cyan-500/30 hover:bg-slate-700 transition-all flex items-center justify-between group">
                <span className="text-sm text-gray-300 group-hover:text-white">🌌 은하 정보</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-cyan-400">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Link>
              <Link href="/logh/ship-viewer" className="p-3 rounded-lg bg-slate-800 border border-white/5 hover:border-cyan-500/30 hover:bg-slate-700 transition-all flex items-center justify-between group">
                <span className="text-sm text-gray-300 group-hover:text-white">🚀 함선 도감</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-cyan-400">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Link>
              <Link href="/logh/commands" className="p-3 rounded-lg bg-slate-800 border border-white/5 hover:border-cyan-500/30 hover:bg-slate-700 transition-all flex items-center justify-between group">
                <span className="text-sm text-gray-300 group-hover:text-white">⚔️ 커맨드 목록</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-cyan-400">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center text-xs text-gray-600 pb-8">
          <p>© 2025 • OpenSAM Project • 은하영웅전설</p>
        </div>
      </div>
    </div>
  );
}
