'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
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
  const [chiefData, setChiefData] = useState<any>(null);
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
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
              {chiefData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-1">국가</span>
                    <span className="text-lg font-bold text-white">{chiefData.nation?.name ?? '알 수 없음'} <span className="text-sm text-gray-400 font-normal">(Lv. {chiefData.nation?.level ?? 0})</span></span>
                  </div>
                  <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-1">제왕</span>
                    <span className="text-lg font-bold text-white">{chiefData.chief?.name ?? '알 수 없음'} <span className="text-sm text-gray-400 font-normal">(관직 {chiefData.chief?.officerLevel ?? 0}급)</span></span>
                  </div>
                  <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-1">권한 자원</span>
                    <div className="flex gap-4 text-sm">
                      <div><span className="text-yellow-500 font-bold">금</span> {chiefData.powers?.gold?.toLocaleString() ?? 0}</div>
                      <div><span className="text-orange-500 font-bold">쌀</span> {chiefData.powers?.rice?.toLocaleString() ?? 0}</div>
                      <div><span className="text-blue-500 font-bold">기술</span> {chiefData.powers?.tech ?? 0}</div>
                    </div>
                  </div>
                </div>
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
                <ChiefReservedCommand serverID={serverID} />
              )}
              {activeTab === 'domestic' && (
                <ChiefDomesticPanel serverID={serverID} chiefData={chiefData} onUpdate={loadChiefData} />
              )}
              {activeTab === 'personnel' && (
                <ChiefPersonnelPanel serverID={serverID} chiefData={chiefData} onUpdate={loadChiefData} />
              )}
              {activeTab === 'diplomacy' && (
                <ChiefDiplomacyPanel serverID={serverID} chiefData={chiefData} onUpdate={loadChiefData} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
