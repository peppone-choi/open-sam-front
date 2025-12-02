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

interface DiplomacyHistoryItem {
  type: string;
  srcNationId: number;
  srcNationName: string;
  destNationId: number;
  destNationName: string;
  oldState?: number;
  newState?: number;
  proposalType?: string;
  message?: string;
  timestamp?: string;
  year?: number;
  month?: number;
  generalName?: string;
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

// 외교 문서 템플릿
interface DiplomacyTemplate {
  id: string;
  name: string;
  icon: string;
  briefTemplate: string;
  detailTemplate: string;
  category: 'peace' | 'war' | 'alliance' | 'trade' | 'other';
}

const DIPLOMACY_TEMPLATES: DiplomacyTemplate[] = [
  {
    id: 'peace_proposal',
    name: '종전 제의',
    icon: '🕊️',
    category: 'peace',
    briefTemplate: '[국가명]에 종전을 제의합니다.',
    detailTemplate: `<p>존경하는 [국가명] 지도자에게,</p>
<p>양국 간의 전쟁으로 많은 피해가 발생하였습니다.</p>
<p>더 이상의 희생을 막기 위해 종전을 제의드립니다.</p>
<p>양국의 평화와 번영을 위해 함께 협력하기를 바랍니다.</p>`,
  },
  {
    id: 'non_aggression',
    name: '불가침 제의',
    icon: '🤝',
    category: 'alliance',
    briefTemplate: '[국가명]에 불가침 조약을 제의합니다.',
    detailTemplate: `<p>존경하는 [국가명] 지도자에게,</p>
<p>양국 간의 평화로운 관계 유지를 위해 불가침 조약을 제의드립니다.</p>
<p>조약 기간: [기간]</p>
<p>상호 불가침을 약속하며, 양국의 발전을 기원합니다.</p>`,
  },
  {
    id: 'alliance_proposal',
    name: '동맹 제의',
    icon: '⚔️',
    category: 'alliance',
    briefTemplate: '[국가명]에 동맹을 제의합니다.',
    detailTemplate: `<p>존경하는 [국가명] 지도자에게,</p>
<p>공동의 적에 대항하기 위해 동맹을 제의드립니다.</p>
<p>동맹 조건:</p>
<ul>
<li>상호 군사 지원</li>
<li>정보 공유</li>
<li>공동 작전 수행</li>
</ul>`,
  },
  {
    id: 'war_declaration',
    name: '선전포고',
    icon: '⚔️',
    category: 'war',
    briefTemplate: '[국가명]에 선전포고합니다.',
    detailTemplate: `<p>[국가명]에 대해 선전포고를 선언합니다.</p>
<p>사유: [사유를 입력하세요]</p>
<p>본 선전포고 후 [기간] 뒤 교전이 시작됩니다.</p>`,
  },
  {
    id: 'trade_agreement',
    name: '통상 협정',
    icon: '💰',
    category: 'trade',
    briefTemplate: '[국가명]과 통상 협정을 제의합니다.',
    detailTemplate: `<p>존경하는 [국가명] 지도자에게,</p>
<p>양국 간의 경제 발전을 위해 통상 협정을 제의드립니다.</p>
<p>협정 내용:</p>
<ul>
<li>교역로 개방</li>
<li>관세 인하</li>
<li>상인 보호</li>
</ul>`,
  },
  {
    id: 'custom',
    name: '직접 작성',
    icon: '📝',
    category: 'other',
    briefTemplate: '',
    detailTemplate: '',
  },
];

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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // 외교 현황 데이터
  const [diplomacyData, setDiplomacyData] = useState<DiplomacyData | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'letters' | 'history'>('matrix');
  
