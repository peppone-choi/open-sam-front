'use client';

import React, { useState, useEffect } from 'react';
import SelectGeneral, { type ProcGeneralItem } from '../SelectGeneral';
import SelectAmount from '../SelectAmount';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';

interface GeneralAmountCommandFormProps {
  commandName: string;
  generals: ProcGeneralItem[];
  minAmount: number;
  maxAmount: number;
  amountGuide: number[];
  onSubmit: (args: { destGeneralID: number; isGold: boolean; amount: number }) => void;
  onCancel: () => void;
}

export default function GeneralAmountCommandForm({
  commandName,
  generals,
  minAmount,
  maxAmount,
  amountGuide,
  onSubmit,
  onCancel
}: GeneralAmountCommandFormProps) {
  const [selectedGeneralID, setSelectedGeneralID] = useState<number>(0);
  const [isGold, setIsGold] = useState(true);
  const [amount, setAmount] = useState(1000);

  useEffect(() => {
    if (generals.length > 0 && selectedGeneralID === 0) {
      setSelectedGeneralID(generals[0].no);
    }
  }, [generals, selectedGeneralID]);

  const handleSubmit = () => {
    if (selectedGeneralID === 0) {
      alert('장수를 선택해주세요.');
      return;
    }
    if (amount < minAmount || amount > maxAmount) {
      alert(`금액은 ${minAmount.toLocaleString()} ~ ${maxAmount.toLocaleString()} 사이여야 합니다.`);
      return;
    }
    onSubmit({
      destGeneralID: selectedGeneralID,
      isGold,
      amount
    });
  };

  const getDescription = () => {
    if (commandName === '몰수') {
      return '장수의 자금이나 군량을 몰수합니다.\n몰수한것은 국가재산으로 귀속됩니다.';
    } else if (commandName === '포상') {
      return '국고로 장수에게 자금이나 군량을 지급합니다.';
    } else if (commandName === '증여') {
      return '자신의 자금이나 군량을 다른 장수에게 증여합니다.';
    }
    return '';
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          {getDescription().split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>장수:</label>
            <SelectGeneral
              value={selectedGeneralID}
              generals={generals}
              onChange={setSelectedGeneralID}
            />
          </div>
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



