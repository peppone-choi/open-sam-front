'use client';

import dynamic from 'next/dynamic';

const OptimizedBattleMap = dynamic(
  () => import('@/components/battle/OptimizedBattleMap'),
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
        ⚡ 최적화 엔진 로딩 중...
      </div>
    )
  }
);

export default function OptimizedBattlePage() {
  return <OptimizedBattleMap />;
}





