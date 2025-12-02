'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ArmyInfo } from './BattleScene';
import styles from './BattleCutscene.module.css';

// ===== Props =====
interface BattleCutsceneProps {
  attacker: ArmyInfo;
  defender: ArmyInfo;
  onComplete: () => void;
  duration?: number;
}

// ===== 메인 컴포넌트 =====
export default function BattleCutscene({
  attacker,
  defender,
  onComplete,
  duration = 3500,
}: BattleCutsceneProps) {
  const [phase, setPhase] = useState<'enter' | 'clash' | 'title'>('enter');

  // 타임라인
  useEffect(() => {
    const timeline = [
      { phase: 'clash' as const, delay: 1000 },
      { phase: 'title' as const, delay: 1800 },
    ];

    const timeouts: NodeJS.Timeout[] = [];

    timeline.forEach(({ phase: nextPhase, delay }) => {
      const timeout = setTimeout(() => setPhase(nextPhase), delay);
      timeouts.push(timeout);
    });

    // 자동 완료
    const completeTimeout = setTimeout(onComplete, duration);
    timeouts.push(completeTimeout);

    return () => timeouts.forEach(t => clearTimeout(t));
  }, [duration, onComplete]);

  // 키보드/클릭으로 스킵
  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  return (
    <motion.div
      className={styles.cutsceneOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleSkip}
    >
      {/* 스킵 힌트 */}
      <div className={styles.skipHint}>
        클릭 또는 ESC로 스킵
      </div>

      {/* 배경 효과 */}
      <div className={styles.backgroundEffects}>
        {/* 동적 그라데이션 */}
        <motion.div
          className={styles.dynamicGradient}
          animate={{
            background: [
              `linear-gradient(135deg, ${attacker.nationColor}40 0%, transparent 50%, ${defender.nationColor}40 100%)`,
              `linear-gradient(135deg, ${attacker.nationColor}60 0%, transparent 50%, ${defender.nationColor}60 100%)`,
              `linear-gradient(135deg, ${attacker.nationColor}40 0%, transparent 50%, ${defender.nationColor}40 100%)`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* 스파크 효과 */}
        <AnimatePresence>
          {phase !== 'enter' && (
            <motion.div
              className={styles.sparkContainer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className={styles.spark}
                  initial={{
                    x: '50%',
                    y: '50%',
                    scale: 0,
                  }}
                  animate={{
                    x: `${50 + (Math.random() - 0.5) * 100}%`,
                    y: `${50 + (Math.random() - 0.5) * 100}%`,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1 + Math.random() * 0.5,
                    delay: Math.random() * 0.3,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 속도선 효과 */}
        <div className={styles.speedLines}>
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.speedLine}
              style={{
                top: `${Math.random() * 100}%`,
                left: Math.random() > 0.5 ? '-10%' : 'auto',
                right: Math.random() > 0.5 ? '-10%' : 'auto',
              }}
              animate={{
                x: Math.random() > 0.5 ? ['-100%', '200%'] : ['100%', '-200%'],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                delay: Math.random() * 2,
                repeat: Infinity,
                repeatDelay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className={styles.mainContent}>
        {/* 공격측 */}
        <motion.div
          className={styles.commanderCard + ' ' + styles.attacker}
          initial={{ x: '-100%', rotate: -10 }}
          animate={{
            x: phase === 'enter' ? '-30%' : phase === 'clash' ? '0%' : '-5%',
            rotate: phase === 'clash' ? 0 : -10,
          }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 15,
          }}
        >
          <div className={styles.cardGlow} style={{ backgroundColor: attacker.nationColor }} />
          <div className={styles.portraitFrame}>
            <div 
              className={styles.portrait}
              style={{
                backgroundImage: attacker.commanderPortrait 
                  ? `url(${attacker.commanderPortrait})`
                  : 'linear-gradient(135deg, #374151, #1f2937)',
              }}
            >
              {!attacker.commanderPortrait && (
                <span className={styles.portraitFallback}>
                  {attacker.commanderName.substring(0, 1)}
                </span>
              )}
            </div>
          </div>
          <div className={styles.commanderInfo}>
            <div className={styles.nationTag} style={{ backgroundColor: attacker.nationColor }}>
              {attacker.nationName}
            </div>
            <h2 className={styles.commanderName}>{attacker.commanderName}</h2>
            <div className={styles.armyStats}>
              <span>⚔️ {attacker.totalUnits}부대</span>
              <span>👥 {attacker.totalCrew.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* VS 표시 */}
        <motion.div
          className={styles.vsContainer}
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: phase === 'enter' ? 0.5 : phase === 'clash' ? 1.5 : 1,
            rotate: phase === 'enter' ? -90 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
        >
          <motion.span
            className={styles.vsText}
            animate={{
              textShadow: phase === 'clash' 
                ? ['0 0 40px #fbbf24, 0 0 80px #fbbf24', '0 0 60px #fbbf24, 0 0 120px #fbbf24', '0 0 40px #fbbf24, 0 0 80px #fbbf24']
                : '0 0 20px #fbbf24, 0 0 40px #fbbf24',
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            VS
          </motion.span>
        </motion.div>

        {/* 방어측 */}
        <motion.div
          className={styles.commanderCard + ' ' + styles.defender}
          initial={{ x: '100%', rotate: 10 }}
          animate={{
            x: phase === 'enter' ? '30%' : phase === 'clash' ? '0%' : '5%',
            rotate: phase === 'clash' ? 0 : 10,
          }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 15,
          }}
        >
          <div className={styles.cardGlow} style={{ backgroundColor: defender.nationColor }} />
          <div className={styles.portraitFrame}>
            <div 
              className={styles.portrait}
              style={{
                backgroundImage: defender.commanderPortrait 
                  ? `url(${defender.commanderPortrait})`
                  : 'linear-gradient(135deg, #374151, #1f2937)',
              }}
            >
              {!defender.commanderPortrait && (
                <span className={styles.portraitFallback}>
                  {defender.commanderName.substring(0, 1)}
                </span>
              )}
            </div>
          </div>
          <div className={styles.commanderInfo}>
            <div className={styles.nationTag} style={{ backgroundColor: defender.nationColor }}>
              {defender.nationName}
            </div>
            <h2 className={styles.commanderName}>{defender.commanderName}</h2>
            <div className={styles.armyStats}>
              <span>⚔️ {defender.totalUnits}부대</span>
              <span>👥 {defender.totalCrew.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 타이틀 */}
      <AnimatePresence>
        {phase === 'title' && (
          <motion.div
            className={styles.battleTitle}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <motion.div
              className={styles.titleText}
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              ⚔️ 전투 개시! ⚔️
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 시작 버튼 */}
      <motion.button
        className={styles.startButton}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 200 }}
        onClick={handleSkip}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        전투 시작!
      </motion.button>
    </motion.div>
  );
}


