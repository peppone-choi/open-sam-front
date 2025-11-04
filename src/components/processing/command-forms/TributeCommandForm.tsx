'use client';

import React, { useState } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import SelectAmount from '@/components/processing/SelectAmount';
import styles from './CommandForm.module.css';

interface TributeCommandFormProps {
  commandName: string;
  minAmount?: number;
  maxAmount?: number;
  amountGuide?: number[];
  onSubmit: (args: { amount: number; isGold: boolean }) => void;
  onCancel: () => void;
}

export default function TributeCommandForm({
  commandName,
  minAmount = 100,
  maxAmount = 999999,
  amountGuide = [100, 500, 1000, 2000, 5000, 10000],
  onSubmit,
  onCancel
}: TributeCommandFormProps) {
  const [amount, setAmount] = useState(1000);
  const [isGold, setIsGold] = useState(true);

  const handleSubmit = () => {
    if (amount < minAmount) {
      alert(`최소 금액은 ${minAmount.toLocaleString()}입니다.`);
      return;
    }
    if (amount > maxAmount) {
      alert(`최대 금액은 ${maxAmount.toLocaleString()}입니다.`);
      return;
    }

    onSubmit({ amount, isGold });
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          자신의 자금이나 군량을 국가 재산으로 헌납합니다.
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>자원:</label>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={`${styles.toggleButton} ${isGold ? styles.active : ''}`}
                onClick={() => setIsGold(true)}
              >
                금
              </button>
              <button
                type="button"
                className={`${styles.toggleButton} ${!isGold ? styles.active : ''}`}
                onClick={() => setIsGold(false)}
              >
                쌀
              </button>
            </div>
          </div>

          <div className={styles.formField}>
            <label>금액:</label>
            <SelectAmount
              value={amount}
              onChange={setAmount}
              minAmount={minAmount}
              maxAmount={maxAmount}
              amountGuide={amountGuide}
            />
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
  );
}


