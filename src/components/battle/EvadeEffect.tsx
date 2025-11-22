'use client';

import styles from './EvadeEffect.module.css';

export default function EvadeEffect() {
  return (
    <div className={styles.evadeContainer}>
      <div className={styles.evadeText}>회피!</div>
      <div className={styles.missText}>빗나감</div>
      <div className={styles.evadeTrace} />
    </div>
  );
}
