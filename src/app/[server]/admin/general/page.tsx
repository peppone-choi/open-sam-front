'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface General {
  no: number;
  name: string;
  nation: number;
  nationName?: string;
  nationColor?: string;
  npc: number;
  owner?: string;
  owner_name?: string;
  leadership: number;
  strength: number;
  intel: number;
  gold: number;
  rice: number;
  crew: number;
  crewtype: number;
  penalty: number;
  killturn: number;
  city?: number;
  cityName?: string;
  turntime?: string;
}

interface Nation {
  nation: number;
  name: string;
  color: string;
}

const CREW_TYPES = ['보병', '궁병', '기병', '귀병', '차병'];
const NPC_TYPES: Record<number, { label: string; color: string }> = {
  0: { label: '유저', color: 'text-white' },
  1: { label: 'NPC유저', color: 'text-cyan-400' },
  2: { label: 'NPC', color: 'text-sky-400' },
  3: { label: 'NPC고급', color: 'text-blue-400' },
  4: { label: 'NPC엘리트', color: 'text-indigo-400' },
  5: { label: '사망', color: 'text-gray-500' },
};

const PENALTY_LEVELS: Record<number, { label: string; color: string }> = {
  0: { label: '정상', color: 'text-green-400' },
  1: { label: '1단계', color: 'text-yellow-400' },
  2: { label: '2단계', color: 'text-orange-400' },
  3: { label: '3단계', color: 'text-red-400' },
  999: { label: '무한삭턴', color: 'text-red-600' },
};

function AdminGeneralContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [generals, setGenerals] = useState<General[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [selectedGenerals, setSelectedGenerals] = useState<number[]>([]);
  const [selectedGeneral, setSelectedGeneral] = useState<General | null>(null);
  
  // 필터 상태
  const [searchName, setSearchName] = useState('');
  const [filterNation, setFilterNation] = useState<number | ''>('');
  const [filterNPC, setFilterNPC] = useState<number | ''>('');
  
  // 모달 상태
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [targetNation, setTargetNation] = useState<number>(0);
  const [skillAmount, setSkillAmount] = useState(10000);
  const [skillType, setSkillType] = useState(0);

  const loadData = useCallback(async () => {
    if (!serverID) return;
    
    try {
      setLoading(true);
      
      const [generalsResult, nationStatsResult] = await Promise.all([
        SammoAPI.AdminGetGenerals({ session_id: serverID }),
        SammoAPI.AdminGetNationStats({ session_id: serverID, sortType: 0 }).catch(() => ({ success: false })),
      ]);
      
      if ((generalsResult as any).success) {
        setGenerals((generalsResult as any).generals || []);
      }
      
      if ((nationStatsResult as any).success) {
        const stats = (nationStatsResult as any).stats || [];
        setNations(stats.map((n: any) => ({
          nation: n.nation,
          name: n.name,
          color: n.color,
        })));
      }
    } catch (error) {
      console.error('General data load error:', error);
    } finally {
      setLoading(false);
    }
  }, [serverID]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredGenerals = generals.filter(g => {
    if (searchName && !g.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (filterNation !== '' && g.nation !== filterNation) return false;
    if (filterNPC !== '' && g.npc !== filterNPC) return false;
    return true;
  });

  const getNationInfo = (nationId: number) => {
    if (nationId === 0) return { name: '재야', color: '#666666' };
    const nation = nations.find(n => n.nation === nationId);
    return nation || { name: '알 수 없음', color: '#666666' };
  };

  const getContrastColor = (hexColor: string): string => {
    if (!hexColor) return '#ffffff';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const handleSelectAll = () => {
    if (selectedGenerals.length === filteredGenerals.length) {
      setSelectedGenerals([]);
    } else {
      setSelectedGenerals(filteredGenerals.map(g => g.no));
    }
  };

  const handleSelectGeneral = (generalNo: number) => {
    setSelectedGenerals(prev => 
      prev.includes(generalNo)
        ? prev.filter(no => no !== generalNo)
        : [...prev, generalNo]
    );
  };

  const openActionModal = (type: string) => {
    if (selectedGenerals.length === 0) {
      showToast('장수를 선택해주세요', 'warning');
      return;
    }
    setActionType(type);
    setShowActionModal(true);
  };

  const executeAction = async () => {
    try {
      let results: string[] = [];
      
      for (const generalNo of selectedGenerals) {
        let result: any;
        
        switch (actionType) {
          case 'block_0':
            result = await SammoAPI.AdminSetBlock({ session_id: serverID, generalNo, penaltyLevel: 0 });
            break;
          case 'block_1':
            result = await SammoAPI.AdminSetBlock({ session_id: serverID, generalNo, penaltyLevel: 1 });
            break;
          case 'block_2':
            result = await SammoAPI.AdminSetBlock({ session_id: serverID, generalNo, penaltyLevel: 2 });
            break;
          case 'block_3':
            result = await SammoAPI.AdminSetBlock({ session_id: serverID, generalNo, penaltyLevel: 3 });
            break;
          case 'block_999':
            result = await SammoAPI.AdminSetBlock({ session_id: serverID, generalNo, penaltyLevel: 999 });
            break;
          case 'force_death':
            result = await SammoAPI.AdminForceDeath({ session_id: serverID, generalNo });
            break;
          case 'send_message':
            result = await SammoAPI.AdminSendMessage({ session_id: serverID, generalNo, text: messageText });
            break;
          case 'change_nation':
            result = await SammoAPI.AdminChangeNation({ session_id: serverID, generalNo, nationId: targetNation });
            break;
          case 'grant_skill':
            result = await SammoAPI.AdminGrantSkill({ 
              session_id: serverID, 
              generalNo, 
              crewType: skillType, 
              amount: skillAmount 
            });
            break;
          default:
            continue;
        }
        
        if (result?.success) {
          results.push(result.message || '성공');
        } else {
          results.push(result?.message || '실패');
        }
      }
      
      showToast(results.join(', '), 'success');
      setShowActionModal(false);
      setSelectedGenerals([]);
      setMessageText('');
      await loadData();
      
    } catch (error: any) {
      showToast(error.message || '오류 발생', 'error');
    }
  };

  const actionLabels: Record<string, string> = {
    block_0: '블럭 해제',
    block_1: '1단계 블럭',
    block_2: '2단계 블럭',
    block_3: '3단계 블럭',
    block_999: '무한삭턴',
    force_death: '강제 사망',
    send_message: '메시지 전달',
    change_nation: '국가 변경',
    grant_skill: '숙련도 부여',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
      <TopBackBar title="장 수 관 리" reloadable onReload={loadData} />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 검색 및 필터 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="장수 이름 검색..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            
            <select
              value={filterNation}
              onChange={(e) => setFilterNation(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="">모든 국가</option>
              <option value={0}>재야</option>
              {nations.map(n => (
                <option key={n.nation} value={n.nation}>{n.name}</option>
              ))}
            </select>
            
            <select
              value={filterNPC}
              onChange={(e) => setFilterNPC(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="">모든 타입</option>
              {Object.entries(NPC_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            
            <span className="text-sm text-gray-400">
              총 <span className="text-white font-mono">{filteredGenerals.length}</span>명
            </span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-400 mr-2 self-center">
              선택: {selectedGenerals.length}명
            </span>
            
            <div className="flex flex-wrap gap-2 border-l border-white/10 pl-4">
              <button
                onClick={() => openActionModal('block_0')}
                className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg text-xs font-medium transition-colors"
              >
                블럭 해제
              </button>
              <button
                onClick={() => openActionModal('block_1')}
                className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-lg text-xs font-medium transition-colors"
              >
                1단계 블럭
              </button>
              <button
                onClick={() => openActionModal('block_2')}
                className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 rounded-lg text-xs font-medium transition-colors"
              >
                2단계 블럭
              </button>
              <button
                onClick={() => openActionModal('block_3')}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs font-medium transition-colors"
              >
                3단계 블럭
              </button>
              <button
                onClick={() => openActionModal('block_999')}
                className="px-3 py-1.5 bg-red-800/20 hover:bg-red-800/40 text-red-500 rounded-lg text-xs font-medium transition-colors"
              >
                무한삭턴
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 border-l border-white/10 pl-4">
              <button
                onClick={() => openActionModal('force_death')}
                className="px-3 py-1.5 bg-gray-600/20 hover:bg-gray-600/40 text-gray-400 rounded-lg text-xs font-medium transition-colors"
              >
                강제 사망
              </button>
              <button
                onClick={() => openActionModal('send_message')}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs font-medium transition-colors"
              >
                메시지 전달
              </button>
              <button
                onClick={() => openActionModal('change_nation')}
                className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-lg text-xs font-medium transition-colors"
              >
                국가 변경
              </button>
              <button
                onClick={() => openActionModal('grant_skill')}
                className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 rounded-lg text-xs font-medium transition-colors"
              >
                숙련도 부여
              </button>
            </div>
          </div>
        </div>

        {/* 장수 목록 테이블 */}
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900/50 text-gray-400 border-b border-white/5">
                    <th className="py-3 px-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedGenerals.length === filteredGenerals.length && filteredGenerals.length > 0}
                        onChange={handleSelectAll}
                        className="rounded bg-slate-700 border-slate-600"
                      />
                    </th>
                    <th className="py-3 px-3 text-left">장수</th>
                    <th className="py-3 px-3 text-left">국가</th>
                    <th className="py-3 px-3 text-center">타입</th>
                    <th className="py-3 px-3 text-center">상태</th>
                    <th className="py-3 px-3 text-right">통솔</th>
                    <th className="py-3 px-3 text-right">무력</th>
                    <th className="py-3 px-3 text-right">지력</th>
                    <th className="py-3 px-3 text-right">금</th>
                    <th className="py-3 px-3 text-right">쌀</th>
                    <th className="py-3 px-3 text-right">병력</th>
                    <th className="py-3 px-3 text-center">병종</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGenerals.map((general) => {
                    const nationInfo = getNationInfo(general.nation);
                    const npcInfo = NPC_TYPES[general.npc] || NPC_TYPES[0];
                    const penaltyInfo = PENALTY_LEVELS[general.penalty] || PENALTY_LEVELS[0];
                    
                    return (
                      <tr 
                        key={general.no}
                        className={cn(
                          "border-b border-white/5 transition-colors cursor-pointer",
                          selectedGenerals.includes(general.no) 
                            ? "bg-blue-900/30" 
                            : "hover:bg-white/5",
                          general.penalty > 0 && "bg-red-900/10"
                        )}
                        onClick={() => setSelectedGeneral(selectedGeneral?.no === general.no ? null : general)}
                      >
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedGenerals.includes(general.no)}
                            onChange={() => handleSelectGeneral(general.no)}
                            className="rounded bg-slate-700 border-slate-600"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-500 text-xs w-8">{general.no}</span>
                            <span className="font-medium text-white">{general.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div 
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: nationInfo.color,
                              color: getContrastColor(nationInfo.color)
                            }}
                          >
                            {nationInfo.name}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={cn("text-xs", npcInfo.color)}>{npcInfo.label}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={cn("text-xs", penaltyInfo.color)}>{penaltyInfo.label}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-red-400">{general.leadership}</td>
                        <td className="py-3 px-3 text-right font-mono text-orange-400">{general.strength}</td>
                        <td className="py-3 px-3 text-right font-mono text-blue-400">{general.intel}</td>
                        <td className="py-3 px-3 text-right font-mono text-amber-400">{general.gold?.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-mono text-green-400">{general.rice?.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-mono text-pink-400">{general.crew?.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center text-xs text-gray-400">
                          {CREW_TYPES[general.crewtype] || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 선택된 장수 상세 정보 */}
        {selectedGeneral && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🎭</span>
                {selectedGeneral.name} 상세 정보
              </h3>
              <button
                onClick={() => setSelectedGeneral(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">장수 번호</div>
                <div className="font-mono text-white">{selectedGeneral.no}</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">소유자</div>
                <div className="font-mono text-white">{selectedGeneral.owner_name || '-'}</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">NPC 타입</div>
                <div className={NPC_TYPES[selectedGeneral.npc]?.color}>
                  {NPC_TYPES[selectedGeneral.npc]?.label}
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">블럭 상태</div>
                <div className={PENALTY_LEVELS[selectedGeneral.penalty]?.color}>
                  {PENALTY_LEVELS[selectedGeneral.penalty]?.label}
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">킬턴</div>
                <div className="font-mono text-white">{selectedGeneral.killturn}</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">최근 턴</div>
                <div className="font-mono text-white text-xs">
                  {selectedGeneral.turntime ? new Date(selectedGeneral.turntime).toLocaleString() : '-'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 액션 모달 */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {actionLabels[actionType]} ({selectedGenerals.length}명)
            </h3>
            
            {actionType === 'send_message' && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">메시지 내용</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-sm h-24 resize-none focus:outline-none focus:border-blue-500/50"
                  placeholder="전달할 메시지를 입력하세요..."
                />
              </div>
            )}
            
            {actionType === 'change_nation' && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">이동할 국가</label>
                <select
                  value={targetNation}
                  onChange={(e) => setTargetNation(Number(e.target.value))}
                  className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value={0}>재야</option>
                  {nations.map(n => (
                    <option key={n.nation} value={n.nation}>{n.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {actionType === 'grant_skill' && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">병종 선택</label>
                  <select
                    value={skillType}
                    onChange={(e) => setSkillType(Number(e.target.value))}
                    className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                  >
                    {CREW_TYPES.map((type, idx) => (
                      <option key={idx} value={idx}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">숙련도 수량</label>
                  <input
                    type="number"
                    value={skillAmount}
                    onChange={(e) => setSkillAmount(Number(e.target.value))}
                    className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            )}
            
            {(actionType === 'force_death' || actionType.startsWith('block_')) && (
              <p className="text-sm text-gray-400 mb-4">
                선택한 {selectedGenerals.length}명의 장수에게 {actionLabels[actionType]}을(를) 적용합니다.
              </p>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={executeAction}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
              >
                실행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminGeneralPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    }>
      <AdminGeneralContent />
    </Suspense>
  );
}
