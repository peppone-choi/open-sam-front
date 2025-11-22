'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

function AuctionContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serverID = params?.server as string;
  const isResAuction = searchParams?.get('type') !== 'unique';

  const [loading, setLoading] = useState(true);
  const [auctionData, setAuctionData] = useState<any>(null);
  const [auctionType, setAuctionType] = useState<'resource' | 'unique'>('resource');

  useEffect(() => {
    setAuctionType(isResAuction ? 'resource' : 'unique');
    loadAuctionData();
  }, [serverID, isResAuction]);

  async function loadAuctionData() {
    try {
      setLoading(true);
      
      if (auctionType === 'unique') {
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
    } catch (err) {
      console.error(err);
      alert('경매 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const handleBid = async (auction: any) => {
    const amount = prompt('입찰 금액을 입력하세요:');
    if (!amount) return;

    const bidAmount = parseInt(amount, 10);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }

    try {
      let result;
      if (auctionType === 'unique') {
        result = await SammoAPI.AuctionBidUniqueAuction({
          auctionID: auction.id,
          bidAmount,
          serverID,
        });
      } else {
        if (auction.type === 'BuyRice') {
          result = await SammoAPI.BidBuyRiceAuction({
            auctionID: auction.id,
            bidAmount,
            serverID,
          });
        } else if (auction.type === 'SellRice') {
          result = await SammoAPI.BidSellRiceAuction({
            auctionID: auction.id,
            bidAmount,
            serverID,
          });
        } else {
          alert('알 수 없는 경매 유형입니다.');
          return;
        }
      }
      
      if (result.result) {
        alert('입찰이 완료되었습니다.');
        loadAuctionData();
      } else {
        alert(result.reason || '입찰에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '입찰 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <TopBackBar title="경 매 장" reloadable onReload={loadAuctionData} />

        {/* Tabs */}
        <div className="flex gap-2 bg-black/20 p-1 rounded-lg border border-white/10 w-fit">
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

        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {auctionData && Array.isArray(auctionData) && auctionData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {auctionData.map((auction: any) => (
                  <div key={auction.id} className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg hover:border-white/20 transition-all duration-200 flex flex-col">
                    {/* Card Header */}
                    <div className="px-5 py-3 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
                      <div className="space-y-1">
                        <div className={cn(
                          "text-sm font-bold",
                          auctionType === 'resource' 
                            ? (auction.type === 'BuyRice' ? "text-orange-400" : "text-yellow-400")
                            : "text-purple-400"
                        )}>
                          {auctionType === 'resource' 
                            ? (auction.type === 'BuyRice' ? '쌀 구매' : '쌀 판매') 
                            : auction.title}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
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
                            <span className="text-gray-500 text-xs uppercase font-bold">수량</span>
                            <span className="font-mono font-bold text-white">{auction.amount.toLocaleString()}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center p-2 bg-black/20 rounded">
                            <span className="text-gray-500 text-xs uppercase font-bold">대상</span>
                            <span className="font-bold text-white">{auction.target}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">시작가</span>
                          <span className="font-mono text-gray-400">{(auction.startBidAmount || 0).toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">종료일</span>
                          <span className="text-gray-400 text-xs">{new Date(auction.closeDate).toLocaleString('ko-KR')}</span>
                        </div>
                      </div>

                      {auction.highestBid && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <div className="text-xs text-gray-500 mb-1">현재 최고 입찰</div>
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-500 font-bold">{auction.highestBid.amount.toLocaleString()}</span>
                            <span className="text-xs text-gray-400">{auction.highestBid.generalName}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 bg-black/20 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleBid(auction)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700"
                        disabled={auction.finished}
                      >
                        {auction.finished ? '입찰 마감' : '입찰하기'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
                진행 중인 경매가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
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


