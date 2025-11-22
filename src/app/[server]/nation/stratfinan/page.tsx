'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

const diplomacyStateInfo: Record<number, {name: string, color: string}> = {
  0: { name: '중립', color: '#9CA3AF' }, // gray-400
  1: { name: '불가침', color: '#4ADE80' }, // green-400
  2: { name: '동맹', color: '#60A5FA' }, // blue-400
  3: { name: '교전', color: '#F87171' }, // red-400
  7: { name: '-', color: '#FFFFFF' }
};

function calculateEndDate(year: number, month: number, term: number): {year: number, month: number} {
  const totalMonths = year * 12 + month + term;
  return {
    year: Math.floor(totalMonths / 12),
    month: totalMonths % 12 || 12
  };
}

export default function NationStratFinanPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [nationData, setNationData] = useState<any>(null);
  
  const [nationMsg, setNationMsg] = useState('');
  const [scoutMsg, setScoutMsg] = useState('');
  const [editingNationMsg, setEditingNationMsg] = useState(false);
  const [editingScoutMsg, setEditingScoutMsg] = useState(false);
  const [originalNationMsg, setOriginalNationMsg] = useState('');
  const [originalScoutMsg, setOriginalScoutMsg] = useState('');
  
  const [policy, setPolicy] = useState({
    rate: 0,
    bill: 0,
    secretLimit: 0,
    blockWar: false,
    blockScout: false
  });

  useEffect(() => {
    loadNationData();
  }, [serverID]);

  async function loadNationData() {
    try {
      setLoading(true);
      const result = await SammoAPI.NationGetStratFinan();
      if (result.result) {
        const data = result.stratFinan;
        setNationData(data);
        
        setNationMsg(data.nationMsg || '');
        setScoutMsg(data.scoutMsg || '');
        setOriginalNationMsg(data.nationMsg || '');
        setOriginalScoutMsg(data.scoutMsg || '');
        
        setPolicy({
          rate: data.rate || 0,
          bill: data.bill || 0,
          secretLimit: data.secretLimit || 0,
          blockWar: data.blockWar || false,
          blockScout: data.blockScout || false
        });
      }
    } catch (err) {
      console.error(err);
      alert('내무부 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function saveNationMsg() {
    try {
      const result = await SammoAPI.NationSetNotice(nationMsg);
      if (result.result) {
        setOriginalNationMsg(nationMsg);
        setEditingNationMsg(false);
        alert('국가 방침이 저장되었습니다.');
      } else {
        alert(result.reason || '저장에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '저장에 실패했습니다.');
    }
  }

  function cancelNationMsg() {
    setNationMsg(originalNationMsg);
    setEditingNationMsg(false);
  }

  async function saveScoutMsg() {
    try {
      const result = await SammoAPI.NationSetScoutMsg(scoutMsg);
      if (result.result) {
        setOriginalScoutMsg(scoutMsg);
        setEditingScoutMsg(false);
        alert('임관 권유 메시지가 저장되었습니다.');
      } else {
        alert(result.reason || '저장에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '저장에 실패했습니다.');
    }
  }

  function cancelScoutMsg() {
    setScoutMsg(originalScoutMsg);
    setEditingScoutMsg(false);
  }

  async function setRate() {
    try {
      const result = await SammoAPI.NationSetRate(policy.rate);
      if (result.result) {
        alert('세율이 변경되었습니다.');
        await loadNationData();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    }
  }

  async function setBill() {
    try {
      const result = await SammoAPI.NationSetBill(policy.bill);
      if (result.result) {
        alert('지급률이 변경되었습니다.');
        await loadNationData();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    }
  }

  async function setSecretLimit() {
    try {
      const result = await SammoAPI.NationSetSecretLimit(policy.secretLimit);
      if (result.result) {
        alert('기밀 권한이 변경되었습니다.');
        await loadNationData();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    }
  }

  async function setBlockWar(value: boolean) {
    try {
      const result = await SammoAPI.NationSetBlockWar(value);
      if (result.result) {
        setPolicy({...policy, blockWar: value});
        alert('전쟁 금지 설정이 변경되었습니다.');
        await loadNationData();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    }
  }

  async function setBlockScout(value: boolean) {
    try {
      const result = await SammoAPI.NationSetBlockScout(value);
      if (result.result) {
        setPolicy({...policy, blockScout: value});
        alert('임관 금지 설정이 변경되었습니다.');
        await loadNationData();
      } else {
        alert(result.reason || '변경에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
      </div>
    );
  }

  const editable = nationData?.editable || false;
  const nationsList = nationData?.nationsList || [];
  const gold = nationData?.gold || 0;
  const rice = nationData?.rice || 0;
  const income = nationData?.income || { gold: { war: 0, city: 0 }, rice: { wall: 0, city: 0 } };
  const outcome = nationData?.outcome || 0;
  const incomeGold = (income.gold?.war || 0) + (income.gold?.city || 0);
  const incomeRice = (income.rice?.wall || 0) + (income.rice?.city || 0);
  const warSettingCnt = nationData?.warSettingCnt || { remain: 0, inc: 0, max: 0 };
  const year = nationData?.year || 0;
  const month = nationData?.month || 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <TopBackBar title="내 무 부" reloadable onReload={loadNationData} />
        
        {/* 외교 관계 */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-white/5 px-6 py-4 border-b border-white/5">
             <h2 className="text-lg font-bold text-white">외교 관계</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-xs uppercase text-gray-400 font-bold border-b border-white/5">
                <tr>
                  <th className="px-6 py-3 whitespace-nowrap">국가명</th>
                  <th className="px-6 py-3 whitespace-nowrap text-center">국력</th>
                  <th className="px-6 py-3 whitespace-nowrap text-center">장수</th>
                  <th className="px-6 py-3 whitespace-nowrap text-center">속령</th>
                  <th className="px-6 py-3 whitespace-nowrap text-center">상태</th>
                  <th className="px-6 py-3 whitespace-nowrap text-center">기간</th>
                  <th className="px-6 py-3 whitespace-nowrap text-center">종료 시점</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {nationsList.map((nation: any) => {
                  const diplomacy = nation.diplomacy || {};
                  const term = diplomacy.term || 0;
                  const endDate = term > 0 ? calculateEndDate(year, month, term) : null;
                  const stateInfo = diplomacyStateInfo[diplomacy.state] || diplomacyStateInfo[0];
                  
                  return (
                    <tr key={nation.nation} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 font-medium" style={{color: nation.nation === 0 ? '#E5E7EB' : nation.color}}>
                         {nation.name}
                      </td>
                      <td className="px-6 py-3 text-center text-gray-400">{nation.power?.toLocaleString() || '-'}</td>
                      <td className="px-6 py-3 text-center text-gray-400">{nation.gennum?.toLocaleString() || '-'}</td>
                      <td className="px-6 py-3 text-center text-gray-400">{nation.cityCnt?.toLocaleString() || '-'}</td>
                      <td className="px-6 py-3 text-center font-bold" style={{color: stateInfo.color}}>{stateInfo.name}</td>
                      <td className="px-6 py-3 text-center text-gray-400">{term === 0 ? '-' : `${term}개월`}</td>
                      <td className="px-6 py-3 text-center text-gray-400">{!endDate ? '-' : `${endDate.year}년 ${endDate.month}월`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 국가 방침 & 임관 권유 메시지 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* 국가 방침 */}
           <section className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg flex flex-col">
              <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">국가 방침</h2>
                {editable && (
                   <div className="flex gap-2">
                      {!editingNationMsg ? (
                         <button onClick={() => setEditingNationMsg(true)} className="px-3 py-1 text-xs font-bold rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors">수정</button>
                      ) : (
                         <>
                            <button onClick={saveNationMsg} className="px-3 py-1 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-900/20">저장</button>
                            <button onClick={cancelNationMsg} className="px-3 py-1 text-xs font-bold rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors">취소</button>
                         </>
                      )}
                   </div>
                )}
              </div>
              <div className="p-6 flex-1">
                <textarea
                  className={cn(
                     "w-full h-full min-h-[150px] bg-black/40 border rounded-lg p-4 text-sm leading-relaxed resize-none focus:outline-none transition-colors",
                     editingNationMsg ? "border-blue-500/50 text-white" : "border-white/10 text-gray-300 cursor-default"
                  )}
                  value={nationMsg}
                  onChange={(e) => setNationMsg(e.target.value)}
                  readOnly={!editingNationMsg}
                />
              </div>
           </section>

           {/* 임관 권유 */}
           <section className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg flex flex-col">
              <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">임관 권유 메시지</h2>
                {editable && (
                   <div className="flex gap-2">
                      {!editingScoutMsg ? (
                         <button onClick={() => setEditingScoutMsg(true)} className="px-3 py-1 text-xs font-bold rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors">수정</button>
                      ) : (
                         <>
                            <button onClick={saveScoutMsg} className="px-3 py-1 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-900/20">저장</button>
                            <button onClick={cancelScoutMsg} className="px-3 py-1 text-xs font-bold rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors">취소</button>
                         </>
                      )}
                   </div>
                )}
              </div>
              <div className="p-6 flex-1">
                <textarea
                  className={cn(
                     "w-full h-full min-h-[150px] bg-black/40 border rounded-lg p-4 text-sm leading-relaxed resize-none focus:outline-none transition-colors",
                     editingScoutMsg ? "border-blue-500/50 text-white" : "border-white/10 text-gray-300 cursor-default"
                  )}
                  value={scoutMsg}
                  onChange={(e) => setScoutMsg(e.target.value)}
                  readOnly={!editingScoutMsg}
                />
              </div>
           </section>
        </div>

        {/* 예산 & 정책 */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-white/5 px-6 py-4 border-b border-white/5">
             <h2 className="text-lg font-bold text-white">예산 & 정책</h2>
          </div>
          <div className="p-6 space-y-8">
             
             {/* Finance Grid */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gold */}
                <div className="bg-black/20 border border-white/5 rounded-lg p-5 space-y-4">
                   <h3 className="text-yellow-500 font-bold uppercase text-xs tracking-wider border-b border-white/5 pb-2 mb-2">자금 예산</h3>
                   <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                         <span className="text-gray-500">현재 자금</span>
                         <span className="text-white font-medium">{gold.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-gray-500">단기수입</span>
                         <span className="text-white font-medium">{(income.gold?.war || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-gray-500">세금</span>
                         <span className="text-white font-medium">{Math.floor(income.gold?.city || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                         <span className="text-gray-400">수입 / 지출</span>
                         <span className="text-gray-200">
                            <span className="text-green-400">+{Math.floor(incomeGold).toLocaleString()}</span> 
                            <span className="mx-2 text-gray-600">/</span>
                            <span className="text-red-400">{Math.floor(-outcome).toLocaleString()}</span>
                         </span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                         <span className="text-yellow-500 font-bold">예상 국고</span>
                         <span className="text-yellow-400 font-bold text-lg">
                            {Math.floor(gold + incomeGold - outcome).toLocaleString()}
                         </span>
                      </div>
                   </div>
                </div>

                {/* Rice */}
                <div className="bg-black/20 border border-white/5 rounded-lg p-5 space-y-4">
                   <h3 className="text-orange-500 font-bold uppercase text-xs tracking-wider border-b border-white/5 pb-2 mb-2">군량 예산</h3>
                   <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                         <span className="text-gray-500">현재 군량</span>
                         <span className="text-white font-medium">{rice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-gray-500">둔전수입</span>
                         <span className="text-white font-medium">{Math.floor(income.rice?.wall || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-gray-500">세금</span>
                         <span className="text-white font-medium">{Math.floor(income.rice?.city || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                         <span className="text-gray-400">수입 / 지출</span>
                         <span className="text-gray-200">
                            <span className="text-green-400">+{Math.floor(incomeRice).toLocaleString()}</span>
                            <span className="mx-2 text-gray-600">/</span>
                            <span className="text-red-400">{Math.floor(-outcome).toLocaleString()}</span>
                         </span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                         <span className="text-orange-500 font-bold">예상 군량</span>
                         <span className="text-orange-400 font-bold text-lg">
                            {Math.floor(rice + incomeRice - outcome).toLocaleString()}
                         </span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Policy Settings Grid */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                {/* Rate */}
                <div className="bg-black/20 border border-white/5 rounded-lg p-4">
                   <label className="text-xs font-bold text-blue-400 uppercase mb-3 block">세율 (5 ~ 30%)</label>
                   <div className="flex gap-2">
                      <input 
                        type="number" 
                        className="flex-1 bg-gray-900 border border-white/10 rounded px-3 py-2 text-sm text-center focus:outline-none focus:border-blue-500/50"
                        value={policy.rate} 
                        onChange={(e) => setPolicy({...policy, rate: Number(e.target.value)})} 
                        min={5} 
                        max={30}
                        disabled={!editable}
                      />
                      {editable && (
                        <button onClick={setRate} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors">
                           변경
                        </button>
                      )}
                   </div>
                </div>

                {/* Bill */}
                <div className="bg-black/20 border border-white/5 rounded-lg p-4">
                   <label className="text-xs font-bold text-blue-400 uppercase mb-3 block">지급률 (20 ~ 200%)</label>
                   <div className="flex gap-2">
                      <input 
                        type="number" 
                        className="flex-1 bg-gray-900 border border-white/10 rounded px-3 py-2 text-sm text-center focus:outline-none focus:border-blue-500/50"
                        value={policy.bill} 
                        onChange={(e) => setPolicy({...policy, bill: Number(e.target.value)})} 
                        min={20} 
                        max={200}
                        disabled={!editable}
                      />
                      {editable && (
                        <button onClick={setBill} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors">
                           변경
                        </button>
                      )}
                   </div>
                </div>

                {/* Secret Limit */}
                <div className="bg-black/20 border border-white/5 rounded-lg p-4">
                   <label className="text-xs font-bold text-blue-400 uppercase mb-3 block">기밀 권한 (1 ~ 99년)</label>
                   <div className="flex gap-2">
                      <input 
                        type="number" 
                        className="flex-1 bg-gray-900 border border-white/10 rounded px-3 py-2 text-sm text-center focus:outline-none focus:border-blue-500/50"
                        value={policy.secretLimit} 
                        onChange={(e) => setPolicy({...policy, secretLimit: Number(e.target.value)})} 
                        min={1} 
                        max={99}
                        disabled={!editable}
                      />
                      {editable && (
                        <button onClick={setSecretLimit} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors">
                           변경
                        </button>
                      )}
                   </div>
                </div>

                {/* Block War/Scout */}
                <div className="bg-black/20 border border-white/5 rounded-lg p-4">
                   <label className="text-xs font-bold text-blue-400 uppercase mb-3 block">금지 설정</label>
                   <div className="text-[10px] text-gray-500 mb-2 text-center">
                      전쟁 금지: {warSettingCnt.remain}회 (월 +{warSettingCnt.inc}회, 최대 {warSettingCnt.max}회)
                   </div>
                   <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                         <input 
                           type="checkbox" 
                           className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-offset-gray-900 focus:ring-1 focus:ring-blue-500"
                           checked={policy.blockWar} 
                           onChange={(e) => editable && setBlockWar(e.target.checked)}
                           disabled={!editable}
                         />
                         <span className="text-sm text-gray-300">전쟁 금지</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                         <input 
                           type="checkbox" 
                           className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-offset-gray-900 focus:ring-1 focus:ring-blue-500"
                           checked={policy.blockScout} 
                           onChange={(e) => editable && setBlockScout(e.target.checked)}
                           disabled={!editable}
                         />
                         <span className="text-sm text-gray-300">임관 금지</span>
                      </label>
                   </div>
                </div>
             </div>
          </div>
        </section>

      </div>
    </div>
  );
}