  // 히스토리 데이터
  const [history, setHistory] = useState<DiplomacyHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadDiplomacyData();
    loadLetters();
    loadNations();
  }, [serverID]);

  // 히스토리 탭 선택 시 로드
  useEffect(() => {
    if (activeTab === 'history' && history.length === 0) {
      loadHistory();
    }
  }, [activeTab]);

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

  // 외교 히스토리 로드
  async function loadHistory() {
    try {
      setHistoryLoading(true);
      const result = await SammoAPI.GetDiplomacyHistory({ 
        session_id: serverID,
        limit: 50 
      });
      if (result.success && result.history) {
        setHistory(result.history);
      }
    } catch (err) {
      console.error('Failed to load diplomacy history:', err);
      showToast('외교 히스토리를 불러오는데 실패했습니다.', 'error');
    } finally {
      setHistoryLoading(false);
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
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-bold transition-colors',
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            외교 기록
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
                  {/* 템플릿 선택 */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">문서 템플릿</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {DIPLOMACY_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(template.id);
                            if (template.id !== 'custom') {
                              const destNationName = nations.find(n => n[0] === Number(newLetter.destNation))?.[1] || '[국가명]';
                              setNewLetter({
                                ...newLetter,
                                brief: template.briefTemplate.replace('[국가명]', destNationName),
                                detail: template.detailTemplate.replace(/\[국가명\]/g, destNationName),
                              });
                            }
                          }}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                            selectedTemplate === template.id
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          <span>{template.icon}</span>
                          <span>{template.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">대상 국가</label>
                    <select
                      value={newLetter.destNation}
                      onChange={(e) => {
                        const newDestNation = e.target.value;
                        setNewLetter({ ...newLetter, destNation: newDestNation });
                        // 템플릿이 선택되어 있으면 국가명 업데이트
                        if (selectedTemplate && selectedTemplate !== 'custom') {
                          const template = DIPLOMACY_TEMPLATES.find(t => t.id === selectedTemplate);
                          if (template) {
                            const destNationName = nations.find(n => n[0] === Number(newDestNation))?.[1] || '[국가명]';
                            setNewLetter(prev => ({
                              ...prev,
                              destNation: newDestNation,
                              brief: template.briefTemplate.replace('[국가명]', destNationName),
                              detail: template.detailTemplate.replace(/\[국가명\]/g, destNationName),
                            }));
                          }
                        }
                      }}
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
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-400 uppercase">상세 내용 (외교권자 전용)</label>
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className={cn(
                          'px-3 py-1 text-xs font-bold rounded transition-colors',
                          showPreview
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        )}
                      >
                        {showPreview ? '📝 편집' : '👁️ 미리보기'}
                      </button>
                    </div>
                    {showPreview ? (
                      <div className="bg-black/40 border border-white/10 rounded-lg p-4 min-h-[200px]">
                        <div className="space-y-4">
                          <div>
                            <div className="text-xs text-gray-500 uppercase font-bold mb-2">요약</div>
                            <div className="text-gray-200 text-sm leading-relaxed bg-gray-900/50 p-3 rounded border border-white/5">
                              {newLetter.brief || '(요약 내용 없음)'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase font-bold mb-2">상세 내용</div>
                            <div 
                              className="text-gray-300 text-sm leading-relaxed prose prose-invert max-w-none prose-sm bg-gray-900/50 p-3 rounded border border-white/5"
                              dangerouslySetInnerHTML={{ __html: newLetter.detail || '<p class="text-gray-500">(상세 내용 없음)</p>' }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden min-h-[200px]">
                        <TipTapEditor
                          content={newLetter.detail}
                          onChange={(content) => setNewLetter({ ...newLetter, detail: content })}
                          placeholder="외교권자만 볼 수 있는 상세 내용을 입력하세요 (선택사항)"
                          serverID={serverID}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewLetter({ prevNo: '', destNation: '', brief: '', detail: '' });
                        setSelectedTemplate(null);
                        setShowPreview(false);
                      }}
                      className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg text-sm transition-colors border border-white/10"
                    >
                      초기화
                    </button>
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

        {/* 외교 기록 탭 */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                외교 기록
              </h2>
              <button
                onClick={loadHistory}
                disabled={historyLoading}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold rounded-lg border border-white/10 transition-colors"
              >
                {historyLoading ? '로딩 중...' : '새로고침'}
              </button>
            </div>

            {historyLoading ? (
              <div className="min-h-[200px] flex items-center justify-center">
                <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
                외교 기록이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, index) => {
                  // 타입별 색상 및 아이콘
                  const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
                    war_declared: { icon: '⚔️', color: 'text-red-400', bg: 'border-red-500/30' },
                    peace_achieved: { icon: '🕊️', color: 'text-green-400', bg: 'border-green-500/30' },
                    pact_broken: { icon: '💔', color: 'text-orange-400', bg: 'border-orange-500/30' },
                    pact_expired: { icon: '⏰', color: 'text-yellow-400', bg: 'border-yellow-500/30' },
                    state_changed: { icon: '🔄', color: 'text-blue-400', bg: 'border-blue-500/30' },
                    proposal_received: { icon: '📨', color: 'text-cyan-400', bg: 'border-cyan-500/30' },
                    proposal_accepted: { icon: '✅', color: 'text-green-400', bg: 'border-green-500/30' },
                    proposal_declined: { icon: '❌', color: 'text-red-400', bg: 'border-red-500/30' },
                    proposal_expired: { icon: '⏱️', color: 'text-gray-400', bg: 'border-gray-500/30' },
                  };
                  
                  const config = typeConfig[item.type] || { icon: '📋', color: 'text-gray-400', bg: 'border-gray-500/30' };
                  const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString('ko-KR') : 
                                 (item.year && item.month ? `${item.year}년 ${item.month}월` : '');

                  return (
                    <div
                      key={`${item.type}-${item.srcNationId}-${item.destNationId}-${index}`}
                      className={cn(
                        'bg-gray-900/40 backdrop-blur-sm border-l-4 rounded-lg p-4 transition-all hover:bg-gray-900/60',
                        config.bg
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">{config.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('font-bold text-sm', config.color)}>
                              {item.srcNationName}
                            </span>
                            <span className="text-gray-600">↔</span>
                            <span className={cn('font-bold text-sm', config.color)}>
                              {item.destNationName}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {item.message || `외교 상태 변경: ${item.type}`}
                          </p>
                          {item.generalName && (
                            <p className="text-xs text-gray-500 mt-1">
                              담당: {item.generalName}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                          {dateStr}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
