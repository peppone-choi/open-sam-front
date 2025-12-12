'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { loghApi } from '@/lib/api/logh';

interface Session {
  sessionId: string;
  name: string;
  korName: string;
  status: 'preparing' | 'running' | 'paused' | 'finished' | 'united';
  statusText: string;
  currentPlayers: number;
  maxPlayers: number;
  turn: number;
  year: string;
}

interface SessionStatus {
  uptime: number;
  memory: { used: number; total: number };
  connections: number;
  lastTurnTime?: string;
  nextTurnTime?: string;
  empireCount: number;
  allianceCount: number;
}

export default function LoGHAdminPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (selectedSession) {
      loadSessionStatus(selectedSession);
    }
  }, [selectedSession]);
  
  async function loadData() {
    try {
      setLoading(true);
      
      const [sessionResult, userInfo] = await Promise.all([
        loghApi.getSessionList(),
        loghApi.getUserInfo(),
      ]);
      
      if (sessionResult.result) {
        setSessions(sessionResult.sessions);
        if (sessionResult.sessions.length > 0 && !selectedSession) {
          setSelectedSession(sessionResult.sessions[0].sessionId);
        }
      }
      
      if (userInfo.result) {
        const grade = parseInt(userInfo.grade) || 0;
        const adminCheck = grade >= 5 || userInfo.acl !== '-';
        setIsAdmin(adminCheck);
        
        if (!adminCheck) {
          showToast('관리자 권한이 없습니다.', 'error');
          router.push('/logh/entrance');
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('데이터 로드에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }
  
  async function loadSessionStatus(sessionId: string) {
    try {
      const result = await loghApi.adminGetSessionStatus(sessionId);
      if (result.result && result.status) {
        setSessionStatus(result.status);
      }
    } catch (error) {
      console.error('Failed to load session status:', error);
    }
  }
  
  async function handleStatusChange(sessionId: string, newStatus: 'running' | 'paused') {
    try {
      const result = await loghApi.adminUpdateSession(sessionId, { status: newStatus });
      if (result.result) {
        showToast(`세션 상태가 ${newStatus === 'running' ? '진행중' : '일시정지'}으로 변경되었습니다.`, 'success');
        loadData();
      } else {
        showToast(result.message || '상태 변경에 실패했습니다.', 'error');
      }
    } catch (error: any) {
      showToast(error.message || '상태 변경 중 오류가 발생했습니다.', 'error');
    }
  }
  
  async function handleForceTurn(sessionId: string) {
    if (!confirm('턴을 강제로 진행하시겠습니까?')) return;
    
    try {
      const result = await loghApi.adminForceTurn(sessionId);
      if (result.result) {
        showToast('턴이 강제 진행되었습니다.', 'success');
        loadSessionStatus(sessionId);
      } else {
        showToast(result.message || '턴 진행에 실패했습니다.', 'error');
      }
    } catch (error: any) {
      showToast(error.message || '턴 진행 중 오류가 발생했습니다.', 'error');
    }
  }
  
  const statusColors: Record<string, string> = {
    preparing: 'bg-purple-500',
    running: 'bg-green-500',
    paused: 'bg-red-500',
    finished: 'bg-gray-500',
    united: 'bg-yellow-500',
  };
  
  if (!isAdmin && !loading) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/logh/entrance"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-yellow-400">LOGH 관리자 패널</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/logh/admin/players"
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
            >
              플레이어 관리
            </Link>
            <Link
              href="/logh/admin/logs"
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
            >
              로그 조회
            </Link>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Session List */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-yellow-400">📋</span>
                세션 목록
              </h2>
              <div className="space-y-2">
                {sessions.map((session) => (
                  <button
                    key={session.sessionId}
                    onClick={() => setSelectedSession(session.sessionId)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all",
                      selectedSession === session.sessionId
                        ? "bg-yellow-500/10 border-yellow-500/50"
                        : "bg-slate-800/50 border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white">{session.korName}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        statusColors[session.status]
                      )}>
                        {session.statusText}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      턴 {session.turn} • {session.currentPlayers}/{session.maxPlayers}명
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Session Detail */}
            <div className="lg:col-span-2">
              {selectedSession ? (
                <div className="space-y-6">
                  {/* Session Info */}
                  <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold mb-4 text-yellow-400">세션 정보</h3>
                    {(() => {
                      const session = sessions.find(s => s.sessionId === selectedSession);
                      if (!session) return null;
                      
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">세션 ID</div>
                            <div className="font-mono text-sm">{session.sessionId}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">현재 상태</div>
                            <div className={cn(
                              "inline-flex items-center gap-1 text-sm",
                              session.status === 'running' ? 'text-green-400' :
                              session.status === 'paused' ? 'text-red-400' : 'text-gray-400'
                            )}>
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                statusColors[session.status]
                              )} />
                              {session.statusText}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">현재 턴</div>
                            <div className="text-sm">{session.turn}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">게임 시간</div>
                            <div className="text-sm">{session.year}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Server Status */}
                  {sessionStatus && (
                    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6">
                      <h3 className="text-lg font-bold mb-4 text-cyan-400">서버 상태</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">가동 시간</div>
                          <div className="text-sm">{Math.floor(sessionStatus.uptime / 3600)}시간</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">메모리</div>
                          <div className="text-sm">
                            {Math.round(sessionStatus.memory.used / 1024 / 1024)}MB / 
                            {Math.round(sessionStatus.memory.total / 1024 / 1024)}MB
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">접속 중</div>
                          <div className="text-sm">{sessionStatus.connections}명</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">다음 턴</div>
                          <div className="text-sm">
                            {sessionStatus.nextTurnTime 
                              ? new Date(sessionStatus.nextTurnTime).toLocaleTimeString('ko-KR') 
                              : '-'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Faction Balance */}
                      <div className="mt-6">
                        <div className="text-xs text-gray-500 mb-2">진영 분포</div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-yellow-400">🦅 은하제국</span>
                              <span>{sessionStatus.empireCount}명</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-500 rounded-full"
                                style={{ 
                                  width: `${(sessionStatus.empireCount / (sessionStatus.empireCount + sessionStatus.allianceCount || 1)) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-cyan-400">🌟 자유혹성동맹</span>
                              <span>{sessionStatus.allianceCount}명</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-cyan-500 rounded-full"
                                style={{ 
                                  width: `${(sessionStatus.allianceCount / (sessionStatus.empireCount + sessionStatus.allianceCount || 1)) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Admin Actions */}
                  <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold mb-4 text-purple-400">관리자 작업</h3>
                    <div className="flex flex-wrap gap-3">
                      {(() => {
                        const session = sessions.find(s => s.sessionId === selectedSession);
                        if (!session) return null;
                        
                        return (
                          <>
                            {session.status === 'running' ? (
                              <button
                                onClick={() => handleStatusChange(selectedSession, 'paused')}
                                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-sm font-medium transition-colors"
                              >
                                ⏸️ 일시정지
                              </button>
                            ) : session.status === 'paused' ? (
                              <button
                                onClick={() => handleStatusChange(selectedSession, 'running')}
                                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 text-sm font-medium transition-colors"
                              >
                                ▶️ 재개
                              </button>
                            ) : null}
                            
                            <button
                              onClick={() => handleForceTurn(selectedSession)}
                              className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 text-sm font-medium transition-colors"
                            >
                              ⚡ 턴 강제 진행
                            </button>
                            
                            <Link
                              href={`/logh/admin/session/${selectedSession}`}
                              className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
                            >
                              🔧 상세 설정
                            </Link>
                            
                            <Link
                              href={`/logh/admin/players?sessionId=${selectedSession}`}
                              className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
                            >
                              👥 플레이어 관리
                            </Link>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  세션을 선택하세요
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}








