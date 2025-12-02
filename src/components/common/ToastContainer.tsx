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

/** 토스트 유형별 aria-live 속성값 */
const ariaLiveMap: Record<ToastType, 'polite' | 'assertive'> = {
  success: 'polite',
  info: 'polite',
  warning: 'assertive',
  error: 'assertive'
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div 
      className={styles.toastContainer}
      role="region"
      aria-label="알림 메시지"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          aria-live={ariaLiveMap[toast.type]}
          aria-atomic="true"
          className={`${styles.toast} ${styles[toast.type]}`}
        >
          <span className={styles.icon} aria-hidden="true">
            {iconMap[toast.type]}
          </span>
          <span className={styles.message}>
            {toast.message}
          </span>
          <button
            type="button"
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
