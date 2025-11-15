'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function SelectNPCPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [npcList, setNpcList] = useState<any[]>([]);
  const [nations, setNations] = useState<Record<number, { name: string; color?: string; scoutmsg?: string }>>({});
  const [selectedNPC, setSelectedNPC] = useState<number | null>(null);
  const [keepList, setKeepList] = useState<number[]>([]);
  const [pickMoreSeconds, setPickMoreSeconds] = useState<number>(0);

  useEffect(() => {
    loadNations();
    loadNPCList(false);
  }, [serverID]);
  
  async function loadNations() {
    try {
      const result = await SammoAPI.GetJoinNations({ serverID });
      if (result.result && result.nations) {
        const nationMap: Record<number, { name: string; color?: string; scoutmsg?: string }> = { 
          0: { name: '재야', color: '#666666' } 
        };
        result.nations.forEach((n: any) => {
          if (n.nation !== 0) {
            nationMap[n.nation] = {
              name: n.name,
              color: n.color,
              scoutmsg: n.scoutmsg
            };
          }
        });
        setNations(nationMap);
      }
    } catch (err) {
      console.error('국가 목록 로드 실패:', err);
      // Fallback to simple nation list
      try {
        const fallbackResult = await SammoAPI.GlobalGetNationList({ session_id: serverID });
        if (fallbackResult.result && fallbackResult.nations) {
          const nationMap: Record<number, { name: string; color?: string; scoutmsg?: string }> = { 
            0: { name: '재야', color: '#666666' } 
          };
          fallbackResult.nations.forEach((n: any) => {
            nationMap[n.nation || n.id] = { name: n.name };
          });
          setNations(nationMap);
        }
      } catch (fallbackErr) {
        console.error('Fallback 국가 목록 로드 실패:', fallbackErr);
      }
    }
  }

  useEffect(() => {
    if (pickMoreSeconds > 0) {
      const timer = setInterval(() => {
        setPickMoreSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [pickMoreSeconds]);

  async function loadNPCList(refresh: boolean) {
    try {
      setLoading(true);
      const result = await SammoAPI.GetSelectNpcToken({
        session_id: serverID,
        refresh: refresh,
        keep: refresh ? keepList : undefined,
      });

      if (result.result && (result as any).pick) {
        const npcArray = Object.values((result as any).pick);
        setNpcList(npcArray);
        setPickMoreSeconds((result as any).pickMoreSeconds || 0);
      } else {
        alert((result as any).reason || 'NPC 목록을 불러오는데 실패했습니다.');
        if ((result as any).reason?.includes('이미 장수가 생성')) {
          router.push(`/${serverID}/game`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('NPC 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    if (pickMoreSeconds > 0) {
      alert(`${pickMoreSeconds}초 후에 다시 뽑을 수 있습니다.`);
      return;
    }
    await loadNPCList(true);
  }

  function handleToggleKeep(npcNo: number) {
    setKeepList((prev) =>
      prev.includes(npcNo) ? prev.filter((n) => n !== npcNo) : [...prev, npcNo]
    );
  }

  async function handleSelect() {
    if (!selectedNPC) {
      alert('NPC를 선택해주세요.');
      return;
    }

    try {
      const result = await SammoAPI.SelectNPC({
        pick: selectedNPC,
        session_id: serverID,
      });

      if (result.result) {
        alert(`${result.general_name || '장수'} 선택이 완료되었습니다.`);
        router.push(`/${serverID}/game`);
      } else {
        alert(result.reason || 'NPC 선택에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('NPC 선택에 실패했습니다.');
    }
  }

  function getNationName(nationId: number): string {
    return nations[nationId]?.name || (nationId === 0 ? '재야' : `국가${nationId}`);
  }

  // 배경색에 따라 텍스트 색상 결정 (밝은 배경 -> 검은색, 어두운 배경 -> 흰색)
  function getTextColor(bgColor: string): string {
    if (!bgColor) return '#ffffff';
    
    // #RRGGBB 형식을 RGB로 변환
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 밝기 계산 (YIQ 공식)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 밝기가 128 이상이면 검은색, 아니면 흰색
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="오리지널 캐릭터 플레이" backUrl="/entrance" />
      
      {/* 임관 권유문 테이블 */}
      {Object.keys(nations).length > 0 && (
        <table className={styles.scoutTable}>
          <thead>
            <tr className="bg2">
              <th style={{ width: '130px' }}>국가</th>
              <th>임관 권유문</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(nations)
              .filter(([id]) => Number(id) !== 0)
              .map(([nationId, nationData]) => {
                const bgColor = nationData.color || '#000000';
                const textColor = getTextColor(bgColor);
                return (
                  <tr 
                    key={nationId}
                    style={{ 
                      backgroundColor: bgColor,
                      color: textColor
                    }}
                  >
                    <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                      {nationData.name}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <div 
                        style={{ maxHeight: '200px', overflow: 'hidden' }}
                        dangerouslySetInnerHTML={{ __html: nationData.scoutmsg || '-' }}
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}
      
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>
          로딩 중...
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.header}>
            <p className={styles.description}>
              각 시나리오의 오리지널 캐릭터를 플레이할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className={styles.refreshButton}
              disabled={pickMoreSeconds > 0}
            >
              {pickMoreSeconds > 0
                ? `다시 뽑기 (${pickMoreSeconds}초)`
                : '다시 뽑기'}
            </button>
          </div>

          <div className={styles.npcList}>
            {npcList.length === 0 ? (
              <div className={styles.empty}>사용 가능한 NPC가 없습니다.</div>
            ) : (
              npcList.map((npc) => (
                <div
                  key={npc.no}
                  className={`${styles.npcItem} ${
                    selectedNPC === npc.no ? styles.selected : ''
                  }`}
                  onClick={() => setSelectedNPC(npc.no)}
                >
                  <div className={styles.npcIcon}>
                    <img
                      src={npc.picture ? `/images/gen_icon/${npc.imgsvr || 0}/${npc.picture}.jpg` : '/default_portrait.png'}
                      alt={npc.name}
                      style={{
                        aspectRatio: '26 / 35',
                        width: '78px',
                        height: '105px',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default_portrait.png';
                      }}
                    />
                  </div>
                  <div className={styles.npcInfo}>
                    <div className={styles.npcName}>{npc.name}</div>
                    <div className={styles.npcStats}>
                      통솔: {npc.leadership} / 무력: {npc.strength} / 지력:{' '}
                      {npc.intel}
                    </div>
                    <div className={styles.npcNation}>
                      소속: {getNationName(npc.nation)}
                    </div>
                    <div className={styles.npcSpecial}>
                      {npc.personal !== 'None' && `특기: ${npc.personal}`}
                    </div>
                  </div>
                  <div className={styles.npcActions}>
                    <button
                      type="button"
                      className={`${styles.keepButton} ${
                        keepList.includes(npc.no) ? styles.kept : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleKeep(npc.no);
                      }}
                    >
                      {keepList.includes(npc.no) ? '유지 중' : '유지'}
                      {npc.keepCnt !== undefined && ` (${npc.keepCnt})`}
                    </button>
                  </div>
                </div>
              ))
            )}
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
