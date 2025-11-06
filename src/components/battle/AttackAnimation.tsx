'use client';

import styles from './AttackAnimation.module.css';

interface AttackAnimationProps {
  type: 'melee' | 'ranged' | 'magic';
}

export default function AttackAnimation({ type }: AttackAnimationProps) {
  return (
    <div className={styles.attackContainer}>
      {type === 'melee' && <SwordSlashEffect />}
      {type === 'ranged' && <ArrowFlyEffect />}
      {type === 'magic' && <MagicBurstEffect />}
    </div>
  );
}

function SwordSlashEffect() {
  return (
    <div className={styles.swordSlash}>
      <svg viewBox="0 0 200 200" className={styles.slashSvg}>
        <path
          d="M 20 180 L 180 20"
          stroke="white"
          strokeWidth="6"
          fill="none"
          className={styles.slashPath}
        />
      </svg>
    </div>
  );
}

function ArrowFlyEffect() {
  return (
    <div className={styles.arrowContainer}>
      <div className={styles.arrow}>→</div>
    </div>
  );
}

function MagicBurstEffect() {
  return (
    <div className={styles.magicBurst}>
      <div className={styles.burstCircle} />
      <div className={styles.burstStar}>✦</div>
    </div>
  );
}
