'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ColorSystem } from '@/types/colorSystem';
import { cn } from '@/lib/utils';

export interface MenuItem {
  type?: 'item' | 'multi' | 'split' | 'line';
  name: string;
  url?: string;
  newTab?: boolean;
  funcCall?: string;
  condShowVar?: string;
  subMenu?: MenuItem[];
  main?: {
    name: string;
    url: string;
    newTab?: boolean;
  };
}

interface GlobalMenuProps {
  menu: MenuItem[];
  globalInfo?: Record<string, any>;
  onMenuClick?: (url: string) => void;
  nationColor?: string;
  colorSystem?: ColorSystem;
}

export default function GlobalMenu({ menu, globalInfo, onMenuClick, nationColor, colorSystem }: GlobalMenuProps) {
  const params = useParams();
  const serverID = params?.server as string;
  const [openDropdowns, setOpenDropdowns] = useState<Set<number>>(new Set());

  // URL 정규화: 상대 경로를 현재 서버 경로로 변환
  const normalizeUrl = (url: string | undefined): string => {
    if (!url || url === '#') return '#';
    
    // 이미 절대 경로이거나 외부 링크인 경우 그대로 반환
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      return url;
    }
    
    // 이미 서버 ID를 포함한 경로인 경우 그대로 반환
    if (url.startsWith(`/${serverID}/`)) {
      return url;
    }
    
    // `/`로 시작하는 절대 경로인 경우 서버 ID 추가
    if (url.startsWith('/')) {
      return `/${serverID}${url}`;
    }
    
    // 상대 경로인 경우 서버 ID와 함께 절대 경로로 변환
    return `/${serverID}/${url}`;
  };

  const toggleDropdown = (index: number) => {
    const newOpen = new Set(openDropdowns);
    if (newOpen.has(index)) {
      newOpen.delete(index);
    } else {
      newOpen.add(index);
    }
    setOpenDropdowns(newOpen);
  };

  const filterMenu = (item: MenuItem): MenuItem | null => {
    if (item.type === 'line') {
      return item;
    }

    if (item.condShowVar && globalInfo) {
      const cond = item.condShowVar;
      if (cond.startsWith('!')) {
        if (globalInfo[cond.slice(1)]) {
          return null;
        }
      } else if (!globalInfo[cond]) {
        return null;
      }
    }

    if (item.type === 'multi' && item.subMenu) {
      const filtered = item.subMenu.map(filterMenu).filter((m): m is MenuItem => m !== null);
      if (filtered.length === 0) return null;
      if (filtered.length === 1 && filtered[0].type === 'item') {
        return filtered[0];
      }
      return { ...item, subMenu: filtered };
    }

    if (item.type === 'split' && item.main && item.subMenu) {
      const filteredMain = filterMenu(item.main);
      if (!filteredMain) return null;
      const filtered = item.subMenu.map(filterMenu).filter((m): m is MenuItem => m !== null);
      if (filtered.length === 0) {
        return filteredMain;
      }
      return { ...item, main: filteredMain as any, subMenu: filtered };
    }

    return item;
  };

  const filteredMenu = menu.map(filterMenu).filter((m): m is MenuItem => m !== null);

  const handleMenuClick = (e: React.MouseEvent, item: MenuItem | { name: string; url: string; newTab?: boolean }) => {
    if ('funcCall' in item && item.funcCall && onMenuClick) {
      e.preventDefault();
      onMenuClick(item.funcCall);
      return;
    }
    if (!item.url) {
      e.preventDefault();
    }
    if (item.newTab && item.url) {
      e.preventDefault();
      const normalizedUrl = normalizeUrl(item.url);
      window.open(normalizedUrl, '_blank');
    }
  };

  const buttonClass = "px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1";
  const defaultButtonStyle = {
     backgroundColor: colorSystem?.buttonBg ?? 'rgba(59, 130, 246, 0.2)',
     color: colorSystem?.buttonText ?? '#fff',
     border: `1px solid ${colorSystem?.borderLight ?? 'rgba(255,255,255,0.1)'}`
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {filteredMenu.length === 0 ? (
        <div className="w-full text-center text-sm text-foreground-muted py-2">
          메뉴를 불러올 수 없습니다.
        </div>
      ) : (
        <>
          {filteredMenu.map((item, idx) => {
            if (item.type === 'line') {
              return <div key={idx} className="w-px h-6 bg-white/10 mx-1" />;
            }

            if (item.type === 'item' || (!item.type && item.url)) {
              const href = normalizeUrl(item.url);
              return (
                <div key={idx}>
                  <Link
                    href={href}
                    className={cn(buttonClass, "hover:opacity-80 shadow-sm active:scale-95")}
                    style={defaultButtonStyle}
                    target={item.newTab ? '_blank' : undefined}
                    onClick={(e) => handleMenuClick(e, item)}
                  >
                    {item.name}
                  </Link>
                </div>
              );
            }

            if (item.type === 'multi' && item.subMenu) {
              const isOpen = openDropdowns.has(idx);
              return (
                <div key={idx} className="relative">
                  <button
                    className={cn(buttonClass, "hover:opacity-80 shadow-sm active:scale-95 pr-2")}
                    style={defaultButtonStyle}
                    onClick={() => toggleDropdown(idx)}
                  >
                    {item.name}
                    <span className="ml-1 text-[10px] opacity-70">▼</span>
                  </button>
                  {isOpen && (
                    <>
                       <div className="fixed inset-0 z-40" onClick={() => toggleDropdown(idx)} />
                       <div 
                          className="absolute top-full left-0 mt-1 z-50 min-w-[160px] bg-background-tertiary/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100"
                          style={{ borderColor: colorSystem?.border }}
                       >
                        {item.subMenu.map((subItem, subIdx) => {
                          if (subItem.type === 'line') {
                            return <div key={subIdx} className="h-px bg-white/10 my-1" />;
                          }
                          const href = normalizeUrl(subItem.url);
                          return (
                            <Link
                              key={subIdx}
                              href={href}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-primary hover:text-white transition-colors text-foreground-dim"
                              target={subItem.newTab ? '_blank' : undefined}
                              onClick={(e) => {
                                handleMenuClick(e, subItem);
                                toggleDropdown(idx);
                              }}
                            >
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            }

            if (item.type === 'split' && item.main && item.subMenu) {
              const isOpen = openDropdowns.has(idx);
              const mainHref = normalizeUrl(item.main.url);
              return (
                <div key={idx} className="relative flex rounded-md shadow-sm" style={defaultButtonStyle}>
                  <Link
                    href={mainHref}
                    className="px-3 py-1.5 text-sm font-medium hover:opacity-80 active:scale-95 border-r border-white/10 rounded-l-md"
                    target={item.main.newTab ? '_blank' : undefined}
                    onClick={(e) => handleMenuClick(e, item.main!)}
                  >
                    {item.main.name}
                  </Link>
                  <button
                    className="px-1.5 py-1.5 hover:opacity-80 active:scale-95 rounded-r-md"
                    onClick={() => toggleDropdown(idx)}
                  >
                    <span className="text-[10px] opacity-70">▼</span>
                  </button>
                  {isOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => toggleDropdown(idx)} />
                      <div 
                          className="absolute top-full right-0 mt-1 z-50 min-w-[160px] bg-background-tertiary/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100"
                          style={{ borderColor: colorSystem?.border }}
                      >
                        {item.subMenu.map((subItem, subIdx) => {
                          if (subItem.type === 'line') {
                            return <div key={subIdx} className="h-px bg-white/10 my-1" />;
                          }
                          const href = normalizeUrl(subItem.url);
                          return (
                            <Link
                              key={subIdx}
                              href={href}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-primary hover:text-white transition-colors text-foreground-dim"
                              target={subItem.newTab ? '_blank' : undefined}
                              onClick={(e) => {
                                handleMenuClick(e, subItem);
                                toggleDropdown(idx);
                              }}
                            >
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            }

            return null;
          })}
        </>
      )}
    </div>
  );
}
