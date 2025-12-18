'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TopBackBar from '@/components/common/TopBackBar';
import { SammoAPI } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';

interface DashboardStats {
  generalCount: number;
  nationCount: number;
  cityCount: number;
  userCount: number;
  year: number;
  month: number;
  status: string;
  turnterm: number;
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

export default function AdminDashboardPage() {
  const params = useParams();
  const serverID = params?.server as string;
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [nationStats, setNationStats] = useState<any[]>([]);
  
  const loadDashboard = useCallback(async () => {
    if (!serverID) return;
    
    try {
      setLoading(true);
      
      // 게임 정보와 통계 동시 로딩
      const [gameInfoResult, infoResult, nationResult] = await Promise.all([
        SammoAPI.AdminGetGameInfo({ session_id: serverID }),
        SammoAPI.AdminGetInfo({ type: 0 }),
        SammoAPI.AdminGetNationStats({ session_id: serverID, sortType: 0 }).catch(() => ({ success: false })),
      ]);
      
      if (gameInfoResult.result) {
        const gameInfo = gameInfoResult.gameInfo;
        
        // info 결과에서 통계 추출
        let generalCount = 0;
        let nationCount = 0;
        let cityCount = 0;
        let userCount = 0;
        
        if (infoResult.result && infoResult.infoList) {
          infoResult.infoList.forEach((item: any) => {
            if (item.name === '총 장수') generalCount = item.value;
            if (item.name === '총 국가') nationCount = item.value;
            if (item.name === '총 도시') cityCount = item.value;
            if (item.name === '총 사용자') userCount = item.value;
          });
        }
        
        setStats({
          generalCount,
          nationCount,
          cityCount,
          userCount,
          year: gameInfo.year || 184,
          month: gameInfo.month || 1,
          status: gameInfo.status || 'unknown',
          turnterm: gameInfo.turnterm || 60,
        });
      }
      
      if ((nationResult as any).success && (nationResult as any).stats) {
        setNationStats((nationResult as any).stats.slice(0, 5)); // 상위 5개 국가
      }
      
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }, [serverID]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    preparing: { label: '🔧 준비중', color: 'text-purple-400', bg: 'bg-purple-500/20' },
    running: { label: '✅ 운영중', color: 'text-green-400', bg: 'bg-green-500/20' },
    paused: { label: '🔒 폐쇄', color: 'text-red-400', bg: 'bg-red-500/20' },
    finished: { label: '🏁 종료', color: 'text-gray-400', bg: 'bg-gray-500/20' },
    united: { label: '👑 천하통일', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  };

  const quickStats: QuickStat[] = stats ? [
    { label: '총 장수', value: stats.generalCount, icon: '🎭', color: 'from-blue-500 to-cyan-500' },
    { label: '총 국가', value: stats.nationCount, icon: '🏰', color: 'from-amber-500 to-orange-500' },
    { label: '총 도시', value: stats.cityCount, icon: '🏙️', color: 'from-green-500 to-emerald-500' },
    { label: '총 유저', value: stats.userCount, icon: '👥', color: 'from-purple-500 to-pink-500' },
  ] : [];

  const adminMenus = [
    {
      title: '게임 설정',
      description: '서버 상태, 턴 시간, 기본 설정 관리',
      href: `/${serverID}/admin/game`,
      icon: '⚙️',
      color: 'hover:border-blue-500/50',
    },
    {
      title: '일제 정보',
      description: '국가별 상세 통계 및 순위',
      href: `/${serverID}/admin/info`,
      icon: '📊',
      color: 'hover:border-green-500/50',
    },
    {
      title: '장수 관리',
      description: '장수 검색, 수정, 블럭 및 이벤트',
      href: `/${serverID}/admin/general`,
      icon: '🎭',
      color: 'hover:border-orange-500/50',
    },
    {
      title: '회원 관리',
      description: '유저 관리, 접속 제한, 메시지 전달',
      href: `/${serverID}/admin/member`,
      icon: '👥',
      color: 'hover:border-purple-500/50',
    },
    {
      title: '외교 관리',
      description: '국가 간 외교 관계 현황',
      href: `/${serverID}/admin/diplomacy`,
      icon: '🤝',
      color: 'hover:border-cyan-500/50',
    },
    {
      title: '시간 제어',
      description: '턴 시간 조정 및 게임 락',
      href: `/${serverID}/admin/time-control`,
      icon: '⏰',
      color: 'hover:border-yellow-500/50',
    },
    {
      title: '활동 로그',
      description: '장수 활동 및 전투 기록 조회',
      href: `/${serverID}/admin/logs`,
      icon: '📜',
      color: 'hover:border-red-500/50',
    },
    {
      title: '전당 재구성',
      description: '명예의 전당 데이터 재계산',
      href: `/${serverID}/admin/force-rehall`,
      icon: '🏆',
      color: 'hover:border-amber-500/50',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
        <TopBackBar title="관 리 자  대 시 보 드" backUrl="/entrance" />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <span className="text-gray-400">대시보드 로딩 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
      <TopBackBar 
        title="관 리 자  대 시 보 드" 
        backUrl="/entrance"
        reloadable
        onReload={loadDashboard}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* 서버 상태 헤더 */}
        {stats && (
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "px-4 py-2 rounded-full font-bold text-sm",
                  statusConfig[stats.status]?.bg || 'bg-gray-500/20',
                  statusConfig[stats.status]?.color || 'text-gray-400'
                )}>
                  {statusConfig[stats.status]?.label || stats.status}
                </div>
                <div className="text-gray-400">
                  <span className="font-mono text-xl text-white">{stats.year}</span>년{' '}
                  <span className="font-mono text-xl text-white">{stats.month}</span>월
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div>
                  턴 주기: <span className="text-white font-mono">{stats.turnterm}</span>분
                </div>
                <div>
                  서버: <span className="text-white font-mono">{serverID}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 퀵 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, idx) => (
            <div 
              key={idx}
              className="relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-5 shadow-lg group hover:border-white/20 transition-all duration-300"
            >
              <div className={cn(
                "absolute inset-0 opacity-10 bg-gradient-to-br",
                stat.color
              )} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold font-mono text-white">{stat.value}</p>
                </div>
                <div className="text-4xl opacity-50 group-hover:opacity-80 transition-opacity">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 국가 순위 미리보기 */}
        {nationStats.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🏆</span> 국력 순위 TOP 5
              </h2>
              <Link 
                href={`/${serverID}/admin/info`}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/5">
                    <th className="py-2 px-3 text-left">#</th>
                    <th className="py-2 px-3 text-left">국가</th>
                    <th className="py-2 px-3 text-right">국력</th>
                    <th className="py-2 px-3 text-right">장수</th>
                    <th className="py-2 px-3 text-right">도시</th>
                    <th className="py-2 px-3 text-right">국고</th>
                    <th className="py-2 px-3 text-right">병량</th>
                  </tr>
                </thead>
                <tbody>
                  {nationStats.map((nation, idx) => (
                    <tr 
                      key={nation.nation} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full shadow-inner"
                            style={{ backgroundColor: nation.color || '#666' }}
                          />
                          <span className="font-medium text-white">{nation.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-yellow-400">{nation.power?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono">{nation.gennum}</td>
                      <td className="py-3 px-3 text-right font-mono">{nation.city_count}</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-400">{nation.gold?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-green-400">{nation.rice?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 관리 메뉴 그리드 */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🛠️</span> 관리 메뉴
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminMenus.map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                className={cn(
                  "group flex flex-col p-5 rounded-xl border border-white/5 bg-slate-800/40 backdrop-blur-sm",
                  "hover:bg-slate-800/70 hover:-translate-y-1 transition-all duration-200 shadow-lg",
                  menu.color
                )}
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                  {menu.icon}
                </div>
                <div className="font-bold text-white mb-1">{menu.title}</div>
                <div className="text-xs text-gray-400 leading-relaxed">{menu.description}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span> 빠른 액션
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${serverID}/admin/game`}
              className="px-4 py-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg text-sm font-medium transition-colors border border-green-500/20"
            >
              ▶️ 서버 시작
            </Link>
            <Link
              href={`/${serverID}/admin/time-control`}
              className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-lg text-sm font-medium transition-colors border border-yellow-500/20"
            >
              ⏸️ 게임 일시정지
            </Link>
            <Link
              href={`/${serverID}/admin/game`}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/20"
            >
              📢 공지 작성
            </Link>
            <Link
              href={`/${serverID}/admin/general`}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-lg text-sm font-medium transition-colors border border-purple-500/20"
            >
              🔍 장수 검색
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
