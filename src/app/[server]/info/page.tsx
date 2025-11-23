'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function InfoPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const basePath = `/${serverID}/info`;

  const menuItems = [
    { label: '내 정보 & 설정', href: `${basePath}/me`, icon: '👤', desc: '개인 설정 및 정보 관리' },
    { label: '세력 정보', href: `${basePath}/nation`, icon: '🏳️', desc: '소속 국가의 상세 정보' },
    { label: '세력 도시', href: `${basePath}/city`, icon: '🏰', desc: '우리 세력이 통치하는 도시' },
    { label: '현재 도시', href: `${basePath}/current-city`, icon: '📍', desc: '현재 위치한 도시 정보' },
    { label: '인사 부', href: `${basePath}/officer`, icon: '📜', desc: '임관, 등용 및 장수 관리' },
    { label: '암행 부', href: `${basePath}/generals`, icon: '🕵️', desc: '타국 장수 및 동향 파악' },
    { label: '장수 정보', href: `${basePath}/general`, icon: '👥', desc: '전체 장수 목록 조회' },
    { label: '토너먼트 정보', href: `${basePath}/tournament`, icon: '🏆', desc: '천하제일 무술대회' },
    { label: '베팅 정보', href: `${basePath}/betting`, icon: '💰', desc: '토너먼트 베팅 현황' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-3xl font-bold text-white">정보 센터</h1>
          <p className="text-gray-400 text-sm">게임 내 다양한 정보를 확인하세요</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center p-6 rounded-xl border border-white/5 bg-gray-900/50 backdrop-blur-sm shadow-lg',
                'hover:bg-gray-800/80 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-200 group',
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
