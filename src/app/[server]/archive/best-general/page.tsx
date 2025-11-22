'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

function BestGeneralContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const btn = searchParams?.get('btn') || '유저 보기';

  const [loading, setLoading] = useState(true);
  const [bestGeneralList, setBestGeneralList] = useState<any[]>([]);

  useEffect(() => {
    loadBestGeneralList();
  }, [serverID, btn]);

  async function loadBestGeneralList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetBestGeneralList({ btn });
      if (result.result) {
        setBestGeneralList(result.generalList);
      }
    } catch (err) {
      console.error(err);
      alert('명장 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="명 장 일 람" reloadable onReload={loadBestGeneralList} />
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Filter Tabs */}
        <div className="flex justify-center gap-4">
           {['유저 보기', 'NPC 보기'].map((label) => (
              <button
                 key={label}
                 onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('btn', label);
                    window.location.href = url.toString();
                 }}
                 className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all duration-200",
                    btn === label 
                       ? "bg-blue-600 text-white shadow-lg scale-105" 
                       : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                 )}
              >
                 {label}
              </button>
           ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestGeneralList.map((general, idx) => (
              <div 
                 key={general.no} 
                 className={cn(
                    "flex items-center gap-4 p-4 bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg hover:border-white/20 transition-colors",
                    idx < 3 ? "border-yellow-500/30 bg-yellow-900/10" : ""
                 )}
              >
                <div className={cn(
                   "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold",
                   idx === 0 ? "bg-yellow-500 text-black shadow-yellow-500/50 shadow-lg" :
                   idx === 1 ? "bg-gray-400 text-black shadow-gray-400/50 shadow-lg" :
                   idx === 2 ? "bg-orange-600 text-white shadow-orange-600/50 shadow-lg" :
                   "bg-gray-800 text-gray-400"
                )}>
                   {idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                   <div className="text-lg font-bold text-white truncate flex items-center gap-2">
                      {general.name}
                      {general.npc === 1 && <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">NPC</span>}
                   </div>
                   <div className="text-sm text-gray-400 flex items-center gap-2 truncate">
                      <span className="text-blue-400">{general.nationName}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                      <span>{general.value?.toLocaleString()}점</span>
                   </div>
                </div>
              </div>
            ))}
            
            {bestGeneralList.length === 0 && (
               <div className="col-span-full text-center py-12 text-gray-500">
                  데이터가 없습니다.
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BestGeneralPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <BestGeneralContent />
    </Suspense>
  );
}
