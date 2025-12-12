'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BattleEffectsOverlay,
  type BattleEffectsOverlayRef,
  type StatusEffectType,
  type DamageType,
} from '@/components/battle/effects';
import styles from './page.module.css';

/**
 * 전투 이펙트 데모 페이지
 * 
 * 스킬 컷인, 데미지 플로터, 상태 이상 효과를 테스트할 수 있는 데모 페이지
 */
export default function BattleEffectsDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [effectsRef, setEffectsRef] = useState<BattleEffectsOverlayRef | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 랜덤 위치 생성
  const getRandomPosition = useCallback(() => ({
    x: 200 + Math.random() * 600,
    y: 150 + Math.random() * 300,
  }), []);

  // 스킬 컷인 테스트
  const testSkillCutIn = useCallback(async (type: 'attack' | 'defense' | 'strategy' | 'support') => {
    if (!effectsRef || isPlaying) return;
    
    setIsPlaying(true);
    
    const skills = {
      attack: { name: '낙뢰', general: '조운', color: '#ef4444' },
      defense: { name: '철벽수비', general: '장비', color: '#3b82f6' },
      strategy: { name: '화공', general: '주유', color: '#a855f7' },
      support: { name: '신묘한 치료', general: '화타', color: '#22c55e' },
    };
    
    const skill = skills[type];
    
    await effectsRef.showSkillCutIn({
      generalName: skill.general,
      skillName: skill.name,
      nationColor: skill.color,
      skillType: type,
      duration: 2000,
    });
    
    setIsPlaying(false);
  }, [effectsRef, isPlaying]);

  // 데미지 테스트
  const testDamage = useCallback((type: DamageType) => {
    if (!effectsRef) return;
    
    const pos = getRandomPosition();
    
    switch (type) {
      case 'normal':
        effectsRef.showDamage(Math.floor(Math.random() * 500) + 100, pos);
        break;
      case 'critical':
        effectsRef.showCriticalDamage(Math.floor(Math.random() * 1000) + 500, pos);
        break;
      case 'heal':
        effectsRef.showHeal(Math.floor(Math.random() * 300) + 100, pos);
        break;
      case 'miss':
        effectsRef.showMiss(pos);
        break;
      case 'fire':
        effectsRef.showDamage(Math.floor(Math.random() * 200) + 50, pos, 'fire');
        break;
      case 'poison':
        effectsRef.showDamage(Math.floor(Math.random() * 100) + 30, pos, 'poison');
        break;
    }
  }, [effectsRef, getRandomPosition]);

  // 다중 데미지 테스트
  const testMultipleDamages = useCallback(() => {
    if (!effectsRef) return;
    
    const damages = Array.from({ length: 5 }, () => ({
      value: Math.floor(Math.random() * 300) + 100,
      position: getRandomPosition(),
      type: Math.random() > 0.7 ? 'critical' : 'normal' as DamageType,
    }));
    
    effectsRef.showMultipleDamages(damages);
  }, [effectsRef, getRandomPosition]);

  // 상태 이상 테스트
  const testStatus = useCallback((type: StatusEffectType) => {
    if (!effectsRef) return;
    effectsRef.showStatus(type, getRandomPosition(), 3000);
  }, [effectsRef, getRandomPosition]);

  // 전체 시퀀스 테스트
  const testFullSequence = useCallback(async () => {
    if (!effectsRef || isPlaying) return;
    
    setIsPlaying(true);
    
    // 1. 스킬 컷인
    await effectsRef.showSkillCutIn({
      generalName: '관우',
      skillName: '청룡언월도',
      nationColor: '#22c55e',
      skillType: 'attack',
      duration: 2000,
    });
    
    // 2. 데미지들
    const damages = [
      { value: 850, position: { x: 500, y: 200 }, type: 'critical' as DamageType },
      { value: 320, position: { x: 600, y: 250 }, type: 'normal' as DamageType },
      { value: 280, position: { x: 450, y: 300 }, type: 'normal' as DamageType },
    ];
    effectsRef.showMultipleDamages(damages);
    
    // 3. 상태 이상
    setTimeout(() => {
      effectsRef.showStatus('fear', { x: 550, y: 250 }, 2500);
    }, 500);
    
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  }, [effectsRef, isPlaying]);

  return (
    <div className={styles.container} ref={containerRef}>
      <header className={styles.header}>
        <h1 className={styles.title}>⚔️ 전투 이펙트 데모</h1>
        <p className={styles.subtitle}>스킬 컷인, 데미지 플로터, 상태 이상 효과 테스트</p>
      </header>

      {/* 테스트 영역 */}
      <div className={styles.testArea}>
        <div className={styles.mockBattleField}>
          <div className={styles.fieldLabel}>전투 필드 (이펙트 표시 영역)</div>
          
          {/* 더미 유닛들 */}
          {[
            { x: 300, y: 200, label: '아군 1' },
            { x: 400, y: 250, label: '아군 2' },
            { x: 600, y: 200, label: '적군 1' },
            { x: 700, y: 250, label: '적군 2' },
          ].map((unit, i) => (
            <motion.div
              key={i}
              className={styles.mockUnit}
              style={{ left: unit.x, top: unit.y }}
              whileHover={{ scale: 1.1 }}
              onClick={() => {
                if (effectsRef) {
                  effectsRef.showDamage(
                    Math.floor(Math.random() * 500) + 100,
                    { x: unit.x, y: unit.y }
                  );
                }
              }}
            >
              <span className={styles.unitIcon}>🧑‍🤝‍🧑</span>
              <span className={styles.unitLabel}>{unit.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className={styles.controlPanel}>
        {/* 스킬 컷인 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🎬 스킬 컷인</h2>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.button} ${styles.attackBtn}`}
              onClick={() => testSkillCutIn('attack')}
              disabled={isPlaying}
            >
              ⚔️ 공격 스킬
            </button>
            <button
              className={`${styles.button} ${styles.defenseBtn}`}
              onClick={() => testSkillCutIn('defense')}
              disabled={isPlaying}
            >
              🛡️ 방어 스킬
            </button>
            <button
              className={`${styles.button} ${styles.strategyBtn}`}
              onClick={() => testSkillCutIn('strategy')}
              disabled={isPlaying}
            >
              📜 계략 스킬
            </button>
            <button
              className={`${styles.button} ${styles.supportBtn}`}
              onClick={() => testSkillCutIn('support')}
              disabled={isPlaying}
            >
              ✨ 지원 스킬
            </button>
          </div>
        </section>

        {/* 데미지 플로터 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>💥 데미지 플로터</h2>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.button} ${styles.normalDmg}`}
              onClick={() => testDamage('normal')}
            >
              일반 데미지
            </button>
            <button
              className={`${styles.button} ${styles.criticalDmg}`}
              onClick={() => testDamage('critical')}
            >
              크리티컬!
            </button>
            <button
              className={`${styles.button} ${styles.healBtn}`}
              onClick={() => testDamage('heal')}
            >
              💚 회복
            </button>
            <button
              className={`${styles.button} ${styles.missBtn}`}
              onClick={() => testDamage('miss')}
            >
              MISS!
            </button>
            <button
              className={`${styles.button} ${styles.fireBtn}`}
              onClick={() => testDamage('fire')}
            >
              🔥 화염
            </button>
            <button
              className={`${styles.button} ${styles.poisonBtn}`}
              onClick={() => testDamage('poison')}
            >
              ☠️ 독
            </button>
            <button
              className={`${styles.button} ${styles.multiBtn}`}
              onClick={testMultipleDamages}
            >
              다중 데미지
            </button>
          </div>
        </section>

        {/* 상태 이상 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🌀 상태 이상</h2>
          <div className={styles.buttonGroup}>
            <button
              className={styles.button}
              onClick={() => testStatus('fire')}
            >
              🔥 화계
            </button>
            <button
              className={styles.button}
              onClick={() => testStatus('confusion')}
            >
              💫 혼란
            </button>
            <button
              className={styles.button}
              onClick={() => testStatus('fear')}
            >
              😱 공포
            </button>
            <button
              className={styles.button}
              onClick={() => testStatus('stun')}
            >
              ⚡ 기절
            </button>
            <button
              className={styles.button}
              onClick={() => testStatus('poison')}
            >
              ☠️ 중독
            </button>
            <button
              className={styles.button}
              onClick={() => testStatus('buff')}
            >
              ⬆️ 버프
            </button>
            <button
              className={styles.button}
              onClick={() => testStatus('debuff')}
            >
              ⬇️ 디버프
            </button>
            <button
              className={styles.button}
              onClick={() => testStatus('shield')}
            >
              🛡️ 방어막
            </button>
            <button
              className={styles.button}
              onClick={() => testStatus('rage')}
            >
              💢 격노
            </button>
          </div>
        </section>

        {/* 통합 테스트 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🎮 통합 테스트</h2>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.button} ${styles.sequenceBtn}`}
              onClick={testFullSequence}
              disabled={isPlaying}
            >
              {isPlaying ? '재생 중...' : '🎬 전체 시퀀스 재생'}
            </button>
            <button
              className={`${styles.button} ${styles.clearBtn}`}
              onClick={() => effectsRef?.clearAll()}
            >
              🗑️ 모두 지우기
            </button>
          </div>
        </section>
      </div>

      {/* 이펙트 오버레이 */}
      <BattleEffectsOverlay
        containerRef={containerRef}
        onRef={setEffectsRef}
      />
    </div>
  );
}








