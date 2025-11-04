'use client';

import React from 'react';
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

  return (
    <div className={styles.controlBar}>
      <Link href={`${basePath}/board`} className={`${styles.btn} ${hasNationAccess && myLevel >= 1 ? '' : styles.disabled}`}>
        회 의 실
      </Link>
      <Link
        href={`${basePath}/board?isSecret=true`}
        className={`${styles.btn} ${permission >= 2 ? '' : styles.disabled}`}
      >
        기 밀 실
      </Link>
      <Link
        href={`${basePath}/troop`}
        className={`${styles.btn} ${hasNationAccess && myLevel >= 1 ? '' : styles.disabled}`}
      >
        부대 편성
      </Link>
      <Link href={`${basePath}/diplomacy`} className={`${styles.btn} ${hasNationAccess && showSecret ? '' : styles.disabled}`}>
        외 교 부
      </Link>
      <Link href={`${basePath}/info/officer`} className={`${styles.btn} ${hasNationAccess && myLevel >= 1 ? '' : styles.disabled}`}>
        인 사 부
      </Link>
      <Link href={`${basePath}/nation/stratfinan`} className={`${styles.btn} ${hasNationAccess && showSecret ? '' : styles.disabled}`}>
        내 무 부
      </Link>
      <Link href={`${basePath}/chief`} className={`${styles.btn} ${hasNationAccess && showSecret ? '' : styles.disabled}`}>
        사 령 부
      </Link>
      <Link href={`${basePath}/npc-control`} className={`${styles.btn} ${hasNationAccess && showSecret ? '' : styles.disabled}`}>
        NPC 정책
      </Link>
      <Link href={`${basePath}/info/generals`} target="_blank" className={`${styles.btn} ${hasNationAccess && showSecret ? '' : styles.disabled}`}>
        암 행 부
      </Link>
      <Link
        href={`${basePath}/tournament`}
        target="_blank"
        className={`${styles.btn} ${isTournamentApplicationOpen ? styles.highlight : ''}`}
      >
        토 너 먼 트
      </Link>
      <Link href={`${basePath}/info/nation`} className={`${styles.btn} ${hasNationAccess ? '' : styles.disabled}`}>
        세력 정보
      </Link>
      <Link
        href={`${basePath}/info/city`}
        className={`${styles.btn} ${hasNationAccess && myLevel >= 1 ? '' : styles.disabled}`}
      >
        세력 도시
      </Link>
      <Link href={`${basePath}/nation/generals`} className={`${styles.btn} ${hasNationAccess && myLevel >= 1 ? '' : styles.disabled}`}>
        세력 장수
      </Link>
      <Link href={`${basePath}/world`} className={styles.btn}>
        중원 정보
      </Link>
      <Link href={`${basePath}/info/current-city`} className={styles.btn}>
        현재 도시
      </Link>
      <Link href={`${basePath}/battle-center`} target="_blank" className={`${styles.btn} ${hasNationAccess && showSecret ? '' : styles.disabled}`}>
        감 찰 부
      </Link>
      <Link href={`${basePath}/inherit`} className={styles.btn}>
        유산 관리
      </Link>
      <Link href={`${basePath}/info/me`} className={styles.btn}>
        내 정보&amp;설정
      </Link>
      <Link href={`${basePath}/auction`} target="_blank" className={styles.btn}>
        경 매 장
      </Link>
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
