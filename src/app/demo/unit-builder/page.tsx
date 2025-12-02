'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Three.js는 SSR에서 문제가 있으므로 동적 임포트
const RealismUnitPreview = dynamic(
  () => import('@/components/battle/units/RealismUnitPreview'),
  { 
    ssr: false,
    loading: () => <LoadingBox />,
  }
);

function LoadingBox() {
  return (
    <div style={{
      width: '100%',
      height: 400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a2e',
      borderRadius: 8,
      color: '#9ca3af',
    }}>
      ⏳ 로딩 중...
    </div>
  );
}

export default function UnitBuilderDemo() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#e5e7eb',
            margin: '0 0 12px',
          }}>
            ⚔️ 리얼리즘 유닛 빌더
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginBottom: 20 }}>
            역사적 고증과 리얼한 질감의 3D 유닛 생성기
          </p>
        </header>

        {/* 프리뷰 (ID 선택기 포함) */}
        <RealismUnitPreview width={800} height={500} />

        {/* 설명 */}
        <section style={{
          marginTop: 32,
          padding: 24,
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ color: '#e5e7eb', fontSize: '1.25rem', margin: '0 0 16px' }}>
            🛡️ 시스템 특징
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
          }}>
            <FeatureCard icon="🎨" title="절차적 텍스처" items={['노이즈/스크래치 자동 생성', '금속/가죽/천 질감', 'PBR 머티리얼']} />
            <FeatureCard icon="👤" title="7.5등신 비율" items={['실사 비례', '역삼각형 상체', '자연스러운 관절']} />
            <FeatureCard icon="📚" title="방대한 DB" items={['100여 종 유닛 정의', '고증 반영 장비', '국가별 색상']} />
            <FeatureCard icon="🐴" title="다양한 탈것" items={['일반말/백마/흑마', '중장 마갑마', '공성 수레']} />
          </div>
        </section>

        {/* 코드 예시 */}
        <section style={{
          marginTop: 24,
          padding: 24,
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: 12,
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <h2 style={{ color: '#e5e7eb', fontSize: '1.25rem', margin: '0 0 12px' }}>
            💡 사용법
          </h2>
          <pre style={{
            background: '#0f0f1a',
            padding: 16,
            borderRadius: 8,
            color: '#4ade80',
            fontSize: '0.8rem',
            overflow: 'auto',
          }}>
{`import { buildUnitById } from '@/components/battle/units/RealismUnitBuilder';
import { NATION_PALETTES } from '@/components/battle/units/DetailedUnitBuilder';

// ID로 유닛 생성 (1106: 대방패병, 위나라 색상)
const unit = buildUnitById(
  1106, 
  NATION_PALETTES.wei.primary, 
  NATION_PALETTES.wei.secondary
);

scene.add(unit);`}
          </pre>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  items 
}: { 
  icon: string; 
  title: string; 
  items: string[];
}) {
  return (
    <div style={{
      padding: 16,
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 8,
      border: '1px solid rgba(255, 255, 255, 0.05)',
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{icon}</div>
      <h3 style={{ color: '#e5e7eb', fontSize: '0.9rem', margin: '0 0 8px' }}>
        {title}
      </h3>
      <ul style={{
        margin: 0,
        paddingLeft: 16,
        color: '#9ca3af',
        fontSize: '0.8rem',
        lineHeight: 1.6,
      }}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
