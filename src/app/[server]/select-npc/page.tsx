'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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

  const router = useRouter();

  async function loadNPCList() {
    try {
      setLoading(true);
      // NPC 목록은 일반 장수 목록에서 필터링하거나 별도 API 필요
      const result = await SammoAPI.GetSelectPool();
      if (result.result) {
        // NPC만 필터링 (실제로는 별도 API가 필요할 수 있음)
        setNpcList(result.pool?.filter((g: any) => g.isNPC) || []);
      }
    } catch (err) {
      console.error(err);
      alert('NPC 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect() {
    if (!selectedNPC) {
      alert('NPC를 선택해주세요.');
      return;
    }
    
    try {
      const result = await SammoAPI.SelectNPC({
        npcID: selectedNPC,
      });

      if (result.result) {
        alert('NPC 선택이 완료되었습니다.');
        router.push(`/${serverID}/game`);
      } else {
        alert(result.reason || 'NPC 선택에 실패했습니다.');
      }
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
                  <img 
                    src={`/images/gen_icon/${npc.imgsvr}/${npc.picture}.jpg`} 
                    alt={npc.name}
                    style={{ aspectRatio: '26 / 35', width: '78px', height: '105px', objectFit: 'cover' }}
                  />
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
