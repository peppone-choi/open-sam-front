// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { ReplayPlayer } from '@/components/battle/replay';
import type { ReplayData } from '@/components/battle/replay';

// 샘플 데이터 import
import sampleReplay from '../../../../docs/mocks/sample-replay.json';

export default function ReplayDemoPage() {
  const [showResult, setShowResult] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
      padding: '24px',
    }}>
      {/* 헤더 */}
      <header style={{
        maxWidth: '900px',
        margin: '0 auto 24px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#e6edf3',
          marginBottom: '8px',
          textShadow: '0 0 30px rgba(88, 166, 255, 0.3)',
        }}>
          🎬 전투 리플레이 플레이어
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#8b949e',
        }}>
          턴제 전투의 리플레이를 시각적으로 재생합니다
        </p>
      </header>

      {/* 리플레이 플레이어 */}
      <div style={{ position: 'relative' }}>
        <ReplayPlayer
          data={sampleReplay as ReplayData}
          autoPlay={false}
          onComplete={() => setShowResult(true)}
        />
      </div>

      {/* 안내 */}
      <footer style={{
        maxWidth: '900px',
        margin: '24px auto 0',
        padding: '16px 24px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#e6edf3',
          marginBottom: '12px',
        }}>
          📖 사용 방법
        </h3>
        <ul style={{
          margin: 0,
          padding: '0 0 0 20px',
          fontSize: '13px',
          color: '#8b949e',
          lineHeight: '1.8',
        }}>
          <li><strong>▶ 재생 버튼</strong>: 전투 리플레이를 시작/일시정지합니다</li>
          <li><strong>⏮ 처음으로</strong>: 전투 시작 상태로 되돌립니다</li>
          <li><strong>슬라이더</strong>: 원하는 시점으로 이동합니다</li>
          <li><strong>속도 조절</strong>: 0.5x ~ 4x 배속으로 재생합니다</li>
        </ul>
      </footer>

      {/* 기술 정보 */}
      <div style={{
        maxWidth: '900px',
        margin: '16px auto 0',
        padding: '12px 24px',
        background: 'rgba(88, 166, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(88, 166, 255, 0.1)',
        fontSize: '12px',
        color: '#58a6ff',
      }}>
        <strong>🔧 기술 스택:</strong> React + Framer Motion + TypeScript
        &nbsp;|&nbsp;
        <strong>📁 데이터:</strong> <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>docs/mocks/sample-replay.json</code>
      </div>
    </div>
  );
}








