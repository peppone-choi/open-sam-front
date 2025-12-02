'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Three.js는 클라이언트에서만 렌더링
const VoxelBattleMap = dynamic(
  () => import('@/components/battle/VoxelBattleMap'),
  { ssr: false }
);

export default function VoxelBattleDemoPage() {
  const [battleResult, setBattleResult] = useState<'attacker' | 'defender' | 'draw' | null>(null);
  const [key, setKey] = useState(0); // 리셋용 키

  const handleBattleEnd = (winner: 'attacker' | 'defender' | 'draw') => {
    setBattleResult(winner);
  };

  const handleReset = () => {
    setBattleResult(null);
    setKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#050510] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              ⚔️ 복셀 전투 시스템 데모
            </h1>
            <p className="text-gray-400 text-sm">
              실시간 전술 전투 시스템 - 병종 상성, 진형, 사기 시스템 포함
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            🔄 전투 리셋
          </button>
        </header>

        {/* 전투 맵 */}
        <div className="bg-[#0a0a15] rounded-xl border border-white/10 overflow-hidden">
          <VoxelBattleMap 
            key={key}
            width={1200} 
            height={700} 
            onBattleEnd={handleBattleEnd}
          />
        </div>

        {/* 하단 정보 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard 
            title="🎮 조작 방법"
            items={[
              '유닛 클릭 → 선택',
              '땅 클릭 → 이동 명령',
              'Shift + 적 클릭 → 공격 명령',
              '진형/자세 버튼 → 전술 변경',
            ]}
          />
          <InfoCard 
            title="⚔️ 병종 상성"
            items={[
              '보병 → 궁병 유리 (+30%)',
              '궁병 → 기병 유리 (+20%)',
              '기병 → 보병 유리 (+20%)',
              '기병 → 공성 매우 유리 (+50%)',
            ]}
          />
          <InfoCard 
            title="🛡️ 진형 효과"
            items={[
              '쐐기진: 공격+30%, 방어-30%',
              '방진: 공격-20%, 방어+40%',
              '학익진: 포위에 유리',
              '어린진: 기동성 증가',
            ]}
          />
          <InfoCard 
            title="💪 전투 요소"
            items={[
              '사기 20% 이하 → 패주',
              '훈련도 → 전투력 영향',
              '지형 → 병종별 보너스',
              '장수 능력치 → 데미지 계산',
            ]}
          />
        </div>

        {/* 공격/방어군 정보 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ArmyCard 
            title="공격군 (위나라)"
            color="blue"
            units={[
              { name: '정규보병', general: '조조', troops: 500 },
              { name: '장궁병', general: '하후연', troops: 400 },
              { name: '호표기', general: '조인', troops: 300 },
            ]}
          />
          <ArmyCard 
            title="방어군 (촉나라)"
            color="red"
            units={[
              { name: '촉한무위군', general: '유비', troops: 600 },
              { name: '장궁병', general: '황충', troops: 350 },
              { name: '경기병', general: '조운', troops: 250 },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-[#0a0a15] rounded-xl border border-white/10 p-4">
      <h3 className="text-white font-semibold mb-3 text-sm">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-gray-400 text-xs flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArmyCard({ 
  title, 
  color, 
  units 
}: { 
  title: string; 
  color: 'blue' | 'red'; 
  units: { name: string; general: string; troops: number }[];
}) {
  const borderColor = color === 'blue' ? 'border-blue-500/30' : 'border-red-500/30';
  const textColor = color === 'blue' ? 'text-blue-400' : 'text-red-400';

  return (
    <div className={`bg-[#0a0a15] rounded-xl border ${borderColor} p-4`}>
      <h3 className={`${textColor} font-semibold mb-3`}>{title}</h3>
      <div className="space-y-2">
        {units.map((unit, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <div>
              <span className="text-white">{unit.name}</span>
              <span className="text-gray-500 ml-2">({unit.general})</span>
            </div>
            <span className="text-gray-400 font-mono">{unit.troops}명</span>
          </div>
        ))}
      </div>
    </div>
  );
}

