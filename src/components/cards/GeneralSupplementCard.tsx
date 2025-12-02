'use client';

import React, { useMemo } from 'react';
import SammoBar from '../game/SammoBar';
import type { ColorSystem } from '@/types/colorSystem';

interface GeneralSupplementCardProps {
  general: {
    no: number;
    name: string;
    experience?: number;
    dedication?: number;
    dedLevelText?: string;
    bill?: number;
    warnum?: number;
    firenum?: number;
    belong?: number;
    killnum?: number;
    deathnum?: number;
    killcrew?: number;
    deathcrew?: number;
    dex1?: number;
    dex2?: number;
    dex3?: number;
    dex4?: number;
    dex5?: number;
    reservedCommand?: Array<{
      action?: string;
      brief?: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  /** 예약 명령 목록 표시 여부 */
  showCommandList?: boolean;
  colorSystem?: ColorSystem;
}

/**
 * 명성 포맷 (Vue의 formatHonor와 동일)
 */
function formatHonor(experience: number): string {
  const ranks = [
    { min: 50000, name: '명장' },
    { min: 30000, name: '대장' },
    { min: 18000, name: '장군' },
    { min: 10000, name: '참장' },
    { min: 5000, name: '도독' },
    { min: 2500, name: '교위' },
    { min: 1200, name: '사마' },
    { min: 500, name: '좌군' },
    { min: 200, name: '병졸' },
    { min: 0, name: '신참' },
  ];
  
  for (const rank of ranks) {
    if (experience >= rank.min) {
      return rank.name;
    }
  }
  return '신참';
}

/**
 * 숙련도 레벨 정보 (Vue의 formatDexLevel과 동일)
 */
interface DexInfo {
  name: string;
  color: string;
}

function formatDexLevel(dex: number): DexInfo {
  // 숙련도 레벨 기준 (1K = 1000)
  const levels: Array<{ min: number; name: string; color: string }> = [
    { min: 900000, name: 'S', color: '#FFD700' },     // 골드
    { min: 750000, name: 'A+', color: '#FF69B4' },    // 핫핑크
    { min: 600000, name: 'A', color: '#FF1493' },     // 딥핑크
    { min: 450000, name: 'B+', color: '#00BFFF' },    // 딥스카이블루
    { min: 300000, name: 'B', color: '#1E90FF' },     // 도저블루
    { min: 180000, name: 'C+', color: '#32CD32' },    // 라임그린
    { min: 100000, name: 'C', color: '#00FF00' },     // 라임
    { min: 50000, name: 'D+', color: '#ADFF2F' },     // 그린옐로우
    { min: 20000, name: 'D', color: '#FFFF00' },      // 옐로우
    { min: 0, name: 'E', color: '#FFFFFF' },          // 화이트
  ];

  for (const level of levels) {
    if (dex >= level.min) {
      return { name: level.name, color: level.color };
    }
  }
  return { name: 'E', color: '#FFFFFF' };
}

/**
 * GeneralSupplementCard - 장수 추가 정보 카드
 * 명성, 계급, 전투 통계, 숙련도, 예약 명령 표시
 * Vue의 GeneralSupplementCard.vue와 동등한 기능 제공
 */
export default function GeneralSupplementCard({ 
  general, 
  showCommandList = false,
  colorSystem
}: GeneralSupplementCardProps) {
  // 숙련도 리스트
  const dexList = useMemo((): Array<[string, number, DexInfo]> => [
    ['보병', general.dex1 || 0, formatDexLevel(general.dex1 || 0)],
    ['궁병', general.dex2 || 0, formatDexLevel(general.dex2 || 0)],
    ['기병', general.dex3 || 0, formatDexLevel(general.dex3 || 0)],
    ['귀병', general.dex4 || 0, formatDexLevel(general.dex4 || 0)],
    ['차병', general.dex5 || 0, formatDexLevel(general.dex5 || 0)],
  ], [general.dex1, general.dex2, general.dex3, general.dex4, general.dex5]);

  // 승률 계산
  const winRate = useMemo(() => {
    const warnum = general.warnum || 0;
    const killnum = general.killnum || 0;
    if (warnum === 0) return '0.00';
    return ((killnum / warnum) * 100).toFixed(2);
  }, [general.warnum, general.killnum]);

  // 살상률 계산
  const killRate = useMemo(() => {
    const deathcrew = general.deathcrew || 1;
    const killcrew = general.killcrew || 0;
    return ((killcrew / deathcrew) * 100).toFixed(2);
  }, [general.killcrew, general.deathcrew]);

  // 예약 명령 (최대 5개)
  const reservedCommands = showCommandList && general.reservedCommand 
    ? general.reservedCommand.slice(0, 5) 
    : [];
  const showReserved = reservedCommands.length > 0;

  return (
    <div 
      className="w-full flex flex-col bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-lg shadow-lg overflow-hidden text-gray-200 font-sans text-sm"
      style={{ borderColor: colorSystem?.border }}
    >
      <div className="flex flex-col lg:flex-row">
        {/* 추가 정보 섹션 */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-800/80 p-2 text-center font-bold border-b border-white/10">
            추가 정보
          </div>
          <div className="grid grid-cols-6 gap-px text-xs">
            {/* 1행: 명성, 계급, 봉급 */}
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">명성</div>
            <div className="bg-gray-900/60 p-1.5 text-center">
              {formatHonor(general.experience || 0)} ({(general.experience || 0).toLocaleString()})
            </div>
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">계급</div>
            <div className="bg-gray-900/60 p-1.5 text-center">
              {general.dedLevelText || '-'} ({(general.dedication || 0).toLocaleString()})
            </div>
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">봉급</div>
            <div className="bg-gray-900/60 p-1.5 text-center">
              {(general.bill || 0).toLocaleString()}
            </div>

            {/* 2행: 전투, 계략, 사관 */}
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">전투</div>
            <div className="bg-gray-900/60 p-1.5 text-center">
              {(general.warnum || 0).toLocaleString()}
            </div>
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">계략</div>
            <div className="bg-gray-900/60 p-1.5 text-center">
              {(general.firenum || 0).toLocaleString()}
            </div>
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">사관</div>
            <div className="bg-gray-900/60 p-1.5 text-center">
              {general.belong || 0}년차
            </div>

            {/* 3행: 승률, 승리, 패배 */}
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">승률</div>
            <div className="bg-gray-900/60 p-1.5 text-center">
              {winRate} %
            </div>
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">승리</div>
            <div className="bg-gray-900/60 p-1.5 text-center" style={{ color: colorSystem?.success || 'limegreen' }}>
              {(general.killnum || 0).toLocaleString()}
            </div>
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">패배</div>
            <div className="bg-gray-900/60 p-1.5 text-center" style={{ color: colorSystem?.error || 'red' }}>
              {(general.deathnum || 0).toLocaleString()}
            </div>

            {/* 4행: 살상률, 사살, 피살 */}
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">살상률</div>
            <div className="bg-gray-900/60 p-1.5 text-center">
              {killRate} %
            </div>
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">사살</div>
            <div className="bg-gray-900/60 p-1.5 text-center" style={{ color: colorSystem?.success || 'limegreen' }}>
              {(general.killcrew || 0).toLocaleString()}
            </div>
            <div className="bg-gray-800/60 p-1.5 text-center text-white/60">피살</div>
            <div className="bg-gray-900/60 p-1.5 text-center" style={{ color: colorSystem?.error || 'red' }}>
              {(general.deathcrew || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* 숙련도 섹션 */}
        <div className={showReserved ? 'flex-1 min-w-0' : 'flex-1 min-w-0'}>
          <div className="bg-gray-800/80 p-2 text-center font-bold border-b border-l border-white/10">
            숙련도
          </div>
          <div className="grid grid-cols-[64px_40px_60px_1fr] gap-px text-xs border-l border-white/10">
            {dexList.map(([dexType, dex, dexInfo]) => (
              <React.Fragment key={dexType}>
                <div className="bg-gray-800/60 p-1.5 text-center text-white/60">{dexType}</div>
                <div className="bg-gray-900/60 p-1.5 text-center font-semibold" style={{ color: dexInfo.color }}>
                  {dexInfo.name}
                </div>
                <div className="bg-gray-900/60 p-1.5 text-center">
                  {(dex / 1000).toFixed(1)}K
                </div>
                <div className="bg-gray-900/60 p-1.5 flex items-center pr-2">
                  <SammoBar height={8} percent={(dex / 1_000_000) * 100} />
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 예약턴 섹션 */}
        {showReserved && (
          <div className="w-full lg:w-40 flex-shrink-0">
            <div className="bg-gray-800/80 p-2 text-center font-bold border-b border-l border-white/10">
              예약턴
            </div>
            <div className="border-l border-white/10">
              {reservedCommands.map((turn, idx) => (
                <div 
                  key={idx} 
                  className="h-[21px] flex items-center justify-center text-xs border-b border-white/10 px-2 truncate"
                >
                  {turn.brief || turn.action || '-'}
                </div>
              ))}
              {/* 빈 슬롯 채우기 */}
              {Array.from({ length: Math.max(0, 5 - reservedCommands.length) }).map((_, idx) => (
                <div 
                  key={`empty-${idx}`}
                  className="h-[21px] flex items-center justify-center text-xs border-b border-white/10 text-white/30"
                >
                  -
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




