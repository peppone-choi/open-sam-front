'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './MainControlBar.module.css';

interface MainControlBarProps {
  permission: number;
  showSecret: boolean;
  myLevel: number;
  nationLevel: number;
  nationId: number; // 재야 체크용 (0이면 재야)
  isTournamentApplicationOpen: boolean;
  isBettingActive: boolean;
}

export default function MainControlBar({
  permission,
  showSecret,
  myLevel,
  nationLevel,
  nationId,
  isTournamentApplicationOpen,
  isBettingActive,
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

  const handleDisabledClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className={styles.controlBar}>
      {/* 회의실: myLevel >= 1 (nationLevel 무관) */}
      {!isRonin && myLevel >= 1 ? (
        <Link href={`${basePath}/board`} className={styles.btn}>
          회 의 실
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>회 의 실</span>
      )}
      {permission >= 2 ? (
        <Link href={`${basePath}/board?isSecret=true`} className={styles.btn}>
          기 밀 실
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>기 밀 실</span>
      )}
      {hasNationAccess && myLevel >= 1 ? (
        <Link href={`${basePath}/troop`} className={styles.btn}>
          부대 편성
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>부대 편성</span>
      )}
      {hasNationAccess && showSecret ? (
        <Link href={`${basePath}/diplomacy`} className={styles.btn}>
          외 교 부
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>외 교 부</span>
      )}
      {/* 인사부: myLevel >= 1 (nationLevel 무관) */}
      {!isRonin && myLevel >= 1 ? (
        <Link href={`${basePath}/info/officer`} className={styles.btn}>
          인 사 부
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>인 사 부</span>
      )}
      {hasNationAccess && showSecret ? (
        <Link href={`${basePath}/nation/stratfinan`} className={styles.btn}>
          내 무 부
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>내 무 부</span>
      )}
      {hasNationAccess && showSecret ? (
        <Link href={`${basePath}/chief`} className={styles.btn}>
          사 령 부
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>사 령 부</span>
      )}
      {hasNationAccess && showSecret ? (
        <Link href={`${basePath}/npc-control`} className={styles.btn}>
          NPC 정책
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>NPC 정책</span>
      )}
      {/* 암행부: showSecret만 체크 (nationLevel 무관) */}
      {showSecret ? (
        <Link href={`${basePath}/info/generals`} target="_blank" className={styles.btn}>
          암 행 부
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>암 행 부</span>
      )}
      <Link
        href={`${basePath}/tournament`}
        target="_blank"
        className={`${styles.btn} ${isTournamentApplicationOpen ? styles.highlight : ''}`}
      >
        토 너 먼 트
      </Link>
      {/* 세력 정보: myLevel >= 1 (nationLevel 무관) */}
      {!isRonin && myLevel >= 1 ? (
        <Link href={`${basePath}/info/nation`} className={styles.btn}>
          세력 정보
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>세력 정보</span>
      )}
      {hasNationAccess && myLevel >= 1 ? (
        <Link href={`${basePath}/info/city`} className={styles.btn}>
          세력 도시
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>세력 도시</span>
      )}
      {/* 세력 장수: myLevel >= 1 (nationLevel 무관) */}
      {!isRonin && myLevel >= 1 ? (
        <Link href={`${basePath}/nation/generals`} className={styles.btn}>
          세력 장수
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>세력 장수</span>
      )}
      <Link href={`${basePath}/world`} className={styles.btn}>
        중원 정보
      </Link>
      <Link href={`${basePath}/info/current-city`} className={styles.btn}>
        현재 도시
      </Link>
      {hasNationAccess && showSecret ? (
        <Link href={`${basePath}/battle-center`} target="_blank" className={styles.btn}>
          감 찰 부
        </Link>
      ) : (
        <span className={`${styles.btn} ${styles.disabled}`}>감 찰 부</span>
      )}
      <Link href={`${basePath}/inherit`} className={styles.btn}>
        유산 관리
      </Link>
      <Link href={`${basePath}/info/me`} className={styles.btn}>
        내 정보&amp;설정
      </Link>
      <div className={styles.btnGroup} ref={auctionDropdownRef}>
        <Link href={`${basePath}/auction`} target="_blank" className={styles.btn}>
          경 매 장
        </Link>
        <button
          type="button"
          className={styles.btnSplit}
          onClick={() => setAuctionDropdownOpen(!auctionDropdownOpen)}
          aria-expanded={auctionDropdownOpen}
        >
          <span className={styles.visuallyHidden}>Toggle Dropdown</span>
        </button>
        {auctionDropdownOpen && (
          <div className={styles.dropdownMenu}>
            <Link
              href={`${basePath}/auction`}
              target="_blank"
              className={styles.dropdownItem}
              onClick={() => setAuctionDropdownOpen(false)}
            >
              금/쌀 경매장
            </Link>
            <Link
              href={`${basePath}/auction?type=unique`}
              target="_blank"
              className={styles.dropdownItem}
              onClick={() => setAuctionDropdownOpen(false)}
            >
              유니크 경매장
            </Link>
          </div>
        )}
      </div>
      <Link
        href={`${basePath}/betting`}
        target="_blank"
        className={`${styles.btn} ${isBettingActive ? styles.highlight : ''}`}
      >
        베 팅 장
      </Link>
    </div>
  );
}
