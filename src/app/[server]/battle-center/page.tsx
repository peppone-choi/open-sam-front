'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import GeneralBasicCard from '@/components/cards/GeneralBasicCard';
import GeneralSupplementCard from '@/components/cards/GeneralSupplementCard';
import { convertLog } from '@/utils/convertLog';

interface GeneralListItem {
  no: number;
  name: string;
  npc: number;
  officerLevel: number;
  officerLevelText?: string;
  turntime: string;
  recent_war?: string;
  warnum?: number;
  [key: string]: any;
}

type SortKey = 'recent_war' | 'warnum' | 'turntime' | 'name';

const sortTextMap: Record<SortKey, { label: string; getter: (gen: GeneralListItem) => any; isAsc: boolean; display: (gen: GeneralListItem) => string }> = {
  recent_war: {
    label: '최근 전투',
    getter: (gen) => gen.recent_war || '',
    isAsc: false,
    display: (gen) => `[${(gen.recent_war || '').slice(-5)}]`,
  },
  warnum: {
    label: '전투 횟수',
    getter: (gen) => gen.warnum || 0,
    isAsc: false,
    display: (gen) => `[${gen.warnum || 0}회]`,
  },
  turntime: {
    label: '최근 턴',
    getter: (gen) => gen.turntime || '',
    isAsc: false,
    display: () => '',
  },
  name: {
    label: '이름',
    getter: (gen) => `${gen.npc} ${gen.name}`,
    isAsc: true,
    display: () => '',
  },
};

function getNPCColor(npc: number): string {
  if (npc === 0) return '#f0f0f0'; // 유저
  if (npc === 1) return '#999999'; // 일반 NPC
  if (npc === 2) return '#00bfff'; // 특수 NPC
  if (npc === 3) return '#ffa500'; // 의적
  if (npc === 4) return '#ff69b4'; // 도적
  return '#cccccc';
}

interface GeneralLogs {
  generalHistory: Array<{ id: number; text: string }>;
  battleResult: Array<{ id: number; text: string }>;
  battleDetail: Array<{ id: number; text: string }>;
  generalAction: Array<{ id: number; text: string }>;
}

