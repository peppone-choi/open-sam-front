'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface TournamentInfo {
  isActive: boolean;
  isApplicationOpen: boolean;
  type: number;
  typeName: string;
  state: number;
  phase: number;
  time: string | null;
  auto: boolean;
  message: string;
  participants?: TournamentParticipant[];
}

interface TournamentParticipant {
  seq: number;
  no: number;
  name: string;
  npc: number;
  leadership: number;
  strength: number;
  intel: number;
  lvl: number;
  grp: number;
  grp_no: number;
  win: number;
  draw: number;
  lose: number;
  gl: number;
  prmt: number;
}

function getTournamentStateLabel(state: number | undefined): string {
  switch (state) {
    case 0:
      return '신청 기간';
    case 1:
      return '신청 마감';
    case 2:
      return '예선 진행 중';
    case 3:
      return '추첨 진행 중';
    case 4:
      return '본선 진행 중';
    case 5:
      return '배정 진행 중';
    case 6:
      return '베팅 진행 중';
    case 7:
      return '16강 진행 중';
    case 8:
      return '8강 진행 중';
    case 9:
      return '4강 진행 중';
    case 10:
      return '결승 진행 중';
    default:
      return '대회 준비 중';
  }
}

export default function TournamentPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tournamentData, setTournamentData] = useState<TournamentInfo | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadTournamentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverID]);

  async function loadTournamentData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetTournamentCenter({
        session_id: serverID,
      });
      if (result.result) {
        setTournamentData(result.tournament as TournamentInfo);
      } else {
        setTournamentData(null);
      }
    } catch (err) {
      console.error(err);
      setTournamentData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    try {
      setJoining(true);
      const result = await SammoAPI.JoinTournament({
        session_id: serverID,
      });

      if (result.result) {
        showToast('토너먼트에 참가 신청되었습니다.', 'success');
        await loadTournamentData();
      } else {
        showToast(result.reason || '참가 신청에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || '참가 신청에 실패했습니다.', 'error');
    } finally {
      setJoining(false);
    }
  }

  const groups = useMemo(() => {
    const participants = tournamentData?.participants || [];
    const byGroup = new Map<number, TournamentParticipant[]>();

    for (const p of participants) {
      const grp = p.grp ?? 0;
      const list = byGroup.get(grp) ?? [];
      list.push(p);
      byGroup.set(grp, list);
    }

    return Array.from(byGroup.entries())
      .sort(([a], [b]) => a - b)
      .map(([groupNo, players]) => ({
        groupNo,
        players: [...players].sort((a, b) => {
          const winDiff = (b.win ?? 0) - (a.win ?? 0);
          if (winDiff !== 0) return winDiff;
          const glDiff = (b.gl ?? 0) - (a.gl ?? 0);
          if (glDiff !== 0) return glDiff;
          return (a.name || '').localeCompare(b.name || '');
        }),
      }));
  }, [tournamentData]);

  const statusText = (() => {
    if (!tournamentData) {
      return '토너먼트 정보가 없습니다.';
    }
    if (tournamentData.isApplicationOpen) {
      return '현재 토너먼트 참가 신청 기간입니다.';
    }
    if (tournamentData.isActive) {
      return `진행 상태: ${getTournamentStateLabel(tournamentData.state)} (${tournamentData.typeName})`;
    }
    return '현재 진행 중인 토너먼트가 없습니다.';
  })();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="토 너 먼 트" reloadable onReload={loadTournamentData} />

      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Info Section */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">토너먼트 정보</h2>
            <p className="text-lg text-gray-300 mb-3">{statusText}</p>

            {tournamentData && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-300 mb-4">
                <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">대회 종류</div>
                  <div className="font-bold">{tournamentData.typeName || '전력전'}</div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">진행 상태</div>
                  <div className="font-bold">{getTournamentStateLabel(tournamentData.state)}</div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">참가자 수</div>
                  <div className="font-bold">{(tournamentData.participants?.length ?? 0).toLocaleString()}명</div>
                </div>
              </div>
            )}

            {tournamentData?.time && (
              <p className="text-xs text-gray-400 mb-2">
                다음 처리 예정 시각: <span className="font-mono">{tournamentData.time}</span>
              </p>
            )}
            {tournamentData?.message && (
              <p className="text-sm text-gray-400 mb-4">공지: {tournamentData.message}</p>
            )}

            {tournamentData?.isApplicationOpen && (
              <button
                type="button"
                onClick={handleJoin}
                disabled={joining}
                className="mt-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {joining ? '신청 중...' : '참가 신청'}
              </button>
            )}
          </div>

          {/* Group/Bracket Section */}
          {groups.length > 0 && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">조별 순위표</h3>
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-6 min-w-max">
                  {groups.map((group) => (
                    <div key={group.groupNo} className="min-w-[220px]">
                      <div className="text-center font-bold text-blue-400 mb-3 border-b border-white/10 pb-1">
                        {group.groupNo}조
                      </div>
                      
                      {/* Desktop Table */}
                      <table className="hidden md:table w-full text-xs text-left text-gray-300">
                        <thead className="bg-white/5 text-gray-400">
                          <tr>
                            <th className="px-2 py-1">장수</th>
                            <th className="px-1 py-1 text-center">전적</th>
                            <th className="px-1 py-1 text-center">득실</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {group.players.map((p) => (
                            <tr
                              key={p.seq}
                              className={cn(
                                'hover:bg-white/5 transition-colors',
                                p.prmt ? 'bg-green-900/20' : undefined,
                              )}
                            >
                              <td className="px-2 py-1 whitespace-nowrap">
                                <span className="font-medium">{p.name}</span>
                                {p.prmt ? <span className="ml-1 text-xs text-green-400">(진출)</span> : null}
                              </td>
                              <td className="px-1 py-1 text-center font-mono">
                                {p.win}-{p.draw}-{p.lose}
                              </td>
                              <td className="px-1 py-1 text-center font-mono">{p.gl}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Mobile Card List */}
                      <div className="md:hidden space-y-2">
                        {group.players.map((p) => (
                          <div 
                            key={p.seq}
                            className={cn(
                              'bg-white/5 p-2 rounded text-xs flex justify-between items-center',
                              p.prmt ? 'bg-green-900/20 border border-green-500/30' : 'border border-transparent'
                            )}
                          >
                            <div>
                              <div className="font-bold text-gray-200">
                                {p.name}
                                {p.prmt && <span className="ml-1 text-[10px] text-green-400 font-normal">(진출)</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-gray-300">{p.win}승 {p.draw}무 {p.lose}패</div>
                              <div className="text-[10px] text-gray-500">득실 {p.gl}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
