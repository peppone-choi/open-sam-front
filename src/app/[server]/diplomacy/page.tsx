'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

interface Letter {
  no: number;
  fromNation: string;
  toNation: string;
  brief: string;
  detail: string;
  date: string;
  status: string;
}

interface NationInfo {
  nation: number;
  name: string;
  color: string;
  [key: string]: any;
}

interface DiplomacyData {
  nations: NationInfo[];
  conflict: Array<[number, Record<number, number>]>;
  diplomacyList: Record<number, Record<number, number>>;
  myNationID: number;
}

// 외교 상태 타입
type DiplomacyState = 0 | 1 | 2 | 7; // 0: 교전, 1: 선포, 2: 통상, 7: 불가침

// 상태별 표시 (내 국가 관련)
const informativeStateCharMap: Record<DiplomacyState, React.ReactNode> = {
  0: <span className="text-red-500">★</span>,
  1: <span className="text-pink-500">▲</span>,
  2: <span>ㆍ</span>,
  7: <span className="text-green-500">@</span>,
};

// 상태별 표시 (일반)
const neutralStateCharMap: Record<DiplomacyState, React.ReactNode> = {
  0: <span className="text-red-500">★</span>,
  1: <span className="text-pink-500">▲</span>,
  2: <span></span>,
  7: <span className="text-red-500">에러</span>,
};

