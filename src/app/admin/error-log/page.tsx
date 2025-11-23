'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';

function ErrorLogContent() {
  const searchParams = useSearchParams();
  const from = searchParams?.get('from') ? Number(searchParams.get('from')) : 0;

  const [loading, setLoading] = useState(true);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);

  const loadErrorLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetErrorLog({
        from,
        limit: 100,
      });
      if (result.result) {
        setErrorLogs(result.errorLogs);
      }
    } catch (err) {
      console.error(err);
      alert('에러 로그를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [from]);

  useEffect(() => {
    loadErrorLogs();
  }, [loadErrorLogs]);

  function handleNext() {
    const url = new URL(window.location.href);
    url.searchParams.set('from', String(from + 100));
    window.location.href = url.toString();
  }

  function handlePrev() {
    if (from >= 100) {
      const url = new URL(window.location.href);
      url.searchParams.set('from', String(from - 100));
      window.location.href = url.toString();
    }
  }

  const renderLoading = () => (
    <div className="flex items-center justify-center rounded-3xl border border-white/5 bg-black/40 p-10 text-lg text-gray-300">
      로딩 중...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10 text-gray-100">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <TopBackBar title="에러 로그" />
        <h1 className="sr-only">에러 로그</h1>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">타임라인</p>
              <h2 className="text-2xl font-semibold text-white">최근 오류 이벤트</h2>
              <p className="text-sm text-gray-400">페이지 {Math.floor(from / 100) + 1}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                onClick={handlePrev}
                disabled={from === 0}
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-orange-400/60 hover:bg-orange-400/10"
              >
                이전 100개
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 font-semibold transition hover:border-orange-400/60 hover:bg-orange-400/10"
              >
                다음 100개
              </button>
            </div>
          </div>

          {loading ? (
            renderLoading()
          ) : (
            <div className="mt-6 space-y-4">
              {errorLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-gray-400">
                  기록된 에러 로그가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-gradient-to-b from-black/60 via-black/40 to-black/60">
                  {errorLogs.map((log, idx) => (
                    <article key={`${log.date}-${idx}`} className="space-y-3 px-6 py-5">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <p className="font-semibold text-sky-300">{log.date}</p>
                        <p className="text-sm text-gray-400">{log.errpath}</p>
                      </div>
                      <p className="text-base font-semibold text-rose-300">{log.errstr}</p>
                      {log.trace && (
                        <details className="group rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-300">
                          <summary className="cursor-pointer select-none font-semibold text-white outline-none">
                            스택 트레이스
                          </summary>
                          <pre className="mt-3 max-h-72 overflow-x-auto whitespace-pre-wrap rounded-xl bg-black/70 p-3 text-xs text-emerald-200">
                            {log.trace}
                          </pre>
                        </details>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ErrorLogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 px-4 py-10 text-gray-100">로딩 중...</div>}>
      <ErrorLogContent />
    </Suspense>
  );
}
