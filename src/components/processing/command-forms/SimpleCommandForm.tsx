'use client';

import React from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';

interface SimpleCommandFormProps {
  commandName: string;
  description?: string;
  onSubmit: (args: Record<string, unknown>) => void;
  onCancel: () => void;
}

export default function SimpleCommandForm({
  commandName,
  description,
  onSubmit,
  onCancel
}: SimpleCommandFormProps) {
  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          {description || `${commandName} 명령을 실행합니다.`}
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.submitButton} 
            onClick={() => onSubmit({})}
          >
            {commandName}
          </button>
          <button 
            type="button" 
            className={styles.cancelButton} 
            onClick={onCancel}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

