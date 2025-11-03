'use client';

import React from 'react';
import styles from './PartialReservedCommand.module.css';

interface PartialReservedCommandProps {
  generalID: number;
  serverID: string;
}

export default function PartialReservedCommand({ generalID, serverID }: PartialReservedCommandProps) {
  return (
    <div className={styles.commandPad}>
      <div className={styles.header}>
        <h4>명령 목록</h4>
      </div>
      <div className={styles.content}>
        명령 목록이 여기에 표시됩니다.
      </div>
    </div>
  );
}
