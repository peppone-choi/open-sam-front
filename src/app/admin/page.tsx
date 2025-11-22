'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';

export default function AdminPage() {
  const router = useRouter();
  const [serverList, setServerList] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [serverStatus, userInfoData] = await Promise.all([
        SammoAPI.GetServerStatus(),
        SammoAPI.GetUserInfo().catch(() => null),
      ]);

      if (serverStatus.result) {
        setServerList(serverStatus.server);
      }

      if (userInfoData?.result) {
        setUserInfo(userInfoData);
        const grade = parseInt(userInfoData.grade) || 0;
        const adminStatus = grade >= 5 || userInfoData.acl !== '-';
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          router.push('/entrance');
          return;
        }
      } else {
        router.push('/entrance');
        return;
      }
    } catch (err) {
      console.error(err);
      router.push('/entrance');
    } finally {
      setLoading(false);
    }
  }

  const renderState = (message: string, tone: 'default' | 'error' = 'default') => (
    <div className="min-h-screen bg-gray-950 text-gray-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-8 text-center shadow-2xl">
        <p className={tone === 'error' ? 'text-lg font-semibold text-red-400' : 'text-lg text-gray-200'}>{message}</p>
      </div>
    </div>
  );

  if (loading) {
    return renderState('로딩 중...');
  }

  if (!isAdmin) {
    return renderState('권한이 없습니다.', 'error');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-black px-4 py-10 text-gray-100">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 text-white shadow-2xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">시스템 콘솔</p>
            <h1 className="mt-2 text-3xl font-bold">관리자 패널</h1>
            {userInfo && (
              <p className="mt-1 text-sm text-gray-400">
                접속 계정: <span className="font-semibold text-white">{userInfo.name}</span>
              </p>
            )}
          </div>
          <Link
            href="/entrance"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-400/60 hover:bg-orange-500/10"
          >
            ← 돌아가기
          </Link>
        </div>

        <section className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">서버</p>
              <h2 className="text-2xl font-semibold text-white">서버별 관리</h2>
            </div>
            <span className="text-sm text-gray-400">총 {serverList.length}개</span>
          </div>

          {serverList.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {serverList.map((server) => (
                <Link
                  key={server.name}
                  href={`/${server.name}/admin`}
                  data-testid={`server-card-${server.name}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-orange-400/60 hover:bg-white/[0.08]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-orange-400">{server.korName}</p>
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-500">{server.name}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-400">상태</span>
                    <span className={server.enable ? 'text-emerald-400' : 'text-red-400'}>
                      {server.enable ? '🟢 활성' : '🔴 비활성'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-gray-400">
              서버가 없습니다.
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">전역</p>
              <h2 className="text-2xl font-semibold text-white">전역 관리</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/userlist"
              data-testid="global-admin-link"
              className="inline-flex flex-1 min-w-[180px] items-center justify-center rounded-2xl border border-white/10 bg-orange-500/90 px-5 py-3 text-center text-sm font-semibold text-white shadow hover:bg-orange-400"
            >
              사용자 관리
            </Link>
            <Link
              href="/admin/error-log"
              data-testid="global-admin-link"
              className="inline-flex flex-1 min-w-[180px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-gray-100 transition hover:border-orange-400/60 hover:bg-orange-400/10"
            >
              에러 로그
            </Link>
            <Link
              href="/admin/sessions"
              data-testid="global-admin-link"
              className="inline-flex flex-1 min-w-[180px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-gray-100 transition hover:border-orange-400/60 hover:bg-orange-400/10"
            >
              세션 관리
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
