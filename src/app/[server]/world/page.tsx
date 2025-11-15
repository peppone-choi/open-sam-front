'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { adjustColorForText } from '@/types/colorSystem';
import styles from './page.module.css';

interface Nation {
  nation: number;
  name: string;
  color: string;
  level: number;
  capital: number;
  gennum: number;
  power: number;
  cities?: string[];
}

interface DiplomacyData {
  nations: Nation[];
  conflict: [number, Record<number, number>][];
  diplomacyList: Record<number, Record<number, number>>;
  myNationID: number;
}

export default function WorldPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diplomacyData, setDiplomacyData] = useState<DiplomacyData | null>(null);

  useEffect(() => {
    loadData();
  }, [serverID]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      const result = await SammoAPI.GetWorldInfo({
        session_id: serverID
      });
      
      if (result.result && (result as any).success) {
        setDiplomacyData({
          nations: (result as any).nations || [],
          conflict: (result as any).conflict || [],
          diplomacyList: (result as any).diplomacyList || {},
          myNationID: (result as any).myNationID || 0
        });
      } else {
        setError('중원 정보를 불러올 수 없습니다.');
      }
    } catch (err: any) {
      console.error('GetDiplomacy error:', err);
      setError(err.message || '중원 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const isBrightColor = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150;
  };

  const getDiplomacySymbol = (state: number, isInvolved: boolean): React.ReactElement => {
    if (isInvolved) {
      switch (state) {
        case 0:
          return <span style={{ color: 'red' }}>★</span>; // 교전
        case 1:
          return <span style={{ color: 'magenta' }}>▲</span>; // 선전포고
        case 2:
          return <span>ㆍ</span>; // 통상
        case 7:
          return <span style={{ color: 'limegreen' }}>@</span>; // 불가침
        default:
          return <span>?</span>;
      }
    } else {
      switch (state) {
        case 0:
          return <span style={{ color: 'red' }}>★</span>; // 교전 (visible)
        case 1:
          return <span style={{ color: 'magenta' }}>▲</span>; // 선전포고 (visible)
        default:
          return <span></span>; // 숨김
      }
    }
  };

  return (
    <div className={styles.container}>
      <TopBackBar title="중원 정보" reloadable onReload={loadData} />
      
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : error ? (
        <div className="center" style={{ padding: '2rem', color: 'red' }}>{error}</div>
      ) : diplomacyData ? (
        <div className={styles.content}>
          {/* 외교 현황 */}
          <div className={styles.diplomacySection}>
            <div className={styles.sectionTitle} style={{ backgroundColor: 'blue' }}>
              외교 현황
            </div>
            <div className={styles.diplomacyTableWrapper}>
              <table className={styles.diplomacyTable}>
                <thead>
                  <tr>
                    <th></th>
                    {diplomacyData.nations.map((nation) => (
                      <th
                        key={nation.nation}
                        className={styles.theadNation}
                        style={{
                          color: '#fff',
                          backgroundColor: adjustColorForText(nation.color),
                        }}
                      >
                        {nation.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {diplomacyData.nations.map((meNation) => (
                    <tr key={meNation.nation}>
                      <th
                        className={styles.tbodyNation}
                        style={{
                          color: '#fff',
                          backgroundColor: adjustColorForText(meNation.color),
                        }}
                      >
                        {meNation.name}
                      </th>
                      {diplomacyData.nations.map((youNation) => {
                        if (meNation.nation === youNation.nation) {
                          return (
                            <td key={youNation.nation} className={styles.tbodyCell}>
                              ＼
                            </td>
                          );
                        }
                        
                        const isInvolved = meNation.nation === diplomacyData.myNationID || 
                                          youNation.nation === diplomacyData.myNationID;
                        const state = diplomacyData.diplomacyList[meNation.nation]?.[youNation.nation] ?? 2;
                        
                        return (
                          <td
                            key={youNation.nation}
                            className={styles.tbodyCell}
                            style={isInvolved ? { backgroundColor: '#660000' } : {}}
                          >
                            {getDiplomacySymbol(state, isInvolved)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={diplomacyData.nations.length + 1} className="center">
                      불가침: <span style={{ color: 'limegreen' }}>@</span>, 통상: ㆍ, 선포: <span style={{ color: 'magenta' }}>▲</span>, 교전: <span style={{ color: 'red' }}>★</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 국가 목록 */}
          <div className={styles.nationListSection}>
            <div className={styles.sectionTitle} style={{ backgroundColor: 'green' }}>
              국가 목록
            </div>
            <table className={styles.nationTable}>
              <thead>
                <tr>
                  <th>국가</th>
                  <th>레벨</th>
                  <th>세력</th>
                  <th>장수</th>
                  <th>도시</th>
                </tr>
              </thead>
              <tbody>
                {diplomacyData.nations.map((nation) => (
                  <tr key={nation.nation}>
                    <td
                      style={{
                        color: '#fff',
                        backgroundColor: adjustColorForText(nation.color),
                        fontWeight: 'bold'
                      }}
                    >
                      {nation.name}
                    </td>
                    <td>{nation.level}</td>
                    <td>{nation.power?.toLocaleString() ?? 0}</td>
                    <td>{nation.gennum ?? 0}</td>
                    <td>{nation.cities?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 분쟁 현황 */}
          {diplomacyData.conflict.length > 0 && (
            <div className={styles.conflictSection}>
              <div className={styles.sectionTitle} style={{ backgroundColor: 'magenta' }}>
                분쟁 현황
              </div>
              <div className={styles.conflictList}>
                {diplomacyData.conflict.map(([cityID, conflictNations]) => (
                  <div key={cityID} className={styles.conflictItem}>
                    <div className={styles.conflictCityName}>도시 #{cityID}</div>
                    <div className={styles.conflictNations}>
                      {Object.entries(conflictNations).map(([nationID, percent]) => {
                        const nation = diplomacyData.nations.find(n => n.nation === parseInt(nationID));
                        if (!nation) return null;
                        
                        return (
                          <div key={nationID} className={styles.conflictNation}>
                            <div
                              className={styles.conflictNationName}
                              style={{
                                color: '#fff',
                                backgroundColor: adjustColorForText(nation.color),
                              }}
                            >
                              {nation.name}
                            </div>
                            <div className={styles.conflictNationPercent}>
                              {percent.toFixed(1)}%
                            </div>
                            <div className={styles.conflictBar}>
                              <div
                                className={styles.conflictBarFill}
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: nation.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="center" style={{ padding: '2rem' }}>데이터가 없습니다.</div>
      )}
    </div>
  );
}
