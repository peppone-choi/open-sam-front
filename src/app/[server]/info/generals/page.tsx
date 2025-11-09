'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

function getCrewTypeName(crewtype: number): string {
  const crewTypes: Record<number, string> = {
    0: '없음',
    1: '창병',
    2: '극병',
    3: '노병',
    4: '기병',
    5: '충차',
    6: '투석',
    7: '정예병'
  };
  return crewTypes[crewtype] || '없음';
}

function GeneralsInfoContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const type = searchParams?.get('type') ? Number(searchParams.get('type')) : 7;

  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<any[]>([]);

  useEffect(() => {
    loadGeneralList();
  }, [serverID, type]);

  async function loadGeneralList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetGeneralList({ type });
      if (result.result && result.generalList) {
        setGeneralList(result.generalList);
      }
    } catch (err) {
      console.error(err);
      alert('장수 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="암 행 부" />
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
              <option value={1}>자금</option>
              <option value={2}>군량</option>
              <option value={3}>도시</option>
              <option value={4}>병종</option>
              <option value={5}>병사</option>
              <option value={6}>삭제턴</option>
              <option value={7}>턴</option>
              <option value={8}>부대</option>
            </select>
          </label>
        </form>
      </div>
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.tableContainer}>
            <table className={styles.generalTable}>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>통무지</th>
                  <th>자금</th>
                  <th>군량</th>
                  <th>도시</th>
                  <th>병종</th>
                  <th>병사</th>
                  <th>훈련</th>
                  <th>사기</th>
                  <th>삭턴</th>
                  <th>턴</th>
                </tr>
              </thead>
              <tbody>
                {generalList.map((general) => (
                  <tr key={general.no}>
                    <td className={styles.nameCell}>
                      <div>{general.name}</div>
                      <div className={styles.level}>Lv {general.explevel || 0}</div>
                    </td>
                    <td className={styles.statsCell}>
                      {general.leadership}∥{general.strength}∥{general.intel}
                    </td>
                    <td className={styles.numberCell}>{general.gold?.toLocaleString() || 0}</td>
                    <td className={styles.numberCell}>{general.rice?.toLocaleString() || 0}</td>
                    <td>{general.cityName || general.city}</td>
                    <td>{getCrewTypeName(general.crewtype || 0)}</td>
                    <td className={styles.numberCell}>{general.crew?.toLocaleString() || 0}</td>
                    <td className={styles.numberCell}>{general.train || 0}</td>
                    <td className={styles.numberCell}>{general.atmos || 0}</td>
                    <td className={styles.numberCell}>{general.killturn || 0}</td>
                    <td className={styles.timeCell}>
                      {general.turntime ? new Date(general.turntime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GeneralsInfoPage() {
  return (
    <Suspense fallback={<div className="center" style={{ padding: '2rem' }}>로딩 중...</div>}>
      <GeneralsInfoContent />
    </Suspense>
  );
}





