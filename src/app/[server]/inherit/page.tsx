'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

// 유산 버프 타입
type InheritBuffType = 
  | 'warAvoidRatio' 
  | 'warCriticalRatio' 
  | 'warMagicTrialProb'
  | 'warAvoidRatioOppose'
  | 'warCriticalRatioOppose'
  | 'warMagicTrialProbOppose'
  | 'domesticSuccessProb'
  | 'domesticFailProb';

interface InheritBuffInfo {
  title: string;
  info: string;
}

const inheritBuffHelpText: Record<InheritBuffType, InheritBuffInfo> = {
  warAvoidRatio: {
    title: '회피 확률 증가',
    info: '전투 시 회피 확률이 1%p ~ 5%p 증가합니다.',
  },
  warCriticalRatio: {
    title: '필살 확률 증가',
    info: '전투 시 필살 확률이 1%p ~ 5%p 증가합니다.',
  },
  warMagicTrialProb: {
    title: '계략 시도 확률 증가',
    info: '전투 시 계략을 시도할 확률이 1%p ~ 5%p 증가합니다.',
  },
  warAvoidRatioOppose: {
    title: '상대 회피 확률 감소',
    info: '전투 시 상대의 회피 확률이 1%p ~ 5%p 감소합니다.',
  },
  warCriticalRatioOppose: {
    title: '상대 필살 확률 감소',
    info: '전투 시 상대의 필살 확률이 1%p ~ 5%p 감소합니다.',
  },
  warMagicTrialProbOppose: {
    title: '상대 계략 시도 확률 감소',
    info: '전투 시 상대의 계략 시도 확률이 1%p ~ 5%p 감소합니다.',
  },
  domesticSuccessProb: {
    title: '내정 성공 확률 증가',
    info: '내정의 성공 확률이 1%p ~ 5%p 증가합니다.',
  },
  domesticFailProb: {
    title: '내정 실패 확률 감소',
    info: '내정의 실패 확률이 1%p ~ 5%p 감소합니다.',
  },
};

// 상점 아이템 정보
const shopItems = [
  {
    id: 'resetTurnTime',
    title: '랜덤 턴 초기화',
    info: '다다음턴부터 시간이 랜덤하게 바뀝니다. (필요 포인트가 피보나치식으로 증가합니다)',
    cost: 500,
  },
  {
    id: 'randomUnique',
    title: '랜덤 유니크 획득',
    info: '다음 턴에 랜덤 유니크를 얻습니다.',
    cost: 1000,
  },
  {
    id: 'resetSpecialWar',
    title: '즉시 전투 특기 초기화',
    info: '즉시 전투 특기를 초기화합니다. (필요 포인트가 피보나치식으로 증가합니다)',
    cost: 300,
  },
];

