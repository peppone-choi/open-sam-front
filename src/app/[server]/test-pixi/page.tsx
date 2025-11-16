'use client';

import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import TestPixi from '@/components/debug/TestPixi';
import styles from '../battle-simulator/page.module.css';

export default function TestPixiPage() {
  const params = useParams();
  const serverID = params?.server as string;

  return (
    <div className={styles.container}>
      <TopBackBar title={`Pixi 테스트 (${serverID})`} />
      <div className={styles.content}>
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#9ca3af' }}>
          아래 캔버스에 파란 배경과 토끼(bunny)가 가운데서 빙글빙글 돌면
          Pixi v8 + React 환경이 정상 동작하는 것입니다.
        </p>
        <TestPixi />
      </div>
    </div>
  );
}
