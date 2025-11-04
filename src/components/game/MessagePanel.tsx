'use client';

import React from 'react';
import styles from './MessagePanel.module.css';

interface MessagePanelProps {
  generalID: number;
  generalName: string;
  nationID: number;
  permissionLevel: number;
}

export default function MessagePanel({
  generalID,
  generalName,
  nationID,
  permissionLevel,
}: MessagePanelProps) {
  // TODO: 실제 메시지 패널 구현
  return (
    <div className={styles.messagePanel}>
      <div className={styles.messagePanelHeader}>
        <div className={styles.boardHeader}>전체</div>
        <div className={styles.boardHeader}>국가</div>
        <div className={styles.boardHeader}>개인</div>
        {permissionLevel >= 1 && (
          <div className={styles.boardHeader}>외교</div>
        )}
      </div>
      <div className={styles.messagePanelBody}>
        <div className={styles.messagePlaceholder}>
          메시지 패널 (구현 예정)
        </div>
      </div>
    </div>
  );
}




