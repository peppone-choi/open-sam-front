'use client';

import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import PureTacticalMap, { type PureTacticalUnit } from '@/components/battle/PureTacticalMap';
import styles from '../battle-simulator/page.module.css';

export default function TacticalSandboxPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const logicalWidth = 12;
  const logicalHeight = 12;

  const units: PureTacticalUnit[] = [
    { id: 'u1', x: 3, y: 4, color: 0x3b82f6 }, // 파란 네모
    { id: 'u2', x: 8, y: 2, color: 0xef4444 }, // 빨간 네모
    { id: 'u3', x: 6, y: 9, color: 0x22c55e }, // 초록 네모
  ];

  return (
    <div className={styles.container}>
      <TopBackBar title={`전술맵 샌드박스 (${serverID})`} />
      <div className={styles.content}>
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#9ca3af' }}>
          완전히 독립된 Pixi 전술맵 컴포넌트입니다. 12x12 그리드 위에 세 개의 네모가
          올라가 있고, 칸을 클릭하면 좌표만 콜백으로 넘어갑니다.
        </p>
        <PureTacticalMap
          logicalWidth={logicalWidth}
          logicalHeight={logicalHeight}
          units={units}
          onCellClick={(x, y) => {
            console.log('[TacticalSandbox] cell click', x, y);
          }}
          onUnitClick={(id) => {
            console.log('[TacticalSandbox] unit click', id);
          }}
        />
      </div>
    </div>
  );
}
