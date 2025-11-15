'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { adjustColorForText } from '@/types/colorSystem';
import styles from './page.module.css';

interface OfficerData {
  meLevel: number;
  nation: {
    nation: number;
    name: string;
    level: number;
    color: string;
    chief_set: number;
  };
  chiefMinLevel: number;
  levelMap: Record<number, {
    name: string;
    city: number;
    cityName: string;
    belong: number;
    picture: string;
    imgsvr: number;
  }>;
  tigers: Array<{ name: string; value: number }>;
  eagles: Array<{ name: string; value: number }>;
  cities: Array<{
    city: number;
    name: string;
    level: number;
    region: number;
    officer_set: number;
    officers: Record<number, {
      name: string;
      city: number;
      cityName: string;
      belong: number;
      npc: number;
    }>;
  }>;
}

const CITY_LEVELS = ['', '촌', '소', '중', '대', '도', '거', '요', '주', '기'];
const REGION_NAMES: Record<number, string> = {
  0: '중립',
  1: '유주',
  2: '기주',
  3: '청주',
  4: '서주',
  5: '연주',
  6: '예주',
  7: '양주',
  8: '형주',
  9: '익주',
  10: '옹주',
  11: '교주',
  12: '낙양',
  13: '장안',
};

function getOfficerLevelText(level: number, nationLevel: number): string {
  const levelNames: Record<number, string> = {
    12: '군주',
    11: '승상',
    10: '대사마',
    9: '대장군',
    8: '대도독',
    7: '중랑장',
    6: '도위',
    5: '군사',
    4: '태수',
    3: '군사',
    2: '종사',
  };
  
  return levelNames[level] || '';
}

function newColor(bgColor: string): string {
  if (!bgColor || bgColor === '#000000') return '#ffffff';
  
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000000' : '#ffffff';
}

