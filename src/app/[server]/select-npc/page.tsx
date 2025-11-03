'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function SelectNPCPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [npcList, setNpcList] = useState<any[]>([]);
  const [selectedNPC, setSelectedNPC] = useState<number | null>(null);

  useEffect(() => {
    loadNPCList();
  }, [serverID]);

  async function loadNPCList() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setNpcList([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect() {
    if (!selectedNPC) return;
    try {
      // API 호출 로직 필요
      alert('NPC 선택이 완료되었습니다.');
      window.location.href = `/${serverID}/game`;
    } catch (err) {
      console.error(err);
      alert('NPC 선택에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="NPC 선택" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.npcList}>
            {npcList.map((npc) => (
              <div
                key={npc.no}
                className={`${styles.npcItem} ${selectedNPC === npc.no ? styles.selected : ''}`}
                onClick={() => setSelectedNPC(npc.no)}
              >
                <div className={styles.npcIcon}>
                  <img src={`/images/gen_icon/${npc.imgsvr}/${npc.picture}.jpg`} alt={npc.name} />
                </div>
                <div className={styles.npcName}>{npc.name}</div>
                <div className={styles.npcStats}>
                  통:{npc.leadership} 무:{npc.strength} 지:{npc.intel}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSelect}
            disabled={!selectedNPC}
            className={styles.selectButton}
          >
            선택하기
          </button>
        </div>
      )}
    </div>
  );
}
