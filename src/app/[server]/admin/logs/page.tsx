// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

interface General {
  no: number;
  name: string;
  nation: number;
  npc: number;
  turntime?: string;
}

interface LogEntry {
  date?: string;
  text?: string;
  type?: string;
}

const SORT_OPTIONS = [
  { value: 'turntime', label: '최근턴' },
  { value: 'recent_war', label: '최근전투' },
  { value: 'name', label: '장수명' },
  { value: 'warnum', label: '전투수' },
];

function AdminLogsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  
  const [loading, setLoading] = useState(true);
  const [generals, setGenerals] = useState<General[]>([]);
  const [selectedGeneral, setSelectedGeneral] = useState<number | null>(null);
  const [sortType, setSortType] = useState('turntime');
  const [searchName, setSearchName] = useState('');
  
  // 로그 데이터
  const [generalInfo, setGeneralInfo] = useState<any>(null);
  const [actionLogs, setActionLogs] = useState<LogEntry[]>([]);
  const [battleLogs, setBattleLogs] = useState<LogEntry[]>([]);
  const [historyLogs, setHistoryLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadGenerals = useCallback(async () => {
    if (!serverID) return;
    
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetGenerals({ 
        session_id: serverID,
        sortType 
      });
      
      if ((result as any).success) {
        let generalList = (result as any).generals || [];
        
        // 정렬
        if (sortType === 'name') {
          generalList.sort((a: any, b: any) => {
            if (a.npc !== b.npc) return a.npc - b.npc;
            return a.name.localeCompare(b.name);
          });
        } else if (sortType === 'turntime') {
          generalList.sort((a: any, b: any) => {
            const timeA = a.turntime ? new Date(a.turntime).getTime() : 0;
            const timeB = b.turntime ? new Date(b.turntime).getTime() : 0;
            return timeB - timeA;
          });
        }
        
        setGenerals(generalList);
        
        // 첫 번째 장수 자동 선택
        if (generalList.length > 0 && !selectedGeneral) {
          setSelectedGeneral(generalList[0].no);
        }
      }
    } catch (error) {
      console.error('Generals load error:', error);
    } finally {
      setLoading(false);
    }
  }, [serverID, sortType, selectedGeneral]);

  const loadGeneralLogs = useCallback(async () => {
    if (!serverID || !selectedGeneral) return;
    
    try {
      setLogsLoading(true);
      
      // 장수 상세 정보 로드
      const result = await SammoAPI.AdminGetGeneral({ 
        session_id: serverID, 
        generalID: selectedGeneral 
      });
      
      if (result.result) {
        setGeneralInfo(result.general);
        
        // 로그 데이터는 별도 API가 필요하지만, 현재는 더미 데이터 사용
        // 실제로는 AdminGetGeneralLogs API를 구현해야 함
        setActionLogs([
          { date: new Date().toISOString(), text: '장수 정보 조회됨', type: 'info' },
        ]);
        setBattleLogs([]);
        setHistoryLogs([]);
      }
    } catch (error) {
      console.error('General logs load error:', error);
    } finally {
      setLogsLoading(false);
    }
  }, [serverID, selectedGeneral]);

  useEffect(() => {
    void loadGenerals();
  }, [loadGenerals]);

  useEffect(() => {
    if (selectedGeneral) {
      void loadGeneralLogs();
    }
  }, [selectedGeneral, loadGeneralLogs]);

  const filteredGenerals = generals.filter(g => {
    if (searchName && !g.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    return true;
  });

  const getNPCColor = (npc: number): string => {
    if (npc === 0) return 'text-white';
    if (npc === 1) return 'text-cyan-400';
    if (npc >= 2 && npc < 5) return 'text-sky-400';
    return 'text-gray-500';
  };

  const formatTurntime = (turntime: string | undefined): string => {
    if (!turntime) return '-';
    const date = new Date(turntime);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseLogText = (text: string): React.ReactNode => {
    // 간단한 HTML 태그 처리 (실제로는 더 정교한 파싱 필요)
    return text
      .replace(/<R>/g, '<span class="text-red-400">')
      .replace(/<\/>/g, '</span>')
      .replace(/<S>/g, '<span class="text-sky-400">')
      .replace(/<Y>/g, '<span class="text-yellow-400">')
      .replace(/<G>/g, '<span class="text-green-400">')
      .replace(/<C>/g, '<span class="text-cyan-400">');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
      <TopBackBar title="활 동 로 그" reloadable onReload={loadGenerals} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 장수 목록 패널 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 정렬 및 검색 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">정렬 순서</label>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                  className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">장수 검색</label>
                <input
                  type="text"
                  placeholder="장수 이름..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* 장수 목록 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg overflow-hidden">
              <div className="p-3 border-b border-white/5">
                <span className="text-sm text-gray-400">
                  대상 장수 ({filteredGenerals.length}명)
                </span>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {filteredGenerals.map(general => (
                    <button
                      key={general.no}
                      onClick={() => setSelectedGeneral(general.no)}
                      className={cn(
                        "w-full px-4 py-2 text-left flex items-center justify-between border-b border-white/5 transition-colors",
                        selectedGeneral === general.no
                          ? "bg-blue-600/30"
                          : "hover:bg-white/5"
                      )}
                    >
                      <span className={cn("font-medium", getNPCColor(general.npc))}>
                        {general.name}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {formatTurntime(general.turntime)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 로그 상세 패널 */}
          <div className="lg:col-span-2 space-y-4">
            {logsLoading ? (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="text-gray-400 mt-4">로그 로딩 중...</p>
              </div>
            ) : selectedGeneral && generalInfo ? (
              <>
                {/* 장수 정보 요약 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-2xl">🎭</div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{generalInfo.name || '알 수 없음'}</h3>
                      <p className="text-sm text-gray-400">장수 번호: {generalInfo.no}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">통솔</div>
                      <div className="font-mono text-red-400">{generalInfo.leadership || '-'}</div>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">무력</div>
                      <div className="font-mono text-orange-400">{generalInfo.strength || '-'}</div>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">지력</div>
                      <div className="font-mono text-blue-400">{generalInfo.intel || '-'}</div>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">최근 턴</div>
                      <div className="font-mono text-gray-300 text-xs">
                        {generalInfo.turntime 
                          ? new Date(generalInfo.turntime).toLocaleString('ko-KR')
                          : '-'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* 로그 탭 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 개인 기록 */}
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-sky-900/30 px-4 py-2 border-b border-white/5">
                      <h4 className="text-sm font-bold text-sky-400">📝 개인 기록</h4>
                    </div>
                    <div className="p-4 max-h-[300px] overflow-y-auto">
                      {actionLogs.length > 0 ? (
                        <div className="space-y-2">
                          {actionLogs.map((log, idx) => (
                            <div key={idx} className="text-xs text-gray-300 py-1 border-b border-white/5">
                              <span className="text-gray-500 font-mono mr-2">
                                {log.date ? new Date(log.date).toLocaleTimeString('ko-KR') : '-'}
                              </span>
                              <span dangerouslySetInnerHTML={{ __html: parseLogText(log.text || '') as string }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-8">기록이 없습니다</p>
                      )}
                    </div>
                  </div>

                  {/* 전투 기록 */}
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-orange-900/30 px-4 py-2 border-b border-white/5">
                      <h4 className="text-sm font-bold text-orange-400">⚔️ 전투 기록</h4>
                    </div>
                    <div className="p-4 max-h-[300px] overflow-y-auto">
                      {battleLogs.length > 0 ? (
                        <div className="space-y-2">
                          {battleLogs.map((log, idx) => (
                            <div key={idx} className="text-xs text-gray-300 py-1 border-b border-white/5">
                              <span className="text-gray-500 font-mono mr-2">
                                {log.date ? new Date(log.date).toLocaleTimeString('ko-KR') : '-'}
                              </span>
                              <span dangerouslySetInnerHTML={{ __html: parseLogText(log.text || '') as string }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-8">기록이 없습니다</p>
                      )}
                    </div>
                  </div>

                  {/* 장수 열전 */}
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-sky-900/30 px-4 py-2 border-b border-white/5">
                      <h4 className="text-sm font-bold text-sky-400">📜 장수 열전</h4>
                    </div>
                    <div className="p-4 max-h-[300px] overflow-y-auto">
                      {historyLogs.length > 0 ? (
                        <div className="space-y-2">
                          {historyLogs.map((log, idx) => (
                            <div key={idx} className="text-xs text-gray-300 py-1 border-b border-white/5">
                              <span dangerouslySetInnerHTML={{ __html: parseLogText(log.text || '') as string }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-8">기록이 없습니다</p>
                      )}
                    </div>
                  </div>

                  {/* 전투 결과 */}
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-orange-900/30 px-4 py-2 border-b border-white/5">
                      <h4 className="text-sm font-bold text-orange-400">🏆 전투 결과</h4>
                    </div>
                    <div className="p-4 max-h-[300px] overflow-y-auto">
                      <p className="text-gray-500 text-sm text-center py-8">기록이 없습니다</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-12 text-center">
                <div className="text-4xl mb-4">📜</div>
                <p className="text-gray-400">좌측에서 장수를 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLogsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    }>
      <AdminLogsContent />
    </Suspense>
  );
}





