'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './GameBottomBar.module.css';

interface GameBottomBarProps {
  onRefresh: () => void;
  onToggleMenu: () => void;
  isLoading?: boolean;
}

export default function GameBottomBar({ 
  onRefresh, 
  onToggleMenu,
  isLoading = false 
}: GameBottomBarProps) {
  const router = useRouter();
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const scrollToSelector = (selector: string) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowQuickMenu(false);
    }
  };

  const scrollToCommandPanel = () => {
    scrollToSelector('#reservedCommandPanel');
  };

  const scrollToMap = () => {
    scrollToSelector('.mapView');
  };

  const moveLobby = () => {
    router.push('/entrance');
  };

  const toggleQuickMenu = () => {
    setShowQuickMenu(!showQuickMenu);
  };

  return (
    <>
      {/* 빠른 이동 메뉴 (드롭업) */}
      {showQuickMenu && (
        <>
          <div className={styles.backdrop} onClick={() => setShowQuickMenu(false)} />
          <div className={styles.quickMenu}>
            <div className={styles.quickMenuHeader}>
              <h4>빠른 이동</h4>
              <button 
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowQuickMenu(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.quickMenuContent}>
              <div className={styles.menuSection}>
                <div className={styles.menuSectionTitle}>국가 정보</div>
                <button onClick={() => scrollToSelector('.nationNotice')} className={styles.menuItem}>
                  방침
                </button>
                <button onClick={() => scrollToSelector('#reservedCommandPanel')} className={styles.menuItem}>
                  명령
                </button>
                <button onClick={() => scrollToSelector('.nationInfo')} className={styles.menuItem}>
                  국가
                </button>
                <button onClick={() => scrollToSelector('.generalInfo')} className={styles.menuItem}>
                  장수
                </button>
                <button onClick={() => scrollToSelector('.cityInfo')} className={styles.menuItem}>
                  도시
                </button>
              </div>
              
              <div className={styles.menuSection}>
                <div className={styles.menuSectionTitle}>동향 정보</div>
                <button onClick={() => scrollToSelector('.mapView')} className={styles.menuItem}>
                  지도
                </button>
                <button onClick={() => scrollToSelector('.PublicRecord')} className={styles.menuItem}>
                  동향
                </button>
                <button onClick={() => scrollToSelector('.GeneralLog')} className={styles.menuItem}>
                  개인
                </button>
                <button onClick={() => scrollToSelector('.WorldHistory')} className={styles.menuItem}>
                  정세
                </button>
              </div>
              
              <div className={styles.menuSection}>
                <div className={styles.menuSectionTitle}>메시지</div>
                <button onClick={() => scrollToSelector('.PublicTalk')} className={styles.menuItem}>
                  전체
                </button>
                <button onClick={() => scrollToSelector('.NationalTalk')} className={styles.menuItem}>
                  국가
                </button>
                <button onClick={() => scrollToSelector('.PrivateTalk')} className={styles.menuItem}>
                  개인
                </button>
                <button onClick={() => scrollToSelector('.DiplomacyTalk')} className={styles.menuItem}>
                  외교
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 하단 바 */}
      <nav className={styles.gameBottomBar}>
        <div className={styles.navbar}>
          <ul className={styles.navbarNav}>
            {/* 명령으로 */}
            <li className={styles.navItem}>
              <button 
                type="button"
                className={styles.navBtn}
                onClick={scrollToCommandPanel}
                title="명령으로 스크롤"
              >
                명령
              </button>
            </li>

            {/* 갱신 */}
            <li className={styles.navItem}>
              <button 
                type="button"
                className={`${styles.navBtn} ${styles.refreshBtn}`}
                onClick={onRefresh}
                disabled={isLoading}
                title="페이지 갱신"
              >
                {isLoading ? '...' : '갱신'}
              </button>
            </li>

            {/* 맵으로 */}
            <li className={styles.navItem}>
              <button 
                type="button"
                className={styles.navBtn}
                onClick={scrollToMap}
                title="지도로 스크롤"
              >
                지도
              </button>
            </li>

            {/* 빠른 이동 */}
            <li className={styles.navItem}>
              <button 
                type="button"
                className={styles.navBtn}
                onClick={toggleQuickMenu}
                title="빠른 이동 메뉴"
              >
                이동
              </button>
            </li>

            {/* 메뉴 토글 */}
            <li className={styles.navItem}>
              <button 
                type="button"
                className={styles.navBtn}
                onClick={onToggleMenu}
                title="메뉴 열기/닫기"
              >
                메뉴
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
