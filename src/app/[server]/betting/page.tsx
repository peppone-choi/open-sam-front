'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

interface BettingSummary {
  id: number;
  title?: string;
  description?: string;
  type?: string;
  finished?: boolean;
  result?: string; // 결과 (우승자 등)
  openYearMonth?: number;
  closeYearMonth?: number;
  selectCnt?: number;
  reqInheritancePoint?: boolean;
  totalAmount?: number;
}

interface BettingDetailState {
  bettingInfo?: any;
  bettingDetail?: [string, number][];
  myBetting?: [string, number][];
  remainPoint?: number;
  year?: number;
  month?: number;
}

// 배당률 바 차트 컴포넌트
function OddsBar({ 
  entries, 
  winningKey 
}: { 
  entries: [string, number][]; 
  winningKey?: string;
}) {
  const total = entries.reduce((sum, [, val]) => sum + val, 0);
  if (total === 0) return null;

  const maxAmount = Math.max(...entries.map(([, val]) => val));

  return (
    <div className="space-y-2">
      {entries.map(([key, amount]) => {
        const percentage = (amount / total) * 100;
        const odds = total > 0 && amount > 0 ? (total / amount).toFixed(2) : '-';
        const isWinner = winningKey === key;
        
        let label = key;
        try {
          const parsed = JSON.parse(key);
          if (Array.isArray(parsed)) {
            label = parsed.join(', ');
          } else {
            label = String(parsed);
          }
        } catch {
          label = key;
        }

        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className={cn(
                "flex items-center gap-2",
                isWinner ? "text-yellow-400 font-bold" : "text-gray-300"
              )}>
                {isWinner && <span className="text-yellow-500">🏆</span>}
                {label}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-mono">{percentage.toFixed(1)}%</span>
                <span className={cn(
                  "font-mono font-bold",
                  isWinner ? "text-yellow-400" : "text-blue-400"
                )}>
                  x{odds}
                </span>
              </div>
            </div>
            <div className="h-4 bg-black/30 rounded-full overflow-hidden relative">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isWinner 
                    ? "bg-gradient-to-r from-yellow-600 to-yellow-400" 
                    : "bg-gradient-to-r from-blue-700 to-blue-500"
                )}
                style={{ width: `${percentage}%` }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/70">
                {amount.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 베팅 결과 배지
function ResultBadge({ finished, hasWon }: { finished: boolean; hasWon?: boolean }) {
  if (!finished) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-900/30 border border-green-500/30 text-green-400 text-xs font-bold rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        진행 중
      </span>
    );
  }
  
  if (hasWon === true) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-900/30 border border-yellow-500/30 text-yellow-400 text-xs font-bold rounded-full">
        🎉 당첨!
      </span>
    );
  }
  
  if (hasWon === false) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-800 border border-gray-700 text-gray-400 text-xs font-bold rounded-full">
        💔 미당첨
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-800 border border-gray-700 text-gray-400 text-xs font-bold rounded-full">
      종료됨
    </span>
  );
}

const normalizeBettingList = (raw: any): BettingSummary[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item) => typeof item === 'object' && item !== null);
  }
  return Object.values(raw).filter((item) => typeof item === 'object' && item !== null) as BettingSummary[];
};

const formatCandidateLabel = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => formatCandidateLabel(item)).join(' / ');
  }
  if (typeof value === 'object') {
    return value.name || value.title || value.label || JSON.stringify(value);
  }
  return String(value);
};

const formatYearMonth = (value?: number | null): string => {
  if (!value || value <= 0) return '-';
  const year = Math.floor((value - 1) / 12);
  const month = ((value - 1) % 12) + 1;
  return `${year}년 ${month}월`;
};

const renderBettingTypeLabel = (typeKey: string): string => {
  try {
    const parsed = JSON.parse(typeKey);
    if (Array.isArray(parsed)) {
      return parsed.join(', ');
    }
    return String(parsed);
  } catch {
    return typeKey;
  }
};

