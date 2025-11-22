'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { isBrightColor } from '@/utils/isBrightColor';
import { cn } from '@/lib/utils';

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

interface OfficerResponse {
  result: boolean;
  officer?: OfficerData;
  reason?: string;
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

export default function OfficerPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [officerData, setOfficerData] = useState<OfficerData | null>(null);

  useEffect(() => {
    loadOfficerData();
  }, [serverID]);

  async function loadOfficerData() {
    try {
      setLoading(true);
      const result = (await SammoAPI['request']('/api/nation/get-officer-info', { 
          method: 'POST',
          body: JSON.stringify({ session_id: serverID }) 
      })) as OfficerResponse;
      if (result.result && result.officer) {
        setOfficerData(result.officer);
      } else {
        // alert((result as any).reason || '장관 정보를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      // alert('장관 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
        <TopBackBar title="인 사 부" reloadable onReload={loadOfficerData} />
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (!officerData) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
        <TopBackBar title="인 사 부" reloadable onReload={loadOfficerData} />
        <div className="flex justify-center items-center h-[50vh] text-gray-500">
          데이터 없음
        </div>
      </div>
    );
  }

  const { nation, levelMap, tigers, eagles, cities, chiefMinLevel } = officerData;
  
  const displayColor = nation.color;
  const textColor = isBrightColor(displayColor) ? '#111827' : '#ffffff';

  const renderOfficerRows = () => {
    const rows: React.ReactElement[] = [];
    for (let i = 12; i >= chiefMinLevel; i -= 2) {
      const i1 = i;
      const i2 = i - 1;
      const officer1 = levelMap[i1] || { name: '-', belong: '-' };
      const officer2 = levelMap[i2] || { name: '-', belong: '-' };

      rows.push(
        <tr key={i} className="border-b border-white/5">
          <td className="py-2 px-4 font-bold text-blue-300 bg-black/20">
            {getOfficerLevelText(i1, nation.level)}
          </td>
          <td className="py-2 px-4">
            {officer1.name !== '-' ? (
                <span className="text-white">{officer1.name} <span className="text-gray-500 text-xs">({officer1.belong}년)</span></span>
            ) : <span className="text-gray-600">-</span>}
          </td>
          <td className="py-2 px-4 font-bold text-blue-300 bg-black/20 border-l border-white/5">
            {getOfficerLevelText(i2, nation.level)}
          </td>
          <td className="py-2 px-4">
            {officer2.name !== '-' ? (
                <span className="text-white">{officer2.name} <span className="text-gray-500 text-xs">({officer2.belong}년)</span></span>
            ) : <span className="text-gray-600">-</span>}
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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="인 사 부" reloadable onReload={loadOfficerData} />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* 중앙 관직 테이블 */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
          <div 
            className="py-4 px-6 text-center font-bold text-xl"
            style={{ backgroundColor: displayColor, color: textColor }}
          >
            【 {nation.name} 】 중앙 관직
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <tbody>
                 {renderOfficerRows()}
                 <tr className="bg-black/30 border-t border-white/10">
                   <td className="py-3 px-4 font-bold text-yellow-500 whitespace-nowrap">오호장군【승전】</td>
                   <td colSpan={3} className="py-3 px-4 text-gray-300">
                     {tigers.length > 0
                       ? tigers.map((t, i) => (
                           <span key={i}>
                             {t.name}<span className="text-gray-500">【{t.value.toLocaleString()}】</span>
                             {i < tigers.length - 1 ? ', ' : ''}
                           </span>
                         ))
                       : '-'}
                   </td>
                 </tr>
                 <tr className="bg-black/30 border-t border-white/5">
                   <td className="py-3 px-4 font-bold text-green-500 whitespace-nowrap">건안칠자【계략】</td>
                   <td colSpan={3} className="py-3 px-4 text-gray-300">
                     {eagles.length > 0
                       ? eagles.map((e, i) => (
                           <span key={i}>
                             {e.name}<span className="text-gray-500">【{e.value.toLocaleString()}】</span>
                             {i < eagles.length - 1 ? ', ' : ''}
                           </span>
                         ))
                       : '-'}
                   </td>
                 </tr>
               </tbody>
             </table>
          </div>
        </div>

        {/* 지방 관직 테이블 */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-800/80 text-gray-300 border-b border-white/10">
                  <th className="py-3 px-4 whitespace-nowrap" colSpan={2}>도시</th>
                  <th className="py-3 px-4 whitespace-nowrap">태 수 (사관) 【현재도시】</th>
                  <th className="py-3 px-4 whitespace-nowrap">군 사 (사관) 【현재도시】</th>
                  <th className="py-3 px-4 whitespace-nowrap">종 사 (사관) 【현재도시】</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedRegions.map((region) => {
                  const regionCities = groupedCities[region];
                  return (
                    <React.Fragment key={region}>
                      <tr className="bg-gray-800/30">
                        <td colSpan={5} className="py-2 px-4 font-bold text-blue-400 border-b border-white/5">
                          【 {REGION_NAMES[region] || '기타'} 】
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
                          <tr key={city.city} className="hover:bg-white/5">
                            <td 
                                className="py-3 px-4 text-center w-12 font-bold"
                                style={{ backgroundColor: displayColor, color: textColor }}
                            >
                                {CITY_LEVELS[city.level] || '-'}
                            </td>
                            <td 
                                className="py-3 px-4 font-medium"
                                style={{ backgroundColor: displayColor, color: textColor }}
                            >
                                {city.name}
                            </td>
                            <td className={cn("py-3 px-4", isOfficerSet(4) ? "text-orange-400" : "text-gray-300")}>
                              {officer4
                                ? `${officer4.name}(${officer4.belong}년) 【${officer4.cityName}】`
                                : '-'}
                            </td>
                            <td className={cn("py-3 px-4", isOfficerSet(3) ? "text-orange-400" : "text-gray-300")}>
                              {officer3
                                ? `${officer3.name}(${officer3.belong}년) 【${officer3.cityName}】`
                                : '-'}
                            </td>
                            <td className={cn("py-3 px-4", isOfficerSet(2) ? "text-orange-400" : "text-gray-300")}>
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
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-black/20 text-xs text-center border-t border-white/5">
             <span className="text-orange-400">※ 노란색</span>은 변경 불가능, <span className="text-gray-400">회색</span>은 변경 가능 관직입니다.
          </div>
        </div>
      </div>
    </div>
  );
}
