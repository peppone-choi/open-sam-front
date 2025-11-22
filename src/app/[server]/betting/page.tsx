'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

interface BettingSummary {
  id: number;
  title?: string;
  description?: string;
  type?: string;
  finished?: boolean;
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

  useEffect(() => {
    loadBettingList();
  }, [serverID]);

  async function loadBettingList() {
    try {
      setLoading(true);
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
      setListError('베팅 정보를 불러오는데 실패했습니다.');
      setBettingList([]);
    } finally {
      setLoading(false);
    }
  }

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
        alert(`최대 ${selectCnt}개까지 선택할 수 있습니다.`);
        return prev;
      }
      return [...prev, candidateKey];
    });
  };

  const handlePlaceBet = async () => {
    if (!detail || selectedBettingId == null) return;
    const selectCnt = detail.bettingInfo?.selectCnt ?? 1;
    if (selectedCandidates.length !== selectCnt) {
      alert(`필요한 선택 수(${selectCnt})를 맞춰주세요.`);
      return;
    }
    const amountValue = Number(betAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      alert('베팅 금액을 올바르게 입력해주세요.');
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
        alert('베팅이 완료되었습니다.');
        await loadBettingDetail(selectedBettingId);
      } else {
        alert(result.reason || '베팅에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('베팅 중 오류가 발생했습니다.');
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
      <TopBackBar title="베 팅 장" reloadable={true} onReload={loadBettingList} />
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
                        : "bg-gray-900/50 border-white/5 hover:border-white/20 hover:bg-gray-800/50"
                    )}
                    onClick={() => setSelectedBettingId(betting.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-white">{betting.title || `베팅 #${betting.id}`}</div>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded font-bold",
                        betting.finished ? "bg-gray-700 text-gray-300" : "bg-green-600 text-white"
                      )}>
                        {betting.finished ? '종료' : '진행 중'}
                      </span>
                    </div>
                    {betting.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{betting.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-500">
                      <div>종류: {betting.type || '-'}</div>
                      <div>선택 수: {betting.selectCnt ?? 1}</div>
                      <div className="col-span-2">총 베팅액: {(betting.totalAmount || 0).toLocaleString()} 금</div>
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
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {bettingDetailEntries.map(([typeKey, amount]) => (
                                  <tr key={typeKey}>
                                    <td className="px-3 py-2 text-gray-300">{renderBettingTypeLabel(typeKey)}</td>
                                    <td className="px-3 py-2 text-right font-mono text-yellow-500">{(amount || 0).toLocaleString()}</td>
                                  </tr>
                                ))}
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
                            <table className="w-full text-xs text-left">
                              <thead className="bg-white/5 text-gray-400">
                                <tr>
                                  <th className="px-3 py-2 font-medium">선택</th>
                                  <th className="px-3 py-2 font-medium text-right">금액</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {myBettingEntries.map(([typeKey, amount]) => (
                                  <tr key={typeKey}>
                                    <td className="px-3 py-2 text-gray-300">{renderBettingTypeLabel(typeKey)}</td>
                                    <td className="px-3 py-2 text-right font-mono text-green-400">{(amount || 0).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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