export default function InheritPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [inheritData, setInheritData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'shop' | 'buff' | 'logs'>('overview');
  
  // 상점 관련 상태
  const [processing, setProcessing] = useState(false);
  const [buffLevels, setBuffLevels] = useState<Record<InheritBuffType, number>>({
    warAvoidRatio: 0,
    warCriticalRatio: 0,
    warMagicTrialProb: 0,
    warAvoidRatioOppose: 0,
    warCriticalRatioOppose: 0,
    warMagicTrialProbOppose: 0,
    domesticSuccessProb: 0,
    domesticFailProb: 0,
  });
  
  // 로그 관련 상태
  const [logs, setLogs] = useState<Array<{ id: number; text: string; date: string }>>([]);
  const [lastLogID, setLastLogID] = useState<number>(Infinity);

  const totalPoint = useMemo(() => inheritData?.totalPoint ?? 0, [inheritData]);
  const inheritList = useMemo(() => inheritData?.inheritList ?? [], [inheritData]);

  useEffect(() => {
    loadInheritData();
  }, [serverID]);

  async function loadInheritData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetInheritPoint({ session_id: serverID });
      if (result.result) {
        setInheritData({
          totalPoint: result.totalPoint,
          inheritList: result.inheritList,
        });
        
        // 로그 초기화
        if (result.inheritList && result.inheritList.length > 0) {
          const logItems = result.inheritList.map((item: any, idx: number) => ({
            id: item.id || idx,
            text: item.reason || item.type || '포인트 변경',
            date: item.date || item.createdAt || '',
          }));
          setLogs(logItems);
          const minId = Math.min(...logItems.map((l: any) => l.id));
          setLastLogID(minId);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('유산 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // 상점 기능: 랜덤 유니크 구매
  async function buyRandomUnique() {
    if (processing) return;
    if (!confirm('랜덤 유니크를 구매하시겠습니까?')) return;
    
    try {
      setProcessing(true);
      const result = await SammoAPI.InheritBuyRandomUnique({ serverID });
      if (result.result) {
        showToast(`랜덤 유니크를 구매했습니다! ${result.itemName || ''}`, 'success');
        loadInheritData();
      } else {
        showToast(result.reason || '구매에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('구매에 실패했습니다.', 'error');
    } finally {
      setProcessing(false);
    }
  }

  // 상점 기능: 전투 특기 초기화
  async function resetSpecialWar() {
    if (processing) return;
    if (!confirm('전투 특기를 초기화하시겠습니까?')) return;
    
    try {
      setProcessing(true);
      const result = await SammoAPI.InheritResetSpecialWar({ serverID });
      if (result.result) {
        showToast('전투 특기가 초기화되었습니다!', 'success');
        loadInheritData();
      } else {
        showToast(result.reason || '초기화에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('초기화에 실패했습니다.', 'error');
    } finally {
      setProcessing(false);
    }
  }

  // 상점 기능: 턴 시간 초기화
  async function resetTurnTime() {
    if (processing) return;
    if (!confirm('턴 시간을 초기화하시겠습니까? 다다음턴부터 무작위 시간으로 초기화됩니다.')) return;
    
    try {
      setProcessing(true);
      const result = await SammoAPI.InheritResetTurnTime({ serverID });
      if (result.result) {
        showToast('턴 시간이 초기화되었습니다!', 'success');
        loadInheritData();
      } else {
        showToast(result.reason || '초기화에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('초기화에 실패했습니다.', 'error');
    } finally {
      setProcessing(false);
    }
  }

  // 버프 구매
  async function buyBuff(buffKey: InheritBuffType, level: number) {
    if (processing) return;
    if (level < 1 || level > 5) {
      showToast('버프 레벨은 1~5 사이여야 합니다.', 'warning');
      return;
    }
    
    const buffInfo = inheritBuffHelpText[buffKey];
    if (!confirm(`${buffInfo.title}를 ${level}등급으로 구매하시겠습니까?`)) return;
    
    try {
      setProcessing(true);
      const result = await SammoAPI.InheritBuyHiddenBuff({
        type: buffKey as any,
        level,
        serverID,
      });
      if (result.result) {
        showToast(`${buffInfo.title} ${level}등급 구매 완료!`, 'success');
        setBuffLevels(prev => ({ ...prev, [buffKey]: level }));
        loadInheritData();
      } else {
        showToast(result.reason || '구매에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('구매에 실패했습니다.', 'error');
    } finally {
      setProcessing(false);
    }
  }

  // 더 많은 로그 가져오기
  async function loadMoreLogs() {
    if (processing) return;
    
    try {
      setProcessing(true);
      const result = await SammoAPI.InheritGetMoreLog({
        lastID: lastLogID,
        serverID,
      });
      if (result.result && result.logs) {
        setLogs(prev => [...prev, ...result.logs!]);
        if (result.logs.length > 0) {
          const minId = Math.min(...result.logs.map(l => l.id));
          setLastLogID(minId);
        }
      } else {
        showToast('더 이상 기록이 없습니다.', 'info');
      }
    } catch (err) {
      console.error(err);
      showToast('로그를 불러오는데 실패했습니다.', 'error');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <TopBackBar title="유산 관리" reloadable onReload={loadInheritData} />
        
        {loading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            {/* 보유 포인트 표시 */}
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-900/20 to-amber-950/30 p-8 text-center shadow-lg backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-bold text-amber-300/80">보유 유산 포인트</h2>
              <div className="text-5xl font-extrabold text-amber-300 tabular-nums">
                {totalPoint.toLocaleString()} <span className="text-xl text-amber-500">P</span>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                유산 포인트로 특수 능력, 버프, 유니크 아이템을 구매할 수 있습니다.
              </p>
            </div>

            {/* 탭 메뉴 */}
            <div className="flex gap-1 bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-1">
              {[
                { id: 'overview', label: '개요' },
                { id: 'shop', label: '상점' },
                { id: 'buff', label: '버프' },
                { id: 'logs', label: '기록' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-md text-sm font-bold transition-colors',
                    activeTab === tab.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 개요 탭 */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">포인트 적립 내역</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {inheritList.slice(0, 9).map((item: any, idx: number) => (
                      <div key={idx} className="bg-gray-800/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">{item.reason || item.type || '적립'}</div>
                        <div className="text-lg font-bold text-amber-400 tabular-nums">
                          {(item.amount || item.point || 0).toLocaleString()}P
                        </div>
                      </div>
                    ))}
                  </div>
                  {inheritList.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      아직 적립 기록이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 상점 탭 */}
            {activeTab === 'shop' && (
              <div className="space-y-4">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                  <div className="bg-amber-600 px-4 py-3 text-center font-bold text-white">
                    유산 포인트 상점
                  </div>
                  <div className="p-4 space-y-4">
                    {/* 랜덤 유니크 */}
                    <div className="bg-gray-800/50 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-white">랜덤 유니크 획득</h4>
                        <p className="text-sm text-gray-400 mt-1">다음 턴에 랜덤 유니크 아이템을 얻습니다.</p>
                        <div className="text-amber-400 text-sm mt-2 font-bold">필요 포인트: 1,000P</div>
                      </div>
                      <button
                        type="button"
                        onClick={buyRandomUnique}
                        disabled={processing || totalPoint < 1000}
                        className={cn(
                          'px-6 py-2 rounded-lg font-bold text-sm transition-colors',
                          totalPoint >= 1000
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        )}
                      >
                        구매
                      </button>
                    </div>

                    {/* 전투 특기 초기화 */}
                    <div className="bg-gray-800/50 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-white">즉시 전투 특기 초기화</h4>
                        <p className="text-sm text-gray-400 mt-1">즉시 전투 특기를 초기화합니다. (필요 포인트가 피보나치식으로 증가)</p>
                        <div className="text-amber-400 text-sm mt-2 font-bold">필요 포인트: 300P~</div>
                      </div>
                      <button
                        type="button"
                        onClick={resetSpecialWar}
                        disabled={processing || totalPoint < 300}
                        className={cn(
                          'px-6 py-2 rounded-lg font-bold text-sm transition-colors',
                          totalPoint >= 300
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        )}
                      >
                        구매
                      </button>
                    </div>

                    {/* 턴 시간 초기화 */}
                    <div className="bg-gray-800/50 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-white">랜덤 턴 초기화</h4>
                        <p className="text-sm text-gray-400 mt-1">다다음턴부터 시간이 랜덤하게 바뀝니다. (필요 포인트가 피보나치식으로 증가)</p>
                        <div className="text-amber-400 text-sm mt-2 font-bold">필요 포인트: 500P~</div>
                      </div>
                      <button
                        type="button"
                        onClick={resetTurnTime}
                        disabled={processing || totalPoint < 500}
                        className={cn(
                          'px-6 py-2 rounded-lg font-bold text-sm transition-colors',
                          totalPoint >= 500
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        )}
                      >
                        구매
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 버프 탭 */}
            {activeTab === 'buff' && (
              <div className="space-y-4">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                  <div className="bg-purple-600 px-4 py-3 text-center font-bold text-white">
                    유산 버프 구매
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.entries(inheritBuffHelpText) as [InheritBuffType, InheritBuffInfo][]).map(([key, info]) => (
                      <div key={key} className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="font-bold text-white mb-1">{info.title}</h4>
                        <p className="text-xs text-gray-400 mb-3">{info.info}</p>
                        <div className="flex items-center gap-2">
                          <select
                            value={buffLevels[key]}
                            onChange={(e) => setBuffLevels(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                            className="flex-1 bg-gray-700 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            {[0, 1, 2, 3, 4, 5].map(level => (
                              <option key={level} value={level}>
                                {level === 0 ? '미구매' : `${level}등급`}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => buyBuff(key, buffLevels[key])}
                            disabled={processing || buffLevels[key] === 0}
                            className={cn(
                              'px-4 py-1.5 rounded font-bold text-sm transition-colors',
                              buffLevels[key] > 0
                                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            )}
                          >
                            구매
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 기록 탭 */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                  <div className="bg-green-600 px-4 py-3 text-center font-bold text-white">
                    유산 포인트 변경 내역
                  </div>
                  <div className="p-4 space-y-2">
                    {logs.length > 0 ? (
                      logs.map((log, idx) => (
                        <div key={log.id || idx} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-b-0">
                          <div className="text-xs text-gray-500 tabular-nums w-32 flex-shrink-0">
                            [{log.date || '-'}]
                          </div>
                          <div className="text-sm text-gray-300">{log.text}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        변경 내역이 없습니다.
                      </div>
                    )}
                  </div>
                  {logs.length > 0 && (
                    <div className="p-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={loadMoreLogs}
                        disabled={processing}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                      >
                        {processing ? '로딩 중...' : '더 가져오기'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
