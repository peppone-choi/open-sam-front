'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

export default function AdminMainPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const adminMenus = [
    {
      title: '일제 정보',
      description: '전체 게임 상태를 한눈에 확인',
      href: `/${serverID}/admin/info`,
      icon: '📊',
    },
    {
      title: '게임 설정',
      description: '게임 규칙 및 설정 관리',
      href: `/${serverID}/admin/game`,
      icon: '⚙️',
    },
    {
      title: '유저 관리',
      description: '유저 및 캐릭터 관리',
      href: `/${serverID}/admin/member`,
      icon: '👥',
    },
    {
      title: '장수 관리',
      description: '장수 상태 및 정보 관리',
      href: `/${serverID}/admin/general`,
      icon: '🎭',
    },
    {
      title: '외교 관리',
      description: '국가 간 외교 관계 관리',
      href: `/${serverID}/admin/diplomacy`,
      icon: '🤝',
    },
    {
      title: '시간 제어',
      description: '게임 시간 및 턴 제어',
      href: `/${serverID}/admin/time-control`,
      icon: '⏰',
    },
    {
      title: '전당 재구성',
      description: '명예의 전당 재계산',
      href: `/${serverID}/admin/force-rehall`,
      icon: '🏆',
    },
  ];

  return (
    <TopBackBar 
      title="관 리 자  패 널" 
      backUrl="/entrance"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {adminMenus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className={cn(
              "flex flex-col items-center text-center p-6 rounded-xl border border-white/5 bg-gray-900/50 backdrop-blur-sm shadow-lg",
              "hover:bg-gray-800/80 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-200 group"
            )}
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{menu.icon}</div>
            <div className="font-bold text-lg text-white mb-2">{menu.title}</div>
            <div className="text-sm text-gray-400">{menu.description}</div>
          </Link>
        ))}
      </div>
    </TopBackBar>
  );
}
