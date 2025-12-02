'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI, type CityInfo } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import CityBasicCard from '@/components/cards/CityBasicCard';
import { cn } from '@/lib/utils';

const cityConstMap = {
  region: {
    0: '기타',
    1: '하북',
    2: '중원',
    3: '서북',
    4: '서촉',
    5: '남중',
    6: '초',
    7: '오월',
    8: '동이'
  },
  level: {
    0: '무',
    1: '향',
    2: '수',
    3: '진',
    4: '관',
    5: '이',
    6: '소',
    7: '중',
    8: '대',
    9: '특',
    10: '경'
  }
};

function CurrentCityContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const cityId = searchParams?.get('cityId');

  const [loading, setLoading] = useState(true);
  const [cityData, setCityData] = useState<CityInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restricted, setRestricted] = useState(false);
  const [restrictedData, setRestrictedData] = useState<any>(null);

  useEffect(() => {
    if (cityId) {
      loadCityData(parseInt(cityId));
    } else {
      loadCurrentCity();
    }
  }, [serverID, cityId]);

  async function loadCityData(cityIdNum: number) {
    try {
      setLoading(true);
      setError(null);
      setRestricted(false);
      const result = await SammoAPI.InfoGetCity({ 
        serverID,
        cityID: cityIdNum 
      });
      
      // 첩보 없는 타국 도시: 제한된 정보만 표시
      const apiResult = result as any;
      if (apiResult.result && apiResult.restricted && apiResult.city) {
        setRestricted(true);
        setRestrictedData(apiResult.city);
        setCityData(null);
      } else if (apiResult.result && apiResult.city) {
        setCityData(result.city);
        setRestrictedData(null);
      } else {
        setError('도시 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('도시 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCurrentCity() {
    try {
      setLoading(true);
      setError(null);
      const result = await SammoAPI.GetCurrentCity(serverID);
      if (result.result && result.city) {
        setCityData(result.city);
      } else {
        setError('현재 도시 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('현재 도시 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const displayName = cityData?.name || restrictedData?.name || '이름 미확인';
  const title = cityId ? `도시 정보 (${displayName})` : '현재 도시';
  
  const handleReload = () => {
    if (cityId) {
      loadCityData(parseInt(cityId));
    } else {
      loadCurrentCity();
    }
  };

  // 제한된 도시 정보 카드 (첩보 없는 타국)
  const RestrictedCityCard = ({ data }: { data: any }) => {
    const nationColor = data.nationColor || '#888888';
    return (
      <div className="w-full bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden text-gray-200">
        {/* 헤더 */}
        <div className="grid grid-cols-2 border-b border-white/10">
          <div 
            className="p-3 text-lg font-bold flex flex-col items-center justify-center"
            style={{ backgroundColor: nationColor, color: '#fff' }}
          >
            <span className="text-xs opacity-80 mb-1">
              {(cityConstMap?.region as any)?.[data.region ?? 0] || '지역'} | {(cityConstMap?.level as any)?.[data.level] || ''}
            </span>
            <span>{data.name}</span>
          </div>
          <div 
            className="p-3 text-lg font-bold flex items-center justify-center border-l border-white/10"
            style={{ backgroundColor: nationColor, color: '#fff' }}
          >
            {data.nationName || '???'}
          </div>
        </div>
        
        {/* 제한된 정보 알림 */}
        <div className="p-4 bg-yellow-900/30 border-b border-yellow-500/20 flex items-center gap-3">
          <span className="text-yellow-400 text-xl">🔒</span>
          <div>
            <div className="text-yellow-300 font-semibold">첩보 필요</div>
            <div className="text-yellow-200/70 text-sm">이 도시에 첩보를 심으면 상세 정보를 확인할 수 있습니다.</div>
          </div>
        </div>

        {/* 마스킹된 정보 */}
        <div className="grid grid-cols-3 gap-2 p-3">
          {['주민', '민심', '농업', '상업', '치안', '수비', '성벽', '장수'].map((label) => (
            <div key={label} className="flex flex-col bg-white/5 rounded-lg p-2.5 border border-white/5 min-h-[60px]">
              <div className="text-xs text-white/60 mb-1 font-semibold">{label}</div>
              <div className="text-lg font-bold text-white/30">???</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title={title} reloadable onReload={handleReload} />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-[50vh] text-red-400">
           {error}
        </div>
      ) : restricted && restrictedData ? (
        <div className="max-w-4xl mx-auto">
           <RestrictedCityCard data={restrictedData} />
        </div>
      ) : cityData ? (
        <div className="max-w-4xl mx-auto">
           <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
              <CityBasicCard city={cityData} cityConstMap={cityConstMap} />
           </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-gray-500">
          도시 정보를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
}

export default function CurrentCityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <CurrentCityContent />
    </Suspense>
  );
}
