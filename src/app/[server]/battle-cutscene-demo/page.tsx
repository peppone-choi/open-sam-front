'use client';

import { useState } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import BattleCutsceneModal from '@/components/battle/BattleCutsceneModal';
import { BattleCutscene } from '@/types/battle';
import styles from './page.module.css';

export default function BattleCutsceneDemoPage() {
  const [cutscene, setCutscene] = useState<BattleCutscene | null>(null);
  const [attackType, setAttackType] = useState<'melee' | 'ranged' | 'magic'>('melee');
  const [damage, setDamage] = useState(1000);
  const [defenderDied, setDefenderDied] = useState(false);

  function showCutscene() {
    const demoAttacker = {
      generalId: 1,
      generalName: '조조',
      unitType: '기병',
      crewBefore: 5000,
      crewAfter: 5000,
      leadership: 95,
      force: 72,
      intellect: 98,
    };

    const demoDefender = {
      generalId: 2,
      generalName: '여포',
      unitType: '창병',
      crewBefore: 3000,
      crewAfter: defenderDied ? 0 : Math.max(0, 3000 - damage),
      leadership: 24,
      force: 100,
      intellect: 18,
    };

    setCutscene({
      attacker: demoAttacker,
      defender: demoDefender,
      attackType,
      damage,
      defenderDied,
    });
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="전투 연출 데모" />
      
      <div className={styles.content}>
        <h2>전투 연출 테스트</h2>
        <p>아래 설정을 변경하고 &quot;연출 시작&quot; 버튼을 눌러 전투 애니메이션을 확인하세요.</p>
        
        <div className={styles.controls}>
          <div className={styles.formGroup}>
            <label>공격 타입:</label>
            <select 
              value={attackType} 
              onChange={(e) => setAttackType(e.target.value as any)}
              className={styles.select}
            >
              <option value="melee">근접 공격 (검격)</option>
              <option value="ranged">원거리 공격 (화살)</option>
              <option value="magic">마법 공격</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>데미지:</label>
            <input 
              type="number" 
              value={damage}
              onChange={(e) => setDamage(Number(e.target.value))}
              className={styles.input}
              min={0}
              max={3000}
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              <input 
                type="checkbox"
                checked={defenderDied}
                onChange={(e) => setDefenderDied(e.target.checked)}
              />
              {' '}방어자 전멸
            </label>
          </div>

          <button 
            onClick={showCutscene}
            className={styles.startButton}
          >
            연출 시작
          </button>
        </div>

        <div className={styles.info}>
          <h3>사용 방법</h3>
          <ul>
            <li>연출이 시작되면 자동으로 진행됩니다 (약 3초)</li>
            <li>ESC 키나 화면 클릭으로 스킵할 수 있습니다</li>
            <li>공격 타입에 따라 다른 이펙트가 재생됩니다</li>
            <li>데미지 숫자가 중앙에 표시되고 HP 바가 감소합니다</li>
            <li>전멸 체크 시 사망 연출이 추가됩니다</li>
          </ul>
        </div>

        <div className={styles.preview}>
          <h3>연출 단계</h3>
          <ol>
            <li><strong>공격 페이즈 (0.3초)</strong>: 공격자 초상화 발광 + 공격 이펙트</li>
            <li><strong>방어 페이즈 (0.5초)</strong>: 방어자 흔들림 + 데미지 표시 + HP 감소</li>
            <li><strong>결과 페이즈 (1초)</strong>: 전멸 시 사망 표시</li>
            <li><strong>종료 (자동)</strong>: 모달 닫힘</li>
          </ol>
        </div>
      </div>

      {cutscene && (
        <BattleCutsceneModal
          cutscene={cutscene}
          onComplete={() => setCutscene(null)}
        />
      )}
    </div>
  );
}
