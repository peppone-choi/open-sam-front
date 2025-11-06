// 전투 컷씬 관련 타입 정의

export interface BattleCutscene {
  attacker: CutsceneUnit;
  defender: CutsceneUnit;
  attackType: 'melee' | 'ranged' | 'magic';
  damage: number;
  defenderDied: boolean;
  isCritical?: boolean;
  isEvaded?: boolean;
  specialSkill?: string;
}

export interface CutsceneUnit {
  generalId: number;
  generalName: string;
  portraitUrl?: string;
  unitType: string;
  crewBefore: number;
  crewAfter: number;
  leadership: number;
  force: number;
  intellect?: number;
}

export type BattleCutscenePhase = 'idle' | 'attack' | 'defend' | 'result';
