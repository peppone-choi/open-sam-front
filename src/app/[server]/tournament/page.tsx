'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

interface BracketMatch {
  id: number;
  round: number;
  matchNo: number;
  player1?: { name: string; score?: number; winner?: boolean };
  player2?: { name: string; score?: number; winner?: boolean };
  winner?: string;
}

interface BracketData {
  rounds: BracketMatch[][];
  champion?: string;
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

function getRoundName(round: number, totalRounds: number): string {
  const remaining = totalRounds - round;
  switch (remaining) {
    case 0: return '결승';
    case 1: return '4강';
    case 2: return '8강';
    case 3: return '16강';
    case 4: return '32강';
    default: return `${Math.pow(2, remaining + 1)}강`;
  }
}

// 토너먼트 대진표 컴포넌트
function TournamentBracket({ bracket }: { bracket: BracketData }) {
  const totalRounds = bracket.rounds.length;

  if (totalRounds === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        대진표 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max p-4">
        {bracket.rounds.map((matches, roundIndex) => (
          <div key={roundIndex} className="flex flex-col justify-around min-w-[200px]">
            {/* Round Header */}
            <div className="text-center mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-800/50 px-3 py-1 rounded-full">
                {getRoundName(roundIndex, totalRounds)}
              </span>
            </div>

            {/* Matches */}
            <div 
              className="flex flex-col justify-around flex-1"
              style={{ gap: `${Math.pow(2, roundIndex) * 2}rem` }}
            >
              {matches.map((match) => (
                <div 
                  key={match.id} 
                  className="relative"
                >
                  <div className="bg-gray-900/70 border border-white/10 rounded-lg overflow-hidden shadow-lg hover:border-white/20 transition-all">
                    {/* Player 1 */}
                    <div 
                      className={cn(
                        "px-3 py-2.5 flex justify-between items-center border-b border-white/5 transition-colors",
                        match.player1?.winner && "bg-green-900/30"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-medium truncate max-w-[120px]",
                        match.player1?.winner ? "text-green-400" : "text-gray-300",
                        !match.player1?.name && "text-gray-600 italic"
                      )}>
                        {match.player1?.name || 'TBD'}
                      </span>
                      {match.player1?.score !== undefined && (
                        <span className={cn(
                          "text-sm font-bold ml-2",
                          match.player1?.winner ? "text-green-400" : "text-gray-500"
                        )}>
                          {match.player1.score}
                        </span>
                      )}
                    </div>

                    {/* Player 2 */}
                    <div 
                      className={cn(
                        "px-3 py-2.5 flex justify-between items-center transition-colors",
                        match.player2?.winner && "bg-green-900/30"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-medium truncate max-w-[120px]",
                        match.player2?.winner ? "text-green-400" : "text-gray-300",
                        !match.player2?.name && "text-gray-600 italic"
                      )}>
                        {match.player2?.name || 'TBD'}
                      </span>
                      {match.player2?.score !== undefined && (
                        <span className={cn(
                          "text-sm font-bold ml-2",
                          match.player2?.winner ? "text-green-400" : "text-gray-500"
                        )}>
                          {match.player2.score}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Connector Lines */}
                  {roundIndex < totalRounds - 1 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-white/20" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Champion */}
        {bracket.champion && (
          <div className="flex flex-col justify-center items-center min-w-[180px]">
            <div className="text-center mb-4">
              <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-500/30">
                우승
              </span>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-2 border-yellow-500/50 rounded-xl p-6 text-center shadow-lg shadow-yellow-900/20">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-xl font-bold text-yellow-400">{bracket.champion}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 진행 상황 타임라인
function TournamentTimeline({ state }: { state: number }) {
  const stages = [
    { id: 0, label: '신청', icon: '📝' },
    { id: 2, label: '예선', icon: '⚔️' },
    { id: 7, label: '16강', icon: '🎯' },
    { id: 8, label: '8강', icon: '🏅' },
    { id: 9, label: '4강', icon: '🥈' },
    { id: 10, label: '결승', icon: '🏆' },
  ];

  const currentStageIndex = stages.findIndex(s => s.id >= state);
  const activeIndex = currentStageIndex === -1 ? stages.length - 1 : Math.max(0, currentStageIndex);

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6 mb-6">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">진행 상황</h3>
      <div className="flex items-center justify-between relative">
        {/* Progress Bar Background */}
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-800 -translate-y-1/2 rounded-full" />
        
        {/* Active Progress */}
        <div 
          className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-blue-500 to-purple-500 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{ width: `${(activeIndex / (stages.length - 1)) * 100}%` }}
        />

        {stages.map((stage, index) => {
          const isPast = index < activeIndex;
          const isCurrent = index === activeIndex;
          
          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all",
                  isPast && "bg-blue-600 border-blue-500 text-white",
                  isCurrent && "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30 scale-110",
                  !isPast && !isCurrent && "bg-gray-800 border-gray-700 text-gray-500"
                )}
              >
                {stage.icon}
              </div>
              <span className={cn(
                "text-xs mt-2 font-medium",
                isCurrent ? "text-purple-400" : isPast ? "text-blue-400" : "text-gray-500"
              )}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TournamentPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tournamentData, setTournamentData] = useState<TournamentInfo | null>(null);
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'groups' | 'bracket'>('groups');

  const loadTournamentData = useCallback(async () => {
    try {
      setLoading(true);
      const [infoResult, bracketResult] = await Promise.all([
        SammoAPI.GetTournamentCenter({ session_id: serverID }),
        SammoAPI.GetTournamentBracket({ session_id: serverID }),
      ]);

      if (infoResult.result) {
        setTournamentData(infoResult.tournament as TournamentInfo);
      } else {
        setTournamentData(null);
      }

      if (bracketResult.result && bracketResult.bracket) {
        setBracketData(bracketResult.bracket as BracketData);
      } else {
        // 샘플 대진표 생성 (본선 진행 중인 경우)
        if (infoResult.result && (infoResult.tournament as TournamentInfo).state >= 7) {
          setBracketData(generateSampleBracket(infoResult.tournament as TournamentInfo));
        } else {
          setBracketData(null);
        }
      }
    } catch (err) {
      console.error(err);
      setTournamentData(null);
      setBracketData(null);
    } finally {
      setLoading(false);
    }
  }, [serverID]);

  // 샘플 대진표 생성 함수
  function generateSampleBracket(tournament: TournamentInfo): BracketData {
    const promotedPlayers = tournament.participants?.filter(p => p.prmt) || [];
    const rounds: BracketMatch[][] = [];
    let matchId = 1;

    // 16강, 8강, 4강, 결승 생성
    const roundSizes = [8, 4, 2, 1]; // 각 라운드의 경기 수
    
    for (let roundIndex = 0; roundIndex < roundSizes.length; roundIndex++) {
      const matchCount = roundSizes[roundIndex];
      const roundMatches: BracketMatch[] = [];

      for (let i = 0; i < matchCount; i++) {
        const match: BracketMatch = {
          id: matchId++,
          round: roundIndex,
          matchNo: i + 1,
        };

        // 첫 라운드(16강)에만 진출자 배정
        if (roundIndex === 0) {
          const idx1 = i * 2;
          const idx2 = i * 2 + 1;
          if (promotedPlayers[idx1]) {
            match.player1 = { name: promotedPlayers[idx1].name };
          }
          if (promotedPlayers[idx2]) {
            match.player2 = { name: promotedPlayers[idx2].name };
          }
        }

        roundMatches.push(match);
      }

      rounds.push(roundMatches);
    }

    return { rounds };
  }

  useEffect(() => {
    loadTournamentData();
  }, [loadTournamentData]);

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
  
  const showBracketTab = tournamentData && tournamentData.state >= 7;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="토 너 먼 트" reloadable onReload={loadTournamentData} />

      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 font-medium">토너먼트 정보 로딩 중...</span>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Progress Timeline */}
          {tournamentData && tournamentData.isActive && (
            <TournamentTimeline state={tournamentData.state} />
          )}

          {/* Info Section */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
                  <span>🏆</span> 토너먼트 정보
                </h2>
                <p className="text-gray-400 mt-1">{statusText}</p>
              </div>
              
              {tournamentData?.isApplicationOpen && (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {joining ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      신청 중...
                    </span>
                  ) : '참가 신청'}
                </button>
              )}
            </div>

            {tournamentData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-300">
                <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1 uppercase">대회 종류</div>
                  <div className="font-bold text-white">{tournamentData.typeName || '전력전'}</div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1 uppercase">진행 상태</div>
                  <div className="font-bold text-purple-400">{getTournamentStateLabel(tournamentData.state)}</div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1 uppercase">참가자 수</div>
                  <div className="font-bold text-white">{(tournamentData.participants?.length ?? 0).toLocaleString()}명</div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1 uppercase">다음 처리</div>
                  <div className="font-bold text-orange-400 font-mono text-sm">{tournamentData.time || '-'}</div>
                </div>
              </div>
            )}

            {tournamentData?.message && (
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="text-xs text-blue-400 font-bold mb-1">📢 공지</div>
                <p className="text-sm text-gray-300">{tournamentData.message}</p>
              </div>
            )}
          </div>

          {/* Tabs for Groups/Bracket */}
          {(groups.length > 0 || showBracketTab) && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
              {/* Tab Header */}
              <div className="flex border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('groups')}
                  className={cn(
                    "flex-1 px-6 py-4 text-sm font-bold transition-colors",
                    activeTab === 'groups' 
                      ? "bg-white/5 text-white border-b-2 border-blue-500" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  📊 조별 리그
                </button>
                {showBracketTab && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('bracket')}
                    className={cn(
                      "flex-1 px-6 py-4 text-sm font-bold transition-colors",
                      activeTab === 'bracket' 
                        ? "bg-white/5 text-white border-b-2 border-purple-500" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    🏅 토너먼트 대진표
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'groups' && groups.length > 0 && (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-6 min-w-max">
                      {groups.map((group) => (
                        <div key={group.groupNo} className="min-w-[240px]">
                          <div className="text-center font-bold text-blue-400 mb-3 bg-blue-900/20 border border-blue-500/30 rounded-lg py-2">
                            {group.groupNo}조
                          </div>
                          
                          {/* Desktop Table */}
                          <table className="hidden md:table w-full text-xs text-left text-gray-300">
                            <thead className="bg-white/5 text-gray-400">
                              <tr>
                                <th className="px-3 py-2">장수</th>
                                <th className="px-2 py-2 text-center">전적</th>
                                <th className="px-2 py-2 text-center">득실</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {group.players.map((p, idx) => (
                                <tr
                                  key={p.seq}
                                  className={cn(
                                    'hover:bg-white/5 transition-colors',
                                    p.prmt && 'bg-green-900/20',
                                    idx < 2 && !p.prmt && 'bg-blue-900/10', // 상위 2명 하이라이트
                                  )}
                                >
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <span className="flex items-center gap-2">
                                      {idx === 0 && <span className="text-yellow-400">🥇</span>}
                                      {idx === 1 && <span className="text-gray-300">🥈</span>}
                                      {idx === 2 && <span className="text-orange-400">🥉</span>}
                                      <span className="font-medium">{p.name}</span>
                                    </span>
                                    {p.prmt ? <span className="ml-1 text-[10px] text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded">(진출)</span> : null}
                                  </td>
                                  <td className="px-2 py-2 text-center font-mono">
                                    <span className="text-green-400">{p.win}</span>-
                                    <span className="text-gray-400">{p.draw}</span>-
                                    <span className="text-red-400">{p.lose}</span>
                                  </td>
                                  <td className={cn(
                                    "px-2 py-2 text-center font-mono font-bold",
                                    p.gl > 0 ? "text-green-400" : p.gl < 0 ? "text-red-400" : "text-gray-400"
                                  )}>
                                    {p.gl > 0 ? '+' : ''}{p.gl}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Mobile Card List */}
                          <div className="md:hidden space-y-2">
                            {group.players.map((p, idx) => (
                              <div 
                                key={p.seq}
                                className={cn(
                                  'p-3 rounded-lg text-xs flex justify-between items-center border',
                                  p.prmt ? 'bg-green-900/20 border-green-500/30' : 'bg-white/5 border-white/5'
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {idx === 0 && <span>🥇</span>}
                                  {idx === 1 && <span>🥈</span>}
                                  {idx === 2 && <span>🥉</span>}
                                  <div>
                                    <div className="font-bold text-gray-200">
                                      {p.name}
                                      {p.prmt && <span className="ml-1 text-[10px] text-green-400">(진출)</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono">
                                    <span className="text-green-400">{p.win}</span>-
                                    <span className="text-gray-400">{p.draw}</span>-
                                    <span className="text-red-400">{p.lose}</span>
                                  </div>
                                  <div className={cn(
                                    "text-[10px] font-bold",
                                    p.gl > 0 ? "text-green-400" : p.gl < 0 ? "text-red-400" : "text-gray-500"
                                  )}>
                                    득실 {p.gl > 0 ? '+' : ''}{p.gl}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'bracket' && bracketData && (
                  <TournamentBracket bracket={bracketData} />
                )}

                {activeTab === 'groups' && groups.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="font-medium">참가자 정보가 없습니다</p>
                    <p className="text-sm mt-1">토너먼트 시작 후 표시됩니다</p>
                  </div>
                )}

                {activeTab === 'bracket' && !bracketData && (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <p className="font-medium">대진표가 아직 생성되지 않았습니다</p>
                    <p className="text-sm mt-1">본선 진행 시 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!tournamentData && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">토너먼트 준비 중</h3>
              <p className="text-gray-500">현재 진행 중인 토너먼트가 없습니다.</p>
              <p className="text-gray-600 text-sm mt-1">새로운 토너먼트가 시작되면 여기에 표시됩니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
