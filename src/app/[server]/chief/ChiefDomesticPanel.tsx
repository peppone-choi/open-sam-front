'use client';

import React, { useState, useEffect } from 'react';
import { SammoAPI, type ChiefFinancePayload, type ChiefPolicyPayload, type ChiefWarSettingPayload } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

interface ChiefDomesticPanelProps {
  serverID: string;
  policy?: ChiefPolicyPayload;
  warSettingCnt?: ChiefWarSettingPayload;
  finance?: ChiefFinancePayload;
  onUpdate: () => void;
}

export default function ChiefDomesticPanel({ serverID, policy, warSettingCnt, finance, onUpdate }: ChiefDomesticPanelProps) {
  const { showToast } = useToast();
  const [rate, setRate] = useState<number>(0);
  const [bill, setBill] = useState<number>(0);
  const [secretLimit, setSecretLimit] = useState<number>(0);
  const [blockWar, setBlockWar] = useState<boolean>(false);
  const [blockScout, setBlockScout] = useState<boolean>(false);

  useEffect(() => {
    if (policy) {
      setRate(policy.rate ?? 0);
      setBill(policy.bill ?? 0);
      setSecretLimit(policy.secretLimit ?? 0);
      setBlockWar(!!policy.blockWar);
      setBlockScout(!!policy.blockScout);
    }
  }, [policy]);

  const handleSetRate = async () => {
    try {
      const result = await SammoAPI.NationSetRate({ amount: rate, serverID });
      if (result.result) {
        showToast('세율이 변경되었습니다.', 'success');
        onUpdate();
      } else {
        showToast(result.reason || '세율 변경 실패', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('세율 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSetBill = async () => {
    try {
      const result = await SammoAPI.NationSetBill({ amount: bill, serverID });
      if (result.result) {
        showToast('징병비가 변경되었습니다.', 'success');
        onUpdate();
      } else {
        showToast(result.reason || '징병비 변경 실패', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('징병비 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSetSecretLimit = async () => {
    try {
      const result = await SammoAPI.NationSetSecretLimit({ amount: secretLimit, serverID });
      if (result.result) {
        showToast('기밀 권한이 변경되었습니다.', 'success');
        onUpdate();
      } else {
        showToast(result.reason || '기밀 권한 변경 실패', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('기밀 권한 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSetBlockWar = async (value: boolean) => {
    try {
      const result = await SammoAPI.NationSetBlockWar({ value, serverID });
      if (result.result) {
        setBlockWar(value);
        showToast('전쟁 금지 설정이 변경되었습니다.', 'success');
        onUpdate();
      } else {
        showToast(result.reason || '설정 실패', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('설정 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSetBlockScout = async (value: boolean) => {
    try {
      const result = await SammoAPI.NationSetBlockScout({ value, serverID });
      if (result.result) {
        setBlockScout(value);
        showToast('정찰 금지 설정이 변경되었습니다.', 'success');
        onUpdate();
      } else {
        showToast(result.reason || '설정 실패', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('설정 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">내정 설정</h3>

      {finance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FinanceCard
            title="자금 현황"
            summary={finance.gold}
            labelMap={{ city: '세금', war: '전쟁' }}
          />
          <FinanceCard
            title="군량 현황"
            summary={finance.rice}
            labelMap={{ city: '세금', wall: '둔전' }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 세율 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">세율 설정 (%)</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={rate} 
              onChange={(e) => setRate(Number(e.target.value))}
              min={0} max={100}
              className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-right"
            />
            <button 
              onClick={handleSetRate}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-blue-900/20"
            >
              변경
            </button>
          </div>
        </div>

        {/* 징병비 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">징병비 설정</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={bill} 
              onChange={(e) => setBill(Number(e.target.value))}
              min={0}
              className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-right"
            />
            <button 
              onClick={handleSetBill}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-blue-900/20"
            >
              변경
            </button>
          </div>
        </div>

        {/* 기밀 권한 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">기밀 권한 (관직 등급)</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={secretLimit} 
              onChange={(e) => setSecretLimit(Number(e.target.value))}
              min={0} max={99}
              className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-right"
            />
            <button 
              onClick={handleSetSecretLimit}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-blue-900/20"
            >
              변경
            </button>
          </div>
        </div>

        {/* 전쟁 금지 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">전쟁 금지</label>
          {warSettingCnt && (
            <p className="text-xs text-gray-400">
              잔여 {warSettingCnt.remain}회 · 월 +{warSettingCnt.inc}회 (최대 {warSettingCnt.max}회)
            </p>
          )}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button 
              className={cn(
                "flex-1 py-2 text-xs font-bold transition-colors",
                blockWar ? "bg-red-600 text-white" : "bg-black/40 text-gray-500 hover:bg-white/5"
              )}
              onClick={() => handleSetBlockWar(true)}
            >
              금지
            </button>
            <button 
              className={cn(
                "flex-1 py-2 text-xs font-bold transition-colors border-l border-white/10",
                !blockWar ? "bg-green-600 text-white" : "bg-black/40 text-gray-500 hover:bg-white/5"
              )}
              onClick={() => handleSetBlockWar(false)}
            >
              허용
            </button>
          </div>
        </div>

        {/* 임관 금지 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">임관 금지</label>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button 
              className={cn(
                "flex-1 py-2 text-xs font-bold transition-colors",
                blockScout ? "bg-red-600 text-white" : "bg-black/40 text-gray-500 hover:bg-white/5"
              )}
              onClick={() => handleSetBlockScout(true)}
            >
              금지
            </button>
            <button 
              className={cn(
                "flex-1 py-2 text-xs font-bold transition-colors border-l border-white/10",
                !blockScout ? "bg-green-600 text-white" : "bg-black/40 text-gray-500 hover:bg-white/5"
              )}
              onClick={() => handleSetBlockScout(false)}
            >
              허용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FinanceCardProps {
  title: string;
  summary: {
    current: number;
    income: number;
    outcome: number;
    net: number;
    breakdown?: Record<string, number>;
  };
  labelMap: Record<string, string>;
}

function FinanceCard({ title, summary, labelMap }: FinanceCardProps) {
  return (
    <div className="bg-gray-900/40 border border-white/5 rounded-xl p-4">
      <h4 className="text-sm font-bold text-white uppercase tracking-wide mb-3">{title}</h4>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <FinanceStat label="보유" value={summary.current} />
        <FinanceStat label="순이익" value={summary.net} highlight />
        <FinanceStat label="수입" value={summary.income} />
        <FinanceStat label="지출" value={summary.outcome} />
        {summary.breakdown &&
          Object.entries(summary.breakdown).map(([key, value]) => (
            <FinanceStat
              key={key}
              label={labelMap[key] ?? key}
              value={value}
            />
          ))}
      </dl>
    </div>
  );
}

function FinanceStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex flex-col bg-black/20 rounded-lg border border-white/5 p-2">
      <dt className="text-xs text-gray-400 uppercase">{label}</dt>
      <dd className={cn('text-sm font-semibold', highlight ? 'text-green-400' : 'text-white')}>
        {value?.toLocaleString() ?? 0}
      </dd>
    </div>
  );
}

