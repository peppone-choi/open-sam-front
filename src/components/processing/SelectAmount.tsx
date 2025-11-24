'use client';

import React, { useState, useEffect } from 'react';
import styles from './SelectAmount.module.css';

interface SelectAmountProps {
  value: number;
  minAmount?: number;
  maxAmount?: number;
  amountGuide?: number[];
  onChange: (value: number) => void;
}

export default function SelectAmount({
  value,
  minAmount = 0,
  maxAmount,
  amountGuide = [],
  onChange
}: SelectAmountProps) {
  const [inputValue, setInputValue] = useState<string>(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const numValue = parseInt(newValue, 10);
    if (!isNaN(numValue)) {
      let finalValue = numValue;
      if (minAmount !== undefined && finalValue < minAmount) {
        finalValue = minAmount;
      }
      if (maxAmount !== undefined && finalValue > maxAmount) {
        finalValue = maxAmount;
      }
      onChange(finalValue);
    }
  };

  const handleGuideClick = (amount: number) => {
    let finalAmount = amount;
    if (minAmount !== undefined && finalAmount < minAmount) {
      finalAmount = minAmount;
    }
    if (maxAmount !== undefined && finalAmount > maxAmount) {
      finalAmount = maxAmount;
    }
    onChange(finalAmount);
    setInputValue(finalAmount.toString());
  };

  return (
    <div className={styles.amountContainer}>
      <label htmlFor="amountInput" className="sr-only">
        금액 입력
      </label>
      <input
        id="amountInput"
        type="number"
        className={styles.amountInput}
        value={inputValue}
        onChange={handleChange}
        min={minAmount}
        max={maxAmount}
        placeholder="금액 입력"
        aria-label="금액 입력"
        aria-valuemin={minAmount}
        aria-valuemax={maxAmount}
        aria-valuenow={value}
      />
      {amountGuide.length > 0 && (
        <div className={styles.guideButtons}>
          {amountGuide.map((amount, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.guideButton}
              onClick={() => handleGuideClick(amount)}
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      )}
      {maxAmount !== undefined && (
        <button
          type="button"
          className={styles.maxButton}
          onClick={() => handleGuideClick(maxAmount)}
        >
          최대
        </button>
      )}
    </div>
  );
}

