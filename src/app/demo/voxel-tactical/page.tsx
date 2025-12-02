'use client';

import dynamic from 'next/dynamic';

// Three.js는 클라이언트에서만 렌더링
const VoxelTacticalMap = dynamic(
  () => import('@/components/battle/VoxelTacticalMap'),
  { ssr: false }
);

export default function VoxelTacticalDemoPage() {
  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            🎮 복셀 전술 맵 데모
          </h1>
          <p className="text-gray-400 text-sm">
            복셀 유닛 시스템이 통합된 전술 맵입니다. 유닛을 클릭하여 선택하고, 
            땅을 클릭하여 이동 명령을 내릴 수 있습니다.
          </p>
        </header>

        <div className="bg-[#0a0a15] rounded-xl border border-white/10 overflow-hidden">
          <VoxelTacticalMap width={1200} height={700} />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard 
            title="조작 방법"
            items={[
              '유닛 클릭: 선택',
              '땅 클릭: 이동 명령',
              '공격 버튼: 공격 애니메이션',
              '방어 버튼: 방어 애니메이션',
            ]}
          />
          <InfoCard 
            title="유닛 종류"
            items={[
              '정규보병 (위): 기본 보병',
              '장궁병 (위): 원거리 궁수',
              '경기병 (촉): 빠른 기병',
              '황건신도 (황건): 반란군',
              '귀병 (오): 책사 유닛',
            ]}
          />
          <InfoCard 
            title="국가 색상"
            items={[
              '위 (魏): 파란색',
              '촉 (蜀): 초록색',
              '오 (吳): 빨간색',
              '황건: 노란색',
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
      <h3 className="text-white font-semibold mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
            <span className="text-blue-400">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

