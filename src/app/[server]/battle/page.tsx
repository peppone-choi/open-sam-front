'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TopBackBar from '@/components/common/TopBackBar';

export default function BattlePage() {
  const params = useParams();
  const serverID = params?.server as string;
  const basePath = `/${serverID}`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <TopBackBar title="전투" />
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
          <div className="text-gray-400 space-y-2 mb-8 text-center">
            <p>전투 목록을 보려면 특정 전투 ID가 필요합니다.</p>
            <p>전투는 게임 내에서 자동으로 생성되거나, 전투 센터에서 시작할 수 있습니다.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link 
              href={`${basePath}/battle-center`} 
              className="group flex flex-col items-center justify-center p-6 bg-black/20 border border-white/10 rounded-lg hover:bg-white/5 hover:border-blue-500/50 transition-all"
            >
              <span className="text-xl font-bold text-white group-hover:text-blue-400 mb-2">전투 센터</span>
              <span className="text-sm text-gray-500">전투 현황 및 기록 확인</span>
            </Link>
            <Link 
              href={`${basePath}/battle-simulator`} 
              className="group flex flex-col items-center justify-center p-6 bg-black/20 border border-white/10 rounded-lg hover:bg-white/5 hover:border-purple-500/50 transition-all"
            >
              <span className="text-xl font-bold text-white group-hover:text-purple-400 mb-2">전투 시뮬레이터</span>
              <span className="text-sm text-gray-500">전투 시뮬레이션 실행</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

