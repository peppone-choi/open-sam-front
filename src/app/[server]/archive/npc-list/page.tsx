'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

function NPCListContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const type = searchParams?.get('type') ? Number(searchParams.get('type')) : 1;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [npcList, setNpcList] = useState<any[]>([]);

  useEffect(() => {
    loadNPCList();
  }, [serverID, type]);

  async function loadNPCList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetNPCList();
      if (result.result) {
        setNpcList(result.npcList);
      }
    } catch (err) {
      console.error(err);
      showToast('NPC 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const sortOptions = [
    { value: 1, label: '이름' },
    { value: 2, label: '국가' },
    { value: 3, label: '종능' },
    { value: 4, label: '통솔' },
    { value: 5, label: '무력' },
    { value: 6, label: '지력' },
    { value: 7, label: '명성' },
    { value: 8, label: '계급' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="오리지널 캐릭터 일람" />
      
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
                    <th className="py-3 px-4 whitespace-nowrap">이름</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">국가</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">통솔</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">무력</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">지력</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">성격</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {npcList.map((npc) => (
                    <tr key={npc.no} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-blue-400">{npc.name}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{npc.nationName}</td>
                      <td className="py-3 px-4 text-center font-mono">{npc.leadership}</td>
                      <td className="py-3 px-4 text-center font-mono">{npc.strength}</td>
                      <td className="py-3 px-4 text-center font-mono">{npc.intel}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{npc.character || '-'}</td>
                    </tr>
                  ))}
                  {npcList.length === 0 && (
                     <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
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

export default function NPCListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <NPCListContent />
    </Suspense>
  );
}
