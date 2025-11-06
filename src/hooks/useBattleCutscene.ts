'use client';

import { useState, useEffect, useCallback } from 'react';
import { BattleCutscene } from '@/types/battle';
import { useSocket } from './useSocket';

export function useBattleCutscene() {
  const { socket, onBattleEvent } = useSocket();
  const [cutscene, setCutscene] = useState<BattleCutscene | null>(null);
  const [cutsceneQueue, setCutsceneQueue] = useState<BattleCutscene[]>([]);

  // 전투 이벤트 수신
  useEffect(() => {
    if (!socket) return;

    const cleanup = onBattleEvent('combat', (data: any) => {
      // 백엔드에서 전투 데이터 수신
      const newCutscene: BattleCutscene = {
        attacker: {
          generalId: data.attacker.generalId,
          generalName: data.attacker.generalName,
          portraitUrl: data.attacker.portraitUrl,
          unitType: data.attacker.unitType || '보병',
          crewBefore: data.attacker.crewBefore,
          crewAfter: data.attacker.crewAfter,
          leadership: data.attacker.leadership,
          force: data.attacker.force,
          intellect: data.attacker.intellect,
        },
        defender: {
          generalId: data.defender.generalId,
          generalName: data.defender.generalName,
          portraitUrl: data.defender.portraitUrl,
          unitType: data.defender.unitType || '보병',
          crewBefore: data.defender.crewBefore,
          crewAfter: data.defender.crewAfter,
          leadership: data.defender.leadership,
          force: data.defender.force,
          intellect: data.defender.intellect,
        },
        attackType: data.attackType || 'melee',
        damage: data.damage,
        defenderDied: data.defenderDied || false,
      };

      // 큐에 추가
      setCutsceneQueue(prev => [...prev, newCutscene]);
    });

    return cleanup;
  }, [socket, onBattleEvent]);

  // 턴 결과로 여러 전투 수신
  useEffect(() => {
    if (!socket) return;

    const cleanup = onBattleEvent('turn_result', (data: any) => {
      if (data.combats && Array.isArray(data.combats)) {
        const newCutscenes: BattleCutscene[] = data.combats.map((combat: any) => ({
          attacker: {
            generalId: combat.attacker.generalId,
            generalName: combat.attacker.generalName,
            portraitUrl: combat.attacker.portraitUrl,
            unitType: combat.attacker.unitType || '보병',
            crewBefore: combat.attacker.crewBefore,
            crewAfter: combat.attacker.crewAfter,
            leadership: combat.attacker.leadership,
            force: combat.attacker.force,
            intellect: combat.attacker.intellect,
          },
          defender: {
            generalId: combat.defender.generalId,
            generalName: combat.defender.generalName,
            portraitUrl: combat.defender.portraitUrl,
            unitType: combat.defender.unitType || '보병',
            crewBefore: combat.defender.crewBefore,
            crewAfter: combat.defender.crewAfter,
            leadership: combat.defender.leadership,
            force: combat.defender.force,
            intellect: combat.defender.intellect,
          },
          attackType: combat.attackType || 'melee',
          damage: combat.damage,
          defenderDied: combat.defenderDied || false,
        }));

        setCutsceneQueue(prev => [...prev, ...newCutscenes]);
      }
    });

    return cleanup;
  }, [socket, onBattleEvent]);

  // 큐에서 다음 컷씬 재생
  useEffect(() => {
    if (!cutscene && cutsceneQueue.length > 0) {
      setCutscene(cutsceneQueue[0]);
      setCutsceneQueue(prev => prev.slice(1));
    }
  }, [cutscene, cutsceneQueue]);

  const showCutscene = useCallback((data: BattleCutscene) => {
    setCutsceneQueue(prev => [...prev, data]);
  }, []);

  const closeCutscene = useCallback(() => {
    setCutscene(null);
  }, []);

  const skipAll = useCallback(() => {
    setCutscene(null);
    setCutsceneQueue([]);
  }, []);

  return {
    cutscene,
    showCutscene,
    closeCutscene,
    skipAll,
    hasQueue: cutsceneQueue.length > 0,
  };
}
