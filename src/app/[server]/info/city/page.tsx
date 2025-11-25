'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

const REGION_LABELS: Record<number, string> = {
  0: '기타',
  1: '하북',
  2: '중원',
  3: '서북',
  4: '서촉',
  5: '남중',
  6: '초',
  7: '오월',
  8: '동이',
};

function CityInfoContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const type = searchParams?.get('type') ? Number(searchParams.get('type')) : 10;

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cityList, setCityList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    loadCityList();
  }, [serverID, type]);

  async function loadCityList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetCityList({ type, session_id: serverID });
      if (result.result && result.cityList) {
        setCityList(result.cityList);
        setPage(1);
      }
    } catch (err) {
      console.error(err);
      showToast('도시 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const sortOptions = [
    { value: 1, label: '기본' },
    { value: 2, label: '인구' },
    { value: 3, label: '인구율' },
    { value: 4, label: '민심' },
    { value: 5, label: '농업' },
    { value: 6, label: '상업' },
    { value: 7, label: '치안' },
    { value: 8, label: '수비' },
    { value: 9, label: '성벽' },
    { value: 10, label: '시세' },
    { value: 11, label: '지역' },
    { value: 12, label: '규모' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="세 력 도 시" reloadable onReload={loadCityList} />
      
      <div className="max-w-6xl mx-auto space-y-6">
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

        {/* Table Section */}
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-800/50 text-gray-300 border-b border-white/5 font-medium">
                    <th className="py-3 px-4 whitespace-nowrap">도시명</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">레벨</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">지역</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">인구</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right text-green-500">농업</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right text-yellow-500">상업</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">치안</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">방어</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">성벽</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">민심</th>
                  </tr>
                </thead>
                 <tbody className="divide-y divide-white/5">
                  {cityList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((city) => (
                    <tr key={city.city} className="hover:bg-white/5 transition-colors">

                      <td className="py-3 px-4 font-bold text-blue-400">{city.name}</td>
                      <td className="py-3 px-4 text-center">{city.level}</td>
                      <td className="py-3 px-4 text-center">{REGION_LABELS[Number(city.region)] ?? '기타'}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-300">
                        {city.pop} <span className="text-gray-500 text-xs">/ {city.pop_max}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-green-400">
                        {city.agri} <span className="text-gray-500 text-xs">/ {city.agri_max}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-yellow-400">
                        {city.comm} <span className="text-gray-500 text-xs">/ {city.comm_max}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-300">
                        {city.secu} <span className="text-gray-500 text-xs">/ {city.secu_max}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-300">
                        {city.def} <span className="text-gray-500 text-xs">/ {city.def_max}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-300">
                        {city.wall} <span className="text-gray-500 text-xs">/ {city.wall_max}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-300">
                        {city.trust ? Math.round(city.trust * 10) / 10 : 0}%
                      </td>
                    </tr>
                  ))}
                  {cityList.length === 0 && (
                     <tr>
                        <td colSpan={10} className="py-8 text-center text-gray-500">
                           도시가 없습니다.
                        </td>
                     </tr>
                  )}
                </tbody>
               </table>
             </div>

             {/* Mobile Card List */}
             <div className="md:hidden">
               <div className="divide-y divide-white/5">
                 {cityList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((city) => (
                   <div key={city.city} className="p-4 space-y-3">
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="text-lg font-bold text-blue-400">{city.name}</div>
                         <div className="text-xs text-gray-400 flex gap-2">
                           <span>Lv.{city.level}</span>
                           <span>•</span>
                           <span>{REGION_LABELS[Number(city.region)] ?? '기타'}</span>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-xs text-gray-500">인구</div>
                         <div className="font-mono text-gray-200">{city.pop}</div>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3 text-sm">
                       <div className="bg-green-900/10 border border-green-500/20 rounded p-2 flex justify-between items-center">
                         <span className="text-xs text-green-500/70 font-bold">농업</span>
                         <div className="text-right">
                           <span className="block font-mono font-bold text-green-400">{city.agri}</span>
                           <span className="block text-[10px] text-gray-500">/ {city.agri_max}</span>
                         </div>
                       </div>
                       <div className="bg-yellow-900/10 border border-yellow-500/20 rounded p-2 flex justify-between items-center">
                         <span className="text-xs text-yellow-500/70 font-bold">상업</span>
                         <div className="text-right">
                           <span className="block font-mono font-bold text-yellow-400">{city.comm}</span>
                           <span className="block text-[10px] text-gray-500">/ {city.comm_max}</span>
                         </div>
                       </div>
                     </div>

                     <div className="grid grid-cols-4 gap-2 text-xs text-center text-gray-400">
                        <div className="bg-black/20 rounded p-1">
                          <div className="text-[10px] text-gray-500">치안</div>
                          <div>{city.secu}</div>
                        </div>
                        <div className="bg-black/20 rounded p-1">
                          <div className="text-[10px] text-gray-500">방어</div>
                          <div>{city.def}</div>
                        </div>
                        <div className="bg-black/20 rounded p-1">
                          <div className="text-[10px] text-gray-500">성벽</div>
                          <div>{city.wall}</div>
                        </div>
                        <div className="bg-black/20 rounded p-1">
                          <div className="text-[10px] text-gray-500">민심</div>
                          <div>{city.trust ? Math.round(city.trust * 10) / 10 : 0}%</div>
                        </div>
                     </div>
                   </div>
                 ))}
                 {cityList.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                       도시가 없습니다.
                    </div>
                 )}
               </div>
             </div>

             {/* Pagination */}
             {cityList.length > PAGE_SIZE && (
               <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-sm text-gray-300">
                 <div>
                   전체 {cityList.length}개 중{' '}
                   <span className="font-mono">
                     {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, cityList.length)}
                   </span>
                 </div>
                 <div className="flex gap-2">
                   <button
                     type="button"
                     onClick={() => setPage((p) => Math.max(1, p - 1))}
                     disabled={page === 1}
                     className={cn(
                       'px-3 py-1 rounded border text-xs',
                       page === 1
                         ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                         : 'border-gray-500 text-gray-200 hover:bg-white/10'
                     )}
                   >
                     이전
                   </button>
                   <button
                     type="button"
                     onClick={() => setPage((p) => (p * PAGE_SIZE < cityList.length ? p + 1 : p))}
                     disabled={page * PAGE_SIZE >= cityList.length}
                     className={cn(
                       'px-3 py-1 rounded border text-xs',
                       page * PAGE_SIZE >= cityList.length
                         ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                         : 'border-gray-500 text-gray-200 hover:bg-white/10'
                     )}
                   >
                     다음
                   </button>
                 </div>
               </div>
             )}
           </div>
         )}

      </div>
    </div>
  );
}

export default function CityInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <CityInfoContent />
    </Suspense>
  );
}
