'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

function GenListContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const type = searchParams?.get('type') ? Number(searchParams.get('type')) : 9;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<any[]>([]);

  useEffect(() => {
    loadGeneralList();
  }, [serverID, type]);

  async function loadGeneralList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetGenList({ type });
      if (result.result) {
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
    { value: 1, label: '국가' },
    { value: 2, label: '통솔' },
    { value: 3, label: '무력' },
    { value: 4, label: '지력' },
    { value: 5, label: '명성' },
    { value: 6, label: '계급' },
    { value: 7, label: '관직' },
    { value: 8, label: '삭턴' },
    { value: 9, label: '벌점' },
    { value: 10, label: 'Lv' },
    { value: 11, label: '성격' },
    { value: 12, label: '내특' },
    { value: 13, label: '전특' },
    { value: 14, label: '개특' },
    { value: 15, label: '직특' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="장 수 일 람" />
      
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
                    <th className="py-3 px-4 whitespace-nowrap text-center">국가</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">통솔</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">무력</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">지력</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">정치</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">매력</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">계급</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">관직</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">명성</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">벌점</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {generalList.map((general) => (
                    <tr key={general.no} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium sticky left-0 bg-gray-900/90 backdrop-blur-sm border-r border-white/5 z-10">
                        <div className="text-blue-400">{general.name}</div>
                        <div className="text-xs text-gray-500">Lv {general.explevel || 0}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-300">{general.nationName}</td>
                      <td className="py-3 px-4 text-center font-mono">{general.leadership}</td>
                      <td className="py-3 px-4 text-center font-mono">{general.strength}</td>
                      <td className="py-3 px-4 text-center font-mono">{general.intel}</td>
                      <td className="py-3 px-4 text-center font-mono">{general.politics}</td>
                      <td className="py-3 px-4 text-center font-mono">{general.charm}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{general.dedlevel || '-'}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{general.officerLevelText || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-yellow-500">{general.experience?.toLocaleString() || 0}</td>
                      <td className="py-3 px-4 text-right font-mono text-red-400">{general.killturn || 0}</td>
                    </tr>
                  ))}
                  {generalList.length === 0 && (
                     <tr>
                        <td colSpan={11} className="py-8 text-center text-gray-500">
                           데이터가 없습니다.
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GenListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <GenListContent />
    </Suspense>
  );
}
