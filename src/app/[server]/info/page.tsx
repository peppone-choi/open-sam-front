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
    <div className="relative min-h-screen overflow-hidden bg-background-main text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-hero-pattern opacity-30" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-[160px]" />

      <div className="relative p-4 font-sans md:p-6 lg:p-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold text-white">정보 센터</h1>
            <p className="text-sm text-foreground-muted">게임 내 다양한 정보를 확인하세요</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-background-secondary/70 p-6 text-center shadow-lg backdrop-blur transition-all duration-200',
                  'hover:-translate-y-1 hover:border-primary/40 hover:bg-background-secondary/90',
                )}
              >
                <div className="mb-3 text-4xl transition-transform group-hover:scale-110">{item.icon}</div>
                <div className="mb-1 text-lg font-bold text-white">{item.label}</div>
                <div className="text-xs text-foreground-muted">{item.desc}</div>
              </Link>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href={`/${serverID}/game`}
              className="rounded-full border border-white/10 px-6 py-2 text-sm text-foreground-muted transition hover:border-primary/40 hover:text-white"
            >
              ← 게임으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
