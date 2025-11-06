'use client';

import styles from './CriticalEffect.module.css';

export default function CriticalEffect() {
  return (
    <div className={styles.criticalContainer}>
      <div className={styles.criticalText}>크리티컬!</div>
      <div className={styles.criticalFlash} />
      <div className={styles.criticalStar}>★</div>
    </div>
  );
}