export default function BattleCenterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const initialGeneralID = searchParams?.get('generalID');

  const [loading, setLoading] = useState(true);
  const [generalList, setGeneralList] = useState<Map<number, GeneralListItem>>(new Map());
  const [targetGeneralID, setTargetGeneralID] = useState<number | undefined>(
    initialGeneralID ? Number(initialGeneralID) : undefined
  );
  const [orderBy, setOrderBy] = useState<SortKey>('turntime');
  const [generalLogs, setGeneralLogs] = useState<GeneralLogs | null>(null);
  const [nationInfo, setNationInfo] = useState<any>(null);
  const [env, setEnv] = useState<{ turnterm?: number; turntime?: string } | null>(null);
  const { showToast } = useToast();

  // 정렬된 장수 목록
  const orderedGeneralList = useMemo(() => {
    const list = Array.from(generalList.values());
    const { getter, isAsc } = sortTextMap[orderBy];
    
    list.sort((a, b) => {
      const aVal = getter(a);
      const bVal = getter(b);
      if (aVal === bVal) return 0;
      return isAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    
    return list;
  }, [generalList, orderBy]);

  // 역인덱스 (장수 ID -> 인덱스)
  const orderedInvIndex = useMemo(() => {
    const map = new Map<number, number>();
    orderedGeneralList.forEach((gen, idx) => {
      map.set(gen.no, idx);
    });
    return map;
  }, [orderedGeneralList]);

  // 선택된 장수 정보
  const targetGeneral = useMemo(() => {
    if (!targetGeneralID) return undefined;
    return generalList.get(targetGeneralID);
  }, [generalList, targetGeneralID]);

  // 장수 목록 로드
  const loadGeneralList = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, nationRes] = await Promise.all([
        SammoAPI.NationGeneralList({ serverID }),
        SammoAPI.NationGetNationInfo({ serverID }),
      ]);

      if (listRes.result && listRes.list) {
        const newMap = new Map<number, GeneralListItem>();
        listRes.list.forEach((gen: GeneralListItem) => {
          newMap.set(gen.no, gen);
        });
        setGeneralList(newMap);
        setEnv(listRes.env || null);

        // 권한 체크
        if (listRes.permission === 0) {
          showToast('감찰부 열람 권한이 부족합니다.', 'error');
        }

        // 초기 장수 선택
        if (!targetGeneralID && listRes.list.length > 0) {
          setTargetGeneralID(listRes.list[0].no);
        }
      }

      if (nationRes.result && nationRes.nation) {
        setNationInfo(nationRes.nation);
      }
    } catch (err) {
      console.error(err);
      showToast('장수 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [serverID, showToast, targetGeneralID]);

  // 장수 로그 로드
  const loadGeneralLogs = useCallback(async (generalID: number) => {
    const reqTypes = ['generalHistory', 'battleResult', 'battleDetail', 'generalAction'] as const;
    const typeMap: Record<string, 'history' | 'battle' | 'action' | 'personal'> = {
      generalHistory: 'history',
      battleResult: 'battle',
      battleDetail: 'battle',
      generalAction: 'action',
    };

    const logs: GeneralLogs = {
      generalHistory: [],
      battleResult: [],
      battleDetail: [],
      generalAction: [],
    };

    try {
      const results = await Promise.all(
        reqTypes.map(async (reqType) => {
          try {
            const res = await SammoAPI.NationGetGeneralLog({
              generalID,
              reqType: typeMap[reqType],
              serverID,
            });
            return { reqType, logs: res.logs || [] };
          } catch (e) {
            console.error(`Failed to load ${reqType}:`, e);
            return { reqType, logs: [] };
          }
        })
      );

      results.forEach(({ reqType, logs: logList }) => {
        logs[reqType] = logList
          .map((log) => ({ id: log.id, text: log.text }))
          .sort((a, b) => b.id - a.id);
      });

      setGeneralLogs(logs);
    } catch (err) {
      console.error(err);
      showToast('장수 기록을 불러오는데 실패했습니다.', 'error');
    }
  }, [serverID, showToast]);

  // 이전/다음 장수 이동
  const changeTargetByOffset = useCallback((offset: number) => {
    if (!targetGeneralID || orderedGeneralList.length === 0) return;

    const currIdx = orderedInvIndex.get(targetGeneralID);
    if (currIdx === undefined) return;

    let newIdx = currIdx + offset;
    const listLen = orderedGeneralList.length;
    while (newIdx < 0) newIdx += listLen;
    newIdx = newIdx % listLen;

    setTargetGeneralID(orderedGeneralList[newIdx].no);
  }, [targetGeneralID, orderedGeneralList, orderedInvIndex]);

  // 정렬 기준 변경 시 장수 선택 초기화
  const handleOrderChange = useCallback((newOrder: SortKey) => {
    setOrderBy(newOrder);
  }, []);

  // 초기 로드
  useEffect(() => {
    loadGeneralList();
  }, [loadGeneralList]);

  // 장수 선택 변경 시 로그 로드
  useEffect(() => {
    if (targetGeneralID) {
      loadGeneralLogs(targetGeneralID);
    } else {
      setGeneralLogs(null);
    }
  }, [targetGeneralID, loadGeneralLogs]);

  // 정렬 변경 시 첫 번째 장수 선택
  useEffect(() => {
    if (orderedGeneralList.length > 0 && !targetGeneralID) {
      setTargetGeneralID(orderedGeneralList[0].no);
    }
  }, [orderedGeneralList, targetGeneralID]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-4">
        <TopBackBar title="감 찰 부" reloadable onReload={loadGeneralList} />

        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : (
          <>
            {/* 장수 선택 컨트롤 */}
            <div className="flex items-stretch gap-0 bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => changeTargetByOffset(-1)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors flex-shrink-0"
              >
                ◀ 이전
              </button>
              
              <select
                value={orderBy}
                onChange={(e) => handleOrderChange(e.target.value as SortKey)}
                className="flex-[3] lg:flex-[4] px-3 py-2 bg-gray-800 border-x border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(sortTextMap).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              
              <select
                value={targetGeneralID || ''}
                onChange={(e) => setTargetGeneralID(Number(e.target.value))}
                className="flex-[5] lg:flex-[6] px-3 py-2 bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {orderedGeneralList.map((gen) => (
                  <option key={gen.no} value={gen.no} style={{ color: getNPCColor(gen.npc) }}>
                    {gen.officerLevel > 4 ? `*${gen.name}*` : gen.name}
                    ({(gen.turntime || '').slice(-5)})
                    {sortTextMap[orderBy].display(gen)}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={() => changeTargetByOffset(1)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors flex-shrink-0"
              >
                다음 ▶
              </button>
            </div>

            {/* 장수 정보 표시 */}
            {targetGeneral && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 장수 기본 정보 */}
                <div className="space-y-2">
                  <div className="bg-gray-800/80 px-4 py-2 text-center font-bold text-sky-400 border border-white/10 rounded-t-lg">
                    장수 정보
                  </div>
                  <GeneralBasicCard
                    general={{
                      ...targetGeneral,
                      officerLevelText: targetGeneral.officerLevelText || getOfficerLevelText(targetGeneral.officerLevel),
                    }}
                    nation={nationInfo}
                    turnTerm={env?.turnterm}
                  />
                  <GeneralSupplementCard general={targetGeneral} />
                </div>

                {/* 장수 열전 */}
                <div className="space-y-2">
                  <div className="bg-gray-800/80 px-4 py-2 text-center font-bold text-orange-400 border border-white/10 rounded-t-lg">
                    장수 열전
                  </div>
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                    {generalLogs?.generalHistory && generalLogs.generalHistory.length > 0 ? (
                      generalLogs.generalHistory.map((log) => (
                        <div
                          key={log.id}
                          className="text-sm text-gray-300 py-1 border-b border-white/5 last:border-b-0"
                          dangerouslySetInnerHTML={{ __html: convertLog(log.text) }}
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">기록이 없습니다.</div>
                    )}
                  </div>
                </div>

                {/* 전투 기록 */}
                <div className="space-y-2">
                  <div className="bg-gray-800/80 px-4 py-2 text-center font-bold text-orange-400 border border-white/10 rounded-t-lg">
                    전투 기록
                  </div>
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                    {generalLogs?.battleDetail && generalLogs.battleDetail.length > 0 ? (
                      generalLogs.battleDetail.map((log) => (
                        <div
                          key={log.id}
                          className="text-sm text-gray-300 py-1 border-b border-white/5 last:border-b-0"
                          dangerouslySetInnerHTML={{ __html: convertLog(log.text) }}
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">기록이 없습니다.</div>
                    )}
                  </div>
                </div>

                {/* 전투 결과 */}
                <div className="space-y-2">
                  <div className="bg-gray-800/80 px-4 py-2 text-center font-bold text-orange-400 border border-white/10 rounded-t-lg">
                    전투 결과
                  </div>
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                    {generalLogs?.battleResult && generalLogs.battleResult.length > 0 ? (
                      generalLogs.battleResult.map((log) => (
                        <div
                          key={log.id}
                          className="text-sm text-gray-300 py-1 border-b border-white/5 last:border-b-0"
                          dangerouslySetInnerHTML={{ __html: convertLog(log.text) }}
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">기록이 없습니다.</div>
                    )}
                  </div>
                </div>

                {/* 개인 기록 */}
                {generalLogs?.generalAction && generalLogs.generalAction.length > 0 && (
                  <div className="space-y-2 lg:col-span-2">
                    <div className="bg-gray-800/80 px-4 py-2 text-center font-bold text-orange-400 border border-white/10 rounded-t-lg">
                      개인 기록
                    </div>
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                      {generalLogs.generalAction.map((log) => (
                        <div
                          key={log.id}
                          className="text-sm text-gray-300 py-1 border-b border-white/5 last:border-b-0"
                          dangerouslySetInnerHTML={{ __html: convertLog(log.text) }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!targetGeneral && orderedGeneralList.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
                감찰할 장수가 없습니다.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function getOfficerLevelText(level: number): string {
  const texts: Record<number, string> = {
    12: '군주',
    11: '참모',
    10: '장관',
    9: '장군',
    8: '방관',
    7: '종사관',
    6: '종사관',
    5: '장수',
    4: '종군',
    3: '군의',
    2: '연의',
    1: '일반',
  };
  return texts[level] || '일반';
}
