'use client';

import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import TestPixi from '@/components/debug/TestPixi';

export default function TestPixiPage() {
  const params = useParams();
  const serverID = params?.server as string;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title={`Pixi 테스트 (${serverID})`} />
      <div className="p-4">
        <p className="mb-4 text-sm text-gray-400">
          아래 캔버스에 파란 배경과 토끼(bunny)가 가운데서 빙글빙글 돌면
          Pixi v8 + React 환경이 정상 동작하는 것입니다.
        </p>
        <div className="border border-white/10 rounded-lg overflow-hidden bg-black/40">
          <TestPixi />
        </div>
      </div>
    </div>
  );
}
