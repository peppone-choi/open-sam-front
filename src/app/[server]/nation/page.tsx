'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

export default function NationPage() {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;
  const basePath = `/${serverID}/nation`;

  const menuItems = [
    { href: `${basePath}/stratfinan`, label: '내무 부', desc: '국가 방침, 세율, 재정 관리' },
    { href: `${basePath}/generals`, label: '세력 장수', desc: '소속 장수 목록 확인' },
    { href: `${basePath}/betting`, label: '국가 베팅', desc: '천통국 예측 베팅' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <TopBackBar title="국가 관리" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className="group bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 hover:bg-white/[0.05] hover:border-white/20 transition-all shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3 text-center h-48"
            >
              <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21V12a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9"/></svg>
              </div>
              <div className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                {item.label}
              </div>
              <div className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                {item.desc}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

