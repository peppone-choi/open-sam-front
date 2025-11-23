'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ColorSystem } from '@/types/colorSystem';
import { cn } from '@/lib/utils';
import { CONTROL_BAR_TEXT } from '@/constants/uiText';

export interface MainControlBarProps {
  permission: number;
  showSecret: boolean;
  myLevel: number;
  nationLevel: number;
  nationId: number; // 재야 체크용 (0이면 재야)
  nationColor?: string; // 국가색
  isTournamentApplicationOpen: boolean;
  isBettingActive: boolean;
  colorSystem?: ColorSystem;
}

export default function MainControlBar({
  permission,
  showSecret,
  myLevel,
  nationLevel,
  nationId,
  nationColor,
  isTournamentApplicationOpen,
  isBettingActive,
  colorSystem,
}: MainControlBarProps) {
  const params = useParams();
  const serverID = params?.server as string;
  const basePath = `/${serverID}`;

  // 재야(무소속)인지 확인
  const isRonin = nationId === 0;
  // 국가에 소속되어 있고 필요한 권한/레벨이 있는지 확인
  const hasNationAccess = !isRonin && nationLevel >= 1;

  // 경매 드롭다운 상태
  const [auctionDropdownOpen, setAuctionDropdownOpen] = useState(false);
  const auctionDropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (auctionDropdownRef.current && !auctionDropdownRef.current.contains(event.target as Node)) {
        setAuctionDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const buttonBaseClass = "relative flex items-center justify-center w-full px-3 py-3 text-sm font-medium transition-all duration-200 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-95";

  const activeClass = "bg-background-tertiary/80 hover:bg-background-secondary hover:text-white border-white/10 text-foreground hover:border-primary/30 hover:shadow-md shadow-black/20";
  const disabledClass = "bg-background-tertiary/30 text-foreground-muted/40 border-white/5 cursor-not-allowed grayscale";
  const highlightClass = "border-accent/50 text-accent shadow-accent/10 bg-accent/5 hover:bg-accent/10";

  const renderButton = (href: string, label: string, enabled: boolean, isHighlight: boolean = false, target: string = "_self") => {
    if (enabled) {
      return (
        <Link
          href={href}
          target={target}
          className={cn(buttonBaseClass, activeClass, isHighlight && highlightClass)}
          // Removed manual color override to let ThemeProvider handle it via Tailwind classes
        >
          {label}
          {isHighlight && <span className="absolute top-1 right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span></span>}
        </Link>
      );
    }
    return (
      <span className={cn(buttonBaseClass, disabledClass)}>
        {label}
      </span>
    );
  };

  return (
    <div
      className="flex flex-col gap-2 p-2 rounded-xl bg-space-panel backdrop-blur-md border border-white/10 shadow-inner h-full"
    >
      <div className="text-xs font-bold text-foreground-muted uppercase tracking-wider px-2 py-1 mb-1 border-b border-white/5 font-mono">
        {CONTROL_BAR_TEXT.title}
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar flex-1 pr-1 font-serif">
        {/* 1. 내정 관련 */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-foreground-dim px-2 pt-2 pb-1 font-mono">{CONTROL_BAR_TEXT.sections.domestic}</div>
          {renderButton(`${basePath}/board`, "회 의 실", !isRonin && myLevel >= 1)}
          {renderButton(`${basePath}/board?isSecret=true`, "기 밀 실", permission >= 2)}
          {renderButton(`${basePath}/my-boss-info`, "인 사 부", !isRonin && myLevel >= 1)}
          {renderButton(`${basePath}/nation/stratfinan`, "내 무 부", hasNationAccess && showSecret)}
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold text-foreground-dim px-2 pt-2 pb-1 font-mono">{CONTROL_BAR_TEXT.sections.military}</div>
          {renderButton(`${basePath}/troop`, "부대 편성", hasNationAccess && myLevel >= 1)}
          {renderButton(`${basePath}/chief`, "사 령 부", hasNationAccess && showSecret)}
          {renderButton(`${basePath}/battle-center`, "감 찰 부", hasNationAccess && showSecret, false, "_blank")}
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold text-foreground-dim px-2 pt-2 pb-1 font-mono">{CONTROL_BAR_TEXT.sections.diplomacy}</div>
          {renderButton(`${basePath}/diplomacy`, "외 교 부", hasNationAccess && showSecret)}
          {renderButton(`${basePath}/npc-control`, "NPC 정책", hasNationAccess && showSecret)}
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold text-foreground-dim px-2 pt-2 pb-1 font-mono">{CONTROL_BAR_TEXT.sections.information}</div>
          {renderButton(`${basePath}/info/nation`, "세력 정보", !isRonin && myLevel >= 1)}
          {renderButton(`${basePath}/info/city`, "세력 도시", hasNationAccess && myLevel >= 1)}
          {renderButton(`${basePath}/nation/generals`, "세력 장수", !isRonin && myLevel >= 1)}
          {renderButton(`${basePath}/world`, "중원 정보", true)}
          {renderButton(`${basePath}/info/current-city`, "현재 도시", true)}
          {renderButton(`${basePath}/info/generals`, "암 행 부", showSecret, false, "_blank")}
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold text-foreground-dim px-2 pt-2 pb-1 font-mono">{CONTROL_BAR_TEXT.sections.personal}</div>
          {renderButton(`${basePath}/inherit`, "유산 관리", true)}
          {renderButton(`${basePath}/info/me`, "내 정보 설정", true)}
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold text-foreground-dim px-2 pt-2 pb-1 font-mono">{CONTROL_BAR_TEXT.sections.special}</div>
          {renderButton(`${basePath}/tournament`, "토너먼트", true, isTournamentApplicationOpen, "_blank")}
          {renderButton(`${basePath}/betting`, "베 팅 장", true, isBettingActive, "_blank")}

          {/* 경매장 드롭다운 */}
          <div className="relative" ref={auctionDropdownRef}>
            <div className="flex w-full">
              <Link
                href={`${basePath}/auction`}
                target="_blank"
                className={cn(buttonBaseClass, activeClass, "rounded-r-none border-r-0 w-full text-left justify-start")}
              >
                경 매 장
              </Link>
              <button
                type="button"
                className={cn(buttonBaseClass, activeClass, "rounded-l-none w-10 px-0 flex items-center justify-center")}
                onClick={() => setAuctionDropdownOpen(!auctionDropdownOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform", auctionDropdownOpen ? "rotate-180" : "")}><path d="m6 9 6 6 6-6" /></svg>
              </button>
            </div>

            {auctionDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-space-panel border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <Link
                  href={`${basePath}/auction`}
                  target="_blank"
                  className="block w-full text-left px-4 py-2 text-xs hover:bg-primary hover:text-white transition-colors"
                  onClick={() => setAuctionDropdownOpen(false)}
                >
                  금/쌀 경매장
                </Link>
                <Link
                  href={`${basePath}/auction?type=unique`}
                  target="_blank"
                  className="block w-full text-left px-4 py-2 text-xs hover:bg-primary hover:text-white transition-colors border-t border-white/5"
                  onClick={() => setAuctionDropdownOpen(false)}
                >
                  유니크 경매장
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
