'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

export default function NationGeneralsPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [generals, setGenerals] = useState<any[]>([]);

  useEffect(() => {
    loadGenerals();
  }, [serverID]);

  async function loadGenerals() {
    try {
      setLoading(true);
      const result = await SammoAPI.NationGetGenerals({ serverID });
      if (result.result && result.generals) {
        setGenerals(result.generals);
      }
    } catch (err) {
      console.error(err);
      alert('세력 장수 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <TopBackBar title="세력 장수" reloadable onReload={loadGenerals} />
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {generals.map((general) => (
              <div key={general.no} className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 hover:border-white/20 hover:bg-white/[0.02] transition-all group shadow-sm">
                <div className="flex items-center justify-between mb-2">
                   <div className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {general.name}
                   </div>
                   <div className="text-[10px] text-gray-500 border border-white/10 rounded px-1.5 py-0.5">
                      NO.{general.no}
                   </div>
                </div>
                <div className="space-y-1">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">소속 도시</span>
                      <span className="text-gray-300">{general.cityName}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">직위</span>
                      <span className={cn(
                        "font-medium",
                        general.officerLevelText !== '일반' ? "text-yellow-500" : "text-gray-400"
                      )}>
                        {general.officerLevelText}
                      </span>
                   </div>
                   {/* Future expansion: Add more stats here if API provides them */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




