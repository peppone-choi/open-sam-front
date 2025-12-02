'use client';

import dynamic from 'next/dynamic';

// 동적 임포트로 클라이언트 컴포넌트 로드
const TurnBasedBattleDemo = dynamic(
  () => import('@/components/battle/TurnBasedBattleDemo'),
  { 
    ssr: false,
    loading: () => (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a2e',
        color: '#fff',
        fontFamily: 'monospace',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⚔️</div>
          <div>전투 UI 로딩중...</div>
        </div>
      </div>
    ),
  }
);

export default function TurnBasedBattlePage() {
  return <TurnBasedBattleDemo />;
}




