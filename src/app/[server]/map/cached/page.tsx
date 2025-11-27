'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import MapViewer from '@/components/game/MapViewer';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';
import { convertLog } from '@/utils/convertLog';
import '@/styles/log.css';

interface CachedMapData {
  result: boolean;
  cityList?: number[][];
  nationList?: Array<[number, string, string, number, string, string, string, string]>;
  year?: number;
  month?: number;
  history?: string[];
  [key: string]: any;
}

export default function CachedMapPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [mapData, setMapData] = useState<CachedMapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapData();
  }, [serverID]);

  async function loadMapData() {
    try {
      setLoading(true);
      // 캐시된 지도 API 사용 (히스토리 포함)
      const result = await SammoAPI.GlobalGetCachedMap({ serverID });
      if (result.result) {
        setMapData(result as CachedMapData);
      }
    } catch (err) {
      console.error(err);
      showToast('지도 데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // 히스토리 로그 포맷팅
  const formatHistoryLog = (log: string): string => {
    try {
      return convertLog(log);
    } catch {
      return log;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <TopBackBar title={`${serverID || '서버'} 현황`} reloadable onReload={loadMapData} />
        
        {loading ? (
          <div className="min-h-[50vh] flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : mapData ? (
          <div className="space-y-6">
            {/* 지도 섹션 */}
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/60">
              <div className="bg-white/5 px-4 py-3 border-b border-white/5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                  </svg>
                  전체 지도
                  {mapData.year && mapData.month && (
                    <span className="text-sm text-gray-400 font-normal ml-2">
                      {mapData.year}년 {mapData.month}월
                    </span>
                  )}
                </h2>
              </div>
              <div className="relative min-h-[400px]">
                <MapViewer
                  serverID={serverID}
                  mapData={mapData as any}
                  onCityClick={() => {}}
                  isFullWidth={true}
                />
              </div>
            </div>

            {/* 히스토리 섹션 */}
            {mapData.history && mapData.history.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-gray-900/50 backdrop-blur shadow-xl overflow-hidden">
                <div className="bg-white/5 px-4 py-3 border-b border-white/5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
                    </svg>
                    중원 정세
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      ({mapData.history.length}건)
                    </span>
                  </h2>
                </div>
                <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                  {mapData.history.map((log, idx) => (
                    <div 
                      key={idx}
                      className="text-sm text-gray-300 leading-relaxed border-l-2 border-orange-500/30 pl-3 py-1"
                      dangerouslySetInnerHTML={{ __html: formatHistoryLog(log) }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-[50vh] flex justify-center items-center text-gray-500">
            지도 데이터를 불러올 수 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