// 밝은 색상인지 체크
function isBrightColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export default function DiplomacyPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [letters, setLetters] = useState<Letter[]>([]);
  const [nations, setNations] = useState<Array<[number, string, string, number]>>([]);
  const [loading, setLoading] = useState(true);
  const [showNewLetter, setShowNewLetter] = useState(false);
  const [newLetter, setNewLetter] = useState({
    prevNo: '',
    destNation: '',
    brief: '',
    detail: '',
  });
  
  // 외교 현황 데이터
  const [diplomacyData, setDiplomacyData] = useState<DiplomacyData | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'letters'>('matrix');

  useEffect(() => {
    loadDiplomacyData();
    loadLetters();
    loadNations();
  }, [serverID]);

  // 외교 매트릭스 데이터 로드
  async function loadDiplomacyData() {
    try {
      const result = await SammoAPI.GlobalGetDiplomacy({ serverID });
      if (result.result && result.nations) {
        setDiplomacyData({
          nations: result.nations,
          conflict: result.conflict || [],
          diplomacyList: result.diplomacyList || {},
          myNationID: result.myNationID || 0,
        });
      }
    } catch (err) {
      console.error('Failed to load diplomacy data:', err);
    }
  }

  async function loadNations() {
    try {
      const result = await SammoAPI.GlobalGetNationList({ session_id: serverID });

      if (!result.result) {
        setNations([]);
        return;
      }

      if (Array.isArray(result.nationList)) {
        setNations(result.nationList);
      } else if (Array.isArray(result.nations)) {
        const list = result.nations.map((n: any): [number, string, string, number] => [
          n.nation ?? n.id,
          n.name,
          n.color ?? '#000000',
          0,
        ]);
        setNations(list);
      } else {
        setNations([]);
      }
    } catch (err) {
      console.error(err);
      setNations([]);
    }
  }

  async function loadLetters() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetDiplomacyLetter({ session_id: serverID });
      if (result.success && result.letters) {
        setLetters(result.letters);
        if (result.letters.length === 0) {
          setShowNewLetter(true);
        }
      } else {
        setLetters([]);
        setShowNewLetter(true);
      }
    } catch (err) {
      console.error(err);
      showToast('외교문서를 불러오는데 실패했습니다.', 'error');
      setLetters([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendLetter() {
    if (!newLetter.destNation || !newLetter.brief) {
      showToast('대상 국가와 내용을 입력해주세요.', 'warning');
      return;
    }

    try {
      const result = await SammoAPI.SendDiplomacyLetter({
        serverID,
        session_id: serverID,
        prevNo: newLetter.prevNo ? Number(newLetter.prevNo) : undefined,
        destNationID: Number(newLetter.destNation),
        brief: newLetter.brief,
        detail: newLetter.detail,
      });

      if (result.success && result.result) {
        setNewLetter({ prevNo: '', destNation: '', brief: '', detail: '' });
        setShowNewLetter(false);
        await loadLetters();
      } else {
        showToast(result.reason || result.message || '외교문서 전송에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('외교문서 전송에 실패했습니다.', 'error');
    }
  }

  // 국가 맵 생성
  const nationMap = useMemo(() => {
    if (!diplomacyData) return new Map<number, NationInfo>();
    const map = new Map<number, NationInfo>();
    diplomacyData.nations.forEach((nation) => {
      map.set(nation.nation, nation);
    });
    return map;
  }, [diplomacyData]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <TopBackBar title="외 교 부" reloadable onReload={() => { loadDiplomacyData(); loadLetters(); }} />

        {/* 탭 메뉴 */}
        <div className="flex gap-2 bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-bold transition-colors',
              activeTab === 'matrix'
                ? 'bg-blue-600 text-white'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            외교 현황
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('letters')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-bold transition-colors',
              activeTab === 'letters'
                ? 'bg-blue-600 text-white'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            외교 문서함
          </button>
        </div>

        {/* 외교 현황 탭 */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            {/* 외교 매트릭스 테이블 */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
              <div className="bg-blue-600 px-4 py-3 text-center font-bold text-white">
                외교 현황
              </div>
              
              {diplomacyData && diplomacyData.nations.length > 0 ? (
                <div className="overflow-x-auto p-4">
                  <table className="mx-auto min-w-[400px] border-collapse">
                    <thead>
                      <tr>
                        <th className="w-24"></th>
                        {diplomacyData.nations.map((nation) => (
                          <th
                            key={nation.nation}
                            className="px-0 py-2 text-xs font-normal min-w-[24px] max-w-[36px]"
                            style={{
                              writingMode: 'vertical-rl',
                              textOrientation: 'mixed',
                              color: isBrightColor(nation.color) ? '#000' : '#fff',
                              backgroundColor: nation.color,
                            }}
                          >
                            {nation.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {diplomacyData.nations.map((me) => (
                        <tr key={me.nation}>
                          <th
                            className="text-right px-2 py-1 text-xs font-normal min-w-[80px]"
                            style={{
                              color: isBrightColor(me.color) ? '#000' : '#fff',
                              backgroundColor: me.color,
                            }}
                          >
                            {me.name}
                          </th>
                          {diplomacyData.nations.map((you) => {
                            const state = diplomacyData.diplomacyList[me.nation]?.[you.nation] as DiplomacyState;
                            const isMyRelation = me.nation === diplomacyData.myNationID || you.nation === diplomacyData.myNationID;
                            
                            if (me.nation === you.nation) {
                              return (
                                <td
                                  key={you.nation}
                                  className="text-center border-l border-t border-gray-600 w-6 h-6"
                                >
                                  ＼
                                </td>
                              );
                            }
                            
                            return (
                              <td
                                key={you.nation}
                                className={cn(
                                  'text-center border-l border-t border-gray-600 w-6 h-6',
                                  isMyRelation && 'bg-red-900/50'
                                )}
                              >
                                {isMyRelation
                                  ? informativeStateCharMap[state] || ''
                                  : neutralStateCharMap[state] || ''}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td
                          colSpan={diplomacyData.nations.length + 1}
                          className="text-center py-3 text-xs text-gray-400"
                        >
                          불가침 : <span className="text-green-500">@</span>, 통상 : ㆍ, 선포 : <span className="text-pink-500">▲</span>, 교전 : <span className="text-red-500">★</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  외교 현황 데이터를 불러오는 중...
                </div>
              )}
            </div>

            {/* 분쟁 현황 */}
            {diplomacyData && diplomacyData.conflict.length > 0 && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-pink-600 px-4 py-3 text-center font-bold text-white">
                  분쟁 현황
                </div>
                <div className="p-4 space-y-3">
                  {diplomacyData.conflict.map(([cityID, conflictNations]) => (
                    <div key={cityID} className="flex items-center gap-4 bg-gray-800/50 rounded-lg p-3">
                      <div className="w-24 text-right text-sm font-bold text-gray-300 flex-shrink-0">
                        도시 #{cityID}
                      </div>
                      <div className="flex-1 space-y-2">
                        {Object.entries(conflictNations).map(([nationIDStr, percent]) => {
                          const nationID = parseInt(nationIDStr);
                          const nation = nationMap.get(nationID);
                          if (!nation) return null;
                          
                          return (
                            <div key={nationID} className="flex items-center gap-2">
                              <div
                                className="w-24 text-xs px-2 py-0.5 rounded flex-shrink-0"
                                style={{
                                  color: isBrightColor(nation.color) ? '#000' : '#fff',
                                  backgroundColor: nation.color,
                                }}
                              >
                                {nation.name}
                              </div>
                              <div className="w-12 text-right text-xs text-gray-400 flex-shrink-0">
                                {(percent as number).toFixed(1)}%
                              </div>
                              <div className="flex-1 bg-gray-700/50 rounded-full h-3 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${percent}%`,
                                    backgroundColor: nation.color,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 국가 목록 */}
            {diplomacyData && diplomacyData.nations.length > 0 && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-green-600 px-4 py-3 text-center font-bold text-white">
                  국가 현황
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {diplomacyData.nations.map((nation) => (
                    <div
                      key={nation.nation}
                      className="px-3 py-2 rounded-lg text-center text-sm font-bold"
                      style={{
                        color: isBrightColor(nation.color) ? '#000' : '#fff',
                        backgroundColor: nation.color,
                      }}
                    >
                      {nation.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 외교 문서함 탭 */}
        {activeTab === 'letters' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                외교 문서함
              </h2>
              <button 
                onClick={() => setShowNewLetter(!showNewLetter)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg",
                  showNewLetter 
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                    : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20"
                )}
              >
                {showNewLetter ? '작성 취소' : '새 문서 작성'}
              </button>
            </div>

            {showNewLetter && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2">외교문서 작성</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">대상 국가</label>
                    <select
                      value={newLetter.destNation}
                      onChange={(e) => setNewLetter({ ...newLetter, destNation: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                    >
                      <option value="">국가를 선택하세요</option>
                      {nations.map(([nationNo, nationName, color]) => (
                        <option key={nationNo} value={nationNo} style={{ color }}>
                          {nationName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">내용 (국가 내 공개)</label>
                    <textarea
                      value={newLetter.brief}
                      onChange={(e) => setNewLetter({ ...newLetter, brief: e.target.value })}
                      className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors resize-y placeholder-gray-600"
                      placeholder="국가 구성원 모두가 볼 수 있는 공개 내용을 입력하세요"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">상세 내용 (외교권자 전용)</label>
                    <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden min-h-[200px]">
                      <TipTapEditor
                        content={newLetter.detail}
                        onChange={(content) => setNewLetter({ ...newLetter, detail: content })}
                        placeholder="외교권자만 볼 수 있는 상세 내용을 입력하세요 (선택사항)"
                        serverID={serverID}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={sendLetter} 
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20"
                    >
                      전송하기
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="min-h-[200px] flex items-center justify-center">
                <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
              </div>
            ) : letters.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
                주고받은 외교문서가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {letters.map((letter) => (
                  <div key={letter.no} className="group bg-gray-900/40 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-xl overflow-hidden transition-all duration-200 shadow-md hover:shadow-lg">
                    {/* Header */}
                    <div className="bg-white/[0.02] px-5 py-3 border-b border-white/5 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">{letter.fromNation}</span>
                        <span className="text-gray-600">→</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">{letter.toNation}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-500">{letter.date}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded font-bold uppercase border",
                          letter.status === 'pending' ? "bg-yellow-900/30 text-yellow-500 border-yellow-500/30" :
                          letter.status === 'accepted' ? "bg-green-900/30 text-green-500 border-green-500/30" :
                          letter.status === 'rejected' ? "bg-red-900/30 text-red-500 border-red-500/30" :
                          "bg-gray-800 text-gray-400 border-gray-700"
                        )}>
                          {letter.status}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">요약</div>
                        <div className="text-gray-200 text-sm leading-relaxed bg-black/20 p-3 rounded border border-white/5">
                          {letter.brief}
                        </div>
                      </div>
                      
                      {letter.detail && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase font-bold mb-1">상세 내용</div>
                          <div className="text-gray-400 text-sm leading-relaxed prose prose-invert max-w-none prose-sm bg-black/20 p-3 rounded border border-white/5" dangerouslySetInnerHTML={{ __html: letter.detail }} />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="bg-black/20 px-5 py-3 border-t border-white/5 flex justify-between items-center">
                      <div className="flex gap-2">
                        {letter.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                if(!confirm('정말 수락하시겠습니까?')) return;
                                try {
                                  const result = await SammoAPI.RespondDiplomacyLetter({
                                    serverID,
                                    letterNo: letter.no,
                                    action: 'accept',
                                  });
                                  if (result.result) {
                                    await loadLetters();
                                  } else {
                                    showToast(result.reason || '처리에 실패했습니다.', 'error');
                                  }
                                } catch (err) {
                                  console.error(err);
                                  showToast('처리에 실패했습니다.', 'error');
                                }
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-green-900/20"
                            >
                              수락
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if(!confirm('정말 거절하시겠습니까?')) return;
                                try {
                                  const result = await SammoAPI.RespondDiplomacyLetter({
                                    serverID,
                                    letterNo: letter.no,
                                    action: 'reject',
                                  });
                                  if (result.result) {
                                    await loadLetters();
                                  } else {
                                    showToast(result.reason || '처리에 실패했습니다.', 'error');
                                  }
                                } catch (err) {
                                  console.error(err);
                                  showToast('처리에 실패했습니다.', 'error');
                                }
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-red-900/20"
                            >
                              거절
                            </button>
                          </>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewLetter(true);
                          setNewLetter({
                            prevNo: String(letter.no),
                            destNation: '',
                            brief: '',
                            detail: '',
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded border border-white/10 transition-colors"
                      >
                        추가 문서 작성
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
