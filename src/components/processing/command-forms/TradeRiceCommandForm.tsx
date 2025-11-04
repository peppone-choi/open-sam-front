'use client';

import React, { useState } from 'react';
import SelectAmount from '../SelectAmount';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';

interface TradeRiceCommandFormProps {
  commandName: string;
  minAmount: number;
  maxAmount: number;
  amountGuide: number[];
  onSubmit: (args: { amount: number; buyRice: boolean }) => void;
  onCancel: () => void;
}

export default function TradeRiceCommandForm({
  commandName,
  minAmount,
  maxAmount,
  amountGuide,
  onSubmit,
  onCancel
}: TradeRiceCommandFormProps) {
  const [amount, setAmount] = useState(1000);
  const [buyRice, setBuyRice] = useState(true);

  const handleSubmit = () => {
    if (amount < minAmount || amount > maxAmount) {
      alert(`금액은 ${minAmount.toLocaleString()} ~ ${maxAmount.toLocaleString()} 사이여야 합니다.`);
      return;
    }
    onSubmit({ amount, buyRice });
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          자신의 군량을 사거나 팝니다.<br />
        </div>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>군량을:</label>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={`${styles.toggleButton} ${buyRice ? styles.active : ''}`}
                onClick={() => setBuyRice(true)}
              >
                삼
              </button>
              <button
                type="button"
                className={`${styles.toggleButton} ${!buyRice ? styles.active : ''}`}
                onClick={() => setBuyRice(false)}
              >
                팜
              </button>
            </div>
          </div>
          <div className={styles.formField}>
            <label>금액:</label>
            <SelectAmount
              value={amount}
              minAmount={minAmount}
              maxAmount={maxAmount}
              amountGuide={amountGuide}
              onChange={setAmount}
            />
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={handleSubmit} className={styles.submitButton}>
              {commandName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

