'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

interface BettingItem {
  id: number;
  type: string;
  title?: string;
  description?: string;
  openYearMonth?: number;
  closeYearMonth?: number;
  finished?: boolean;
  candidates?: Array<{ id: number; name: string; value?: any }>;
  totalAmount?: number;
}

export default function NationBettingPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [bettingList, setBettingList] = useState<BettingItem[]>([]);
  const [selectedBetting, setSelectedBetting] = useState<BettingItem | null>(null);
  const [bettingDetail, setBettingDetail] = useState<any>(null);

  useEffect(() => {
    loadBettingData();
  }, [serverID]);

  async function loadBettingData() {
    try {
      setLoading(true);
      const result = await SammoAPI.NationGetBetting();
      if (result.result && result.bettings) {
        // bettingList가 객체인 경우 배열로 변환
        const bettingArray = Array.isArray(result.bettings)
          ? result.bettings
          : Object.values(result.bettings || {});
        // 국가 관련 베팅만 필터링 (type이 'nation'이거나 국가 관련)
        const nationBettings = bettingArray.filter((betting: any) => 
          betting.type === 'nation' || betting.type?.includes('nation')
        );
        setBettingList(nationBettings);
      }
    } catch (err) {
      console.error(err);
      alert('국가 베팅 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function loadBettingDetail(bettingId: number) {
    try {
      const result = await SammoAPI.GetBettingDetail({ betting_id: bettingId });
      if (result.result && result.bettingDetail) {
        setBettingDetail(result);
      }
    } catch (err) {
      console.error(err);
      // 베팅 상세 정보가 없어도 계속 진행
      setBettingDetail(null);
    }
  }

  function handleBettingClick(betting: BettingItem) {
    setSelectedBetting(betting);
    loadBettingDetail(betting.id);
  }

  function formatYearMonth(yearMonth?: number): string {
    if (!yearMonth) return '-';
    const year = Math.floor((yearMonth - 1) / 12);
    const month = ((yearMonth - 1) % 12) + 1;
    return `${year}년 ${month}월`;
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="천통국 베팅" reloadable onReload={loadBettingData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.bettingList}>
            {bettingList.length === 0 ? (
              <div className="center" style={{ padding: '2rem' }}>진행 중인 국가 베팅이 없습니다.</div>
            ) : (
              bettingList.map((betting) => (
                <div
                  key={betting.id}
                  className={`${styles.bettingItem} ${selectedBetting?.id === betting.id ? styles.selected : ''}`}
                  onClick={() => handleBettingClick(betting)}
                >
                  <div className={styles.bettingHeader}>
                    <div className={styles.bettingTitle}>{betting.title || `베팅 #${betting.id}`}</div>
                    <div className={styles.bettingStatus}>
                      {betting.finished ? '종료' : '진행중'}
                    </div>
                  </div>
                  {betting.description && (
                    <div className={styles.bettingDescription}>{betting.description}</div>
                  )}
                  <div className={styles.bettingInfo}>
                    <div>개시: {formatYearMonth(betting.openYearMonth)}</div>
                    <div>마감: {formatYearMonth(betting.closeYearMonth)}</div>
                    {betting.totalAmount !== undefined && (
                      <div>총 베팅액: {betting.totalAmount.toLocaleString()}원</div>
                    )}
                  </div>
                  {betting.candidates && betting.candidates.length > 0 && (
                    <div className={styles.candidates}>
                      <div className={styles.candidatesLabel}>후보:</div>
                      <div className={styles.candidatesList}>
                        {betting.candidates.map((candidate) => (
                          <div key={candidate.id} className={styles.candidateItem}>
                            {candidate.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {selectedBetting && bettingDetail && (
            <div className={styles.bettingDetail}>
              <h3>베팅 상세</h3>
              <div className={styles.detailContent}>
                {/* 베팅 상세 정보 및 베팅 기능은 추후 구현 */}
                <p>베팅 상세 정보 로딩 완료</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