export default function BettingPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [bettingList, setBettingList] = useState<BettingSummary[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedBettingId, setSelectedBettingId] = useState<number | null>(null);
  const [detail, setDetail] = useState<BettingDetailState | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [betAmount, setBetAmount] = useState('');
  const [placing, setPlacing] = useState(false);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const loadBettingList = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setListError(null);
      const result = await SammoAPI.BettingGetBettingList({ serverID });
      if (!result.result && result.success === false) {
        setListError(result.reason || '베팅 정보를 불러올 수 없습니다.');
        setBettingList([]);
        return;
      }
      const normalized = normalizeBettingList(result.bettings || result.bettingList);
      setBettingList(normalized);
      if (normalized.length > 0) {
        setSelectedBettingId((prev) => {
          if (prev && normalized.some((item) => item.id === prev)) {
            return prev;
          }
          return normalized[0].id;
        });
      } else {
        setSelectedBettingId(null);
      }
    } catch (err) {
      console.error(err);
      if (!silent) setListError('베팅 정보를 불러오는데 실패했습니다.');
      setBettingList([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [serverID]);

  useEffect(() => {
    loadBettingList();
  }, [loadBettingList]);

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      loadBettingList(true);
    }, 30000);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [loadBettingList]);


  useEffect(() => {
    if (selectedBettingId == null) {
      setDetail(null);
      return;
    }
    loadBettingDetail(selectedBettingId);
  }, [selectedBettingId, serverID]);

  async function loadBettingDetail(bettingId: number) {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setSelectedCandidates([]);
      setBetAmount('');
      const result = await SammoAPI.GetBettingDetail({ betting_id: bettingId, serverID });
      if (!result.result) {
        setDetailError(result.reason || '베팅 상세를 불러올 수 없습니다.');
        setDetail(null);
        return;
      }
      setDetail({
        bettingInfo: result.bettingInfo,
        bettingDetail: result.bettingDetail,
        myBetting: result.myBetting,
        remainPoint: result.remainPoint,
        year: result.year,
        month: result.month,
      });
    } catch (err) {
      console.error(err);
      setDetailError('베팅 상세를 불러오는데 실패했습니다.');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  const toggleCandidate = (candidateKey: string) => {
    const selectCnt = detail?.bettingInfo?.selectCnt ?? 1;
    setSelectedCandidates((prev) => {
      if (prev.includes(candidateKey)) {
        return prev.filter((item) => item !== candidateKey);
      }
      if (prev.length >= selectCnt) {
        showToast(`최대 ${selectCnt}개까지 선택할 수 있습니다.`, 'warning');
        return prev;
      }
      return [...prev, candidateKey];
    });
  };

  const handlePlaceBet = async () => {
    if (!detail || selectedBettingId == null) return;
    const selectCnt = detail.bettingInfo?.selectCnt ?? 1;
    if (selectedCandidates.length !== selectCnt) {
      showToast(`필요한 선택 수(${selectCnt})를 맞춰주세요.`, 'warning');
      return;
    }
    const amountValue = Number(betAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      showToast('베팅 금액을 올바르게 입력해주세요.', 'warning');
      return;
    }
    setPlacing(true);
    try {
      const result = await SammoAPI.BettingBet({
        bettingID: selectedBettingId,
        bettingType: selectedCandidates.map((value) => {
          const parsed = Number(value);
          return Number.isNaN(parsed) ? value : parsed;
        }),
        amount: amountValue,
        serverID,
      });
      if (result.result) {
        showToast('베팅이 완료되었습니다.', 'success');
        await loadBettingDetail(selectedBettingId);
      } else {
        showToast(result.reason || '베팅에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('베팅 중 오류가 발생했습니다.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const bettingDetailEntries = detail?.bettingDetail || [];
  const myBettingEntries = detail?.myBetting || [];
  const candidateEntries = detail?.bettingInfo?.candidates
    ? Object.entries(detail.bettingInfo.candidates)
    : [];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="베 팅 장" reloadable={true} onReload={() => loadBettingList()} />
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : listError ? (
        <div className="flex justify-center items-center h-[50vh] text-red-400">{listError}</div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Betting List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-white px-2">진행 중인 베팅</h2>
            {bettingList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5">
                 진행 중인 베팅이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {bettingList.map((betting) => (
                  <button
                    key={betting.id}
                    type="button"
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all duration-200",
                      betting.id === selectedBettingId 
                        ? "bg-blue-900/30 border-blue-500 ring-1 ring-blue-500/50" 
                        : betting.finished
                          ? "bg-gray-900/30 border-white/5 hover:border-white/20 opacity-75"
                          : "bg-gray-900/50 border-white/5 hover:border-white/20 hover:bg-gray-800/50"
                    )}
                    onClick={() => setSelectedBettingId(betting.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className={cn(
                        "font-bold",
                        betting.finished ? "text-gray-400" : "text-white"
                      )}>
                        {betting.title || `베팅 #${betting.id}`}
                      </div>
                      <ResultBadge finished={betting.finished || false} />
                    </div>
                    {betting.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{betting.description}</p>
                    )}
                    
                    {/* 결과 표시 (종료된 경우) */}
                    {betting.finished && betting.result && (
                      <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                        <div className="text-xs text-yellow-500 font-bold flex items-center gap-1">
                          <span>🏆</span>
                          <span>결과: {betting.result}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-500">
                      <div>종류: {betting.type || '-'}</div>
                      <div>선택 수: {betting.selectCnt ?? 1}</div>
                      <div className="col-span-2 flex items-center gap-1">
                        <span>총 베팅액:</span>
                        <span className="font-mono text-yellow-500 font-bold">{(betting.totalAmount || 0).toLocaleString()}</span>
                        <span>금</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Detail Panel */}
          <div className="lg:col-span-2">
            {selectedBettingId && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg min-h-[600px] flex flex-col">
                {detailLoading ? (
                  <div className="flex-1 flex justify-center items-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : detailError ? (
                  <div className="flex-1 flex justify-center items-center text-red-400">{detailError}</div>
                ) : detail ? (
                  <>
                    <div className="mb-6 pb-4 border-b border-white/10">
                      <h2 className="text-2xl font-bold text-white mb-2">{detail.bettingInfo?.title || `베팅 #${selectedBettingId}`}</h2>
                      {detail.bettingInfo?.description && (
                        <p className="text-gray-300 text-sm leading-relaxed">{detail.bettingInfo.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 bg-black/20 p-4 rounded-lg border border-white/5">
                      <div>
                        <span className="text-xs text-gray-500 block">개시</span>
                        <strong className="text-sm text-white">{formatYearMonth(detail.bettingInfo?.openYearMonth)}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">마감</span>
                        <strong className="text-sm text-white">{formatYearMonth(detail.bettingInfo?.closeYearMonth)}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">필요 선택 수</span>
                        <strong className="text-sm text-white">{detail.bettingInfo?.selectCnt ?? 1}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">보증 자원</span>
                        <strong className="text-sm text-yellow-500">
                          {detail.bettingInfo?.reqInheritancePoint ? '유산 포인트' : '금'}
                        </strong>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-xs text-gray-500 block">보유 자원</span>
                        <strong className="text-sm text-white font-mono">{(detail.remainPoint || 0).toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-white">후보 선택</h3>
                        <span className="text-xs text-gray-400">선택 {selectedCandidates.length} / {detail.bettingInfo?.selectCnt ?? 1}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
                        {candidateEntries.map(([key, value]) => (
                          <button
                            key={key}
                            type="button"
                            className={cn(
                              "px-3 py-2 rounded text-sm text-left transition-colors flex items-center gap-2 border",
                              selectedCandidates.includes(key) 
                                ? "bg-blue-600 border-blue-500 text-white shadow-md" 
                                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                            )}
                            onClick={() => toggleCandidate(key)}
                            disabled={detail.bettingInfo?.finished}
                          >
                            <span className="font-mono opacity-50 text-xs">[{key}]</span>
                            <span className="truncate flex-1">{formatCandidateLabel(value)}</span>
                          </button>
                        ))}
                        {candidateEntries.length === 0 && (
                          <div className="col-span-full text-center py-4 text-gray-500 text-sm">등록된 후보가 없습니다.</div>
                        )}
                      </div>
                    </div>

                    {!detail.bettingInfo?.finished && (
                      <div className="mb-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                          <label htmlFor="bet-amount" className="block text-sm font-medium text-blue-300 mb-1">베팅 금액</label>
                          <input
                            id="bet-amount"
                            type="number"
                            min={1}
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            className="w-full bg-black/40 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-blue-900/50"
                            placeholder="금액 입력"
                          />
                        </div>
                        <button
                          type="button"
                          className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          onClick={handlePlaceBet}
                          disabled={placing}
                        >
                          {placing ? '처리 중...' : '베팅하기'}
                        </button>
                      </div>
                    )}

                    {/* 배당률 시각화 */}
                    {bettingDetailEntries.length > 0 && (
                      <div className="mb-6 p-4 bg-black/20 rounded-xl border border-white/5">
                        <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          배당률 현황
                        </h4>
                        <OddsBar 
                          entries={bettingDetailEntries} 
                          winningKey={detail.bettingInfo?.result}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto pt-6 border-t border-white/10">
                      <div>
                        <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">전체 베팅 현황</h4>
                        <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                          {bettingDetailEntries.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">집계된 내역이 없습니다.</div>
                          ) : (
                            <table className="w-full text-xs text-left">
                              <thead className="bg-white/5 text-gray-400">
                                <tr>
                                  <th className="px-3 py-2 font-medium">선택</th>
                                  <th className="px-3 py-2 font-medium text-right">총 금액</th>
                                  <th className="px-3 py-2 font-medium text-right">배당</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {bettingDetailEntries.map(([typeKey, amount]) => {
                                  const total = bettingDetailEntries.reduce((sum, [, val]) => sum + val, 0);
                                  const odds = total > 0 && amount > 0 ? (total / amount).toFixed(2) : '-';
                                  const isWinner = detail.bettingInfo?.result === typeKey;
                                  return (
                                    <tr key={typeKey} className={isWinner ? 'bg-yellow-900/20' : ''}>
                                      <td className={cn(
                                        "px-3 py-2",
                                        isWinner ? "text-yellow-400 font-bold" : "text-gray-300"
                                      )}>
                                        {isWinner && '🏆 '}
                                        {renderBettingTypeLabel(typeKey)}
                                      </td>
                                      <td className="px-3 py-2 text-right font-mono text-yellow-500">{(amount || 0).toLocaleString()}</td>
                                      <td className={cn(
                                        "px-3 py-2 text-right font-mono font-bold",
                                        isWinner ? "text-yellow-400" : "text-blue-400"
                                      )}>x{odds}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">내 베팅 내역</h4>
                        <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                          {myBettingEntries.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">베팅한 내역이 없습니다.</div>
                          ) : (
                            <>
                              <table className="w-full text-xs text-left">
                                <thead className="bg-white/5 text-gray-400">
                                  <tr>
                                    <th className="px-3 py-2 font-medium">선택</th>
                                    <th className="px-3 py-2 font-medium text-right">금액</th>
                                    <th className="px-3 py-2 font-medium text-right">결과</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {myBettingEntries.map(([typeKey, amount]) => {
                                    const isWinner = detail.bettingInfo?.result === typeKey;
                                    const total = bettingDetailEntries.reduce((sum, [, val]) => sum + val, 0);
                                    const betOnThis = bettingDetailEntries.find(([k]) => k === typeKey)?.[1] || 0;
                                    const potentialWin = betOnThis > 0 ? Math.floor((amount / betOnThis) * total) : 0;
                                    
                                    return (
                                      <tr key={typeKey} className={isWinner && detail.bettingInfo?.finished ? 'bg-yellow-900/20' : ''}>
                                        <td className="px-3 py-2 text-gray-300">{renderBettingTypeLabel(typeKey)}</td>
                                        <td className="px-3 py-2 text-right font-mono text-green-400">{(amount || 0).toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right">
                                          {detail.bettingInfo?.finished ? (
                                            isWinner ? (
                                              <span className="text-yellow-400 font-bold">+{potentialWin.toLocaleString()}</span>
                                            ) : (
                                              <span className="text-red-400">-{(amount || 0).toLocaleString()}</span>
                                            )
                                          ) : (
                                            <span className="text-gray-500">대기 중</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              {detail.bettingInfo?.finished && (
                                <div className={cn(
                                  "p-3 border-t border-white/5 text-center",
                                  myBettingEntries.some(([k]) => k === detail.bettingInfo?.result)
                                    ? "bg-yellow-900/20 text-yellow-400"
                                    : "bg-red-900/20 text-red-400"
                                )}>
                                  <span className="font-bold">
                                    {myBettingEntries.some(([k]) => k === detail.bettingInfo?.result)
                                      ? '🎉 축하합니다! 당첨되었습니다!'
                                      : '아쉽게도 당첨되지 않았습니다.'}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex justify-center items-center text-gray-500">베팅을 선택해주세요.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
