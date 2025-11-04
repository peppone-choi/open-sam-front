'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function NPCControlPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [npcData, setNpcData] = useState<any>(null);

  useEffect(() => {
    loadNPCData();
  }, [serverID]);

  async function loadNPCData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetNPCControl();
      if (result.result) {
        setNpcData(result.npcControl);
      }
    } catch (err) {
      console.error(err);
      alert('NPC 정책 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const result = await SammoAPI.SetNPCControl({
        settings: npcData,
      });

      if (result.result) {
        alert('NPC 정책이 저장되었습니다.');
      } else {
        alert(result.reason || '저장에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('저장에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="NPC 정책" reloadable onReload={loadNPCData} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.section}>
            <h2>NPC 정책 설정</h2>
            <div className={styles.settingsForm}>
              {/* NPC 정책 설정 폼 */}
            </div>
            <button type="button" onClick={handleSave} className={styles.saveButton}>
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




