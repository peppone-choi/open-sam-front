'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface RankingTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  emptyMessage?: string;
  keyExtractor: (item: T, index: number) => string | number;
  rowClassName?: (item: T, index: number) => string;
}

function RankingTableSkeleton<T>({ columns }: { columns: Column<T>[] }) {
  return (
    <div className="space-y-2">
      {[...Array(10)].map((_, idx) => (
        <div 
          key={idx}
          className="flex items-center gap-4 p-4 bg-gray-900/30 rounded-lg border border-white/5"
        >
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          {columns.slice(2).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 w-16" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function RankingTable<T>({
  columns,
  data,
  loading,
  sortField,
  sortDirection,
  onSort,
  emptyMessage = '데이터가 없습니다.',
  keyExtractor,
  rowClassName,
}: RankingTableProps<T>) {
  if (loading) {
    return <RankingTableSkeleton columns={columns} />;
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'py-3 px-4 text-gray-400 font-medium whitespace-nowrap',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.align === 'left' && 'text-left',
                  !col.align && 'text-left',
                  col.sortable && 'cursor-pointer hover:text-white transition-colors select-none',
                  col.width
                )}
                style={{ width: col.width }}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.label}
                  {col.sortable && sortField === col.key && (
                    <span className="text-blue-400">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((item, idx) => (
            <tr 
              key={keyExtractor(item, idx)}
              className={cn(
                'hover:bg-white/5 transition-colors',
                rowClassName?.(item, idx)
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'py-3 px-4',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                  )}
                >
                  {col.render 
                    ? col.render(item, idx)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    : (item as any)[col.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 순위 뱃지 컴포넌트
export function RankBadge({ rank }: { rank: number }) {
  const getStyle = () => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-yellow-500/40';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-gray-400/40';
    if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-500/40';
    return 'bg-gray-800 text-gray-400';
  };

  const getMedal = () => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-lg',
          getStyle()
        )}
      >
        {rank}
      </div>
      {getMedal() && <span className="text-lg">{getMedal()}</span>}
    </div>
  );
}

// 능력치 바 컴포넌트
export function StatBar({ value, max = 100, color = 'blue', label }: { 
  value: number; 
  max?: number; 
  color?: string;
  label?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-gray-500 w-8">{label}</span>}
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all', colorMap[color] || colorMap.blue)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-400 w-8 text-right">{value}</span>
    </div>
  );
}

// 페이지네이션 컴포넌트
export interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // 처음 페이지
    pages.push(1);
    
    // 현재 페이지 주변
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) pages.push('ellipsis');
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push('ellipsis');
    
    // 마지막 페이지
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className={cn(
          'p-2 rounded-lg transition-colors text-sm',
          page === 1 
            ? 'text-gray-600 cursor-not-allowed' 
            : 'text-gray-400 hover:bg-white/10 hover:text-white'
        )}
      >
        ←
      </button>
      
      {getVisiblePages().map((p, idx) => (
        p === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-600">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all',
              p === page 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            )}
          >
            {p}
          </button>
        )
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className={cn(
          'p-2 rounded-lg transition-colors text-sm',
          page === totalPages 
            ? 'text-gray-600 cursor-not-allowed' 
            : 'text-gray-400 hover:bg-white/10 hover:text-white'
        )}
      >
        →
      </button>
    </div>
  );
}






