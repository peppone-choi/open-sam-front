'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function HallOfFamePage() {
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
    <div className={styles.container}>
      <TopBackBar title="명 예 의 전 당" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.filterSection}>
            <label>
              시나리오 검색:
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
                className={styles.select}
              >
                {scenarioList.map((scenario) => (
                  <option key={`${scenario.season}_${scenario.scenario}`} value={`${scenario.season}_${scenario.scenario}`}>
                    {scenario.name} ({scenario.cnt}회)
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.rankSection}>
            {/* 명예의 전당 랭킹 표시 */}
          </div>
        </div>
      )}
    </div>
  );
}


