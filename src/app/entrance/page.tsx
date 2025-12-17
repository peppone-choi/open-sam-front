'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';
import { COMMON_TEXT } from '@/constants/uiText';
import { useToast } from '@/contexts/ToastContext';

interface Server {
  serverID: string;
  name: string;
  korName: string;
  color: string;
  exists: boolean;
  enable: boolean;
  isunited?: number; // 레거시: 0: 운영중, 2: 폐쇄, 3: 천하통일
  status?: 'preparing' | 'running' | 'paused' | 'finished' | 'united'; // 새 상태 시스템
  statusText?: string; // 한글 상태 텍스트
  scenarioName?: string; // 시나리오 이름
  serverDescription?: string; // 서버 설명 (로비 표시용)
  hasCharacter?: boolean; // 캐릭터 존재 여부
  characterName?: string; // 캐릭터 이름
  characterNation?: string; // 캐릭터 국가
  characterPicture?: string; // 캐릭터 얼굴 이미지
  characterImgsvr?: number; // 캐릭터 이미지 서버
  generals?: Array<{ name: string; nation: string }>;
  allow_npc_possess?: boolean; // NPC 플레이 허용 여부
}

export default function EntrancePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [serverList, setServerList] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [notice, setNotice] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      const [serverStatus, userInfoData] = await Promise.all([
        SammoAPI.GetServerStatus(),
        SammoAPI.GetUserInfo().catch(() => null),
      ]);

      if (serverStatus.result) {
        if (serverStatus.notice) {
          setNotice(serverStatus.notice);
        }
        
        const serverListData = serverStatus.server.map((s: any) => ({
          serverID: s.name,
          name: s.name,
          korName: s.korName,
          color: s.color,
          exists: s.exists,
          enable: s.enable,
          isunited: s.isunited || 0,
          status: s.status || 'running',
          statusText: s.statusText || '운영중',
          scenarioName: s.scenarioName || '',
          serverDescription: s.serverDescription || '', // 서버 설명 (로비 표시용)
          hasCharacter: false,
          allow_npc_possess: s.allow_npc_possess || false,
        }));
        
        setServerList(serverListData);

        if (userInfoData?.result) {
          const characterChecks = serverListData.map(async (server: any) => {
            try {
              const frontInfo = await SammoAPI.GeneralGetFrontInfo({
                serverID: server.serverID,
              });
              
              const hasCharacter = frontInfo.success === true && frontInfo.general && frontInfo.general.no > 0;
              
              return {
                serverID: server.serverID,
                hasCharacter,
                characterName: frontInfo.general?.name || '',
                characterNation: frontInfo.nation?.name || '',
                characterPicture: frontInfo.general?.picture || '',
                characterImgsvr: frontInfo.general?.imgsvr || 0,
              };
            } catch (err: any) {
              return {
                serverID: server.serverID,
                hasCharacter: false,
              };
            }
          });

          const results = await Promise.all(characterChecks);
          
          setServerList((prev) => {
            return prev.map((server) => {
              const result = results.find((r) => r.serverID === server.serverID);
              return {
                ...server,
                hasCharacter: result?.hasCharacter ?? false,
                characterName: result?.characterName || '',
                characterNation: result?.characterNation || '',
                characterPicture: result?.characterPicture || '',
                characterImgsvr: result?.characterImgsvr || 0,
              };
            });
          });
        }
      }

      if (userInfoData?.result) {
        setUserInfo(userInfoData);
        const grade = parseInt(userInfoData.grade) || 0;
        setIsAdmin(grade >= 5 || userInfoData.acl !== '-');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      localStorage.removeItem('token');
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      try {
        await SammoAPI.Logout();
      } catch (err) {}
      
      router.push('/');
    } catch (err) {
      localStorage.removeItem('token');
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-main relative overflow-x-hidden selection:bg-primary selection:text-white font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-hero-pattern opacity-30 pointer-events-none -z-10" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-20 -z-10" />

      {/* Nav */}
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-background-main/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <Link href="/" className="text-2xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary hover:opacity-80 transition-opacity">
          OpenSAM
        </Link>
        <div className="flex items-center gap-6">
           <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-white">{userInfo?.nickName}</span>
              <span className="text-xs text-foreground-dim">환영합니다</span>
           </div>
           <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-sm text-foreground-muted transition-all border border-transparent hover:border-red-500/20" aria-label="로그아웃">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
             {COMMON_TEXT.logout}
           </button>
        </div>
      </nav>

      <div className="flex-1 container mx-auto p-4 lg:p-8 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Warning Banner */}
        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-4 shadow-lg shadow-red-900/5">
           <div className="p-2 bg-red-500/20 rounded-full shrink-0">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400" aria-label="경고 아이콘"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
           </div>
           <div>
             <h3 className="text-sm font-bold text-red-400 mb-1">중요 알림</h3>
             <p className="text-sm text-red-200/80 leading-relaxed">
               ★ 1명이 2개 이상의 계정을 사용하거나 타 유저의 턴을 대신 입력하는 것이 적발될 경우 차단 될 수 있습니다.<br/>
               계정은 한번 등록으로 계속 사용합니다. 각 서버 리셋시 캐릭터만 새로 생성하면 됩니다.
             </p>
           </div>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="mb-8 p-6 rounded-xl bg-background-secondary/60 backdrop-blur border border-primary/20 shadow-lg shadow-primary/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-primary">관리자 패널</h2>
                <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/20 font-mono">{COMMON_TEXT.adminBadge}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              <Link href="/admin" className="px-4 py-2 rounded-lg bg-background-tertiary hover:bg-primary hover:text-white transition-all text-sm font-medium border border-white/5 shadow-sm">
                회원 관리
              </Link>
              <Link href="/admin/error-log" className="px-4 py-2 rounded-lg bg-background-tertiary hover:bg-primary hover:text-white transition-all text-sm font-medium border border-white/5 shadow-sm">
                에러 로그
              </Link>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                 <label className="text-xs text-foreground-dim mb-1 block">전체 공지사항 수정</label>
                 <div className="flex gap-2">
                    <input 
                      className="flex-1 px-4 py-2 rounded-lg bg-background-main/50 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm"
                      value={notice}
                      onChange={(e) => setNotice(e.target.value)}
                      placeholder="공지사항을 입력하세요..."
                    />
                    <button 
                      className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all text-sm font-medium border border-primary/20"
                       onClick={async () => {
                         try {
                           const result = await SammoAPI.AdminSetGlobalNotice({ notice });
                           if (result.result) {
                             showToast('공지사항이 저장되었습니다.', 'success');
                           } else {
                             showToast(result.reason || '공지사항 저장에 실패했습니다.', 'error');
                           }
                         } catch (error: any) {
                           showToast(error.message || '공지사항 저장 중 오류가 발생했습니다.', 'error');
                         }
                       }}
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
          <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-background-secondary border border-orange-500/20 flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left relative overflow-hidden">
             <div className="absolute top-0 right-0 p-32 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
             <div className="p-3 bg-orange-500/20 rounded-xl shrink-0 text-orange-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="공지사항 알림"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
             </div>
             <div className="relative z-10">
               <h3 className="text-lg font-bold text-orange-400 mb-1">공지사항</h3>
               <p className="text-orange-100/90 text-lg leading-relaxed font-medium">{notice}</p>
             </div>
          </div>
        )}

        {/* Server List Header */}
        <div className="mb-6 flex items-end justify-between border-b border-white/10 pb-4">
          <div>
             <h2 className="text-3xl font-bold text-white mb-1">서버 선택</h2>
             <p className="text-sm text-foreground-dim">참여할 전장을 선택하세요</p>
          </div>
        </div>

        {/* Server Grid */}
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1,2,3].map(i => (
               <div key={i} className="h-56 rounded-2xl bg-background-secondary/40 animate-pulse border border-white/5"></div>
             ))}
           </div>
        ) : serverList.length === 0 ? (
           <div className="text-center py-24 rounded-2xl bg-background-secondary/20 border border-dashed border-white/10">
             <p className="text-foreground-muted text-lg font-medium">현재 운영 중인 서버가 없습니다.</p>
             <p className="text-sm text-foreground-dim mt-2">나중에 다시 확인해주세요.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serverList.map((server) => {
              const status = server.status || (
                server.isunited === 2 ? 'preparing' :
                server.isunited === 3 ? 'united' : 'running'
              );
              
              const isRunning = status === 'running';
              const canJoin = status === 'preparing' || isRunning;
              
              const statusConfig = {
                preparing: { color: 'bg-purple-500 text-purple-50', label: '준비중' },
                running: { color: 'bg-green-500 text-green-50', label: '운영중' },
                paused: { color: 'bg-red-500 text-red-50', label: '일시정지' },
                finished: { color: 'bg-gray-500 text-gray-50', label: '종료됨' },
                united: { color: 'bg-yellow-500 text-yellow-50', label: '천하통일' },
              };
              
              const currentConfig = statusConfig[status] || statusConfig.finished;
              const statusText = server.statusText || currentConfig.label;

              return (
                <div key={server.serverID} className="group relative flex flex-col bg-background-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40">
                  
                  {/* Header Area */}
                  <div className="p-6 pb-4 flex items-start justify-between gap-4 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider", currentConfig.color)}>
                          {statusText}
                        </span>
                        {server.serverID === 'sammo' && (
                           <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">{COMMON_TEXT.officialBadge}</span>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-white truncate pr-2 group-hover:text-primary transition-colors tracking-tight">{server.korName}</h3>
                      <p className="text-sm text-foreground-dim truncate mt-1">{server.scenarioName || '기본 시나리오'}</p>
                    </div>
                    
                    {/* Character Portrait */}
                     {server.hasCharacter && (
                       <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 shadow-lg group-hover:scale-110 transition-transform group-hover:border-primary/50">
                          <img
                            src={server.characterPicture ? `/images/gen_icon/${server.characterImgsvr || 0}/${server.characterPicture}.jpg` : '/default_portrait.png'}
                            alt={`${server.characterName} - ${server.characterNation} 소속 장수 초상`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default_portrait.png';
                            }}
                          />
                       </div>
                     )}
                  </div>

                  {/* Character Info (if exists) */}
                  {server.hasCharacter && (
                    <div className="px-6 py-2">
                      <div className="flex items-center gap-2 text-xs text-foreground-muted bg-black/20 p-2 rounded-lg border border-white/5">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="font-bold text-white">{server.characterName}</span>
                        <span className="text-foreground-dim">|</span>
                        <span>{server.characterNation}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Area */}
                  <div className="mt-auto p-6 pt-4">
                     <div className="grid grid-cols-1 gap-3">
                        {!canJoin ? (
                           <button disabled className="w-full py-3 rounded-xl bg-white/5 text-white/30 font-medium cursor-not-allowed text-sm border border-white/5">
                               입장 불가
                           </button>
                        ) : server.exists && server.hasCharacter ? (
                           <Link href={`/${server.serverID}/game`} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-center text-sm shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2" aria-label={`${server.korName} 서버 게임에 접속하기`}>
                              <span>접속하기</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                           </Link>
                        ) : (
                           <>
                              <Link href={`/${server.serverID}/join`} className="w-full py-3 rounded-xl bg-secondary text-white font-bold text-center text-sm shadow-lg shadow-secondary/20 hover:bg-secondary-hover hover:shadow-secondary/30 transition-all active:scale-[0.98]">
                                 캐릭터 생성
                              </Link>
                              {server.allow_npc_possess && (
                                 <button
                                    onClick={() => router.push(`/${server.serverID}/select-npc`)}
                                    className="w-full py-2.5 rounded-xl bg-accent/10 text-accent font-semibold text-center text-xs border border-accent/20 hover:bg-accent hover:text-white transition-all"
                                 >
                                    NPC로 플레이
                                 </button>
                              )}
                           </>
                        )}
                        
                        {isAdmin && (
                           <Link href={`/${server.serverID}/admin`} className="w-full py-2 rounded-lg bg-background-tertiary text-foreground-dim hover:text-white hover:bg-background-tertiary/80 border border-white/10 transition-colors text-xs text-center">
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

        {/* Account Management & Server Info Section */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-white/10 pt-12">
           
           {/* Account Tools */}
           <div className="lg:col-span-1">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                계정 설정
              </h3>
              <div className="flex flex-col gap-2">
                <Link href="/user-info" className="p-3 rounded-lg bg-background-secondary border border-white/5 hover:border-primary/30 hover:bg-background-tertiary transition-all flex items-center justify-between group" aria-label="비밀번호 및 정보 수정 페이지로 이동">
                  <span className="text-sm text-gray-300 group-hover:text-white">비밀번호 &amp; 정보 수정</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-primary" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
                <Link href="/user-info/icon" className="p-3 rounded-lg bg-background-secondary border border-white/5 hover:border-primary/30 hover:bg-background-tertiary transition-all flex items-center justify-between group" aria-label="전용 아이콘 관리 페이지로 이동">
                  <span className="text-sm text-gray-300 group-hover:text-white">전용 아이콘 관리</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-primary" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
                <Link href="/user_info/delete" className="p-3 rounded-lg bg-background-secondary border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 transition-all flex items-center justify-between group" aria-label="회원 탈퇴 페이지로 이동">
                  <span className="text-sm text-gray-300 group-hover:text-red-300">회원 탈퇴</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-red-400" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              </div>
           </div>

           {/* Server Info Grid - 동적으로 서버 목록에서 가져옴 */}
           <div className="lg:col-span-2">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                서버 안내
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {serverList.length > 0 ? (
                    serverList.map((server) => (
                       <div key={server.serverID} className="p-3 rounded-lg bg-background-secondary/50 border border-white/5">
                          <span 
                            className="font-bold mr-2" 
                            style={{ color: (server.color && server.color !== '#000000') ? server.color : '#ffffff' }}
                          >
                            {server.korName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {server.serverDescription || server.scenarioName || `${server.statusText || '운영중'}`}
                          </span>
                       </div>
                    ))
                 ) : (
                    <div className="col-span-2 p-3 rounded-lg bg-background-secondary/50 border border-white/5 text-center text-gray-400">
                       서버 정보를 불러오는 중...
                    </div>
                 )}
              </div>
           </div>

        </div>
        
        <div className="mt-12 text-center text-xs text-foreground-dim pb-8">
           <p>© 2025 • Team OpenSAM</p>
        </div>

      </div>
    </div>
  );
}
