'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

export default function TrafficPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [trafficData, setTrafficData] = useState<any>(null);

  useEffect(() => {
    loadTrafficData();
  }, [serverID]);

  async function loadTrafficData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetTraffic();
      if (result.result) {
        setTrafficData(result.traffic);
      }
    } catch (err) {
      console.error(err);
      alert('트래픽 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="트래픽정보" />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : trafficData ? (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center shadow-lg">
              <div className="text-sm text-gray-400 mb-1">현재 접속자</div>
              <div className="text-2xl font-bold text-blue-400">{trafficData.currentOnline?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center shadow-lg">
              <div className="text-sm text-gray-400 mb-1">최대 접속자</div>
              <div className="text-2xl font-bold text-green-400">{trafficData.maxOnline?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center shadow-lg">
              <div className="text-sm text-gray-400 mb-1">현재 갱신수</div>
              <div className="text-2xl font-bold text-yellow-400">{trafficData.currentRefresh?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center shadow-lg">
              <div className="text-sm text-gray-400 mb-1">최대 갱신수</div>
              <div className="text-2xl font-bold text-purple-400">{trafficData.maxRefresh?.toLocaleString() || 0}</div>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg min-h-[300px] flex flex-col items-center justify-center text-gray-500">
             <div className="text-4xl mb-4">📊</div>
             <p>트래픽 차트 (준비중)</p>
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
