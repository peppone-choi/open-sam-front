'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SkillCutInProps } from './types';
import styles from './SkillCutIn.module.css';

/**
 * SkillCutIn - 스킬 발동 컷인 애니메이션
 * 
 * 장수가 스킬을 사용할 때 화면을 가로지르며 등장하는
 * 화려한 컷인 연출 컴포넌트
 */
export default function SkillCutIn({
  generalName,
  skillName,
  portraitUrl,
  nationColor = '#fbbf24',
  skillType = 'attack',
  onComplete,
  duration = 2000,
}: SkillCutInProps) {
  
  // 자동 완료 타이머
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  // 스킵 핸들러
  const handleSkip = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // 스킬 타입에 따른 색상
  const getSkillTypeColor = () => {
    switch (skillType) {
      case 'attack': return '#ef4444';
      case 'defense': return '#3b82f6';
      case 'strategy': return '#a855f7';
      case 'support': return '#22c55e';
      default: return '#fbbf24';
    }
  };

  const skillTypeColor = getSkillTypeColor();

  return (
    <motion.div
      className={styles.cutinOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={handleSkip}
    >
      {/* 배경 플래시 */}
      <motion.div
        className={styles.flashBackground}
        style={{ backgroundColor: skillTypeColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.3 }}
      />

      {/* 속도선 효과 */}
      <div className={styles.speedLineContainer}>
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.speedLine}
            style={{
              top: `${Math.random() * 100}%`,
              height: `${2 + Math.random() * 3}px`,
              background: `linear-gradient(90deg, transparent, ${nationColor}80, transparent)`,
            }}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ 
              x: '-100%', 
              opacity: [0, 1, 0] 
            }}
            transition={{
              duration: 0.4 + Math.random() * 0.3,
              delay: Math.random() * 0.2,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* 대각선 슬래시 라인 */}
      <motion.div
        className={styles.slashContainer}
        initial={{ clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' }}
        animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className={styles.slashGradient} style={{ 
          background: `linear-gradient(135deg, ${nationColor}20 0%, ${nationColor}60 50%, ${nationColor}20 100%)`
        }} />
      </motion.div>

      {/* 메인 컨텐츠 */}
      <div className={styles.mainContent}>
        {/* 포트레이트 프레임 */}
        <motion.div
          className={styles.portraitSection}
          initial={{ x: '-150%', rotate: -15 }}
          animate={{ x: '0%', rotate: 0 }}
          exit={{ x: '-150%', rotate: -15 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 25,
            duration: 0.4,
          }}
        >
          {/* 글로우 이펙트 */}
          <motion.div
            className={styles.portraitGlow}
            style={{ backgroundColor: nationColor }}
            animate={{
              boxShadow: [
                `0 0 40px ${nationColor}, 0 0 80px ${nationColor}80`,
                `0 0 60px ${nationColor}, 0 0 120px ${nationColor}80`,
                `0 0 40px ${nationColor}, 0 0 80px ${nationColor}80`,
              ],
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />

          {/* 포트레이트 이미지 */}
          <div className={styles.portraitFrame}>
            <div
              className={styles.portrait}
              style={{
                backgroundImage: portraitUrl
                  ? `url(${portraitUrl})`
                  : 'linear-gradient(135deg, #374151, #1f2937)',
              }}
            >
              {!portraitUrl && (
                <span className={styles.portraitFallback}>
                  {generalName.substring(0, 1)}
                </span>
              )}
            </div>
          </div>

          {/* 장수명 */}
          <motion.div
            className={styles.generalName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <span style={{ color: nationColor }}>{generalName}</span>
          </motion.div>
        </motion.div>

        {/* 스킬명 섹션 */}
        <motion.div
          className={styles.skillSection}
          initial={{ x: '150%', opacity: 0 }}
          animate={{ x: '0%', opacity: 1 }}
          exit={{ x: '150%', opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 180,
            damping: 25,
            delay: 0.1,
          }}
        >
          {/* 스킬 타입 뱃지 */}
          <motion.div
            className={styles.skillTypeBadge}
            style={{ backgroundColor: skillTypeColor }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          >
            {skillType === 'attack' && '⚔️ 공격'}
            {skillType === 'defense' && '🛡️ 방어'}
            {skillType === 'strategy' && '📜 계략'}
            {skillType === 'support' && '✨ 지원'}
          </motion.div>

          {/* 스킬명 */}
          <motion.h1
            className={styles.skillName}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
          >
            {skillName}
          </motion.h1>

          {/* 스킬명 글로우 */}
          <motion.div
            className={styles.skillNameGlow}
            animate={{
              textShadow: [
                `0 0 20px ${skillTypeColor}, 0 0 40px ${skillTypeColor}`,
                `0 0 40px ${skillTypeColor}, 0 0 80px ${skillTypeColor}`,
                `0 0 20px ${skillTypeColor}, 0 0 40px ${skillTypeColor}`,
              ],
            }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            {skillName}
          </motion.div>
        </motion.div>
      </div>

      {/* 파티클 효과 */}
      <AnimatePresence>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.particle}
            style={{
              left: `${50 + (Math.random() - 0.5) * 60}%`,
              top: `${50 + (Math.random() - 0.5) * 60}%`,
              backgroundColor: Math.random() > 0.5 ? nationColor : skillTypeColor,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [1, 0.8, 0],
              x: (Math.random() - 0.5) * 200,
              y: (Math.random() - 0.5) * 200,
            }}
            transition={{
              duration: 0.8 + Math.random() * 0.4,
              delay: 0.2 + Math.random() * 0.3,
              ease: 'easeOut',
            }}
          />
        ))}
      </AnimatePresence>

      {/* 임팩트 버스트 */}
      <motion.div
        className={styles.impactBurst}
        style={{ borderColor: skillTypeColor }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
      />
    </motion.div>
  );
}






