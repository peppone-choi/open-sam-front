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
    <div className="min-h-screen bg-background-main text-foreground px-4 py-10" role="alert" aria-live="polite">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center rounded-2xl border border-white/10 bg-background-secondary p-8 text-center shadow-2xl">
        <p className={tone === 'error' ? 'text-lg font-semibold text-hud-alert' : 'text-lg text-foreground'}>{message}</p>
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
    <div className="min-h-screen bg-background-main px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-background-secondary p-6 text-foreground shadow-2xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent/70">시스템 콘솔</p>
            <h1 className="mt-2 text-3xl font-bold font-serif text-empire-gold">관리자 패널</h1>
            {userInfo && (
              <p className="mt-1 text-sm text-foreground-muted">
                접속 계정: <span className="font-semibold text-foreground">{userInfo.name}</span>
              </p>
            )}
          </div>
          <Link
            href="/entrance"
            aria-label="메인 화면으로 돌아가기"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-foreground transition hover:border-accent/60 hover:bg-accent/10 focus:ring-2 focus:ring-accent focus:outline-none"
          >
            ← 돌아가기
          </Link>
        </header>

        <section className="space-y-6 rounded-3xl border border-white/10 bg-background-secondary p-6 shadow-2xl" aria-labelledby="server-section-title">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-accent/70">서버</p>
              <h2 id="server-section-title" className="text-2xl font-semibold text-foreground">서버별 관리</h2>
            </div>
            <span className="text-sm text-foreground-muted">총 {serverList.length}개</span>
          </div>

          {serverList.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {serverList.map((server) => (
                <div role="listitem" key={server.name}>
                  <Link
                    href={`/${server.name}/admin`}
                    data-testid={`server-card-${server.name}`}
                    className="block group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-accent/60 hover:bg-white/[0.08] focus:ring-2 focus:ring-accent focus:outline-none"
                    aria-label={`${server.korName} 서버 관리 페이지로 이동. 상태: ${server.enable ? '활성' : '비활성'}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-accent">{server.korName}</p>
                      <span className="text-xs uppercase tracking-[0.2em] text-foreground-muted">{server.name}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-foreground-muted">상태</span>
                      <span className={server.enable ? 'text-hud-success' : 'text-hud-alert'} aria-hidden="true">
                        {server.enable ? '🟢 활성' : '🔴 비활성'}
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-foreground-muted">
              서버가 없습니다.
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-background-secondary p-6 shadow-2xl" aria-labelledby="global-section-title">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-accent/70">전역</p>
              <h2 id="global-section-title" className="text-2xl font-semibold text-foreground">전역 관리</h2>
            </div>
          </div>
          <nav className="flex flex-wrap gap-3" aria-label="전역 관리 메뉴">
            <Link
              href="/admin/userlist"
              data-testid="global-admin-link"
              className="inline-flex flex-1 min-w-[180px] items-center justify-center rounded-2xl border border-white/10 bg-accent/90 px-5 py-3 text-center text-sm font-semibold text-white shadow hover:bg-accent focus:ring-2 focus:ring-white focus:outline-none"
            >
              사용자 관리
            </Link>
            <Link
              href="/admin/error-log"
              data-testid="global-admin-link"
              className="inline-flex flex-1 min-w-[180px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:border-accent/60 hover:bg-accent/10 focus:ring-2 focus:ring-accent focus:outline-none"
            >
              에러 로그
            </Link>
            <Link
              href="/admin/sessions"
              data-testid="global-admin-link"
              className="inline-flex flex-1 min-w-[180px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:border-accent/60 hover:bg-accent/10 focus:ring-2 focus:ring-accent focus:outline-none"
            >
              세션 관리
            </Link>
          </nav>
        </section>
      </div>
    </div>
  );
}
