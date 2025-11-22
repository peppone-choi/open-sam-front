import type { BattleUnit } from '@/components/battle/BattleMap';
import { getAttackTypeByCrewtype as getAttackTypeByCrewtypeMapping } from './unitTypeMapping';

export type AttackType = 'melee' | 'ranged' | 'magic';

export function getAttackTypeByUnitType(unitType: string): AttackType {
  const type = unitType.toLowerCase();
  
  if (type.includes('궁') || type.includes('archer') || type.includes('bow') || type.includes('노') || type.includes('마궁')) {
    return 'ranged';
  }
  
  if (type.includes('마법') || type.includes('법사') || type.includes('magic') || type.includes('mage') || 
      type.includes('책사') || type.includes('도사') || type.includes('천사')) {
    return 'magic';
  }
  
  if (type.includes('차') || type.includes('siege') || type.includes('정란') || type.includes('투석')) {
    return 'ranged';
  }
  
  return 'melee';
}

export function getAttackTypeByCrewtype(crewtype?: number): AttackType {
  if (!crewtype) return 'melee';
  return getAttackTypeByCrewtypeMapping(crewtype);
}

export interface CombatResult {
  damage: number;
  isCritical: boolean;
  isEvaded: boolean;
  defenderDied: boolean;
  attackerDamage: number;
}

function calculateDistance(attacker: BattleUnit, defender: BattleUnit): number {
  const dx = attacker.x - defender.x;
  const dy = attacker.y - defender.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateCombat(attacker: BattleUnit, defender: BattleUnit): CombatResult {
  const attackerForce = attacker.force || 50;
  const attackerLeadership = attacker.leadership || 50;
  const defenderForce = defender.force || 50;
  const defenderLeadership = defender.leadership || 50;
  
  const attackerCrew = attacker.crew || 1000;
  const defenderCrew = defender.crew || 1000;
  
  const evadeChance = Math.max(0, (defenderLeadership - attackerLeadership) / 200);
  const isEvaded = Math.random() < evadeChance;
  
  if (isEvaded) {
    return {
      damage: 0,
      isCritical: false,
      isEvaded: true,
      defenderDied: false,
      attackerDamage: 0,
    };
  }
  
  const critChance = Math.min(0.3, attackerLeadership / 300);
  const isCritical = Math.random() < critChance;
  
  const baseDamage = attackerForce * (attackerCrew / 100);
  const critMultiplier = isCritical ? 2.0 : 1.0;
  const randomFactor = 0.8 + Math.random() * 0.4;
  
  const damage = Math.floor(baseDamage * critMultiplier * randomFactor);
  
  const defenderBaseDamage = defenderForce * (defenderCrew / 200);
  const defenderRandomFactor = 0.5 + Math.random() * 0.3;
  const attackerDamage = Math.floor(defenderBaseDamage * defenderRandomFactor);
  
  const defenderDied = defenderCrew <= damage;
  
  return {
    damage,
    isCritical,
    isEvaded: false,
    defenderDied,
    attackerDamage,
  };
}

export function updateUnitsAfterCombat(
  units: BattleUnit[],
  attackerId: string,
  defenderId: string,
  result: CombatResult
): BattleUnit[] {
  return units.map(unit => {
    if (unit.id === attackerId) {
      const newCrew = Math.max(0, (unit.crew || 0) - result.attackerDamage);
      return {
        ...unit,
        crew: newCrew,
      };
    }
    if (unit.id === defenderId) {
      const newCrew = Math.max(0, (unit.crew || 0) - result.damage);
      return {
        ...unit,
        crew: newCrew,
      };
    }
    return unit;
  }).filter(unit => (unit.crew || 0) > 0);
}

export function getUnitColor(unitType: string): string {
  const type = unitType.toLowerCase();
  
  if (type.includes('기병') || type.includes('cavalry')) {
    return '#ff6b6b';
  }
  if (type.includes('궁') || type.includes('archer')) {
    return '#4ecdc4';
  }
  if (type.includes('창') || type.includes('spear')) {
    return '#ffe66d';
  }
  if (type.includes('마법') || type.includes('magic')) {
    return '#a29bfe';
  }
  
  return '#95e1d3';
}
