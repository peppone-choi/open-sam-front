'use client';

import dynamic from 'next/dynamic';

// Phaser는 window 객체가 필요하므로 클라이언트에서만 로드
const PhaserBattleMap = dynamic(
  () => import('@/components/battle/PhaserBattleMap'),
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
        🎮 Phaser 3 엔진 로딩 중...
      </div>
    )
  }
);

export default function PhaserBattlePage() {
  return <PhaserBattleMap />;
}

