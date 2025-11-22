'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

export default function TournamentCenterPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [tournamentData, setTournamentData] = useState<any>(null);

  useEffect(() => {
    loadTournamentData();
  }, [serverID]);

  async function loadTournamentData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetTournamentCenter();
      if (result.result) {
        setTournamentData(result.tournament);
      }
    } catch (err) {
      console.error(err);
      // alert('토너먼트 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="토너먼트 센터" reloadable onReload={loadTournamentData} />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-8 shadow-lg text-center min-h-[400px] flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold text-yellow-500 mb-6">토너먼트 정보</h2>
            
            {tournamentData ? (
               <div className="space-y-4">
                  {/* Tournament Detail Rendering */}
                  <p className="text-xl text-white">{tournamentData.status}</p>
               </div>
            ) : (
               <div className="flex flex-col items-center gap-4">
                  <div className="text-5xl opacity-50">🏆</div>
                  <p className="text-lg text-gray-400">현재 진행중인 토너먼트가 없습니다.</p>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
