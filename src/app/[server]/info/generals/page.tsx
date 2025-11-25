'use client';
 
import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { formatOfficerLevelText } from '@/utils/formatOfficerLevelText';
import { useToast } from '@/contexts/ToastContext';


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

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<any[]>([]);

  useEffect(() => {
    loadGeneralList();
  }, [serverID, type]);

  async function loadGeneralList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetGeneralList({ session_id: serverID, type });
      if (result.result && result.generalList) {
        setGeneralList(result.generalList);
      }
    } catch (err) {
      console.error(err);
      showToast('장수 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const sortOptions = [
    { value: 1, label: '자금' },
    { value: 2, label: '군량' },
    { value: 3, label: '도시' },
    { value: 4, label: '병종' },
    { value: 5, label: '병사' },
    { value: 6, label: '삭제턴' },
    { value: 7, label: '턴' },
    { value: 8, label: '부대' },
    { value: 9, label: '통솔' },
    { value: 10, label: '무력' },
    { value: 11, label: '지력' },
    { value: 12, label: '정치' },
    { value: 13, label: '매력' },
    { value: 14, label: '훈련' },
    { value: 15, label: '사기' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="암 행 부" reloadable onReload={loadGeneralList} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Filter Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg flex items-center gap-4">
          <label className="text-sm font-medium text-gray-300 whitespace-nowrap">정렬 기준</label>
          <select
            value={type}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set('type', e.target.value);
              window.location.href = url.toString();
            }}
            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white min-w-[150px]"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-900">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-800/50 text-gray-300 border-b border-white/5 font-medium">
                    <th className="py-3 px-4 whitespace-nowrap sticky left-0 bg-gray-800/50 backdrop-blur-sm z-10">이름</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">관직</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">통솔</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">무력</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">지력</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">정치</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">매력</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">병력</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">병종</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">도시</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">부대</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">자금</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">군량</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">훈련</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">사기</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">삭턴</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">턴 시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {generalList.map((general) => (
                    <tr key={general.no} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium sticky left-0 bg-gray-900/90 backdrop-blur-sm border-r border-white/5 z-10">
                        <div className="text-blue-400">{general.name}</div>
                        <div className="text-xs text-gray-500">Lv {general.explevel || 0}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-400">
                        {general.officerLevelText || formatOfficerLevelText(general.officer_level ?? 0)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{general.leadership || 0}</td>
                      <td className="py-3 px-4 text-center font-mono">{general.strength || 0}</td>
                      <td className="py-3 px-4 text-center font-mono">{general.intel || 0}</td>
                      <td className="py-3 px-4 text-center font-mono">{general.experience || 0}</td>
                      <td className="py-3 px-4 text-center font-mono">{general.dedlevel || 0}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-300">{general.crew?.toLocaleString() || 0}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{getCrewTypeName(general.crewtype || 0)}</td>
                      <td className="py-3 px-4 text-center text-gray-300">
                        {(general.cityName || general.city)
                          ? `${general.cityName || `도시 ${general.city}`}${typeof general.cityLevel === 'number' && general.cityLevel > 0 ? ` (+ Lv.${general.cityLevel})` : ''}`
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-400">{general.troopName || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-yellow-500">{general.gold?.toLocaleString() || 0}</td>
                      <td className="py-3 px-4 text-right font-mono text-green-500">{general.rice?.toLocaleString() || 0}</td>
                      <td className="py-3 px-4 text-right font-mono">{general.train || 0}</td>
                      <td className="py-3 px-4 text-right font-mono">{general.atmos || 0}</td>
                      <td className="py-3 px-4 text-right font-mono text-red-400">{general.killturn || 0}</td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500">
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
    </div>
  );
}

export default function GeneralsInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <GeneralsInfoContent />
    </Suspense>
  );
}
