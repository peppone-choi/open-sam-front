'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function CityInfoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const type = searchParams?.get('type') ? Number(searchParams.get('type')) : 10;

  const [loading, setLoading] = useState(true);
  const [cityList, setCityList] = useState<any[]>([]);

  useEffect(() => {
    loadCityList();
  }, [serverID, type]);

  async function loadCityList() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setCityList([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="세 력 도 시" reloadable onReload={loadCityList} />
      <div className={styles.filterSection}>
        <form method="get" className={styles.filterForm}>
          <label>
            정렬순서:
            <select
              name="type"
              value={type}
              onChange={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set('type', e.target.value);
                window.location.href = url.toString();
              }}
              className={styles.select}
            >
              <option value={1}>기본</option>
              <option value={2}>인구</option>
              <option value={3}>인구율</option>
              <option value={4}>민심</option>
              <option value={5}>농업</option>
              <option value={6}>상업</option>
              <option value={7}>치안</option>
              <option value={8}>수비</option>
              <option value={9}>성벽</option>
              <option value={10}>시세</option>
              <option value={11}>지역</option>
              <option value={12}>규모</option>
            </select>
          </label>
        </form>
      </div>
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.cityList}>
            {cityList.map((city) => (
              <div key={city.id} className={styles.cityItem}>
                <div className={styles.cityName}>{city.name}</div>
                <div className={styles.cityInfo}>
                  인구: {city.pop} / {city.popMax} | 민심: {city.trust}% | 농업: {city.agri} | 상업: {city.comm}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


