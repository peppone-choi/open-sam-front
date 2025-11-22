'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

function AdminGeneralContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const queryType = searchParams?.get('query_type') || 'turntime';

  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<any[]>([]);

  useEffect(() => {
    loadGeneralList();
  }, [serverID, queryType]);

  async function loadGeneralList() {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetGeneral({});
      if (result.result) {
        setGeneralList(Array.isArray(result.general) ? result.general : [result.general]);
      }
    } catch (err) {
      console.error(err);
      // alert('장수 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const sortOptions = [
    { value: 'turntime', label: '최근턴' },
    { value: 'recent_war', label: '최근전투' },
    { value: 'name', label: '장수명' },
    { value: 'warnum', label: '전투수' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="장 수 정 보" reloadable onReload={loadGeneralList} />
      
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Filter Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg flex items-center gap-4">
          <label className="text-sm font-medium text-gray-300 whitespace-nowrap">정렬 기준</label>
          <select
            value={queryType}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set('query_type', e.target.value);
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

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {generalList.map((general) => (
                <div 
                  key={general.no} 
                  className="p-3 bg-black/20 rounded-lg border border-white/5 hover:border-white/20 transition-colors text-sm text-gray-300"
                >
                  {general.name}
                </div>
              ))}
            </div>
            
            {generalList.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <div className="text-4xl mb-2">👥</div>
                  <p>표시할 장수가 없습니다.</p>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminGeneralPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <AdminGeneralContent />
    </Suspense>
  );
}
