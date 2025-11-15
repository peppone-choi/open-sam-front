'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import ChiefReservedCommand from '@/components/game/ChiefReservedCommand';
import styles from './page.module.css';

export default function ChiefPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [chiefData, setChiefData] = useState<any>(null);

  useEffect(() => {
    loadChiefData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverID]);

  async function loadChiefData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetChiefCenter({ serverID });

      if (result.result) {
        setChiefData(result.center || null);
      } else {
        const msg = result.reason || '제왕 권한이 없거나 국가에 소속되어 있지 않습니다.';
        alert(msg);
        // 수뇌가 아니면 사령부에 머무르지 않고 게임 화면으로 이동
        if (serverID) {
          window.location.href = `/${serverID}/game`;
        } else {
          window.location.href = '/entrance';
        }
      }
    } catch (err) {
      console.error(err);
      alert('사령부 정보를 불러오는데 실패했습니다.');
      if (serverID) {
        window.location.href = `/${serverID}/game`;
      } else {
        window.location.href = '/entrance';
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="사 령 부" reloadable onReload={loadChiefData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.chiefSubTable}>
            {chiefData && (
              <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                <div>
                  국가: {chiefData.nation?.name ?? '알 수 없음'} (Lv. {chiefData.nation?.level ?? 0})
                </div>
                <div>
                  제왕: {chiefData.chief?.name ?? '알 수 없음'} (관직 {chiefData.chief?.officerLevel ?? 0}급)
                </div>
                <div>
                  권한: 금 {chiefData.powers?.gold ?? 0}, 쌀 {chiefData.powers?.rice ?? 0}, 기술 {chiefData.powers?.tech ?? 0}
                </div>
              </div>
            )}
            <ChiefReservedCommand serverID={serverID} />
          </div>
        </div>
      )}
    </div>
  );
}





