'use client';

import React, { useState } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';

interface ChangeNationFlagCommandFormProps {
  commandName: string;
  colors?: string[];
  onSubmit: (args: { colorType: number }) => void;
  onCancel: () => void;
}

export default function ChangeNationFlagCommandForm({
  commandName,
  colors = [],
  onSubmit,
  onCancel
}: ChangeNationFlagCommandFormProps) {
  const [selectedColorID, setSelectedColorID] = useState(0);

  const handleSubmit = () => {
    onSubmit({ colorType: selectedColorID });
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          국기를 변경합니다. 단 1회 가능합니다.
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>색상:</label>
            <div className={styles.colorSelect}>
              {colors.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  className={`${styles.toggleButton} ${selectedColorID === index ? styles.active : ''}`}
                  onClick={() => setSelectedColorID(index)}
                  style={{
                    backgroundColor: color,
                    color: '#fff',
                    border: selectedColorID === index ? '2px solid #007bff' : '1px solid #6c757d'
                  }}
                >
                  {index}
                </button>
              ))}
            </div>
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

