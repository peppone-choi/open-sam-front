'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

function CityInfoContent() {
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
      const result = await SammoAPI.GetCityList({ type, session_id: serverID });
      if (result.result && result.cityList) {
        setCityList(result.cityList);
      }
    } catch (err) {
      console.error(err);
      alert('도시 목록을 불러오는데 실패했습니다.');
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
          <table className={styles.cityTable}>
            <thead>
              <tr>
                <th>도시명</th>
                <th>레벨</th>
                <th>지역</th>
                <th>인구</th>
                <th>농업</th>
                <th>상업</th>
                <th>치안</th>
                <th>방어</th>
                <th>성벽</th>
                <th>민심</th>
              </tr>
            </thead>
            <tbody>
              {cityList.map((city) => (
                <tr key={city.city}>
                  <td className={styles.cityName}>{city.name}</td>
                  <td>{city.level}</td>
                  <td>{city.region}</td>
                  <td>{city.pop} / {city.pop_max}</td>
                  <td>{city.agri} / {city.agri_max}</td>
                  <td>{city.comm} / {city.comm_max}</td>
                  <td>{city.secu} / {city.secu_max}</td>
                  <td>{city.def} / {city.def_max}</td>
                  <td>{city.wall} / {city.wall_max}</td>
                  <td>{city.trust ? Math.round(city.trust * 10) / 10 : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function CityInfoPage() {
  return (
    <Suspense fallback={<div className="center" style={{ padding: '2rem' }}>로딩 중...</div>}>
      <CityInfoContent />
    </Suspense>
  );
}





