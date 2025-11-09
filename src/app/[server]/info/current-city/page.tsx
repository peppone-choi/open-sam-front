'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import CityBasicCard from '@/components/cards/CityBasicCard';
import styles from './page.module.css';

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
  const [cityData, setCityData] = useState<any>(null);
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
      const result = await SammoAPI.GetCurrentCity();
      if (result.result) {
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

  const title = cityId ? `도시 정보 (${cityData?.name || cityId})` : '현재 도시';
  
  const handleReload = () => {
    if (cityId) {
      loadCityData(parseInt(cityId));
    } else {
      loadCurrentCity();
    }
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={title} reloadable onReload={handleReload} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : error ? (
        <div className="center" style={{ padding: '2rem', color: 'red' }}>{error}</div>
      ) : cityData ? (
        <div className={styles.content}>
          <CityBasicCard city={cityData} cityConstMap={cityConstMap} />
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>도시 정보를 불러올 수 없습니다.</div>
      )}
    </div>
  );
}

export default function CurrentCityPage() {
  return (
    <Suspense fallback={<div className="center" style={{ padding: '2rem' }}>로딩 중...</div>}>
      <CurrentCityContent />
    </Suspense>
  );
}





