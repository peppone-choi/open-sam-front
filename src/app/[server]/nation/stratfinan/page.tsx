'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI, type NationStratFinanPayload } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

const diplomacyStateInfo: Record<number, { name: string; color?: string }> = {
  0: { name: '교전', color: '#F87171' }, // red-400
  1: { name: '선포중', color: '#F472B6' }, // pink-400
  2: { name: '통상', color: '#E5E7EB' }, // gray-200
  7: { name: '불가침', color: '#4ADE80' }, // green-400
};

function calculateEndDate(year: number, month: number, term: number): {year: number, month: number} {
  const totalMonths = year * 12 + month + term;
  return {
    year: Math.floor(totalMonths / 12),
    month: totalMonths % 12 || 12
  };
}

// 간단한 바 차트 컴포넌트
interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  maxValue?: number;
  showLabels?: boolean;
}

function BarChart({ data, maxValue: providedMax, showLabels = true }: BarChartProps) {
  const maxValue = providedMax || Math.max(...data.map(d => Math.abs(d.value)), 1);

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = Math.min((Math.abs(item.value) / maxValue) * 100, 100);
        return (
          <div key={index} className="space-y-1">
            {showLabels && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">{item.label}</span>
                <span className="font-mono" style={{ color: item.color }}>
                  {item.value >= 0 ? '+' : ''}{item.value.toLocaleString()}
                </span>
              </div>
            )}
            <div className="h-3 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 도넛 차트 컴포넌트
interface DonutChartProps {
  income: number;
  expense: number;
  current: number;
  label: string;
  incomeColor: string;
  expenseColor: string;
}

function DonutChart({ income, expense, current, label, incomeColor, expenseColor }: DonutChartProps) {
  const total = income + Math.abs(expense);
  const incomePercent = total > 0 ? (income / total) * 100 : 50;
  const expensePercent = total > 0 ? (Math.abs(expense) / total) * 100 : 50;
  
  // SVG 도넛 차트 계산
  const size = 120;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const incomeOffset = 0;
  const expenseOffset = (incomePercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Income Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={incomeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${(incomePercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-incomeOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          {/* Expense Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={expenseColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${(expensePercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-expenseOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500">{label}</span>
          <span className="text-lg font-bold text-white">{current.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: incomeColor }} />
          <span className="text-gray-400">수입</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: expenseColor }} />
          <span className="text-gray-400">지출</span>
        </div>
      </div>
    </div>
  );
}

// 수지 예측 게이지
interface BudgetGaugeProps {
  current: number;
  projected: number;
  label: string;
  color: string;
}

function BudgetGauge({ current, projected, label, color }: BudgetGaugeProps) {
  const change = projected - current;
  const changePercent = current > 0 ? (change / current) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>{projected.toLocaleString()}</div>
      <div className={cn(
        "text-xs font-medium mt-1",
        isPositive ? "text-green-400" : "text-red-400"
      )}>
        {isPositive ? '▲' : '▼'} {Math.abs(change).toLocaleString()} ({isPositive ? '+' : ''}{changePercent.toFixed(1)}%)
      </div>
    </div>
  );
}

export default function NationStratFinanPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [nationData, setNationData] = useState<NationStratFinanPayload | null>(null);
  
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
      const result = await SammoAPI.NationGetStratFinan({ serverID });
         if (result.result) {
         const data = result.stratFinan;
         setNationData(data);
         
         setNationMsg(data.nationMsg || '');
         setScoutMsg(data.scoutMsg || '');
         setOriginalNationMsg(data.nationMsg || '');
         setOriginalScoutMsg(data.scoutMsg || '');
         
         const policySource = data.policy || data;
         setPolicy({
           rate: policySource.rate || 0,
           bill: policySource.bill || 0,
           secretLimit: policySource.secretLimit || 0,
           blockWar: policySource.blockWar || false,
           blockScout: policySource.blockScout || false
         });
       }
    } catch (err) {
      console.error(err);
      showToast('내무부 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveNationMsg() {
    try {
      const result = await SammoAPI.NationSetNotice({ msg: nationMsg, serverID });
      if (result.result) {
        setOriginalNationMsg(nationMsg);
        setEditingNationMsg(false);
        showToast('국가 방침이 저장되었습니다.', 'success');
      } else {
        showToast(result.reason || '저장에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '저장에 실패했습니다.', 'error');
    }
  }

  function cancelNationMsg() {
    setNationMsg(originalNationMsg);
    setEditingNationMsg(false);
  }

  async function saveScoutMsg() {
    try {
      const result = await SammoAPI.NationSetScoutMsg({ msg: scoutMsg, serverID });
      if (result.result) {
        setOriginalScoutMsg(scoutMsg);
        setEditingScoutMsg(false);
        showToast('임관 권유 메시지가 저장되었습니다.', 'success');
      } else {
        showToast(result.reason || '저장에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '저장에 실패했습니다.', 'error');
    }
  }

  function cancelScoutMsg() {
    setScoutMsg(originalScoutMsg);
    setEditingScoutMsg(false);
  }

  async function setRate() {
    try {
      const result = await SammoAPI.NationSetRate({ amount: policy.rate, serverID });
      if (result.result) {
        showToast('세율이 변경되었습니다.', 'success');
        await loadNationData();
      } else {
        showToast(result.reason || '변경에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '변경에 실패했습니다.', 'error');
    }
  }

  async function setBill() {
    try {
      const result = await SammoAPI.NationSetBill({ amount: policy.bill, serverID });
      if (result.result) {
        showToast('지급률이 변경되었습니다.', 'success');
        await loadNationData();
      } else {
        showToast(result.reason || '변경에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '변경에 실패했습니다.', 'error');
    }
  }

  async function setSecretLimit() {
    try {
      const result = await SammoAPI.NationSetSecretLimit({ amount: policy.secretLimit, serverID });
      if (result.result) {
        showToast('기밀 권한이 변경되었습니다.', 'success');
        await loadNationData();
      } else {
        showToast(result.reason || '변경에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '변경에 실패했습니다.', 'error');
    }
  }

  async function setBlockWar(value: boolean) {
    try {
      const result = await SammoAPI.NationSetBlockWar({ value, serverID });
      if (result.result) {
        setPolicy({ ...policy, blockWar: value });
        showToast('전쟁 금지 설정이 변경되었습니다.', 'success');
        await loadNationData();
      } else {
        showToast(result.reason || '변경에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '변경에 실패했습니다.', 'error');
    }
  }

  async function setBlockScout(value: boolean) {
    try {
      const result = await SammoAPI.NationSetBlockScout({ value, serverID });
      if (result.result) {
        setPolicy({ ...policy, blockScout: value });
        showToast('임관 금지 설정이 변경되었습니다.', 'success');
        await loadNationData();
      } else {
        showToast(result.reason || '변경에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '변경에 실패했습니다.', 'error');
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
  const myNationID = nationData?.nationID || 0;
  // 자기 국가는 외교 관계에서 제외
  const nationsList = (nationData?.nationsList || []).filter((nation: any) => nation.nation !== myNationID);
  const gold = nationData?.gold || 0;
  const rice = nationData?.rice || 0;
  const income = nationData?.income || { gold: { war: 0, city: 0 }, rice: { wall: 0, city: 0 } };
  const outcome = nationData?.outcome || 0;
  const incomeGold = (income.gold?.war || 0) + (income.gold?.city || 0);
  const incomeRice = (income.rice?.wall || 0) + (income.rice?.city || 0);
  const warSettingCnt = nationData?.warSettingCnt || { remain: 0, inc: 0, max: 0 };
  const canToggleBlockWar = editable && (warSettingCnt.remain ?? 0) > 0;
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
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
                   const rawState = typeof diplomacy.state === 'number' ? diplomacy.state : 2;
                   const stateInfo = diplomacyStateInfo[rawState] || diplomacyStateInfo[2];
                   
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

          {/* Mobile Card List */}
          <div className="md:hidden">
            <div className="divide-y divide-white/5">
              {nationsList.map((nation: any) => {
                 const diplomacy = nation.diplomacy || {};
                 const term = diplomacy.term || 0;
                 const endDate = term > 0 ? calculateEndDate(year, month, term) : null;
                 const rawState = typeof diplomacy.state === 'number' ? diplomacy.state : 2;
                 const stateInfo = diplomacyStateInfo[rawState] || diplomacyStateInfo[2];
                 
                 return (
                  <div key={nation.nation} className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg" style={{color: nation.nation === 0 ? '#E5E7EB' : nation.color}}>
                         {nation.name}
                      </span>
                      <span className="text-sm font-bold px-2 py-1 rounded bg-black/40" style={{color: stateInfo.color}}>
                        {stateInfo.name}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="bg-black/20 p-2 rounded border border-white/5">
                        <div className="text-xs text-gray-500 mb-1">국력</div>
                        <div className="text-gray-300">{nation.power?.toLocaleString() || '-'}</div>
                      </div>
                      <div className="bg-black/20 p-2 rounded border border-white/5">
                        <div className="text-xs text-gray-500 mb-1">장수</div>
                        <div className="text-gray-300">{nation.gennum?.toLocaleString() || '-'}</div>
                      </div>
                      <div className="bg-black/20 p-2 rounded border border-white/5">
                        <div className="text-xs text-gray-500 mb-1">속령</div>
                        <div className="text-gray-300">{nation.cityCnt?.toLocaleString() || '-'}</div>
                      </div>
                    </div>

                    {(term > 0) && (
                      <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
                        <span>기간: {term}개월</span>
                        <span>종료: {endDate ? `${endDate.year}년 ${endDate.month}월` : '-'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
             
             {/* Visual Budget Overview */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="flex justify-center">
                 <DonutChart
                   income={Math.floor(incomeGold)}
                   expense={Math.floor(outcome)}
                   current={gold}
                   label="자금"
                   incomeColor="#FBBF24"
                   expenseColor="#EF4444"
                 />
               </div>
               <div className="flex justify-center">
                 <DonutChart
                   income={Math.floor(incomeRice)}
                   expense={Math.floor(outcome)}
                   current={rice}
                   label="군량"
                   incomeColor="#22C55E"
                   expenseColor="#EF4444"
                 />
               </div>
               <div className="flex flex-col justify-center items-center gap-6">
                 <BudgetGauge 
                   current={gold} 
                   projected={Math.floor(gold + incomeGold - outcome)} 
                   label="예상 자금"
                   color="#FBBF24"
                 />
                 <BudgetGauge 
                   current={rice} 
                   projected={Math.floor(rice + incomeRice - outcome)} 
                   label="예상 군량"
                   color="#22C55E"
                 />
               </div>
             </div>

             {/* Income/Expense Bar Charts */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
               <div className="bg-black/20 border border-white/5 rounded-lg p-5">
                 <h3 className="text-yellow-500 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                   <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                   자금 수입 내역
                 </h3>
                 <BarChart
                   data={[
                     { label: '단기수입', value: income.gold?.war || 0, color: '#FBBF24' },
                     { label: '세금', value: Math.floor(income.gold?.city || 0), color: '#F59E0B' },
                   ]}
                 />
               </div>
               <div className="bg-black/20 border border-white/5 rounded-lg p-5">
                 <h3 className="text-green-500 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                   <span className="w-3 h-3 rounded-full bg-green-500"></span>
                   군량 수입 내역
                 </h3>
                 <BarChart
                   data={[
                     { label: '둔전수입', value: Math.floor(income.rice?.wall || 0), color: '#22C55E' },
                     { label: '세금', value: Math.floor(income.rice?.city || 0), color: '#16A34A' },
                   ]}
                 />
               </div>
             </div>

             {/* Finance Grid - Detailed */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Gold */}
                 <div className="bg-black/20 border border-white/5 rounded-lg p-5 space-y-4">
                    <h3 className="text-yellow-500 font-bold uppercase text-xs tracking-wider border-b border-white/5 pb-2 mb-2">자금 상세</h3>
                    <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                          <span className="text-gray-400">현재 자금</span>
                          <span className="text-white font-medium">{gold.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-400">단기수입</span>
                          <span className="text-white font-medium">{(income.gold?.war || 0).toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-400">세금</span>
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
                    <h3 className="text-green-500 font-bold uppercase text-xs tracking-wider border-b border-white/5 pb-2 mb-2">군량 상세</h3>
                    <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                          <span className="text-gray-400">현재 군량</span>
                          <span className="text-white font-medium">{rice.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-400">둔전수입</span>
                          <span className="text-white font-medium">{Math.floor(income.rice?.wall || 0).toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-400">세금</span>
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
                          <span className="text-green-500 font-bold">예상 군량</span>
                          <span className="text-green-400 font-bold text-lg">
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
                       {editable && !canToggleBlockWar && ' - 잔여 횟수 0회 (변경 불가)'}
                    </div>
                    <div className="space-y-2">
                       <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-offset-gray-900 focus:ring-1 focus:ring-blue-500"
                            checked={policy.blockWar} 
                            onChange={(e) => {
                              if (!editable || !canToggleBlockWar) return;
                              void setBlockWar(e.target.checked);
                            }}
                            disabled={!canToggleBlockWar}
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
