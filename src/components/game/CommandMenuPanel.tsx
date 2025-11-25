'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MainControlBarProps } from './MainControlBar';
import { cn } from '@/lib/utils';

export interface MenuItem {
  // GlobalMenu.tsx와 호환되는 구조 (또는 필요한 필드만 정의)
  name: string;
  url?: string;
  newTab?: boolean;
  [key: string]: any;
}

export interface CommandMenuPanelProps {
  serverID: string;
  mainControlProps: MainControlBarProps;
  globalMenu: MenuItem[];
}

export default function CommandMenuPanel({
  serverID,
  mainControlProps,
  globalMenu,
}: CommandMenuPanelProps) {
  const {
    permission,
    showSecret,
    myLevel,
    nationLevel,
    nationId,
    // nationColor,
    // isTournamentApplicationOpen,
    // isBettingActive,
    // colorSystem,
    // hasCity,
  } = mainControlProps;

  const basePath = `/${serverID}`;
  const isRonin = nationId === 0;
  const hasNationAccess = !isRonin && nationLevel >= 1;

  const renderButton = (
    href: string,
    label: string,
    enabled: boolean,
    target: string = "_self"
  ) => {
    if (!enabled) return null;

    return (
      <Link href={href} target={target} className="w-full">
        <Button variant="secondary" size="sm" className="w-full justify-start text-xs h-8 px-2">
          {label}
        </Button>
      </Link>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* 분류 1: 내정 및 인사 */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader className="py-3 px-4 border-b border-white/5">
          <CardTitle className="text-sm font-bold text-gray-200">
            내정 및 인사 (Domestic & Personnel)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {renderButton(`${basePath}/board`, "회의실", !isRonin && myLevel >= 1)}
            {renderButton(`${basePath}/board?isSecret=true`, "기밀실", permission >= 2)}
            {renderButton(`${basePath}/my-boss-info`, "인사부", !isRonin && myLevel >= 1)}
            {renderButton(`${basePath}/nation/stratfinan`, "내무부", hasNationAccess && showSecret)}
            {renderButton(`${basePath}/info/nation`, "세력 정보", !isRonin && myLevel >= 1)}
            {renderButton(`${basePath}/info/city`, "세력 도시", hasNationAccess && myLevel >= 1)}
            {renderButton(`${basePath}/nation/generals`, "세력 장수", !isRonin && myLevel >= 1)}
            {renderButton(`${basePath}/world`, "중원 정보", true)}
            {renderButton(`${basePath}/inherit`, "유산 관리", true)}
            {renderButton(`${basePath}/info/me`, "내 정보 설정", true)}
          </div>
        </CardContent>
      </Card>

      {/* 분류 2: 군사 및 전략 */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader className="py-3 px-4 border-b border-white/5">
          <CardTitle className="text-sm font-bold text-gray-200">
            군사 및 전략 (Military & Strategy)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {renderButton(`${basePath}/troop`, "부대 편성", hasNationAccess && myLevel >= 1)}
            {renderButton(`${basePath}/chief`, "사령부", hasNationAccess && showSecret)}
            {renderButton(`${basePath}/battle-center`, "감찰부", hasNationAccess && showSecret, "_blank")}
            {renderButton(`${basePath}/diplomacy`, "외교부", hasNationAccess && showSecret)}
            {renderButton(`${basePath}/npc-control`, "NPC 정책", hasNationAccess && showSecret)}
            {renderButton(`${basePath}/info/generals`, "암행부", showSecret, "_blank")}
            {renderButton(`${basePath}/tournament`, "토너먼트", true, "_blank")}
            {renderButton(`${basePath}/betting`, "베팅장", true, "_blank")}
            {renderButton(`${basePath}/auction`, "경매장", true, "_blank")}
            
            {/* 외부 메뉴 렌더링 */}
            {globalMenu.map((item, index) => {
              if (!item.url) return null;
              return (
                <Link 
                  key={`global-menu-${index}`} 
                  href={item.url.startsWith('/') ? `/${serverID}${item.url}` : item.url}
                  target={item.newTab ? "_blank" : "_self"} 
                  className="w-full"
                >
                  <Button variant="secondary" size="sm" className="w-full justify-start text-xs h-8 px-2">
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
