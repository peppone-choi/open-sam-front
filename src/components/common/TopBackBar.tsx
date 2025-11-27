'use client';

import React, { useState, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './TopBackBar.module.css';

/** 뒤로가기 타입 (Vue와 동일) */
type BackType = 'normal' | 'chief' | 'close' | 'gateway';

interface TopBackBarProps {
  title: string;
  /** 뒤로가기 타입: normal(게임), chief(수뇌부), close(창닫기), gateway(상위) */
  type?: BackType;
  /** 갱신 버튼 표시 */
  reloadable?: boolean;
  /** 검색 토글 표시 (Vue의 searchable) */
  searchable?: boolean;
  /** 검색 상태 변경 콜백 */
  onSearchableChange?: (value: boolean) => void;
  /** 텔레포트 영역 ID (Vue의 teleportZone) */
  teleportZone?: string;
  /** 갱신 콜백 */
  onReload?: () => void;
  /** 뒤로가기 커스텀 콜백 */
  onBack?: () => void;
  /** 뒤로 가기 URL 직접 지정 */
  backUrl?: string;
  /** 자식 요소 (Vue의 slot) */
  children?: ReactNode;
}

export default function TopBackBar({ 
  title, 
  type = 'normal',
  reloadable, 
  searchable,
  onSearchableChange,
  teleportZone,
  onReload, 
  onBack, 
  backUrl,
  children
}: TopBackBarProps) {
  const params = useParams();
  const router = useRouter();
  const serverID = params?.server as string;
  
  const [isSearchOn, setIsSearchOn] = useState(searchable ?? false);

  // 뒤로가기 버튼 텍스트
  const backButtonText = type === 'close' ? '창 닫기' : '돌아가기';

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }
    
    if (backUrl) {
      router.push(backUrl);
      return;
    }

    // Vue의 type에 따른 동작
    switch (type) {
      case 'normal':
        // 게임 메인으로
        router.push(`/${serverID}/game`);
        break;
      case 'chief':
        // 수뇌부 센터로
        router.push(`/${serverID}/chief`);
        break;
      case 'gateway':
        // 상위 경로 (로비)
        router.push('/entrance');
        break;
      case 'close':
        // 창 닫기 (팝업인 경우)
        if (window.opener) {
          window.close();
        } else {
          // 팝업이 아니면 뒤로가기
          router.back();
        }
        break;
      default:
        // 기본 동작: 현재 경로 분석
        const currentPath = window.location.pathname;
        if (currentPath.includes('/admin')) {
          const pathParts = currentPath.split('/').filter(Boolean);
          const adminIndex = pathParts.indexOf('admin');
          
          if (adminIndex >= 0 && adminIndex < pathParts.length - 1) {
            router.push(`/${serverID}/admin`);
          } else {
            router.push('/entrance');
          }
        } else {
          router.push(`/${serverID}/game`);
        }
    }
  }

  function handleReload() {
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
  }

  function handleSearchToggle() {
    const newValue = !isSearchOn;
    setIsSearchOn(newValue);
    onSearchableChange?.(newValue);
  }

  return (
    <div className={`${styles.topBackBar} ${teleportZone ? styles.topBackBarTeleport : ''}`}>
      {/* 뒤로가기 버튼 */}
      <button type="button" onClick={handleBack} className={styles.btn}>
        {backButtonText}
      </button>
      
      {/* 갱신 버튼 */}
      {reloadable ? (
        <button type="button" onClick={handleReload} className={styles.btn}>
          갱신
        </button>
      ) : (
        <div />
      )}
      
      {/* 타이틀 */}
      <h2 className={styles.title}>{title}</h2>
      
      {/* 슬롯/텔레포트 영역/검색 토글 */}
      {children ? (
        children
      ) : teleportZone ? (
        <div id={teleportZone} className={styles.teleportZone} />
      ) : (
        <>
          <div>&nbsp;</div>
          {searchable !== undefined && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnToggle} ${isSearchOn ? styles.btnToggleOn : ''}`}
              onClick={handleSearchToggle}
            >
              {isSearchOn ? '검색 켜짐' : '검색 꺼짐'}
            </button>
          )}
        </>
      )}
    </div>
  );
}


