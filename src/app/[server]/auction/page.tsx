'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AuctionPage() {
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          onClick={() => router.push(`/${serverID}/auction`)}
          className={`${styles.typeBtn} ${auctionType === 'resource' ? styles.active : ''}`}
        >
          금/쌀 경매장
        </button>
        <button
          type="button"
          onClick={() => router.push(`/${serverID}/auction?type=unique`)}
          className={`${styles.typeBtn} ${auctionType === 'unique' ? styles.active : ''}`}
        >
          유니크 경매장
        </button>
        <button type="button" onClick={() => window.close()} className={styles.closeBtn}>
          닫기
        </button>
        <button type="button" onClick={loadAuctionData} className={styles.reloadBtn}>
          갱신
        </button>
      </div>

      <div className={styles.title}>경매장</div>

      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.auctionContent}>
          {auctionType === 'resource' ? (
            <div className={styles.resourceAuction}>
              {auctionData && Array.isArray(auctionData) && auctionData.length > 0 ? (
                <div className={styles.auctionList}>
                  {auctionData.map((auction: any) => (
                    <div key={auction.id} className={styles.auctionItem}>
                      <div className={styles.auctionHeader}>
                        <div className={styles.auctionType}>{auction.type === 'BuyRice' ? '쌀 구매 경매' : '쌀 판매 경매'}</div>
                        <div className={styles.auctionHost}>{auction.hostName}</div>
                      </div>
                      <div className={styles.auctionInfo}>
                        <div>수량: {auction.amount.toLocaleString()}</div>
                        <div>시작가: {auction.startBidAmount.toLocaleString()}</div>
                        {auction.highestBid && (
                          <div>최고입찰: {auction.highestBid.amount.toLocaleString()} ({auction.highestBid.generalName})</div>
                        )}
                        <div>종료: {new Date(auction.closeDate).toLocaleString('ko-KR')}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const amount = prompt('입찰 금액을 입력하세요:');
                          if (amount) {
                            // TODO: 입찰 API 호출
                            alert('입찰 기능은 향후 구현 예정입니다.');
                          }
                        }}
                        className={styles.bidBtn}
                      >
                        입찰
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="center" style={{ padding: '2rem' }}>진행 중인 경매가 없습니다.</div>
              )}
            </div>
          ) : (
            <div className={styles.uniqueAuction}>
              {auctionData && Array.isArray(auctionData) && auctionData.length > 0 ? (
                <div className={styles.auctionList}>
                  {auctionData.map((auction: any) => (
                    <div key={auction.id} className={styles.auctionItem}>
                      <div className={styles.auctionHeader}>
                        <div className={styles.auctionTitle}>{auction.title}</div>
                        <div className={styles.auctionHost}>{auction.hostName}</div>
                      </div>
                      <div className={styles.auctionInfo}>
                        <div>대상: {auction.target}</div>
                        {auction.highestBid && (
                          <div>
                            최고입찰: {auction.highestBid.amount.toLocaleString()} ({auction.highestBid.generalName})
                          </div>
                        )}
                        <div>종료: {new Date(auction.closeDate).toLocaleString('ko-KR')}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const amount = prompt('입찰 금액을 입력하세요:');
                          if (amount) {
                            // TODO: 입찰 API 호출
                            alert('입찰 기능은 향후 구현 예정입니다.');
                          }
                        }}
                        className={styles.bidBtn}
                        disabled={auction.finished}
                      >
                        {auction.finished ? '종료' : '입찰'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="center" style={{ padding: '2rem' }}>진행 중인 경매가 없습니다.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

