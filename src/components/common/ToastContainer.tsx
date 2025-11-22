'use client';

import React from 'react';
import { useToast, ToastType } from '@/contexts/ToastContext';
import styles from './Toast.module.css';
import { COMMON_TEXT } from '@/constants/uiText';

const iconMap: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠'
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
        >
          <span className={styles.icon}>
            {iconMap[toast.type]}
          </span>
          <span className={styles.message}>
            {toast.message}
          </span>
          <button
            className={styles.closeButton}
            onClick={() => removeToast(toast.id)}
            aria-label={COMMON_TEXT.toastClose}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
