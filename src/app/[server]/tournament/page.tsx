'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

export default function TournamentPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [tournamentData, setTournamentData] = useState<any>(null);
  const [bracket, setBracket] = useState<any>(null);

  useEffect(() => {
    loadTournamentData();
  }, [serverID]);

  async function loadTournamentData() {
    try {
      setLoading(true);
      
      // 토너먼트 기본 정보와 대진표 정보를 병렬로 로드
      // SammoAPI methods might need adjustment based on actual implementation
      const [infoResult, bracketResult]: any[] = await Promise.all([
        SammoAPI['request']('/api/tournament/info', { method: 'POST', body: JSON.stringify({ session_id: serverID }) }),
        SammoAPI['request']('/api/tournament/bracket', { method: 'POST', body: JSON.stringify({ session_id: serverID }) }),
      ]);

      if (infoResult.result) {
        setTournamentData(infoResult.tournament);
      }
      
      if (bracketResult.result && bracketResult.bracket) {
        setBracket(bracketResult.bracket);
      }
    } catch (err) {
      console.error(err);
      // alert('토너먼트 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    try {
      const result: any = await SammoAPI['request']('/api/tournament/join', { 
          method: 'POST', 
          body: JSON.stringify({ session_id: serverID }) 
      });
      
      if (result.result) {
        alert('토너먼트에 참가 신청되었습니다.');
        await loadTournamentData();
      } else {
        alert(result.reason || '참가 신청에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('참가 신청에 실패했습니다.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="토 너 먼 트" reloadable onReload={loadTournamentData} />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Info Section */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg text-center">
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">토너먼트 정보</h2>
            <div className="text-lg text-gray-300 mb-6">
               {tournamentData?.status || '진행중인 토너먼트가 없습니다.'}
            </div>
            {tournamentData?.canJoin && (
              <button 
                type="button" 
                onClick={handleJoin} 
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
              >
                참가 신청
              </button>
            )}
          </div>

          {/* Bracket Section */}
          {bracket && Array.isArray(bracket) && bracket.length > 0 && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-8 min-w-max px-4">
                {bracket.map((round: any, roundIdx: number) => (
                  <div key={roundIdx} className="flex flex-col justify-around gap-4 min-w-[200px]">
                    <div className="text-center font-bold text-blue-400 mb-4 uppercase tracking-wider border-b border-white/10 pb-2">
                       Round {roundIdx + 1}
                    </div>
                    {round.map((match: any, matchIdx: number) => (
                      <div 
                        key={matchIdx} 
                        className="bg-black/40 border border-white/10 rounded-lg overflow-hidden shadow-md flex flex-col"
                      >
                        <div className={cn(
                           "px-3 py-2 text-sm font-medium flex justify-between items-center border-b border-white/5",
                           match.winner === 1 ? "bg-green-900/30 text-green-400" : match.winner === 2 ? "text-gray-500" : "text-gray-300"
                        )}>
                          <span>{match.player1 ? match.player1.name : 'TBD'}</span>
                          {match.winner === 1 && <span>🏆</span>}
                        </div>
                        <div className={cn(
                           "px-3 py-2 text-sm font-medium flex justify-between items-center",
                           match.winner === 2 ? "bg-green-900/30 text-green-400" : match.winner === 1 ? "text-gray-500" : "text-gray-300"
                        )}>
                          <span>{match.player2 ? match.player2.name : 'TBD'}</span>
                          {match.winner === 2 && <span>🏆</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
