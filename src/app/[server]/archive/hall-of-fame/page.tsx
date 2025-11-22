'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

function HallOfFameContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const seasonIdx = searchParams?.get('seasonIdx') ? Number(searchParams.get('seasonIdx')) : null;
  const scenarioIdx = searchParams?.get('scenarioIdx') ? Number(searchParams.get('scenarioIdx')) : null;

  const [loading, setLoading] = useState(true);
  const [scenarioList, setScenarioList] = useState<any[]>([]);
  const [hallOfFameData, setHallOfFameData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [seasonIdx, scenarioIdx]);

  async function loadData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetHallOfFame({
        seasonIdx: seasonIdx || undefined,
        scenarioIdx: scenarioIdx || undefined,
      });
      
      if (result.result) {
        setScenarioList(result.scenarioList || []);
        setHallOfFameData(result.hallOfFame || null);
      }
    } catch (err) {
      console.error(err);
      alert('명예의 전당 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="명 예 의 전 당" />
      
      <div className="max-w-6xl mx-auto space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            {/* Filter Section */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-center gap-4">
              <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
                시나리오 검색
              </label>
              <select
                value={`${seasonIdx}_${scenarioIdx || ''}`}
                onChange={(e) => {
                  const [s, sc] = e.target.value.split('_');
                  const url = new URL(window.location.href);
                  if (sc) {
                    url.searchParams.set('scenarioIdx', sc);
                  } else {
                    url.searchParams.delete('scenarioIdx');
                  }
                  if (s) {
                    url.searchParams.set('seasonIdx', s);
                  }
                  window.location.href = url.toString();
                }}
                className="flex-1 w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
              >
                {scenarioList.map((scenario) => (
                  <option key={`${scenario.season}_${scenario.scenario}`} value={`${scenario.season}_${scenario.scenario}`} className="bg-gray-900">
                    {scenario.name} ({scenario.cnt}회)
                  </option>
                ))}
              </select>
            </div>

            {/* Rank Section */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg min-h-[400px]">
              {/* 실제 데이터 렌더링은 백엔드 데이터 구조에 따라 구현 필요 */}
              {hallOfFameData ? (
                 <div className="space-y-4">
                    {/* Placeholder for hall of fame data structure */}
                    <pre className="text-xs text-gray-500 overflow-auto p-4 bg-black/30 rounded">
                       {JSON.stringify(hallOfFameData, null, 2)}
                    </pre>
                 </div>
              ) : (
                 <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="text-4xl mb-2">🏛️</div>
                    <p>선택된 시나리오의 기록이 없습니다.</p>
                 </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function HallOfFamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <HallOfFameContent />
    </Suspense>
  );
}
