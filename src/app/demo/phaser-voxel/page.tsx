'use client';

import dynamic from 'next/dynamic';

const PhaserVoxelBattleMap = dynamic(
  () => import('@/components/battle/PhaserVoxelBattleMap'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#1a1a2e',
        color: '#eee',
        fontSize: '1.5rem'
      }}>
        🎮 Phaser + Three.js + 복셀 하이브리드 엔진 로딩 중...
      </div>
    )
  }
);

export default function PhaserVoxelBattlePage() {
  return <PhaserVoxelBattleMap />;
}





