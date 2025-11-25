'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

function AdminInfoContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const type = searchParams?.get('type') ? Number(searchParams.get('type')) : 0;
  const type2 = searchParams?.get('type2') ? Number(searchParams.get('type2')) : 0;

  const [loading, setLoading] = useState(true);
  const [infoData, setInfoData] = useState<any[]>([]);

  useEffect(() => {
    loadInfoData();
  }, [serverID, type, type2]);

  async function loadInfoData() {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetInfo({ type, type2 });
      if (result.result) {
        setInfoData(result.infoList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="일 제 정 보" reloadable onReload={loadInfoData} />
      
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Filter Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg flex items-center gap-4">
          <label className="text-sm font-medium text-gray-300 whitespace-nowrap">정렬 기준</label>
          <select 
            name="type" 
            value={type} 
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set('type', e.target.value);
              window.location.href = url.toString();
            }} 
            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white min-w-[150px]"
          >
            <option value={0} className="bg-gray-900">기본</option>
            {/* Add more options as needed based on PHP version */}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg min-h-[400px]">
            {infoData.length > 0 ? (
               <div className="space-y-4">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                     {JSON.stringify(infoData, null, 2)}
                  </pre>
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-gray-500 pt-20">
                  <div className="text-4xl mb-2">📊</div>
                  <p>표시할 정보가 없습니다.</p>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <AdminInfoContent />
    </Suspense>
  );
}
