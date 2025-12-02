'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import { useToast } from '@/contexts/ToastContext';

interface ErrorLog {
  date: string;
  errpath: string;
  errstr: string;
  trace?: string;
}

type SeverityLevel = 'all' | 'critical' | 'error' | 'warning';

function ErrorLogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams?.get('from') ? Number(searchParams.get('from')) : 0;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel>('all');
  const [filterPath, setFilterPath] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);

  const loadErrorLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetErrorLog({
        from,
        limit: 100,
      });
      if (result.result) {
        setErrorLogs(result.errorLogs || []);
        setTotalCount(result.total || result.errorLogs?.length || 0);
      }
    } catch (err) {
      console.error(err);
      showToast('에러 로그를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [from, showToast]);

  useEffect(() => {
    loadErrorLogs();
  }, [loadErrorLogs]);

  // 에러 심각도 분류
  function getSeverity(errstr: string): SeverityLevel {
    const lowerErr = errstr.toLowerCase();
    if (lowerErr.includes('fatal') || lowerErr.includes('critical') || lowerErr.includes('crash')) {
      return 'critical';
    }
    if (lowerErr.includes('warning') || lowerErr.includes('notice') || lowerErr.includes('deprecated')) {
      return 'warning';
    }
    return 'error';
  }

  // 필터링된 로그
  const filteredLogs = useMemo(() => {
    return errorLogs.filter((log) => {
      // 검색어 필터
      const matchesSearch =
        searchQuery === '' ||
        log.errstr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.errpath.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.date.includes(searchQuery);

      // 심각도 필터
      const severity = getSeverity(log.errstr);
      const matchesSeverity = filterSeverity === 'all' || severity === filterSeverity;

      // 경로 필터
      const matchesPath = filterPath === '' || log.errpath.toLowerCase().includes(filterPath.toLowerCase());

      return matchesSearch && matchesSeverity && matchesPath;
    });
  }, [errorLogs, searchQuery, filterSeverity, filterPath]);

  // 고유 경로 목록 추출
  const uniquePaths = useMemo(() => {
    const paths = new Set<string>();
    errorLogs.forEach((log) => {
      if (log.errpath) {
        // 파일명만 추출
        const parts = log.errpath.split('/');
        const filename = parts[parts.length - 1];
        paths.add(filename);
      }
    });
    return Array.from(paths).sort();
  }, [errorLogs]);

  // 통계
  const stats = useMemo(() => {
    const critical = errorLogs.filter((log) => getSeverity(log.errstr) === 'critical').length;
    const error = errorLogs.filter((log) => getSeverity(log.errstr) === 'error').length;
    const warning = errorLogs.filter((log) => getSeverity(log.errstr) === 'warning').length;
    return { critical, error, warning, total: errorLogs.length };
  }, [errorLogs]);

  function handlePageChange(newFrom: number) {
    const url = new URL(window.location.href);
    url.searchParams.set('from', String(newFrom));
    router.push(url.pathname + url.search);
  }

  function toggleExpand(idx: number) {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  }

  function expandAll() {
    setExpandedLogs(new Set(filteredLogs.map((_, idx) => idx)));
  }

  function collapseAll() {
    setExpandedLogs(new Set());
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showToast('클립보드에 복사되었습니다.', 'success');
  }

  const renderLoading = () => (
    <div className="flex items-center justify-center rounded-3xl border border-white/5 bg-black/40 p-10 text-lg text-gray-300">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
        로딩 중...
      </div>
    </div>
  );

  const severityConfig: Record<SeverityLevel, { label: string; color: string; bgColor: string; icon: string }> = {
    all: { label: '전체', color: 'text-white', bgColor: 'bg-white/10', icon: '📊' },
    critical: { label: '치명적', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: '🔴' },
    error: { label: '오류', color: 'text-orange-400', bgColor: 'bg-orange-500/20', icon: '🟠' },
    warning: { label: '경고', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: '🟡' },
  };

  const totalPages = Math.ceil(totalCount / 100);
  const currentPage = Math.floor(from / 100) + 1;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10 text-gray-100">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">모니터링</p>
            <h1 className="mt-1 text-3xl font-bold text-white">에러 로그</h1>
            <p className="text-sm text-gray-400">시스템 에러 및 경고 로그 조회</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadErrorLogs}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-400/60 hover:bg-orange-500/10 disabled:opacity-50"
            >
              🔄 새로고침
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-400/60 hover:bg-orange-500/10"
            >
              ← 관리자 패널
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(['all', 'critical', 'error', 'warning'] as const).map((level) => {
            const config = severityConfig[level];
            const count =
              level === 'all' ? stats.total : level === 'critical' ? stats.critical : level === 'error' ? stats.error : stats.warning;
            const isActive = filterSeverity === level;

            return (
              <button
                key={level}
                type="button"
                onClick={() => setFilterSeverity(level)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? 'border-orange-400/60 bg-orange-500/10'
                    : 'border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{config.icon}</span>
                  <span className="text-2xl font-bold text-white">{count}</span>
                </div>
                <p className={`mt-2 text-sm font-medium ${config.color}`}>{config.label}</p>
              </button>
            );
          })}
        </div>

        {/* 필터 및 검색 */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="에러 메시지, 경로, 날짜로 검색..."
              className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:border-orange-400/60 focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>
          <select
            value={filterPath}
            onChange={(e) => setFilterPath(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-orange-400/60 focus:outline-none"
          >
            <option value="">모든 경로</option>
            {uniquePaths.map((path) => (
              <option key={path} value={path}>
                {path}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-300 transition hover:bg-white/10"
            >
              모두 펼치기
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-300 transition hover:bg-white/10"
            >
              모두 접기
            </button>
          </div>
        </div>

        {/* 에러 로그 목록 */}
        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">타임라인</p>
              <h2 className="text-2xl font-semibold text-white">에러 로그</h2>
              <p className="text-sm text-gray-400">
                {searchQuery || filterSeverity !== 'all' || filterPath
                  ? `${filteredLogs.length}개 필터링됨`
                  : `총 ${totalCount}개`}{' '}
                · 페이지 {currentPage} / {totalPages || 1}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(0, from - 100))}
                disabled={from === 0}
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-orange-400/60 hover:bg-orange-400/10"
              >
                ← 이전
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(from + 100)}
                disabled={from + 100 >= totalCount}
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-orange-400/60 hover:bg-orange-400/10"
              >
                다음 →
              </button>
            </div>
          </div>

          {loading ? (
            renderLoading()
          ) : (
            <div className="mt-6 space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-gray-400">
                  {searchQuery || filterSeverity !== 'all' || filterPath
                    ? '조건에 맞는 에러 로그가 없습니다.'
                    : '기록된 에러 로그가 없습니다.'}
                </div>
              ) : (
                filteredLogs.map((log, idx) => {
                  const severity = getSeverity(log.errstr);
                  const config = severityConfig[severity];
                  const isExpanded = expandedLogs.has(idx);

                  return (
                    <article
                      key={`${log.date}-${idx}`}
                      className={`rounded-2xl border transition ${
                        isExpanded ? 'border-white/20 bg-white/5' : 'border-white/10 bg-black/40'
                      }`}
                    >
                      <div
                        className="flex cursor-pointer items-start gap-4 p-4"
                        onClick={() => log.trace && toggleExpand(idx)}
                      >
                        {/* 심각도 아이콘 */}
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}
                        >
                          <span className="text-lg">{config.icon}</span>
                        </div>

                        {/* 내용 */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm font-medium text-sky-300">{log.date}</p>
                            <p className="truncate text-xs text-gray-500">{log.errpath}</p>
                          </div>
                          <p className={`mt-1 text-sm font-medium ${config.color}`}>{log.errstr}</p>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(`${log.date}\n${log.errpath}\n${log.errstr}\n${log.trace || ''}`);
                            }}
                            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-400 transition hover:bg-white/5"
                            title="복사"
                          >
                            📋
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-400 transition hover:bg-white/5"
                            title="상세"
                          >
                            🔍
                          </button>
                          {log.trace && (
                            <span className="text-xs text-gray-500">{isExpanded ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </div>

                      {/* 스택 트레이스 */}
                      {log.trace && isExpanded && (
                        <div className="border-t border-white/10 px-4 pb-4">
                          <pre className="mt-3 max-h-72 overflow-x-auto whitespace-pre-wrap rounded-xl bg-black/70 p-4 text-xs text-emerald-200">
                            {log.trace}
                          </pre>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalCount > 100 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(0)}
                disabled={from === 0}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm transition disabled:opacity-40 hover:bg-white/5"
              >
                처음
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, currentPage - 2) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange((pageNum - 1) * 100)}
                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                      currentPage === pageNum
                        ? 'bg-orange-500 text-white'
                        : 'border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handlePageChange((totalPages - 1) * 100)}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm transition disabled:opacity-40 hover:bg-white/5"
              >
                마지막
              </button>
            </div>
          )}
        </section>

        {/* 상세 보기 모달 */}
        {selectedLog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl border border-white/10 bg-gray-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">에러 상세</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `${selectedLog.date}\n${selectedLog.errpath}\n${selectedLog.errstr}\n${selectedLog.trace || ''}`
                      )
                    }
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-white/5"
                  >
                    📋 복사
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/5 p-4">
                  <div>
                    <p className="text-xs text-gray-500">날짜</p>
                    <p className="font-medium text-sky-300">{selectedLog.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">심각도</p>
                    <p className={severityConfig[getSeverity(selectedLog.errstr)].color}>
                      {severityConfig[getSeverity(selectedLog.errstr)].icon}{' '}
                      {severityConfig[getSeverity(selectedLog.errstr)].label}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">경로</p>
                  <p className="mt-1 break-all text-sm text-gray-300">{selectedLog.errpath}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">에러 메시지</p>
                  <p className="mt-1 text-base font-medium text-rose-300">{selectedLog.errstr}</p>
                </div>
                {selectedLog.trace && (
                  <div>
                    <p className="text-xs text-gray-500">스택 트레이스</p>
                    <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-black/70 p-4 text-xs text-emerald-200">
                      {selectedLog.trace}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ErrorLogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10 text-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
            로딩 중...
          </div>
        </div>
      }
    >
      <ErrorLogContent />
    </Suspense>
  );
}
