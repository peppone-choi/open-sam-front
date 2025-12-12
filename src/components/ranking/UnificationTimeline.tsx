'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { UnificationRecord } from '@/types/ranking';

interface UnificationTimelineProps {
  records: UnificationRecord[];
  loading?: boolean;
  emptyMessage?: string;
}

// 스켈레톤 로딩 컴포넌트
function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {[...Array(5)].map((_, idx) => (
        <div key={idx} className="relative pl-8 md:pl-12">
          {/* 타임라인 마커 */}
          <div className="absolute left-0 top-0 w-6 h-6 md:w-8 md:h-8">
            <Skeleton className="w-full h-full rounded-full" />
          </div>
          {/* 카드 */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-white/5">
            <div className="flex flex-wrap gap-4 mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 시즌 구분자 컴포넌트
function SeasonDivider({ season }: { season: number }) {
  return (
    <div className="relative flex items-center justify-center py-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-dashed border-white/10" />
      </div>
      <div className="relative px-4 py-2 bg-gray-950 rounded-full border border-white/20">
        <span className="text-sm font-bold text-gray-400">
          시즌 {season}
        </span>
      </div>
    </div>
  );
}

// 통일 기록 카드 컴포넌트
function UnificationCard({ record, index }: { record: UnificationRecord; index: number }) {
  const formattedDate = record.unifiedAt
    ? new Date(record.unifiedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div 
      className={cn(
        'relative pl-8 md:pl-12 group',
        'before:absolute before:left-3 md:before:left-4 before:top-8 before:bottom-0',
        'before:w-0.5 before:bg-gradient-to-b before:from-white/20 before:to-transparent',
        index === 0 && 'before:from-yellow-500/50'
      )}
    >
      {/* 타임라인 마커 */}
      <div 
        className={cn(
          'absolute left-0 top-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center',
          'border-2 transition-all duration-300',
          index === 0 
            ? 'bg-yellow-500 border-yellow-400 shadow-lg shadow-yellow-500/30' 
            : 'bg-gray-900 border-white/20 group-hover:border-white/40'
        )}
      >
        {index === 0 ? (
          <span className="text-sm">👑</span>
        ) : (
          <span className="text-xs font-bold text-gray-500">{index + 1}</span>
        )}
      </div>

      {/* 카드 */}
      <div 
        className={cn(
          'bg-gray-900/50 backdrop-blur-sm rounded-xl p-5 md:p-6 border transition-all duration-300',
          index === 0 
            ? 'border-yellow-500/30 bg-yellow-900/10 shadow-lg shadow-yellow-900/20' 
            : 'border-white/5 hover:border-white/15 hover:bg-gray-900/70'
        )}
      >
        {/* 헤더 */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 
                className="text-xl md:text-2xl font-black"
                style={{ color: record.nationColor || '#fbbf24' }}
              >
                {record.nationName}
              </h3>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">
                {record.scenarioName}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {record.unificationYear}년 {record.unificationMonth}월 통일
            </p>
          </div>
          <div className="text-right">
            {formattedDate && (
              <p className="text-xs text-gray-500">{formattedDate}</p>
            )}
            {record.duration && (
              <p className="text-xs text-gray-600">{record.duration}턴 소요</p>
            )}
          </div>
        </div>

        {/* 군주 정보 */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-black/20 rounded-lg">
          <div 
            className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
          >
            {record.rulerIcon ? (
              <img src={record.rulerIcon} alt={record.rulerName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xl">👤</span>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">천하통일 군주</p>
            <p className="font-bold text-white text-lg">{record.rulerName}</p>
          </div>
        </div>

        {/* 주요 장수 */}
        {record.topGenerals && record.topGenerals.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">🏆 주요 장수</p>
            <div className="flex flex-wrap gap-2">
              {record.topGenerals.slice(0, 5).map((gen, idx) => (
                <div 
                  key={gen.id}
                  className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full"
                >
                  <span className="text-xs text-gray-400">#{idx + 1}</span>
                  <span className="text-sm font-medium text-white">{gen.name}</span>
                  {gen.kills > 0 && (
                    <span className="text-xs text-red-400">⚔️ {gen.kills}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 통계 */}
        <div className="flex flex-wrap gap-4 pt-3 border-t border-white/5 text-sm">
          {record.totalGenerals !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-blue-400">👥</span>
              <span className="text-gray-400">장수</span>
              <span className="text-white font-mono">{record.totalGenerals}</span>
            </div>
          )}
          {record.totalBattles !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-orange-400">⚔️</span>
              <span className="text-gray-400">전투</span>
              <span className="text-white font-mono">{record.totalBattles}</span>
            </div>
          )}
          {record.totalDeaths !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-red-400">💀</span>
              <span className="text-gray-400">사망</span>
              <span className="text-white font-mono">{record.totalDeaths}</span>
            </div>
          )}
          {record.gameMode && (
            <div className="ml-auto">
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                {record.gameMode}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function UnificationTimeline({ 
  records, 
  loading, 
  emptyMessage = '통일 기록이 없습니다.' 
}: UnificationTimelineProps) {
  if (loading) {
    return <TimelineSkeleton />;
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="text-6xl mb-4">🏛️</div>
        <p className="text-lg">{emptyMessage}</p>
        <p className="text-sm mt-2 text-gray-600">아직 천하를 통일한 자가 없습니다.</p>
      </div>
    );
  }

  // 시즌별로 그룹핑
  const groupedBySeason: Record<number, UnificationRecord[]> = {};
  records.forEach((record) => {
    const season = record.seasonNumber || 1;
    if (!groupedBySeason[season]) {
      groupedBySeason[season] = [];
    }
    groupedBySeason[season].push(record);
  });

  const seasons = Object.keys(groupedBySeason)
    .map(Number)
    .sort((a, b) => b - a); // 최신 시즌 먼저

  return (
    <div className="space-y-6">
      {seasons.map((season, sIdx) => (
        <div key={season}>
          {seasons.length > 1 && <SeasonDivider season={season} />}
          <div className="space-y-6 mt-4">
            {groupedBySeason[season].map((record, idx) => (
              <UnificationCard 
                key={record.id} 
                record={record} 
                index={sIdx === 0 ? idx : idx + groupedBySeason[seasons[0]].length}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}








