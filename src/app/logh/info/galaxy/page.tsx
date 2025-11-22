'use client';

import { useEffect, useState } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import StarGrid from '@/components/logh/StarGrid';
import { loghApi } from '@/lib/api/logh';
import { cn } from '@/lib/utils';
import { LOGH_TEXT } from '@/constants/uiText';

// Types for Galaxy Info
interface GalaxyStats {
  empireSystems: number;
  allianceSystems: number;
  neutralSystems: number;
  activeBattles: number;
  totalFleets: number;
}

export default function LoghGalaxyInfoPage() {
  const [stats, setStats] = useState<GalaxyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGalaxyData();
  }, []);

  const loadGalaxyData = async () => {
    try {
      // TODO: Real API integration
      // const data = await loghApi.getGalaxyStats();
      
      // Mock Data
      setStats({
        empireSystems: 45,
        allianceSystems: 42,
        neutralSystems: 13,
        activeBattles: 3,
        totalFleets: 128
      });
    } catch (e) {
      console.error('은하 정보 로드 실패', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 md:p-6 lg:p-8 flex flex-col">
      <TopBackBar title="은하 지도 정보" backUrl="/logh/game" />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
        {/* Left Sidebar: Galaxy Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-blue-300 mb-4">세력 현황</h2>
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg border-l-4 border-yellow-500">
                  <span className="text-gray-300">은하제국</span>
                  <span className="font-bold text-white text-lg">{stats?.empireSystems} 성계</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg border-l-4 border-cyan-500">
                  <span className="text-gray-300">자유행성동맹</span>
                  <span className="font-bold text-white text-lg">{stats?.allianceSystems} 성계</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg border-l-4 border-gray-500">
                  <span className="text-gray-300">페잔/중립</span>
                  <span className="font-bold text-white text-lg">{stats?.neutralSystems} 성계</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-red-400 mb-4">전쟁 상황</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 mb-1">진행 중인 전투</div>
                <div className="text-2xl font-bold text-red-500">{stats?.activeBattles}</div>
              </div>
              <div className="bg-black/30 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 mb-1">출격 함대</div>
                <div className="text-2xl font-bold text-blue-400">{stats?.totalFleets}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Area: Interactive Map */}
        <div className="lg:col-span-3 bg-gray-900/30 border border-white/10 rounded-xl overflow-hidden relative min-h-[500px]">
          <div className="absolute inset-0">
             <StarGrid />
          </div>
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur p-2 rounded text-xs text-gray-400 border border-white/10">
            {LOGH_TEXT.pointerGuide.wheel.label}: {LOGH_TEXT.pointerGuide.wheel.action}
          </div>
        </div>
      </div>
    </div>
  );
}
