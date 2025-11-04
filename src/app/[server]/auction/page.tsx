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
        const result = await SammoAPI.AuctionGetUniqueItemAuctionList();
        if (result.result) {
          setAuctionData(result.auctions);
        }
      } else {
        const result = await SammoAPI.GetActiveResourceAuctionList();
        if (result.result) {
          setAuctionData(result.auctions);
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
              {/* 금/쌀 경매장 내용 */}
            </div>
          ) : (
            <div className={styles.uniqueAuction}>
              {/* 유니크 경매장 내용 */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

