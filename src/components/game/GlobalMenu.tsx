'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './GlobalMenu.module.css';

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
}

export default function GlobalMenu({ menu, globalInfo, onMenuClick }: GlobalMenuProps) {
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

  return (
    <div className={styles.globalMenu}>
      {filteredMenu.map((item, idx) => {
        if (item.type === 'line') {
          return <hr key={idx} className={styles.menuDivider} />;
        }

        if (item.type === 'item' || (!item.type && item.url)) {
          const href = normalizeUrl(item.url);
          const content = (
            <Link
              href={href}
              className={styles.menuButton}
              target={item.newTab ? '_blank' : undefined}
              onClick={(e) => handleMenuClick(e, item)}
            >
              {item.name}
            </Link>
          );
          return <div key={idx} className={styles.menuItem}>{content}</div>;
        }

        if (item.type === 'multi' && item.subMenu) {
          const isOpen = openDropdowns.has(idx);
          return (
            <div key={idx} className={styles.menuItem}>
              <button
                className={styles.menuButton}
                onClick={() => toggleDropdown(idx)}
              >
                {item.name} ▼
              </button>
              {isOpen && (
                <div className={styles.dropdownMenu}>
                  {item.subMenu.map((subItem, subIdx) => {
                    if (subItem.type === 'line') {
                      return <hr key={subIdx} className={styles.menuDivider} />;
                    }
                    const href = normalizeUrl(subItem.url);
                    return (
                      <Link
                        key={subIdx}
                        href={href}
                        className={styles.dropdownItem}
                        target={subItem.newTab ? '_blank' : undefined}
                        onClick={(e) => handleMenuClick(e, subItem)}
                      >
                        {subItem.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        if (item.type === 'split' && item.main && item.subMenu) {
          const isOpen = openDropdowns.has(idx);
          const mainHref = normalizeUrl(item.main.url);
          return (
            <div key={idx} className={styles.menuItem}>
              <div className={styles.splitButton}>
                <Link
                  href={mainHref}
                  className={styles.menuButton}
                  target={item.main.newTab ? '_blank' : undefined}
                  onClick={(e) => handleMenuClick(e, item.main!)}
                >
                  {item.main.name}
                </Link>
                <button
                  className={styles.splitToggle}
                  onClick={() => toggleDropdown(idx)}
                >
                  ▼
                </button>
              </div>
              {isOpen && (
                <div className={styles.dropdownMenu}>
                  {item.subMenu.map((subItem, subIdx) => {
                    if (subItem.type === 'line') {
                      return <hr key={subIdx} className={styles.menuDivider} />;
                    }
                    const href = normalizeUrl(subItem.url);
                    return (
                      <Link
                        key={subIdx}
                        href={href}
                        className={styles.dropdownItem}
                        target={subItem.newTab ? '_blank' : undefined}
                        onClick={(e) => handleMenuClick(e, subItem)}
                      >
                        {subItem.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}




