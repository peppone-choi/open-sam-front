'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ArchivePage() {
  const params = useParams();
  const serverID = params?.server as string;
  const basePath = `/${serverID}/archive`;

  const menuItems = [
    { label: '역대 장수 순위', href: `${basePath}/best-general`, icon: '🏅', desc: '역대 최고의 장수들' },
    { label: '역대 통일', href: `${basePath}/emperior`, icon: '👑', desc: '천하통일의 기록' },
    { label: '장수 목록', href: `${basePath}/gen-list`, icon: '📜', desc: '전체 장수 명단' },
    { label: '명예의 전당', href: `${basePath}/hall-of-fame`, icon: '🏛️', desc: '전설적인 기록들' },
    { label: '국가 목록', href: `${basePath}/kingdom-list`, icon: '🚩', desc: '역대 국가 정보' },
    { label: 'NPC 목록', href: `${basePath}/npc-list`, icon: '🤖', desc: '등장 NPC 정보' },
    { label: '접속 통계', href: `${basePath}/traffic`, icon: '📈', desc: '서버 접속 현황' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col items-center space-y-2">
           <h1 className="text-3xl font-bold text-white">기록실</h1>
           <p className="text-gray-400 text-sm">서버의 역사와 기록을 열람하세요</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-xl border border-white/5 bg-gray-900/50 backdrop-blur-sm shadow-lg",
                "hover:bg-gray-800/80 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-200 group"
              )}
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
              <div className="font-bold text-lg text-white mb-1">{item.label}</div>
              <div className="text-xs text-gray-500 text-center">{item.desc}</div>
            </Link>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <Link 
            href={`/${serverID}/game`}
            className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm transition-colors"
          >
            ← 게임으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
