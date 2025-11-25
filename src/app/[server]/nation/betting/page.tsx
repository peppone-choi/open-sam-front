'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface BettingItem {
  id: number;
  type?: string;
  title?: string;
  description?: string;
  openYearMonth?: number;
  closeYearMonth?: number;
  finished?: boolean;
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

const normalizeBettingList = (raw: any): BettingItem[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item) => typeof item === 'object' && item !== null);
  }
  return Object.values(raw).filter((item) => typeof item === 'object' && item !== null) as BettingItem[];
};

const formatYearMonth = (yearMonth?: number): string => {
  if (!yearMonth) return '-';
  const year = Math.floor((yearMonth - 1) / 12);
  const month = ((yearMonth - 1) % 12) + 1;
  return `${year}년 ${month}월`;
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

export default function NationBettingPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [bettingList, setBettingList] = useState<BettingItem[]>([]);
  const [selectedBettingId, setSelectedBettingId] = useState<number | null>(null);
  const [detail, setDetail] = useState<BettingDetailState | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadBettingData();
  }, [serverID]);

  async function loadBettingData() {
    try {
      setLoading(true);
      const result = await SammoAPI.NationGetBetting({ serverID });
      if (!result.result) {
        setBettingList([]);
        return;
      }
      const normalized = normalizeBettingList(result.bettings);
      setBettingList(normalized);
      if (normalized.length > 0) {
        setSelectedBettingId(normalized[0].id);
      } else {
        setSelectedBettingId(null);
      }
    } catch (err) {
      console.error(err);
      showToast('국가 베팅 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const selectedBetting = useMemo(
    () => bettingList.find((item) => item.id === selectedBettingId) || null,
    [bettingList, selectedBettingId]
  );

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
      const result = await SammoAPI.GetBettingDetail({ betting_id: bettingId, serverID });
      if (!result.result) {
        setDetail(null);
        setDetailError(result.reason || '베팅 상세를 불러올 수 없습니다.');
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
      setDetail(null);
      setDetailError('베팅 상세를 불러오는데 실패했습니다.');
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <TopBackBar title="천통국 베팅" reloadable onReload={loadBettingData} />
        
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List Section */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-lg font-bold text-white px-2">베팅 목록</h2>
              <div className="space-y-3">
                {bettingList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5">
                    진행 중인 국가 베팅이 없습니다.
                  </div>
                ) : (
                  bettingList.map((betting) => (
                    <div
                      key={betting.id}
                      className={cn(
                        "group border rounded-xl p-4 cursor-pointer transition-all duration-200 shadow-sm",
                        selectedBettingId === betting.id 
                          ? "bg-blue-900/20 border-blue-500 ring-1 ring-blue-500/50" 
                          : "bg-gray-900/50 border-white/5 hover:bg-white/[0.05] hover:border-white/20"
                      )}
                      onClick={() => setSelectedBettingId(betting.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                           {betting.title || `베팅 #${betting.id}`}
                        </div>
                        <div className={cn(
                           "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                           betting.finished ? "bg-gray-700 text-gray-300" : "bg-green-900/50 text-green-400 border border-green-500/30"
                        )}>
                          {betting.finished ? '종료' : '진행중'}
                        </div>
                      </div>
                      {betting.description && (
                        <div className="text-xs text-gray-400 mb-3 line-clamp-2">{betting.description}</div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 border-t border-white/5 pt-2">
                        <div>개시: <span className="text-gray-300">{formatYearMonth(betting.openYearMonth)}</span></div>
                        <div>마감: <span className="text-gray-300">{formatYearMonth(betting.closeYearMonth)}</span></div>
                        {betting.totalAmount !== undefined && (
                          <div className="col-span-2">총 베팅액: <span className="text-yellow-500">{betting.totalAmount.toLocaleString()}</span></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detail Section */}
            <div className="lg:col-span-8">
               {selectedBetting && (
                 <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg overflow-hidden min-h-[500px] flex flex-col">
                   {detailLoading ? (
                     <div className="flex-1 flex items-center justify-center">
                        <div className="animate-pulse text-gray-400">상세 정보를 불러오는 중...</div>
                     </div>
                   ) : detailError ? (
                     <div className="flex-1 flex items-center justify-center text-red-400">
                        {detailError}
                     </div>
                   ) : detail ? (
                     <div className="flex flex-col h-full">
                       {/* Header */}
                       <div className="bg-white/5 px-6 py-4 border-b border-white/5">
                          <h3 className="text-xl font-bold text-white mb-1">{detail.bettingInfo?.title || `베팅 #${selectedBetting.id}`}</h3>
                          {detail.bettingInfo?.description && (
                            <p className="text-sm text-gray-400">{detail.bettingInfo.description}</p>
                          )}
                       </div>

                       <div className="p-6 space-y-8 flex-1">
                          {/* Info Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                             {[
                                { label: '상태', value: detail.bettingInfo?.finished ? '종료' : '진행 중', highlight: !detail.bettingInfo?.finished },
                                { label: '개시', value: formatYearMonth(detail.bettingInfo?.openYearMonth) },
                                { label: '마감', value: formatYearMonth(detail.bettingInfo?.closeYearMonth) },
                                { label: '필요 선택 수', value: detail.bettingInfo?.selectCnt ?? 1 },
                                { label: '베팅 자원', value: detail.bettingInfo?.reqInheritancePoint ? '유산 포인트' : '금' },
                                { label: '보유 자원', value: (detail.remainPoint || 0).toLocaleString(), highlight: true },
                             ].map((item, idx) => (
                                <div key={idx} className="bg-black/20 border border-white/5 rounded-lg p-3">
                                   <div className="text-[10px] text-gray-500 uppercase mb-1">{item.label}</div>
                                   <div className={cn("font-bold text-sm", item.highlight ? "text-white" : "text-gray-300")}>
                                      {item.value}
                                   </div>
                                </div>
                             ))}
                          </div>

                          {/* Candidates */}
                          <div>
                             <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                후보 목록
                             </h4>
                             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                               {detail.bettingInfo?.candidates
                                 ? Object.entries(detail.bettingInfo.candidates).map(([key, value]) => (
                                     <div key={key} className="bg-black/20 border border-white/5 rounded-lg p-3 hover:bg-white/5 transition-colors">
                                       <div className="text-xs font-bold text-white mb-1">{key}</div>
                                       <div className="text-[10px] text-gray-400 break-words leading-snug">
                                          {formatCandidateLabel(value)}
                                       </div>
                                     </div>
                                   ))
                                 : <div className="text-sm text-gray-500 col-span-full">후보 정보가 없습니다.</div>}
                             </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* Global Stats */}
                             <div className="space-y-3">
                                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                   <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
                                   전체 베팅 현황
                                </h4>
                                <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                                   {detail.bettingDetail && detail.bettingDetail.length > 0 ? (
                                     <table className="w-full text-xs text-left">
                                       <thead className="bg-white/5 text-gray-400 font-bold border-b border-white/5">
                                         <tr>
                                           <th className="px-3 py-2">선택</th>
                                           <th className="px-3 py-2 text-right">총 금액</th>
                                         </tr>
                                       </thead>
                                       <tbody className="divide-y divide-white/5">
                                         {detail.bettingDetail.map(([typeKey, amount]) => (
                                           <tr key={typeKey}>
                                             <td className="px-3 py-2 text-gray-300">{renderBettingTypeLabel(typeKey)}</td>
                                             <td className="px-3 py-2 text-right font-medium text-white">{(amount || 0).toLocaleString()}</td>
                                           </tr>
                                         ))}
                                       </tbody>
                                     </table>
                                   ) : (
                                     <div className="p-4 text-center text-xs text-gray-500">집계된 내역이 없습니다.</div>
                                   )}
                                </div>
                             </div>

                             {/* My Stats */}
                             <div className="space-y-3">
                                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                   <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                   내 베팅 내역
                                </h4>
                                <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                                   {detail.myBetting && detail.myBetting.length > 0 ? (
                                     <table className="w-full text-xs text-left">
                                       <thead className="bg-white/5 text-gray-400 font-bold border-b border-white/5">
                                         <tr>
                                           <th className="px-3 py-2">선택</th>
                                           <th className="px-3 py-2 text-right">금액</th>
                                         </tr>
                                       </thead>
                                       <tbody className="divide-y divide-white/5">
                                         {detail.myBetting.map(([typeKey, amount]) => (
                                           <tr key={typeKey}>
                                             <td className="px-3 py-2 text-gray-300">{renderBettingTypeLabel(typeKey)}</td>
                                             <td className="px-3 py-2 text-right font-medium text-green-400">{(amount || 0).toLocaleString()}</td>
                                           </tr>
                                         ))}
                                       </tbody>
                                     </table>
                                   ) : (
                                     <div className="p-4 text-center text-xs text-gray-500">베팅한 내역이 없습니다.</div>
                                   )}
                                </div>
                             </div>
                          </div>

                          <p className="text-xs text-gray-500 italic text-center mt-4 border-t border-white/5 pt-4">
                             * 실제 베팅은 상단 `베팅장` 페이지에서 진행할 수 있습니다.
                          </p>
                       </div>
                     </div>
                   ) : (
                     <div className="flex-1 flex items-center justify-center text-gray-500">
                        베팅을 선택해주세요.
                     </div>
                   )}
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
