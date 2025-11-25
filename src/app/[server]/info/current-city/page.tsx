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
      const result = await SammoAPI.InfoGetCity({ 
        serverID,
        cityID: cityIdNum 
      });
      if (result.result && result.city) {
        setCityData(result.city);
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

  const title = cityId ? `도시 정보 (${cityData?.name || '이름 미확인'})` : '현재 도시';
  
  const handleReload = () => {
    if (cityId) {
      loadCityData(parseInt(cityId));
    } else {
      loadCurrentCity();
    }
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
