'use client';

import React, { useState } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';

interface ChangeNationNameCommandFormProps {
  commandName: string;
  onSubmit: (args: { nationName: string }) => void;
  onCancel: () => void;
}

export default function ChangeNationNameCommandForm({
  commandName,
  onSubmit,
  onCancel
}: ChangeNationNameCommandFormProps) {
  const [nationName, setNationName] = useState('');

  const handleSubmit = () => {
    if (!nationName.trim()) {
      alert('국명을 입력해주세요.');
      return;
    }

    if (nationName.length > 18) {
      alert('국명은 18자 이하여야 합니다.');
      return;
    }

    onSubmit({ nationName: nationName.trim() });
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          나라의 이름을 바꿉니다. 황제가 된 후 1회 가능합니다.
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>국명:</label>
            <input
              type="text"
              className={styles.textInput}
              value={nationName}
              onChange={(e) => setNationName(e.target.value)}
              maxLength={18}
              placeholder="국명 입력"
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleSubmit}
              className={styles.submitButton}
            >
              {commandName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

