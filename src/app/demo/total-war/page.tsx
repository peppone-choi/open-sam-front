'use client';

import dynamic from 'next/dynamic';

const TotalWarBattleMap = dynamic(
  () => import('@/components/battle/TotalWarBattleMap'),
  { ssr: false }
);

export default function TotalWarDemoPage() {
  return <TotalWarBattleMap />;
}

