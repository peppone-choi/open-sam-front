'use client';

import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import ThreeTacticalMap from '@/components/battle/ThreeTacticalMap';

export default function ThreeTacticalPage() {
  const params = useParams();
  const serverID = params?.server as string;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title={`three.js 전술맵 샌드박스 (${serverID})`} />
      <div className="p-4">
        <p className="mb-4 text-sm text-gray-400">
          three.js로 렌더링한 전술맵 샌드박스입니다. 등각에 가까운 카메라 시점에서
          그리드와 정육면체 유닛 3개를 확인할 수 있습니다.
        </p>
        <div className="border border-white/10 rounded-lg overflow-hidden bg-black/40">
          <ThreeTacticalMap width={960} height={640} />
        </div>
      </div>
    </div>
  );
}
