'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI, type ChiefCenterPayload, type ChiefFinancePayload, type ChiefPolicyPayload, type ChiefNoticePayload, type ChiefWarSettingPayload } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import ChiefReservedCommand from '@/components/game/ChiefReservedCommand';
import { cn } from '@/lib/utils';

// 하위 컴포넌트 임포트
import ChiefDomesticPanel from './ChiefDomesticPanel';
import ChiefPersonnelPanel from './ChiefPersonnelPanel';
import ChiefDiplomacyPanel from './ChiefDiplomacyPanel';

export default function ChiefPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [chiefData, setChiefData] = useState<ChiefCenterPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'turn' | 'domestic' | 'personnel' | 'diplomacy'>('turn');

  useEffect(() => {
    loadChiefData();
  }, [serverID]);

  async function loadChiefData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetChiefCenter({ serverID });

      if (result.result) {
        setChiefData(result.center || null);
      } else {
        const msg = result.reason || '제왕 권한이 없거나 국가에 소속되어 있지 않습니다.';
        alert(msg);
        if (serverID) {
          window.location.href = `/${serverID}/game`;
        } else {
          window.location.href = '/entrance';
        }
      }
    } catch (err) {
      console.error(err);
      alert('사령부 정보를 불러오는데 실패했습니다.');
      if (serverID) {
        window.location.href = `/${serverID}/game`;
      } else {
        window.location.href = '/entrance';
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <TopBackBar title="사 령 부" reloadable onReload={loadChiefData} />
        
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
             <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 상단 정보 패널 */}
            <div className="space-y-4">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
                {chiefData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoCard
                      title="국가"
                      subtitle={`Lv. ${chiefData.nation?.level ?? 0}`}
                      value={chiefData.nation?.name ?? '알 수 없음'}
                    />
                    <InfoCard
                      title="제왕"
                      subtitle={`관직 ${chiefData.chief?.officerLevel ?? 0}급`}
                      value={chiefData.chief?.name ?? '알 수 없음'}
                    />
                    <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5">
                      <span className="text-xs text-gray-500 uppercase font-bold mb-1">권한 자원</span>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div><span className="text-yellow-500 font-bold">금</span> {chiefData.powers?.gold?.toLocaleString() ?? 0}</div>
                        <div><span className="text-orange-500 font-bold">쌀</span> {chiefData.powers?.rice?.toLocaleString() ?? 0}</div>
                        <div><span className="text-blue-500 font-bold">기술</span> {chiefData.powers?.tech ?? 0}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {chiefData?.policy && (
                <PolicySummary
                  policy={chiefData.policy}
                  warSetting={chiefData.warSettingCnt}
                  timeline={chiefData.timeline}
                />
              )}

              {chiefData?.finance && (
                <FinanceSummary finance={chiefData.finance} />
              )}

              {(chiefData?.notices?.nation || chiefData?.notices?.scout) && (
                <NoticeSummary notices={chiefData.notices} />
              )}
            </div>

            {/* 탭 메뉴 */}
            <div className="flex border-b border-white/10">
              {[
                { id: 'turn', label: '수뇌부 턴' },
                { id: 'domestic', label: '내정 관리' },
                { id: 'personnel', label: '인사 관리' },
                { id: 'diplomacy', label: '외교/전략' },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  className={cn(
                    "px-6 py-3 text-sm font-bold transition-colors relative",
                    activeTab === tab.id 
                      ? "text-white border-b-2 border-blue-500" 
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  )}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 탭 컨텐츠 */}
            <div className="bg-gray-900/30 rounded-xl border border-white/5 p-6 min-h-[400px]">
              {activeTab === 'turn' && (
                <ChiefReservedCommand serverID={serverID} maxChiefTurn={chiefData?.timeline?.maxChiefTurn} />
              )}
              {activeTab === 'domestic' && (
                <ChiefDomesticPanel
                  serverID={serverID}
                  policy={chiefData?.policy}
                  finance={chiefData?.finance}
                  warSettingCnt={chiefData?.warSettingCnt}
                  onUpdate={loadChiefData}
                />
              )}
              {activeTab === 'personnel' && (
                <ChiefPersonnelPanel serverID={serverID} chiefData={chiefData} onUpdate={loadChiefData} />
              )}
              {activeTab === 'diplomacy' && (
                <ChiefDiplomacyPanel
                  serverID={serverID}
                  notices={chiefData?.notices}
                  onUpdate={loadChiefData}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type InfoCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

function InfoCard({ title, value, subtitle }: InfoCardProps) {
  return (
    <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5">
      <span className="text-xs text-gray-500 uppercase font-bold mb-1">{title}</span>
      <span className="text-lg font-bold text-white">
        {value}{' '}
        {subtitle && <span className="text-sm text-gray-400 font-normal">{subtitle}</span>}
      </span>
    </div>
  );
}

function PolicySummary({
  policy,
  warSetting,
  timeline,
}: {
  policy: ChiefPolicyPayload;
  warSetting?: ChiefWarSettingPayload;
  timeline?: { maxChiefTurn: number; turnTerm: number };
}) {
  const policyItems = [
    { label: '세율', value: `${policy.rate ?? 0}%` },
    { label: '지급률', value: `${policy.bill ?? 0}%` },
    { label: '기밀 권한', value: `${policy.secretLimit ?? 0}년` },
    { label: '전쟁 금지', value: policy.blockWar ? '차단' : '허용' },
    { label: '임관 제한', value: policy.blockScout ? '차단' : '허용' },
  ];

  return (
    <div className="bg-gray-900/40 border border-white/5 rounded-xl p-4 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">국가 정책</h3>
        {timeline && (
          <div className="text-xs text-gray-400">
            수뇌 턴 {timeline.maxChiefTurn ?? 0}회 · 턴 간격 {timeline.turnTerm ?? 0}분
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {policyItems.map((item) => (
          <div
            key={item.label}
            className="bg-black/30 border border-white/5 rounded-lg p-3 text-sm"
          >
            <div className="text-xs text-gray-500 uppercase mb-1">{item.label}</div>
            <div className="text-white font-semibold">{item.value}</div>
          </div>
        ))}
      </div>
      {warSetting && (
        <div className="mt-3 text-xs text-gray-400">
          전쟁 금지 잔여 {warSetting.remain}회 (월 +{warSetting.inc}회, 최대 {warSetting.max}회)
        </div>
      )}
    </div>
  );
}

function FinanceSummary({ finance }: { finance: ChiefFinancePayload }) {
  const cards = [
    {
      title: '자금 (Gold)',
      data: finance.gold,
      breakdownLabels: { city: '세금', war: '전쟁' },
    },
    {
      title: '군량 (Rice)',
      data: finance.rice,
      breakdownLabels: { city: '세금', wall: '둔전' },
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-gray-900/40 border border-white/5 rounded-xl p-4">
          <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">{card.title}</h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <FinanceRow label="보유" value={card.data.current} highlight />
            <FinanceRow label="순이익" value={card.data.net} highlight positive />
            <FinanceRow label="수입" value={card.data.income} />
            <FinanceRow label="지출" value={card.data.outcome} />
            {Object.entries(card.data.breakdown || {}).map(([key, val]) => (
              <FinanceRow
                key={key}
                label={card.breakdownLabels[key as keyof typeof card.breakdownLabels] || key}
                value={val}
              />
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function FinanceRow({
  label,
  value,
  highlight,
  positive,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  positive?: boolean;
}) {
  const formatted = (value ?? 0).toLocaleString();
  return (
    <div className="flex flex-col bg-black/20 rounded-lg border border-white/5 p-2">
      <dt className="text-xs text-gray-400 uppercase">{label}</dt>
      <dd
        className={cn('text-sm font-semibold', {
          'text-green-400': highlight && positive,
          'text-white': highlight && !positive,
        })}
      >
        {positive ? `+${formatted}` : formatted}
      </dd>
    </div>
  );
}

function NoticeSummary({ notices }: { notices?: ChiefNoticePayload }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {notices?.nation && (
        <div className="bg-gray-900/40 border border-white/5 rounded-xl p-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wide mb-2">국가 방침</h4>
          <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed min-h-[120px]">
            {notices.nation.msg || '등록된 방침이 없습니다.'}
          </p>
          <div className="text-xs text-gray-500 mt-2">
            {notices.nation.author ?? '미상'} ·{' '}
            {notices.nation.date ? new Date(notices.nation.date).toLocaleString('ko-KR') : '미등록'}
          </div>
        </div>
      )}
      <div className="bg-gray-900/40 border border-white/5 rounded-xl p-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wide mb-2">임관 권유</h4>
        <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed min-h-[120px]">
          {notices?.scout || '등록된 임관 권유가 없습니다.'}
        </p>
      </div>
    </div>
  );
}
