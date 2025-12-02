'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

interface AuctionItem {
  id: number;
  type?: string;
  title?: string;
  hostName?: string;
  amount?: number;
  target?: string;
  startBidAmount?: number;
  closeDate?: string;
  finished?: boolean;
  highestBid?: {
    amount: number;
    generalName: string;
  };
}

interface BidModalProps {
  auction: AuctionItem;
  auctionType: 'resource' | 'unique';
  onClose: () => void;
  onBid: (amount: number) => Promise<void>;
}

function BidModal({ auction, auctionType, onClose, onBid }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(bidAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    
    setSubmitting(true);
    try {
      await onBid(amount);
    } finally {
      setSubmitting(false);
    }
  };

  const minBid = auction.highestBid?.amount 
    ? auction.highestBid.amount + 1 
    : (auction.startBidAmount || 1);

  const quickBidAmounts = [
    minBid,
    Math.ceil(minBid * 1.1),
    Math.ceil(minBid * 1.25),
    Math.ceil(minBid * 1.5),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-white">입찰하기</h3>
              <p className="text-sm text-gray-400 mt-1">
                {auctionType === 'resource' 
                  ? (auction.type === 'BuyRice' ? '쌀 구매' : '쌀 판매')
                  : auction.title}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Auction Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <div className="text-xs text-gray-500 mb-1">
                {auctionType === 'resource' ? '수량' : '대상'}
              </div>
              <div className="font-bold text-white">
                {auctionType === 'resource' 
                  ? (auction.amount?.toLocaleString() || '-')
                  : (auction.target || '-')}
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <div className="text-xs text-gray-500 mb-1">현재 최고가</div>
              <div className="font-bold text-yellow-400">
                {auction.highestBid?.amount?.toLocaleString() || auction.startBidAmount?.toLocaleString() || '0'}
              </div>
            </div>
          </div>

          {/* Quick Bid Buttons */}
          <div>
            <div className="text-xs text-gray-500 mb-2">빠른 입찰</div>
            <div className="grid grid-cols-4 gap-2">
              {quickBidAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setBidAmount(String(amount))}
                  className={cn(
                    "py-2 text-xs font-bold rounded-lg border transition-all",
                    bidAmount === String(amount)
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  )}
                >
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div>
            <label htmlFor="bid-amount" className="text-xs text-gray-500 mb-2 block">
              입찰 금액
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="bid-amount"
                type="number"
                min={1}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`최소 ${minBid.toLocaleString()}`}
                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-600"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">금</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !bidAmount || parseInt(bidAmount) <= 0}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-700 disabled:to-gray-600"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                처리 중...
              </span>
            ) : (
              `${bidAmount ? parseInt(bidAmount).toLocaleString() + ' 금으로 ' : ''}입찰하기`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function AuctionContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serverID = params?.server as string;
  const isResAuction = searchParams?.get('type') !== 'unique';
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [auctionData, setAuctionData] = useState<AuctionItem[]>([]);
  const [auctionType, setAuctionType] = useState<'resource' | 'unique'>('resource');
  const [selectedAuction, setSelectedAuction] = useState<AuctionItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const loadAuctionData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const currentType = isResAuction ? 'resource' : 'unique';
      
      if (currentType === 'unique') {
        const result = await SammoAPI.AuctionGetUniqueItemAuctionList({ serverID });
        if (result.success && result.list) {
          setAuctionData(result.list);
        } else {
          setAuctionData([]);
        }
      } else {
        const result = await SammoAPI.GetActiveResourceAuctionList({ serverID });
        if (result.success && result.buyRiceList && result.sellRiceList) {
          setAuctionData([...result.buyRiceList, ...result.sellRiceList]);
        } else {
          setAuctionData([]);
        }
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      if (!silent) {
        showToast('경매 정보를 불러오는데 실패했습니다.', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [serverID, isResAuction, showToast]);

  useEffect(() => {
    setAuctionType(isResAuction ? 'resource' : 'unique');
    loadAuctionData();
  }, [loadAuctionData, isResAuction]);

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      loadAuctionData(true);
    }, 30000);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [loadAuctionData]);

  const handleBid = useCallback(async (auction: AuctionItem, amount: number) => {
    try {
      let result;
      if (auctionType === 'unique') {
        result = await SammoAPI.AuctionBidUniqueAuction({
          auctionID: auction.id,
          bidAmount: amount,
          serverID,
        });
      } else {
        if (auction.type === 'BuyRice') {
          result = await SammoAPI.BidBuyRiceAuction({
            auctionID: auction.id,
            bidAmount: amount,
            serverID,
          });
        } else if (auction.type === 'SellRice') {
          result = await SammoAPI.BidSellRiceAuction({
            auctionID: auction.id,
            bidAmount: amount,
            serverID,
          });
        } else {
          showToast('알 수 없는 경매 유형입니다.', 'error');
          return;
        }
      }
      
      if (result.result) {
        showToast('입찰이 완료되었습니다!', 'success');
        setSelectedAuction(null);
        loadAuctionData();
      } else {
        showToast(result.reason || '입찰에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '입찰 중 오류가 발생했습니다.', 'error');
    }
  }, [auctionType, serverID, showToast, loadAuctionData]);

  const getRemainingTime = (closeDate: string) => {
    const now = new Date();
    const close = new Date(closeDate);
    const diff = close.getTime() - now.getTime();
    
    if (diff <= 0) return '마감됨';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}일 ${hours % 24}시간`;
    }
    return `${hours}시간 ${minutes}분`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <TopBackBar title="경 매 장" reloadable onReload={() => loadAuctionData()} />

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Tabs */}
          <div className="flex gap-2 bg-black/20 p-1 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => router.push(`/${serverID}/auction`)}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded transition-all",
                auctionType === 'resource' 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              금/쌀 경매장
            </button>
            <button
              type="button"
              onClick={() => router.push(`/${serverID}/auction?type=unique`)}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded transition-all",
                auctionType === 'unique' 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              유니크 경매장
            </button>
          </div>

          {/* Auto Refresh Indicator */}
          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>자동 갱신 · {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-400 font-medium">경매 정보 로딩 중...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {auctionData && Array.isArray(auctionData) && auctionData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {auctionData.map((auction: AuctionItem) => (
                  <div 
                    key={auction.id} 
                    className={cn(
                      "bg-gray-900/50 backdrop-blur-sm border rounded-xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col group",
                      auction.finished 
                        ? "border-white/5 opacity-60" 
                        : "border-white/5 hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5"
                    )}
                  >
                    {/* Card Header */}
                    <div className="px-5 py-3 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
                      <div className="space-y-1">
                        <div className={cn(
                          "text-sm font-bold",
                          auctionType === 'resource' 
                            ? (auction.type === 'BuyRice' ? "text-green-400" : "text-yellow-400")
                            : "text-purple-400"
                        )}>
                          {auctionType === 'resource' 
                            ? (auction.type === 'BuyRice' ? '쌀 구매' : '쌀 판매') 
                            : auction.title}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <span>by</span>
                          <span className="text-gray-300">{auction.hostName}</span>
                        </div>
                      </div>
                      <div className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded border",
                        auction.finished 
                          ? "bg-gray-800 text-gray-500 border-gray-700" 
                          : "bg-green-900/30 text-green-500 border-green-500/30"
                      )}>
                        {auction.finished ? '종료됨' : '진행중'}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4 flex-1 text-sm text-gray-300">
                      <div className="space-y-2">
                        {auctionType === 'resource' ? (
                          <div className="flex justify-between items-center p-2 bg-black/20 rounded">
                            <span className="text-gray-400 text-xs uppercase font-bold">수량</span>
                            <span className="font-mono font-bold text-white">{(auction.amount || 0).toLocaleString()}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center p-2 bg-black/20 rounded">
                            <span className="text-gray-400 text-xs uppercase font-bold">대상</span>
                            <span className="font-bold text-white">{auction.target}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">시작가</span>
                          <span className="font-mono text-gray-400">{(auction.startBidAmount || 0).toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">남은 시간</span>
                          <span className={cn(
                            "text-xs font-bold",
                            auction.closeDate && getRemainingTime(auction.closeDate) === '마감됨' 
                              ? "text-gray-500" 
                              : "text-orange-400"
                          )}>
                            {auction.closeDate ? getRemainingTime(auction.closeDate) : '-'}
                          </span>
                        </div>
                      </div>

                      {auction.highestBid && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <div className="text-xs text-gray-400 mb-1">현재 최고 입찰</div>
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-400 font-bold text-lg">{auction.highestBid.amount.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded">{auction.highestBid.generalName}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 bg-black/20 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setSelectedAuction(auction)}
                        className={cn(
                          "w-full py-2.5 font-bold rounded-lg text-sm transition-all",
                          auction.finished 
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-900/20 transform hover:-translate-y-0.5"
                        )}
                        disabled={auction.finished}
                      >
                        {auction.finished ? '입찰 마감' : '입찰하기'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
                <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-500 font-medium">진행 중인 경매가 없습니다</p>
                <p className="text-gray-600 text-sm mt-1">새로운 경매가 등록되면 여기에 표시됩니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bid Modal */}
      {selectedAuction && (
        <BidModal
          auction={selectedAuction}
          auctionType={auctionType}
          onClose={() => setSelectedAuction(null)}
          onBid={(amount) => handleBid(selectedAuction, amount)}
        />
      )}
    </div>
  );
}

export default function AuctionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">로딩 중...</div>}>
      <AuctionContent />
    </Suspense>
  );
}


