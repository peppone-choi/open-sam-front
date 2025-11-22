'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

interface TournamentResponse {
  result: boolean;
  tournament?: any;
}

export default function TournamentInfoPage() {
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
      // Note: SammoAPI.GetTournamentInfo is not defined in the interface provided earlier.
      // Assuming it exists or using request method directly.
      // Original code used: SammoAPI.GetTournamentInfo({ session_id: serverID })
      
      const result = (await SammoAPI['request']('/api/game/get-tournament-info', { 
          method: 'POST',
          body: JSON.stringify({ session_id: serverID })
      })) as TournamentResponse;

      if (result.result) {
        setTournamentData(result.tournament ?? null);
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
      <TopBackBar title="토너먼트 정보" reloadable onReload={loadTournamentData} />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : tournamentData ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg p-6 text-center">
            <h2 className="text-3xl font-bold text-yellow-500 mb-4">{tournamentData.name || '천하제일 무술대회'}</h2>
            
            <div className="space-y-4 text-gray-300">
               {/* Detailed tournament info visualization would go here */}
               <div className="p-8 border border-white/10 rounded bg-black/20">
                  <p>현재 진행 중인 토너먼트 정보가 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">(토너먼트 대진표 시각화 예정)</p>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-gray-500 flex-col gap-2">
           <div className="text-4xl mb-2">🏆</div>
           <div>토너먼트 정보를 불러올 수 없습니다.</div>
        </div>
      )}
    </div>
  );
}