export default function OfficerPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [officerData, setOfficerData] = useState<OfficerData | null>(null);
  const [sortBy, setSortBy] = useState<'region' | 'level'>('region');

  useEffect(() => {
    loadOfficerData();
  }, [serverID]);

  async function loadOfficerData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetOfficerInfo();
      if (result.result) {
        setOfficerData(result.officer);
      } else {
        alert((result as any).reason || '장관 정보를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('장관 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <TopBackBar title="인 사 부" reloadable onReload={loadOfficerData} />
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      </div>
    );
  }

  if (!officerData) {
    return (
      <div className={styles.container}>
        <TopBackBar title="인 사 부" reloadable onReload={loadOfficerData} />
        <div className="center" style={{ padding: '2rem' }}>데이터 없음</div>
      </div>
    );
  }

  const { nation, levelMap, tigers, eagles, cities, chiefMinLevel } = officerData;
  
  // 밝은 색상이면 자동으로 어둡게 보정
  const displayColor = adjustColorForText(nation.color);
  const textColor = '#ffffff'; // 보정된 색상은 항상 어두우므로 흰색 글자

  const renderOfficerRows = () => {
    const rows: React.ReactElement[] = [];
    for (let i = 12; i >= chiefMinLevel; i -= 2) {
      const i1 = i;
      const i2 = i - 1;
      const officer1 = levelMap[i1] || { name: '-', belong: '-' };
      const officer2 = levelMap[i2] || { name: '-', belong: '-' };

      rows.push(
        <tr key={i}>
          <td className={styles.officerTitle}>
            {getOfficerLevelText(i1, nation.level)}
          </td>
          <td className={styles.officerIconCell}>
            {/* 이미지 표시 생략 */}
          </td>
          <td className={styles.officerName}>
            {officer1.name}({officer1.belong}년)
          </td>
          <td className={styles.officerTitle}>
            {getOfficerLevelText(i2, nation.level)}
          </td>
          <td className={styles.officerIconCell}>
            {/* 이미지 표시 생략 */}
          </td>
          <td className={styles.officerName}>
            {officer2.name}({officer2.belong}년)
          </td>
        </tr>
      );
    }
    return rows;
  };

  const groupedCities: Record<number, typeof cities> = {};
  cities.forEach((city) => {
    if (!groupedCities[city.region]) {
      groupedCities[city.region] = [];
    }
    groupedCities[city.region].push(city);
  });

  const sortedRegions = Object.keys(groupedCities)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className={styles.container}>
      <TopBackBar title="인 사 부" reloadable onReload={loadOfficerData} />

      <div className={styles.content}>
        {/* 국가명 헤더 */}
        <table className={styles.mainTable}>
          <thead>
            <tr>
              <th
                colSpan={6}
                style={{
                  color: textColor,
                  backgroundColor: displayColor,
                  fontSize: '1.5rem',
                  padding: '0.5rem'
                }}
              >
                【 {nation.name} 】
              </th>
            </tr>
          </thead>
          <tbody>
            {renderOfficerRows()}
            <tr>
              <td className={styles.labelCell}>오호장군【승전】</td>
              <td colSpan={5} className={styles.rankList}>
                {tigers.length > 0
                  ? tigers.map((t, i) => (
                      <span key={i}>
                        {t.name}【{t.value.toLocaleString()}】
                        {i < tigers.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  : '-'}
              </td>
            </tr>
            <tr>
              <td className={styles.labelCell}>건안칠자【계략】</td>
              <td colSpan={5} className={styles.rankList}>
                {eagles.length > 0
                  ? eagles.map((e, i) => (
                      <span key={i}>
                        {e.name}【{e.value.toLocaleString()}】
                        {i < eagles.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  : '-'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 도시 관직자 테이블 */}
        <div style={{ marginTop: '1rem' }}>
          <table className={styles.mainTable}>
            <thead>
              <tr>
                <th colSpan={2} className={styles.headerCell}>
                  도 시
                </th>
                <th className={styles.headerCell}>태 수 (사관) 【현재도시】</th>
                <th className={styles.headerCell}>군 사 (사관) 【현재도시】</th>
                <th className={styles.headerCell}>종 사 (사관) 【현재도시】</th>
              </tr>
            </thead>
            <tbody>
              {sortedRegions.map((region) => {
                const regionCities = groupedCities[region];
                return (
                  <React.Fragment key={region}>
                    <tr>
                      <td colSpan={5} className={styles.regionHeader}>
                        <span style={{ color: 'skyblue', fontSize: '1.2rem' }}>
                          {' '}
                          【 {REGION_NAMES[region] || '기타'} 】{' '}
                        </span>
                      </td>
                    </tr>
                    {regionCities.map((city) => {
                      const officer4 = city.officers[4];
                      const officer3 = city.officers[3];
                      const officer2 = city.officers[2];

                      const isOfficerSet = (level: number) => {
                        const mask = 1 << level;
                        return (city.officer_set & mask) !== 0;
                      };

                      return (
                        <tr key={city.city}>
                          <td
                            className={styles.cityLevel}
                            style={{
                              color: textColor,
                              backgroundColor: displayColor
                            }}
                          >
                            【{CITY_LEVELS[city.level] || '-'}】
                          </td>
                          <td
                            className={styles.cityName}
                            style={{
                              color: textColor,
                              backgroundColor: displayColor
                            }}
                          >
                            {city.name}
                          </td>
                          <td
                            className={styles.officerCell}
                            style={{ color: isOfficerSet(4) ? 'orange' : 'white' }}
                          >
                            {officer4
                              ? `${officer4.name}(${officer4.belong}년) 【${officer4.cityName}】`
                              : '-'}
                          </td>
                          <td
                            className={styles.officerCell}
                            style={{ color: isOfficerSet(3) ? 'orange' : 'white' }}
                          >
                            {officer3
                              ? `${officer3.name}(${officer3.belong}년) 【${officer3.cityName}】`
                              : '-'}
                          </td>
                          <td
                            className={styles.officerCell}
                            style={{ color: isOfficerSet(2) ? 'orange' : 'white' }}
                          >
                            {officer2
                              ? `${officer2.name}(${officer2.belong}년) 【${officer2.cityName}】`
                              : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              <tr>
                <td colSpan={5} className={styles.noteCell}>
                  ※ <span style={{ color: 'orange' }}>노란색</span>은 변경 불가능,
                  하얀색은 변경 가능 관직입니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
