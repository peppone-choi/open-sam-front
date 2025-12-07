'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StatusEffectType, StatusOverlayProps } from './types';
import styles from './StatusOverlay.module.css';

/**
 * StatusOverlay - 상태 이상 오버레이 효과
 * 
 * 화계, 혼란, 기절 등 다양한 상태 이상을 시각적으로 표현
 */
export function StatusOverlay({
  type,
  position,
  duration = 2000,
  intensity = 'medium',
}: StatusOverlayProps) {
  // 상태별 설정
  const getStatusConfig = (statusType: StatusEffectType) => {
    switch (statusType) {
      case 'fire':
        return {
          icon: '🔥',
          label: '화계',
          color: '#ef4444',
          bgGradient: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)',
          particles: ['🔥', '💥', '🔥'],
        };
      case 'confusion':
        return {
          icon: '💫',
          label: '혼란',
          color: '#a855f7',
          bgGradient: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
          particles: ['⭐', '💫', '✨'],
        };
      case 'fear':
        return {
          icon: '😱',
          label: '공포',
          color: '#6366f1',
          bgGradient: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
          particles: ['👻', '💀', '😱'],
        };
      case 'stun':
        return {
          icon: '⚡',
          label: '기절',
          color: '#eab308',
          bgGradient: 'radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, transparent 70%)',
          particles: ['⚡', '💥', '⭐'],
        };
      case 'poison':
        return {
          icon: '☠️',
          label: '중독',
          color: '#22c55e',
          bgGradient: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)',
          particles: ['💀', '☠️', '💚'],
        };
      case 'buff':
        return {
          icon: '⬆️',
          label: '강화',
          color: '#3b82f6',
          bgGradient: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
          particles: ['✨', '⬆️', '💪'],
        };
      case 'debuff':
        return {
          icon: '⬇️',
          label: '약화',
          color: '#f97316',
          bgGradient: 'radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%)',
          particles: ['💔', '⬇️', '❌'],
        };
      case 'shield':
        return {
          icon: '🛡️',
          label: '방어',
          color: '#06b6d4',
          bgGradient: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
          particles: ['🛡️', '✨', '💠'],
        };
      case 'rage':
        return {
          icon: '💢',
          label: '격노',
          color: '#dc2626',
          bgGradient: 'radial-gradient(circle, rgba(220, 38, 38, 0.5) 0%, transparent 70%)',
          particles: ['💢', '🔥', '⚡'],
        };
      default:
        return {
          icon: '❓',
          label: '상태',
          color: '#9ca3af',
          bgGradient: 'radial-gradient(circle, rgba(156, 163, 175, 0.4) 0%, transparent 70%)',
          particles: ['❓'],
        };
    }
  };

  const config = getStatusConfig(type);
  const intensityScale = {
    low: 0.7,
    medium: 1,
    high: 1.3,
  }[intensity];

  return (
    <motion.div
      className={styles.overlay}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: intensityScale }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
    >
      {/* 배경 글로우 */}
      <motion.div
        className={styles.bgGlow}
        style={{ background: config.bgGradient }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      {/* 아이콘 */}
      <motion.div
        className={styles.iconContainer}
        animate={{
          y: [0, -5, 0],
          rotate: type === 'confusion' ? [0, 10, -10, 0] : [0, 0, 0],
        }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <span className={styles.icon}>{config.icon}</span>
      </motion.div>

      {/* 레이블 */}
      <motion.div
        className={styles.label}
        style={{ color: config.color }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {config.label}
      </motion.div>

      {/* 파티클 효과 */}
      <AnimatePresence>
        {config.particles.map((particle, i) => (
          <motion.span
            key={i}
            className={styles.particle}
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / config.particles.length) * 40,
              y: Math.sin((i * Math.PI * 2) / config.particles.length) * 40 - 20,
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          >
            {particle}
          </motion.span>
        ))}
      </AnimatePresence>

      {/* 화계 전용: 불꽃 애니메이션 */}
      {type === 'fire' && (
        <div className={styles.fireContainer}>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.flame}
              style={{
                left: `${20 + i * 15}%`,
              }}
              animate={{
                y: [0, -30, 0],
                scale: [1, 1.2, 0.8, 1],
                opacity: [0.8, 1, 0.6, 0.8],
              }}
              transition={{
                duration: 0.6 + Math.random() * 0.4,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            >
              🔥
            </motion.div>
          ))}
        </div>
      )}

      {/* 혼란 전용: 회전 별 */}
      {type === 'confusion' && (
        <motion.div
          className={styles.confusionRing}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          {['⭐', '💫', '✨', '⭐', '💫'].map((star, i) => (
            <span
              key={i}
              className={styles.confusionStar}
              style={{
                transform: `rotate(${i * 72}deg) translateY(-35px)`,
              }}
            >
              {star}
            </span>
          ))}
        </motion.div>
      )}

      {/* 기절 전용: 번개 효과 */}
      {type === 'stun' && (
        <motion.div
          className={styles.stunFlash}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          ⚡
        </motion.div>
      )}

      {/* 방어 전용: 보호막 링 */}
      {type === 'shield' && (
        <motion.div
          className={styles.shieldRing}
          style={{ borderColor: config.color }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

/**
 * StatusIcon - 작은 상태 아이콘 (HUD용)
 */
export function StatusIcon({
  type,
  size = 24,
}: {
  type: StatusEffectType;
  size?: number;
}) {
  const icons: Record<StatusEffectType, string> = {
    fire: '🔥',
    confusion: '💫',
    fear: '😱',
    stun: '⚡',
    poison: '☠️',
    buff: '⬆️',
    debuff: '⬇️',
    shield: '🛡️',
    rage: '💢',
  };

  return (
    <motion.span
      className={styles.statusIcon}
      style={{ fontSize: `${size}px` }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    >
      {icons[type]}
    </motion.span>
  );
}

export default StatusOverlay;

