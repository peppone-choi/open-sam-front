'use client';

import React from 'react';
import styles from './VersionModal.module.css';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameConst?: {
    title?: string;
    banner?: string;
  };
  version?: string;
}

export default function VersionModal({
  isOpen,
  onClose,
  gameConst,
  version = '0.1.0',
}: VersionModalProps) {
  if (!isOpen) {
    return null;
  }

  const title = gameConst?.title || '삼국지 모의전략';
  const banner = gameConst?.banner || '';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>게임 정보</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.title}>{title}</div>
          <div className={styles.version}>Version {version}</div>
          {banner && (
            <div 
              className={styles.banner}
              dangerouslySetInnerHTML={{ __html: banner }}
            />
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.closeFooterButton} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
