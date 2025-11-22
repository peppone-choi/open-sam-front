'use client';

import { useState } from 'react';

type OfficeTab = 'personnel' | 'logistics' | 'finance';

export default function OfficePage() {
  const [activeTab, setActiveTab] = useState<OfficeTab>('personnel');

  return (
    <div className="h-full flex flex-col bg-[#050510] text-[#E0E0E0] font-mono">
      {/* 헤더 / 탭 */}
      <div className="flex border-b border-[#333] bg-[#101520]">
        <button 
          onClick={() => setActiveTab('personnel')}
          className={`px-6 py-3 hover:bg-[#333] ${activeTab === 'personnel' ? 'text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-[#9CA3AF]'}`}
        >
          인사 (人事)
        </button>
        <button 
          onClick={() => setActiveTab('logistics')}
          className={`px-6 py-3 hover:bg-[#333] ${activeTab === 'logistics' ? 'text-[#1E90FF] border-b-2 border-[#1E90FF]' : 'text-[#9CA3AF]'}`}
        >
          병참 (兵站)
        </button>
        <button 
          onClick={() => setActiveTab('finance')}
          className={`px-6 py-3 hover:bg-[#333] ${activeTab === 'finance' ? 'text-[#10B981] border-b-2 border-[#10B981]' : 'text-[#9CA3AF]'}`}
        >
          재정 (財務)
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'personnel' && <PersonnelPanel />}
        {activeTab === 'logistics' && <LogisticsPanel />}
        {activeTab === 'finance' && <FinancePanel />}
      </div>
    </div>
  );
}

function PersonnelPanel() {
  // 매뉴얼 P.33 승진 체계, P.36 보직 부여 참고
  const officers = [
    { id: 1, name: '줄리안 민츠', rank: '소위', merit: 4500 },
    { id: 2, name: '더스티 애텐버러', rank: '준제독', merit: 12000 },
    { id: 3, name: '발터 폰 쇤코프', rank: '준장', merit: 8900 },
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="border border-[#333] bg-[#101520] p-4">
        <h3 className="text-[#FFD700] border-b border-[#333] pb-2 mb-4">승진 단계</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[#9CA3AF]">
              <th className="pb-2">이름</th>
              <th className="pb-2">계급</th>
              <th className="pb-2 text-right">공적 점수</th>
            </tr>
          </thead>
          <tbody>
            {officers.map(off => (
              <tr key={off.id} className="border-b border-[#333]/50 hover:bg-[#FFFFFF]/5">
                <td className="py-2">{off.name}</td>
                <td className="py-2">{off.rank}</td>
                <td className="py-2 text-right">{off.merit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="border border-[#333] bg-[#101520] p-4">
        <h3 className="text-[#FFD700] border-b border-[#333] pb-2 mb-4">조치</h3>
        <div className="flex flex-col gap-2">
          <button className="bg-[#333] hover:bg-[#444] py-2 text-left px-4 border border-[#555]">
            📄 승진 요청
          </button>
          <button className="bg-[#333] hover:bg-[#444] py-2 text-left px-4 border border-[#555]">
            🎖️ 함대 배속
          </button>
          <button className="bg-[#333] hover:bg-[#444] py-2 text-left px-4 border border-[#555] text-red-400">
            🚫 장교 해임
          </button>
        </div>
      </div>
    </div>
  );
}

function LogisticsPanel() {
  // 매뉴얼 P.40 생산·보급 파트 참고
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-[#101520] border border-[#1E90FF] p-4 text-center">
        <div className="text-[#9CA3AF] text-xs">헤지니안 (P-1)</div>
        <div className="text-2xl font-bold my-2">98%</div>
        <div className="text-[#1E90FF] text-sm">생산 효율</div>
      </div>
      <div className="bg-[#101520] border border-[#1E90FF] p-4 text-center">
        <div className="text-[#9CA3AF] text-xs">총 보급량</div>
        <div className="text-2xl font-bold my-2">45,000</div>
        <div className="text-[#1E90FF] text-sm">톤</div>
      </div>
    </div>
  );
}


function FinancePanel() {
  // 구현된 경제 현황 뷰
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
         <div className="bg-[#101520] border border-[#10B981] p-4">
            <div className="text-[#9CA3AF] text-xs">국고</div>
            <div className="text-2xl font-bold text-[#10B981]">150,000 Cr</div>
         </div>
         <div className="bg-[#101520] border border-[#1E90FF] p-4">
            <div className="text-[#9CA3AF] text-xs">수입</div>
            <div className="text-xl font-bold text-[#1E90FF]">+5,000 / 턴</div>
         </div>
         <div className="bg-[#101520] border border-[#EF4444] p-4">
            <div className="text-[#9CA3AF] text-xs">지출</div>
            <div className="text-xl font-bold text-[#EF4444]">-3,200 / 턴</div>
         </div>
      </div>
      
      <div className="border border-[#333] bg-[#101520] p-4 flex-1 min-h-[200px]">
         <h3 className="text-[#FFD700] border-b border-[#333] pb-2 mb-2">재정 기록</h3>
         <div className="text-sm text-[#9CA3AF] font-mono space-y-1">
            <div>[796.01.01] 함대 유지비: -1,200 Cr</div>
            <div>[796.01.01] 세금 수입 (오딘): +3,500 Cr</div>
            <div>[795.12.31] 함선 건조: -50,000 Cr</div>
         </div>
      </div>
    </div>
  );
}
