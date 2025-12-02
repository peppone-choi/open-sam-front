/**
 * 국가 정보 대시보드 패널
 * 외교 관계, 재정 상태, 국가 통계를 한눈에 보여주는 컴팩트 패널
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { SammoAPI, type NationStratFinanPayload } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';
import { isBrightColor } from '@/utils/isBrightColor';
import { getNPCColor } from '@/utils/getNPCColor';
import type { ColorSystem } from '@/types/colorSystem';

// 외교 상태 정보
const DIPLOMACY_STATE: Record<number, { name: string; color: string; bgColor: string }> = {
  0: { name: '교전', color: '#EF4444', bgColor: 'bg-red-500/20' },
  1: { name: '선포', color: '#F472B6', bgColor: 'bg-pink-500/20' },
  2: { name: '통상', color: '#9CA3AF', bgColor: 'bg-gray-500/20' },
  7: { name: '불가침', color: '#22C55E', bgColor: 'bg-green-500/20' },
};

interface NationPanelProps {
  serverID: string;
  nationId: number;
  nationName: string;
  nationColor: string;
  colorSystem?: ColorSystem;
  className?: string;
  compact?: boolean;
  showDiplomacy?: boolean;
  showFinance?: boolean;
  showLeaders?: boolean;
}

export function NationPanel({
  serverID,
  nationId,
  nationName,
  nationColor,
  colorSystem,
  className,
  compact = false,
  showDiplomacy = true,
  showFinance = true,
  showLeaders = true,
}: NationPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NationStratFinanPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'diplomacy' | 'finance'>('overview');

  const textColor = useMemo(() => 
    isBrightColor(nationColor) ? '#1F2937' : '#FFFFFF'
  , [nationColor]);

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!serverID || !nationId) return;
    
    try {
      setLoading(true);
      const result = await SammoAPI.NationGetStratFinan({ serverID });
      if (result.result) {
        setData(result.stratFinan);
      }
    } catch (err) {
      console.error('국가 정보 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [serverID, nationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 재정 계산
  const finance = useMemo(() => {
    if (!data) return null;
    const income = data.income || { gold: { war: 0, city: 0 }, rice: { wall: 0, city: 0 } };
    const outcome = data.outcome || 0;
    
    return {
      gold: data.gold || 0,
      rice: data.rice || 0,
      incomeGold: (income.gold?.war || 0) + (income.gold?.city || 0),
      incomeRice: (income.rice?.wall || 0) + (income.rice?.city || 0),
      outcome,
      projectedGold: Math.floor((data.gold || 0) + (income.gold?.war || 0) + (income.gold?.city || 0) - outcome),
      projectedRice: Math.floor((data.rice || 0) + (income.rice?.wall || 0) + (income.rice?.city || 0) - outcome),
    };
  }, [data]);

  // 외교 관계 목록
  const diplomacyList = useMemo(() => {
    if (!data?.nationsList) return [];
    return data.nationsList.filter((n: any) => n.nation !== nationId);
  }, [data, nationId]);

  // 로딩 상태
  if (loading) {
    return (
      <div className={cn(
        'rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur overflow-hidden',
        className,
      )}>
        <div className="p-4 flex items-center justify-center">
          <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
        </div>
      </div>
    );
  }

  // 재야인 경우
  if (!nationId || nationId === 0) {
    return (
      <div className={cn(
        'rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur overflow-hidden',
        className,
      )}>
        <div className="p-4 text-center text-gray-500 text-sm">
          소속 국가가 없습니다
        </div>
      </div>
    );
  }

  // 컴팩트 모드
  if (compact) {
    return (
      <div className={cn(
        'rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur overflow-hidden',
        className,
      )}>
        {/* 헤더 */}
        <div
          className="px-4 py-3 border-b border-white/10"
          style={{ backgroundColor: nationColor }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm" style={{ color: textColor }}>
              {nationName}
            </h3>
            <Link
              href={`/${serverID}/nation`}
              className="text-xs px-2 py-1 rounded bg-black/20 hover:bg-black/30 transition-colors"
              style={{ color: textColor }}
            >
              상세 보기
            </Link>
          </div>
        </div>

        {/* 핵심 정보 */}
        <div className="p-3 grid grid-cols-2 gap-2">
          <StatBox label="국고" value={finance?.gold?.toLocaleString() || '0'} icon="💰" />
          <StatBox label="병량" value={finance?.rice?.toLocaleString() || '0'} icon="🌾" />
          <StatBox label="예상 국고" value={finance?.projectedGold?.toLocaleString() || '0'} icon="📈" trend={finance ? finance.projectedGold - finance.gold : 0} />
          <StatBox label="예상 병량" value={finance?.projectedRice?.toLocaleString() || '0'} icon="📊" trend={finance ? finance.projectedRice - finance.rice : 0} />
        </div>

        {/* 외교 미니 표시 */}
        {showDiplomacy && diplomacyList.length > 0 && (
          <div className="px-3 pb-3">
            <div className="text-[10px] text-gray-500 mb-1.5">외교 관계</div>
            <div className="flex flex-wrap gap-1">
              {diplomacyList.slice(0, 5).map((nation: any) => {
                const state = DIPLOMACY_STATE[nation.diplomacy?.state ?? 2];
                return (
                  <span
                    key={nation.nation}
                    className={cn('px-2 py-0.5 rounded text-[10px] font-medium', state.bgColor)}
                    style={{ color: state.color }}
                  >
                    {nation.name}
                  </span>
                );
              })}
              {diplomacyList.length > 5 && (
                <span className="px-2 py-0.5 rounded text-[10px] text-gray-500 bg-white/5">
                  +{diplomacyList.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 전체 모드
  return (
    <div className={cn(
      'rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur overflow-hidden',
      className,
    )}>
      {/* 헤더 */}
      <div
        className="px-4 py-3 border-b border-white/10"
        style={{ backgroundColor: nationColor }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: textColor }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21V12a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9" />
            </svg>
            {nationName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="p-1.5 rounded bg-black/20 hover:bg-black/30 transition-colors"
              style={{ color: textColor }}
              aria-label="새로고침"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
            </button>
            <Link
              href={`/${serverID}/nation`}
              className="text-xs px-3 py-1.5 rounded bg-black/20 hover:bg-black/30 transition-colors"
              style={{ color: textColor }}
            >
              국가 관리 →
            </Link>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-white/10 bg-black/20">
        {[
          { key: 'overview', label: '개요', icon: '📊' },
          { key: 'diplomacy', label: '외교', icon: '🤝' },
          { key: 'finance', label: '재정', icon: '💰' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              'flex-1 px-4 py-2 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'text-white bg-white/10 border-b-2'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5',
            )}
            style={{
              borderColor: activeTab === tab.key ? colorSystem?.accent || nationColor : 'transparent',
            }}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="p-4"
        >
          {activeTab === 'overview' && (
            <OverviewTab
              data={data}
              finance={finance}
              diplomacyList={diplomacyList}
              nationColor={nationColor}
              colorSystem={colorSystem}
            />
          )}
          {activeTab === 'diplomacy' && (
            <DiplomacyTab
              diplomacyList={diplomacyList}
              year={data?.year || 0}
              month={data?.month || 0}
            />
          )}
          {activeTab === 'finance' && (
            <FinanceTab finance={finance} data={data} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// 통계 박스 컴포넌트
function StatBox({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon: string;
  trend?: number;
}) {
  return (
    <div className="bg-black/30 rounded-lg p-2.5 border border-white/5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500">{label}</span>
        <span className="text-sm">{icon}</span>
      </div>
      <div className="text-sm font-bold text-white">{value}</div>
      {trend !== undefined && (
        <div className={cn(
          'text-[10px] mt-0.5',
          trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-500',
        )}>
          {trend > 0 ? '+' : ''}{trend.toLocaleString()}
        </div>
      )}
    </div>
  );
}

// 개요 탭
function OverviewTab({
  data,
  finance,
  diplomacyList,
  nationColor,
  colorSystem,
}: {
  data: NationStratFinanPayload | null;
  finance: {
    gold: number;
    rice: number;
    incomeGold: number;
    incomeRice: number;
    outcome: number;
    projectedGold: number;
    projectedRice: number;
  } | null;
  diplomacyList: any[];
  nationColor: string;
  colorSystem?: ColorSystem;
}) {
  // 교전/불가침 국가 수
  const warCount = diplomacyList.filter((n) => n.diplomacy?.state === 0).length;
  const allyCount = diplomacyList.filter((n) => n.diplomacy?.state === 7).length;

  return (
    <div className="space-y-4">
      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="국고" value={finance?.gold?.toLocaleString() || '0'} icon="💰" />
        <StatBox label="병량" value={finance?.rice?.toLocaleString() || '0'} icon="🌾" />
        <StatBox
          label="예상 국고"
          value={finance?.projectedGold?.toLocaleString() || '0'}
          icon="📈"
          trend={finance ? finance.projectedGold - finance.gold : 0}
        />
        <StatBox
          label="예상 병량"
          value={finance?.projectedRice?.toLocaleString() || '0'}
          icon="📊"
          trend={finance ? finance.projectedRice - finance.rice : 0}
        />
      </div>

      {/* 외교 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{warCount}</div>
          <div className="text-[10px] text-red-400/70">교전 중</div>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-400">{diplomacyList.length - warCount - allyCount}</div>
          <div className="text-[10px] text-gray-400/70">통상</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{allyCount}</div>
          <div className="text-[10px] text-green-400/70">불가침</div>
        </div>
      </div>

      {/* 정책 상태 */}
      <div className="flex flex-wrap gap-2">
        <PolicyBadge
          label="세율"
          value={`${data?.policy?.rate || (data as any)?.rate || 10}%`}
          active
        />
        <PolicyBadge
          label="지급률"
          value={`${data?.policy?.bill || (data as any)?.bill || 0}%`}
          active
        />
        <PolicyBadge
          label="전쟁"
          value={data?.policy?.blockWar || (data as any)?.blockWar ? '금지' : '허가'}
          active={!(data?.policy?.blockWar || (data as any)?.blockWar)}
          variant={data?.policy?.blockWar || (data as any)?.blockWar ? 'danger' : 'success'}
        />
        <PolicyBadge
          label="임관"
          value={data?.policy?.blockScout || (data as any)?.blockScout ? '금지' : '허가'}
          active={!(data?.policy?.blockScout || (data as any)?.blockScout)}
          variant={data?.policy?.blockScout || (data as any)?.blockScout ? 'danger' : 'success'}
        />
      </div>
    </div>
  );
}

// 정책 뱃지
function PolicyBadge({
  label,
  value,
  active,
  variant = 'default',
}: {
  label: string;
  value: string;
  active?: boolean;
  variant?: 'default' | 'success' | 'danger';
}) {
  const variantStyles = {
    default: 'bg-white/5 border-white/10 text-gray-300',
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    danger: 'bg-red-500/10 border-red-500/20 text-red-400',
  };

  return (
    <div className={cn(
      'px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2',
      variantStyles[variant],
    )}>
      <span className="text-gray-500">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

// 외교 탭
function DiplomacyTab({
  diplomacyList,
  year,
  month,
}: {
  diplomacyList: any[];
  year: number;
  month: number;
}) {
  // 종료 시점 계산
  const calculateEndDate = (term: number) => {
    if (!term) return null;
    const totalMonths = year * 12 + month + term;
    return {
      year: Math.floor(totalMonths / 12),
      month: totalMonths % 12 || 12,
    };
  };

  if (diplomacyList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        다른 국가가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {diplomacyList.map((nation: any) => {
        const state = DIPLOMACY_STATE[nation.diplomacy?.state ?? 2];
        const term = nation.diplomacy?.term || 0;
        const endDate = calculateEndDate(term);

        return (
          <div
            key={nation.nation}
            className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:bg-black/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: nation.color }}
              />
              <div>
                <div className="font-medium text-white text-sm">{nation.name}</div>
                <div className="text-[10px] text-gray-500">
                  국력 {nation.power?.toLocaleString() || '-'} / 장수 {nation.gennum || '-'}명
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {term > 0 && endDate && (
                <div className="text-right text-[10px] text-gray-500">
                  <div>{term}개월</div>
                  <div>{endDate.year}년 {endDate.month}월까지</div>
                </div>
              )}
              <span
                className={cn('px-2.5 py-1 rounded text-xs font-bold', state.bgColor)}
                style={{ color: state.color }}
              >
                {state.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 재정 탭
function FinanceTab({
  finance,
  data,
}: {
  finance: {
    gold: number;
    rice: number;
    incomeGold: number;
    incomeRice: number;
    outcome: number;
    projectedGold: number;
    projectedRice: number;
  } | null;
  data: NationStratFinanPayload | null;
}) {
  if (!finance) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        재정 정보를 불러올 수 없습니다
      </div>
    );
  }

  const income = data?.income || { gold: { war: 0, city: 0 }, rice: { wall: 0, city: 0 } };

  return (
    <div className="space-y-4">
      {/* 자금 */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
        <h4 className="text-yellow-500 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>💰</span> 자금 예산
        </h4>
        <div className="space-y-2 text-sm">
          <FinanceRow label="현재 국고" value={finance.gold} />
          <FinanceRow label="단기 수입" value={income.gold?.war || 0} positive />
          <FinanceRow label="세금 수입" value={Math.floor(income.gold?.city || 0)} positive />
          <FinanceRow label="지출" value={-Math.floor(finance.outcome)} negative />
          <div className="border-t border-yellow-500/20 pt-2 mt-2">
            <FinanceRow
              label="예상 국고"
              value={finance.projectedGold}
              highlight
            />
          </div>
        </div>
      </div>

      {/* 병량 */}
      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
        <h4 className="text-green-500 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>🌾</span> 군량 예산
        </h4>
        <div className="space-y-2 text-sm">
          <FinanceRow label="현재 병량" value={finance.rice} />
          <FinanceRow label="둔전 수입" value={Math.floor(income.rice?.wall || 0)} positive />
          <FinanceRow label="세금 수입" value={Math.floor(income.rice?.city || 0)} positive />
          <FinanceRow label="지출" value={-Math.floor(finance.outcome)} negative />
          <div className="border-t border-green-500/20 pt-2 mt-2">
            <FinanceRow
              label="예상 병량"
              value={finance.projectedRice}
              highlight
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 재정 행
function FinanceRow({
  label,
  value,
  positive,
  negative,
  highlight,
}: {
  label: string;
  value: number;
  positive?: boolean;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'flex justify-between',
      highlight && 'font-bold',
    )}>
      <span className={cn(
        highlight ? 'text-white' : 'text-gray-400',
      )}>
        {label}
      </span>
      <span className={cn(
        positive && 'text-green-400',
        negative && 'text-red-400',
        !positive && !negative && 'text-white',
        highlight && 'text-lg',
      )}>
        {positive && value > 0 && '+'}
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default NationPanel;


