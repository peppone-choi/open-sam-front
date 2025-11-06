'use client';

import styles from './DefendAnimation.module.css';

interface DefendAnimationProps {
  damage: number;
  died: boolean;
}

export default function DefendAnimation({ damage, died }: DefendAnimationProps) {
  return (
    <div className={styles.defendContainer}>
      <div className={styles.damageNumber}>
        -{damage.toLocaleString()}
      </div>
      
      <div className={styles.hitEffect}>
        <div className={styles.hitFlash} />
      </div>
      
      {died && (
        <div className={styles.deathEffect}>
          💀
        </div>
      )}
    </div>
  );
}
