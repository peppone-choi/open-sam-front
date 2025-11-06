'use client';

import { useEffect, useState } from 'react';
import { BattleCutscene, BattleCutscenePhase } from '@/types/battle';
import AttackAnimation from './AttackAnimation';
import DefendAnimation from './DefendAnimation';
import HPBar from './HPBar';
import CriticalEffect from './CriticalEffect';
import EvadeEffect from './EvadeEffect';
import styles from './BattleCutsceneModal.module.css';

interface BattleCutsceneModalProps {
  cutscene: BattleCutscene;
  onComplete: () => void;
}

export default function BattleCutsceneModal({ cutscene, onComplete }: BattleCutsceneModalProps) {
  const [phase, setPhase] = useState<BattleCutscenePhase>('idle');
  
  useEffect(() => {
    const timeline = [
      { phase: 'attack' as BattleCutscenePhase, delay: 300 },
      { phase: 'defend' as BattleCutscenePhase, delay: 800 },
      { phase: 'result' as BattleCutscenePhase, delay: 1800 },
    ];
    
    const timeouts: NodeJS.Timeout[] = [];
    
    timeline.forEach(({ phase: nextPhase, delay }) => {
      const timeout = setTimeout(() => {
        setPhase(nextPhase);
      }, delay);
      timeouts.push(timeout);
    });
    
    const closeTimeout = setTimeout(() => {
      onComplete();
    }, 2800);
    timeouts.push(closeTimeout);
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [onComplete]);
  
  useEffect(() => {
    function handleSkip(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === ' ') {
        onComplete();
      }
    }
    
    window.addEventListener('keydown', handleSkip);
    return () => window.removeEventListener('keydown', handleSkip);
  }, [onComplete]);
  
  const getPortraitUrl = (url?: string) => {
    return url || '/default-portrait.svg';
  };
  
  return (
    <div className={styles.modalOverlay} onClick={onComplete}>
      <div className={styles.cutsceneContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.skipHint}>
          ESC 또는 클릭하여 스킵
        </div>
        
        {/* 왼쪽: 공격자 */}
        <div className={`${styles.unitPanel} ${styles.attacker} ${phase === 'attack' ? styles.active : ''}`}>
          <div className={styles.portrait}>
            <img 
              src={getPortraitUrl(cutscene.attacker.portraitUrl)} 
              alt={cutscene.attacker.generalName}
              onError={(e) => {
                e.currentTarget.src = '/default-portrait.svg';
              }}
            />
            {phase === 'attack' && <div className={styles.glowEffect} />}
          </div>
          <div className={styles.unitInfo}>
            <div className={styles.generalName}>{cutscene.attacker.generalName}</div>
            <div className={styles.unitType}>{cutscene.attacker.unitType}</div>
            <div className={styles.stats}>
              <div>통솔 {cutscene.attacker.leadership}</div>
              <div>무력 {cutscene.attacker.force}</div>
            </div>
            <div className={styles.crew}>
              병력: {cutscene.attacker.crewBefore.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* 중앙: 전투 애니메이션 */}
        <div className={styles.animationArea}>
          {phase === 'attack' && !cutscene.isEvaded && (
            <AttackAnimation type={cutscene.attackType} />
          )}
          {phase === 'attack' && cutscene.isEvaded && (
            <EvadeEffect />
          )}
          {phase === 'defend' && !cutscene.isEvaded && (
            <>
              <DefendAnimation 
                damage={cutscene.damage} 
                died={cutscene.defenderDied} 
              />
              {cutscene.isCritical && <CriticalEffect />}
            </>
          )}
          {phase === 'result' && cutscene.defenderDied && (
            <div className={styles.resultText}>전멸!</div>
          )}
        </div>
        
        {/* 오른쪽: 방어자 */}
        <div className={`${styles.unitPanel} ${styles.defender} ${phase === 'defend' ? styles.active : ''} ${cutscene.defenderDied && phase === 'result' ? styles.dead : ''}`}>
          <div className={styles.portrait}>
            <img 
              src={getPortraitUrl(cutscene.defender.portraitUrl)} 
              alt={cutscene.defender.generalName}
              onError={(e) => {
                e.currentTarget.src = '/default-portrait.svg';
              }}
            />
            {phase === 'defend' && <div className={styles.shakeEffect} />}
            {cutscene.defenderDied && phase === 'result' && (
              <div className={styles.deathOverlay}>전멸</div>
            )}
          </div>
          <div className={styles.unitInfo}>
            <div className={styles.generalName}>{cutscene.defender.generalName}</div>
            <div className={styles.unitType}>{cutscene.defender.unitType}</div>
            <div className={styles.stats}>
              <div>통솔 {cutscene.defender.leadership}</div>
              <div>무력 {cutscene.defender.force}</div>
            </div>
            <div className={styles.crew}>
              <HPBar
                before={cutscene.defender.crewBefore}
                after={cutscene.defender.crewAfter}
                animate={phase === 'defend' || phase === 'result'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
