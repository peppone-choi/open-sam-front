'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './DamageNumber.module.css';

// ===== Props =====
interface DamageNumberProps {
  damage: number;
  position: { x: number; y: number };
  isCritical?: boolean;
  isHeal?: boolean;
  isMiss?: boolean;
}

// ===== 메인 컴포넌트 =====
export default function DamageNumber({
  damage,
  position,
  isCritical = false,
  isHeal = false,
  isMiss = false,
}: DamageNumberProps) {
  // 텍스트와 색상 결정
  const getText = () => {
    if (isMiss) return 'MISS!';
    if (isHeal) return `+${damage}`;
    return `-${damage}`;
  };

  const getColorClass = () => {
    if (isMiss) return styles.miss;
    if (isHeal) return styles.heal;
    if (isCritical) return styles.critical;
    return styles.normal;
  };

  return (
    <motion.div
      className={`${styles.damageNumber} ${getColorClass()}`}
      style={{
        left: `${position.x * 32 + 16}px`, // 그리드 셀 크기 기준
        top: `${position.y * 32}px`,
      }}
      initial={{
        opacity: 1,
        y: 0,
        scale: isCritical ? 1.5 : 1,
      }}
      animate={{
        opacity: 0,
        y: -60,
        scale: isCritical ? [1.5, 1.8, 1] : [1, 1.2, 1],
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        duration: 1.2,
        ease: 'easeOut',
      }}
    >
      {/* 크리티컬 이펙트 */}
      {isCritical && (
        <motion.div
          className={styles.criticalEffect}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* 회복 이펙트 */}
      {isHeal && (
        <motion.div
          className={styles.healEffect}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}

      {/* 크리티컬 레이블 */}
      {isCritical && !isMiss && (
        <motion.span
          className={styles.criticalLabel}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          CRITICAL!
        </motion.span>
      )}

      {/* 데미지 숫자 */}
      <motion.span
        className={styles.numberText}
        animate={
          isCritical
            ? {
                textShadow: [
                  '0 0 10px #fbbf24, 0 0 20px #fbbf24, 0 0 30px #fbbf24',
                  '0 0 20px #fbbf24, 0 0 40px #fbbf24, 0 0 60px #fbbf24',
                  '0 0 10px #fbbf24, 0 0 20px #fbbf24, 0 0 30px #fbbf24',
                ],
              }
            : {}
        }
        transition={{ duration: 0.3, repeat: 2 }}
      >
        {getText()}
      </motion.span>
    </motion.div>
  );
}

// ===== 데미지 숫자 그룹 (여러 개 표시) =====
export function DamageNumberGroup({
  damages,
}: {
  damages: Array<{
    id: string;
    damage: number;
    position: { x: number; y: number };
    isCritical?: boolean;
    isHeal?: boolean;
    isMiss?: boolean;
  }>;
}) {
  return (
    <>
      {damages.map((d, index) => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <DamageNumber
            damage={d.damage}
            position={d.position}
            isCritical={d.isCritical}
            isHeal={d.isHeal}
            isMiss={d.isMiss}
          />
        </motion.div>
      ))}
    </>
  );
}

// ===== 콤보 데미지 표시 =====
export function ComboDamageNumber({
  totalDamage,
  comboCount,
  position,
}: {
  totalDamage: number;
  comboCount: number;
  position: { x: number; y: number };
}) {
  return (
    <motion.div
      className={styles.comboDamage}
      style={{
        left: `${position.x * 32 + 16}px`,
        top: `${position.y * 32 - 40}px`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      <span className={styles.comboCount}>{comboCount} HIT!</span>
      <span className={styles.totalDamage}>-{totalDamage}</span>
    </motion.div>
  );
}

// ===== 상태 효과 텍스트 =====
export function StatusEffectText({
  text,
  position,
  type = 'buff',
}: {
  text: string;
  position: { x: number; y: number };
  type?: 'buff' | 'debuff' | 'info';
}) {
  const colorClass = {
    buff: styles.buff,
    debuff: styles.debuff,
    info: styles.info,
  }[type];

  return (
    <motion.div
      className={`${styles.statusEffect} ${colorClass}`}
      style={{
        left: `${position.x * 32 + 16}px`,
        top: `${position.y * 32}px`,
      }}
      initial={{ opacity: 0, y: 10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      {text}
    </motion.div>
  );
}


