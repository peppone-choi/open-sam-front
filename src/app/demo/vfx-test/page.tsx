'use client';

import dynamic from 'next/dynamic';

const VFXTestContent = dynamic(
  () => import('./VFXTestContent'),
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
        🎆 VFX 테스트 페이지 로딩 중...
      </div>
    )
  }
);

export default function VFXTestPage() {
  return <VFXTestContent />;
}
