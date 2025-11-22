'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="flex min-h-screen items-center justify-center bg-gray-950 p-6 text-gray-100">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/70 p-6 text-center shadow-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">오류 발생</p>
          <h1 className="mt-2 text-2xl font-bold text-white">서비스가 잠시 중단되었습니다</h1>
          <p className="mt-3 text-sm text-gray-400">
            문제가 자동으로 보고되었으며, 다시 시도하면 복구될 수 있습니다.
          </p>
          {error?.message && (
            <p className="mt-4 truncate text-xs text-gray-500">사유: {error.message}</p>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              className="rounded-full border border-white/10 bg-blue-600/80 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500/80"
              onClick={() => reset()}
            >
              다시 시도
            </button>
            <Link
              href="/entrance"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              로비로 이동
            </Link>
          </div>
          {error?.digest && (
            <p className="mt-4 text-[10px] font-mono text-gray-500">참조 코드: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
