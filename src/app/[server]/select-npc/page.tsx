'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import InfoSummaryCard from '@/components/info/InfoSummaryCard';
import HistoryTimeline from '@/components/info/HistoryTimeline';
import { buildNpcSummaryCards, buildTimelineFromSources } from '@/lib/utils/game/entryFormatter';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

export default function SelectNPCPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [npcList, setNpcList] = useState<any[]>([]);
  const [nations, setNations] = useState<Record<number, { name: string; color?: string; scoutmsg?: string }>>({});
  const [selectedNPC, setSelectedNPC] = useState<number | null>(null);
  const [keepList, setKeepList] = useState<number[]>([]);
  const [pickMoreSeconds, setPickMoreSeconds] = useState<number>(0);

  const activeNationCount = useMemo(() => {
    const keys = Object.keys(nations || {});
    return Math.max(keys.filter((key) => Number(key) !== 0).length, 0);
  }, [nations]);

  const npcSummaryCards = useMemo(
    () =>
      buildNpcSummaryCards({
        npcCount: npcList.length,
        keepCount: keepList.length,
        pickMoreSeconds,
        nationCount: activeNationCount,
      }),
    [npcList.length, keepList.length, pickMoreSeconds, activeNationCount],
  );

  const npcTimelineEvents = useMemo(
    () =>
      buildTimelineFromSources([
        {
          id: 'pool',
          order: 1,
          category: 'system',
          title: '후보 풀 로드',
          description: `${npcList.length}명 후보 확보`,
        },
        {
          id: 'keep',
          order: 2,
          category: 'nation',
          title: keepList.length ? `찜 ${keepList.length}명 유지` : '찜 목록 비어 있음',
          description: keepList.length ? '다시 뽑아도 해당 후보를 유지합니다.' : '찜 버튼으로 원하는 후보를 잠그세요.',
        },
        {
          id: 'refresh',
          order: 3,
          category: 'action',
          title: pickMoreSeconds > 0 ? '다시 뽑기 대기 중' : '다시 뽑기 가능',
          description: pickMoreSeconds > 0 ? `${pickMoreSeconds}초 후 재시도` : '지금 새 후보를 뽑을 수 있습니다.',
        },
      ]),
    [npcList.length, keepList.length, pickMoreSeconds],
  );

  useEffect(() => {
    loadNations();
    loadNPCList(false);
  }, [serverID]);
  
  async function loadNations() {
    try {
      // Use raw request if GetJoinNations is not in types
      const result: any = await SammoAPI['request']('/api/join/get-nations', {
          method: 'POST',
          body: JSON.stringify({ serverID })
      });

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
      // Fallback
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
      // Use raw request as GetSelectNpcToken might be missing
      const result: any = await SammoAPI['request']('/api/general/get-select-npc-token', {
        method: 'POST',
        body: JSON.stringify({
            session_id: serverID,
            refresh: refresh,
            keep: refresh ? keepList : undefined,
        })
      });

      if (result.result && (result as any).pick) {
        const npcArray = Object.values((result as any).pick);
        setNpcList(npcArray);
        setPickMoreSeconds((result as any).pickMoreSeconds || 0);
      } else {
        if ((result as any).reason?.includes('이미 장수가 생성')) {
          router.push(`/${serverID}/game`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    if (pickMoreSeconds > 0) {
      showToast(`${pickMoreSeconds}초 후에 다시 뽑을 수 있습니다.`, 'info');
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
      showToast('NPC를 선택해주세요.', 'error');
      return;
    }

    try {
      const result = await SammoAPI.SelectNPC({
        pick: selectedNPC,
        session_id: serverID,
      });

      if (result.result) {
        showToast(`${result.general_name || '장수'} 선택이 완료되었습니다.`, 'success');
        router.push(`/${serverID}/game`);
      } else {
        showToast(result.reason || 'NPC 선택에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'NPC 선택에 실패했습니다.', 'error');
    }
  }

  function getNationName(nationId: number): string {
    if (nationId === 0) return '재야';
    return nations[nationId]?.name || '이름 미확인 국가';
  }

  function getTextColor(bgColor: string): string {
    if (!bgColor) return '#ffffff';
    let hex = bgColor.replace('#', '');
    if(hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 p-4 font-sans text-gray-100 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute -top-32 right-1/4 h-80 w-80 rounded-full bg-pink-500/15 blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <TopBackBar title="오리지널 캐릭터 플레이" backUrl="/entrance" />
        {/* Scout Messages */}
        {Object.keys(nations).length > 0 && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-gray-100">
                    <th className="py-3 px-4 text-left w-[130px]">국가</th>
                    <th className="py-3 px-4 text-left">임관 권유문</th>
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
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="py-3 px-4 font-bold text-center">
                            {nationData.name}
                          </td>
                          <td className="py-3 px-4">
                            <div 
                              className="max-h-[200px] overflow-hidden whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: nationData.scoutmsg || '-' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {!loading && npcSummaryCards.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {npcSummaryCards.map((card) => (
              <InfoSummaryCard key={card.label} dense {...card} />
            ))}
          </div>
        )}

        {!loading && (
          <HistoryTimeline
            title="NPC 선택 절차"
            subtitle="후보 갱신 · 찜 관리 · 다시 뽑기"
            events={npcTimelineEvents}
            variant="compact"
            highlightCategory={keepList.length ? 'nation' : 'system'}
          />
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg">
              <p className="text-sm text-gray-400">
                각 시나리오의 오리지널 캐릭터를 플레이할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={pickMoreSeconds > 0}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                  pickMoreSeconds > 0 
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow hover:shadow-blue-500/30"
                )}
              >
                {pickMoreSeconds > 0 ? `다시 뽑기 (${pickMoreSeconds}초)` : '다시 뽑기'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {npcList.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-400">
                   사용 가능한 NPC가 없습니다.
                </div>
              ) : (
                npcList.map((npc) => (
                  <div
                    key={npc.no}
                    className={cn(
                      "relative cursor-pointer group transition-all duration-200",
                      "bg-gray-900/50 backdrop-blur-sm border rounded-xl overflow-hidden shadow-lg",
                      selectedNPC === npc.no 
                        ? "border-blue-500 ring-2 ring-blue-500/50 transform -translate-y-1" 
                        : "border-white/10 hover:border-white/30 hover:-translate-y-0.5"
                    )}
                    onClick={() => setSelectedNPC(npc.no)}
                  >
                    <div className="flex p-4 gap-4">
                      <div className="relative w-[78px] h-[105px] flex-shrink-0 bg-black/40 rounded overflow-hidden border border-white/5">
                        <img
                          src={npc.picture ? `/images/gen_icon/${npc.imgsvr || 0}/${npc.picture}.jpg` : '/default_portrait.png'}
                          alt={npc.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default_portrait.png';
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                           <div className="font-bold text-white truncate text-lg">{npc.name}</div>
                           <div className="text-xs text-blue-400 truncate">{getNationName(npc.nation)}</div>
                        </div>
                        
                        <div className="text-xs text-gray-400 space-y-1">
                           <div className="flex justify-between">
                              <span>통솔 <span className="text-white font-mono">{npc.leadership}</span></span>
                              <span>무력 <span className="text-white font-mono">{npc.strength}</span></span>
                           </div>
                           <div className="flex justify-between">
                              <span>지력 <span className="text-white font-mono">{npc.intel}</span></span>
                              <span>정치 <span className="text-white font-mono">{npc.politics}</span></span>
                           </div>
                        </div>

                        {npc.personal !== 'None' && (
                           <div className="text-xs text-yellow-500 truncate">특기: {npc.personal}</div>
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <button
                        type="button"
                        className={cn(
                          "w-full py-1.5 rounded text-xs font-medium transition-colors border",
                          keepList.includes(npc.no)
                            ? "bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleKeep(npc.no);
                        }}
                      >
                        {keepList.includes(npc.no) ? `유지 중 ${npc.keepCnt !== undefined ? `(${npc.keepCnt})` : ''}` : '유지'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="sticky bottom-6 flex justify-center z-20">
              <button
                type="button"
                onClick={handleSelect}
                disabled={!selectedNPC}
                className={cn(
                  "px-8 py-3 rounded-full font-bold text-lg shadow-xl transition-all duration-300 transform",
                  selectedNPC 
                    ? "bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 hover:shadow-blue-500/30" 
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                )}
              >
                {selectedNPC ? '이 캐릭터로 시작하기' : '캐릭터를 선택해주세요'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
