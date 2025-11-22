'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

export default function EmperiorDetailPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [emperiorDetail, setEmperiorDetail] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadEmperiorDetail();
    }
  }, [id]);

  async function loadEmperiorDetail() {
    if (!id) return;
    
    try {
      setLoading(true);
      const result = await SammoAPI.GetEmperiorDetail({ id: Number(id) });
      if (result.result) {
        setEmperiorDetail(result.emperior);
      }
    } catch (err) {
      console.error(err);
      alert('왕조 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="왕 조 상 세" />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : emperiorDetail ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-yellow-500 mb-6 text-center">{emperiorDetail.phase}</h2>
            
            <div className="space-y-6 text-gray-300">
              {/* Placeholder for detailed dynasty info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-4 bg-black/30 rounded-lg border border-white/5">
                    <div className="text-sm text-gray-500 mb-1">통일 연도</div>
                    <div className="text-xl font-mono text-white">
                       {emperiorDetail.year}년 {emperiorDetail.month}월
                    </div>
                 </div>
                 <div className="p-4 bg-black/30 rounded-lg border border-white/5">
                    <div className="text-sm text-gray-500 mb-1">통일 국가</div>
                    <div className="text-xl font-bold text-blue-400">
                       {emperiorDetail.nationName}
                    </div>
                 </div>
                 <div className="p-4 bg-black/30 rounded-lg border border-white/5">
                    <div className="text-sm text-gray-500 mb-1">군주</div>
                    <div className="text-xl font-bold text-white">
                       {emperiorDetail.rulerName}
                    </div>
                 </div>
                 <div className="p-4 bg-black/30 rounded-lg border border-white/5">
                    <div className="text-sm text-gray-500 mb-1">서버명</div>
                    <div className="text-xl text-gray-300">
                       {emperiorDetail.serverName}
                    </div>
                 </div>
              </div>

              {emperiorDetail.description && (
                 <div className="mt-6 p-6 bg-black/20 rounded-xl border border-white/5 leading-relaxed">
                    <h3 className="text-lg font-bold text-white mb-2">치세 기록</h3>
                    {emperiorDetail.description}
                 </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-gray-500">
          데이터를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
}
