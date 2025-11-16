'use client';

import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import ThreeTacticalMap from '@/components/battle/ThreeTacticalMap';
import styles from '../battle-simulator/page.module.css';

export default function ThreeTacticalPage() {
  const params = useParams();
  const serverID = params?.server as string;

  return (
    <div className={styles.container}>
      <TopBackBar title={`three.js 전술맵 샌드박스 (${serverID})`} />
      <div className={styles.content}>
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#9ca3af' }}>
          three.js로 렌더링한 전술맵 샌드박스입니다. 등각에 가까운 카메라 시점에서
          그리드와 정육면체 유닛 3개를 확인할 수 있습니다.
        </p>
        <ThreeTacticalMap width={960} height={640} />
      </div>
    </div>
  );
}
