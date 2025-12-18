// @ts-nocheck
/**
 * Phaser + Three.js + 복셀 하이브리드 전투 엔진
 * 
 * - Phaser: 게임 로직 (60fps 안정 루프, 물리, AI)
 * - Three.js: 3D 복셀 렌더링
 * - InstancedUnitRenderer: 대규모 유닛 최적화
 */

import * as Phaser from 'phaser';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { InstancedUnitRenderer } from './InstancedUnitRenderer'; // 복셀 DB 빌드 이슈로 임시 비활성화
import { buildVoxelUnitFromSpec } from '@/components/battle/units/VoxelUnitBuilder';
import { VOXEL_UNIT_DATABASE } from '@/components/battle/units/db/VoxelUnitDefinitions';
import { UnitCategory, type TWSquad, type TWSoldier, type TWFormation, type FormationState, type MovementMode, type SquadState } from './TotalWarEngine';
import { CameraController, type FollowTarget, type CameraModeType, type Vector3Like } from './camera';

// AI 시스템 임포트
import { 
  AIController, 
  getAIController, 
  resetAIController,
  type AIState,
  type AISquadContext 
} from './ai/AIController';
import { 
  TargetSelector, 
  createTargetSelectorForCategory,
  type TargetInfo 
} from './ai/TargetSelector';
import { 
  SpecialActionManager,
  type SpecialActionType 
} from './ai/SpecialActions';
import { 
  MoraleManager, 
  getMoraleManager,
  getMoraleState,
  type MoraleState 
} from './systems/MoraleSystem';
import { 
  FormationManager,
  type FormationSlot 
} from './systems/FormationManager';

// ========================================
// 타입 정의
// ========================================

export type TeamId = 'attacker' | 'defender';
export type SoldierState = 
  | 'idle' | 'moving' | 'charging' | 'fighting' 
  | 'pursuing' | 'wavering' | 'routing' | 'dead';

// 병사 역할
export type SoldierRole = 'soldier' | 'flag_bearer' | 'drummer' | 'sergeant';

const TEAM_VOXEL_COLORS: Record<TeamId, {
  primary: string;
  secondary: string;
  indicator: number;
  fighting: number;
}> = {
  attacker: {
    primary: '#2F4F4F',
    secondary: '#4682B4',
    indicator: 0x1f4f4f,
    fighting: 0x00bcd4,
  },
  defender: {
    primary: '#8B0000',
    secondary: '#CD5C5C',
    indicator: 0x8b1a1a,
    fighting: 0xff5f5f,
  },
};

const ROUTING_INDICATOR_COLOR = 0xF6AD55;
const DEFAULT_VOXEL_SCALE = 1.5;
const VOXEL_FORWARD_OFFSET = -Math.PI / 2;
// ========================================
// 유닛 스탯
// ========================================

const UNIT_STATS: Record<string, {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  isRanged: boolean;
  unitTypeId: number;
}> = {
  ji_infantry: { hp: 100, attack: 35, defense: 40, speed: 2.5, range: 3, isRanged: false, unitTypeId: 1103 },
  sword_infantry: { hp: 90, attack: 45, defense: 35, speed: 3, range: 2.5, isRanged: false, unitTypeId: 1102 },
  halberd_infantry: { hp: 110, attack: 50, defense: 30, speed: 2.5, range: 3.5, isRanged: false, unitTypeId: 1104 },
  spear_guard: { hp: 120, attack: 30, defense: 50, speed: 2, range: 3, isRanged: false, unitTypeId: 1106 },
  archer: { hp: 60, attack: 40, defense: 15, speed: 2.8, range: 50, isRanged: true, unitTypeId: 1201 },
  crossbow: { hp: 65, attack: 55, defense: 20, speed: 2.5, range: 60, isRanged: true, unitTypeId: 1202 },
  horse_archer: { hp: 70, attack: 35, defense: 20, speed: 5, range: 40, isRanged: true, unitTypeId: 1303 },
  cavalry: { hp: 100, attack: 50, defense: 35, speed: 6, range: 3, isRanged: false, unitTypeId: 1300 },
  shock_cavalry: { hp: 120, attack: 65, defense: 30, speed: 7, range: 3, isRanged: false, unitTypeId: 1304 },
};

// ========================================
// 병사 데이터 (TotalWarEngine 호환)
// ========================================

export interface PVSoldier {
  id: string;
  squadId: string;
  teamId: TeamId;
  
  // 역할
  role: SoldierRole;
  
  // 위치/회전
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  facing: number;
  
  // 전투 스탯
  hp: number;
  maxHp: number;
  morale: number;
  fatigue: number;
  
  // 상태
  state: SoldierState;
  lastStateChangeTime: number;
  
  // 전투
  engagedWith?: string;
  lastAttackTime: number;
  
  // 진형
  formationOffset: { x: number; y: number };
  
  // 시야
  visionRange: number;
  awarenessRange: number;
  visibleEnemies: string[];
  personalityTraits: string[];
}

export interface PVSquad extends TWSquad {
  // 추가 필드 없음, TWSquad 그대로 사용
}

// ========================================
// Phaser 게임 씬 (로직 전용)
// ========================================

export class BattleLogicScene extends Phaser.Scene {
  // 데이터 저장소
  public soldiers: Map<string, PVSoldier> = new Map();
  public squads: Map<string, PVSquad> = new Map();
  
  // 공간 분할
  private gridCellSize = 10;
  private spatialGrid: Map<string, Set<string>> = new Map();
  private teamCenterCache: Map<TeamId, { x: number; y: number } | null> = new Map();
  
  // 전투 상태
  public battleState: 'preparing' | 'running' | 'paused' | 'ended' = 'preparing';
  public winner?: TeamId;
  
  // Three.js 동기화 콜백
  public onUpdate?: (soldiers: Map<string, PVSoldier>, squads: Map<string, PVSquad>) => void;
  public onStatsUpdate?: (attacker: { alive: number; total: number; kills: number }, defender: { alive: number; total: number; kills: number }) => void;
  public onBattleEnd?: (winner: TeamId) => void;
  
  // 통계
  private attackerStats = { alive: 0, total: 0, kills: 0 };
  private defenderStats = { alive: 0, total: 0, kills: 0 };
  private lastStatsUpdate = 0;
  
  // ========================================
  // AI 시스템 (모듈화된 AI)
  // ========================================
  private aiController: AIController;
  private targetSelector: TargetSelector;
  private specialActionManager: SpecialActionManager;
  private moraleManager: MoraleManager;
  private formationManager: FormationManager;
  
  /** AI 시스템 활성화 여부 (false면 기존 인라인 AI 사용) */
  public useAdvancedAI: boolean = true;
  
  constructor() {
    super({ key: 'BattleLogicScene' });
    
    // AI 시스템 초기화
    this.aiController = getAIController({
      updateInterval: 100,
      detectionRange: 80,
      visionRange: 60,
      maxConcurrentUpdates: 10,
    });
    this.targetSelector = new TargetSelector();
    this.specialActionManager = new SpecialActionManager();
    this.moraleManager = getMoraleManager();
    this.formationManager = new FormationManager();
  }
  
  create(): void {
    console.log('🎮 Phaser BattleLogicScene created');
    console.log('🤖 Advanced AI System initialized');
  }
  
  // ========================================
  // 부대/병사 생성
  // ========================================
  
  createSquad(config: {
    name: string;
    teamId: TeamId;
    category: string;
    soldierCount: number;
    x: number;
    z: number;
    facing: number;
  }): PVSquad {
    const squadId = `squad_${this.squads.size}`;
    const stats = UNIT_STATS[config.category] || UNIT_STATS.ji_infantry;
    
    const squad: PVSquad = {
      id: squadId,
      name: config.name,
      teamId: config.teamId,
      category: config.category as UnitCategory,
      unitTypeId: stats.unitTypeId,
      soldiers: [],
      position: { x: config.x, y: config.z },
      targetPosition: { x: config.x, y: config.z },
      facing: config.facing,
      formation: 'line',
      formationSpacing: 1.5,
      state: 'idle',
      morale: 100,
      maxMorale: 100,
      fatigue: 0,
      leadership: 70,
      experience: 50,
      aliveSoldiers: config.soldierCount,
      kills: 0,
      losses: 0,
      formationState: 'formed',
      cohesion: 100,
      tacticalRole: 'line_holder',
      isRanged: stats.isRanged,
      ammo: stats.isRanged ? 30 : 0,
      maxAmmo: stats.isRanged ? 30 : 0,
      isOutOfAmmo: false,
    };
    
    // 병사 생성 (진형)
    const cols = Math.ceil(Math.sqrt(config.soldierCount * 2));
    const rows = Math.ceil(config.soldierCount / cols);
    const spacing = 1.5;
    
    // 특수 유닛 위치 계산
    // 깃발병: 부대 중앙 뒤쪽
    // 군악대: 깃발병 옆
    // 분대장: 맨 앞줄 중앙
    const centerCol = Math.floor(cols / 2);
    const backRow = rows - 1;
    const frontRow = 0;
    
    // 특수 유닛 인덱스 계산
    const flagBearerIdx = backRow * cols + centerCol;
    const drummerIdx = backRow * cols + Math.max(0, centerCol - 1);
    const sergeantIdx = frontRow * cols + centerCol;
    
    let soldierIndex = 0;
    for (let row = 0; row < rows && soldierIndex < config.soldierCount; row++) {
      for (let col = 0; col < cols && soldierIndex < config.soldierCount; col++) {
        const offsetX = (col - cols / 2) * spacing;
        const offsetZ = (row - rows / 2) * spacing;
        
        // 회전 적용
        const cos = Math.cos(config.facing);
        const sin = Math.sin(config.facing);
        const rotatedX = offsetX * cos - offsetZ * sin;
        const rotatedZ = offsetX * sin + offsetZ * cos;
        
        const soldierId = `${squadId}_soldier_${soldierIndex}`;
        
        // 역할 결정
        let role: SoldierRole = 'soldier';
        if (soldierIndex === flagBearerIdx) {
          role = 'flag_bearer';
        } else if (soldierIndex === drummerIdx && drummerIdx !== flagBearerIdx) {
          role = 'drummer';
        } else if (soldierIndex === sergeantIdx) {
          role = 'sergeant';
        }
        
        // 특수 유닛은 스탯 보너스
        const hpBonus = role === 'sergeant' ? 1.3 : (role === 'flag_bearer' ? 1.1 : 1.0);
        
        const soldier: PVSoldier = {
          id: soldierId,
          squadId,
          teamId: config.teamId,
          role,
          position: { x: config.x + rotatedX, y: config.z + rotatedZ },
          hp: Math.floor(stats.hp * hpBonus),
          maxHp: Math.floor(stats.hp * hpBonus),
          morale: 100,
          fatigue: 0,
          state: 'idle',
          facing: config.facing,
          targetPosition: { x: config.x + rotatedX, y: config.z + rotatedZ },
          formationOffset: { x: offsetX, y: offsetZ },
          lastAttackTime: 0,
          engagedWith: undefined,
          visionRange: stats.isRanged ? 80 : 60,
          awarenessRange: 15,
          visibleEnemies: [],
          personalityTraits: [],
          lastStateChangeTime: 0,
        };
        
        this.soldiers.set(soldierId, soldier);
        squad.soldiers.push(soldier);
        soldierIndex++;
      }
    }
    
    this.squads.set(squadId, squad);
    
    // 통계 업데이트
    if (config.teamId === 'attacker') {
      this.attackerStats.total += config.soldierCount;
      this.attackerStats.alive += config.soldierCount;
    } else {
      this.defenderStats.total += config.soldierCount;
      this.defenderStats.alive += config.soldierCount;
    }
    
    // AI 컨트롤러에 부대 등록
    if (this.useAdvancedAI) {
      // PVSquad를 TWSquad 형태로 변환하여 등록
      this.aiController.registerSquad(squad as unknown as import('./TotalWarEngine').TWSquad, false);
    }
    
    return squad;
  }
  
  // ========================================
  // 게임 루프
  // ========================================
  
  update(time: number, delta: number): void {
    if (this.battleState !== 'running') return;
    
    const deltaSeconds = delta / 1000;
    this.teamCenterCache.clear();
    
    // 1. 공간 그리드 재구축
    this.rebuildSpatialGrid();
    
    // 2. 부대 단위 회전 (적을 향해 돌기)
    this.updateSquadFacings(deltaSeconds);
    
    // 3. 병사 AI (고급 AI 또는 기본 AI)
    if (this.useAdvancedAI) {
      this.updateAdvancedAI(time, deltaSeconds);
    } else {
      this.updateSoldierAI(time, deltaSeconds);
    }
    
    // 4. 전투 처리
    this.processCombat(time);
    
    // 5. 사기 업데이트 (고급 사기 시스템 또는 기본)
    if (this.useAdvancedAI) {
      this.updateAdvancedMorale(deltaSeconds, time);
    } else {
      this.updateMorale(deltaSeconds);
    }
    
    // 6. Three.js 동기화 (매 프레임)
    this.onUpdate?.(this.soldiers, this.squads);
    
    // 7. 통계 업데이트 (200ms마다)
    if (time - this.lastStatsUpdate > 200) {
      this.updateStats();
      this.lastStatsUpdate = time;
    }
    
    // 8. 승패 체크
    this.checkVictory();
  }
  
  // ========================================
  // 고급 AI 시스템 업데이트
  // ========================================
  
  /**
   * 고급 AI 시스템으로 병사 행동 업데이트
   */
  private updateAdvancedAI(time: number, deltaSeconds: number): void {
    // TWSquad/TWSoldier 형태로 변환하여 AI 컨트롤러에 전달
    const twSquads = this.convertToTWSquads();
    const twSoldiers = this.convertToTWSoldiers();
    
    // AI 컨트롤러 업데이트
    this.aiController.update(twSquads, twSoldiers, time, deltaSeconds * 1000);
    
    // AI 결과를 각 부대/병사에 적용
    this.squads.forEach(squad => {
      const aiState = this.aiController.getSquadAIState(squad.id);
      const targetPos = this.aiController.getSquadTargetPosition(squad.id);
      const target = this.aiController.getSquadTarget(squad.id);
      
      // 부대 AI 상태에 따라 병사들 업데이트
      this.applySquadAIDecision(squad, aiState, targetPos, target, time, deltaSeconds);
    });
  }
  
  /**
   * 부대 AI 결정을 병사들에게 적용
   */
  private applySquadAIDecision(
    squad: PVSquad,
    aiState: AIState | null,
    targetPos: { x: number; z: number } | null,
    target: import('./TotalWarEngine').TWSquad | null,
    time: number,
    deltaSeconds: number
  ): void {
    if (!aiState) return;
    
    const teamId = squad.teamId;
    const enemyTeamId = this.getEnemyTeamId(teamId);
    
    squad.soldiers.forEach(soldierRef => {
      const soldier = this.soldiers.get(soldierRef.id);
      if (!soldier || soldier.state === 'dead') return;
      
      // AI 상태별 행동
      switch (aiState) {
        case 'routing':
          this.handleRouting(soldier, teamId, deltaSeconds);
          break;
          
        case 'rallying':
          // 재집결 중 - 느리게 이동, 사기 회복
          soldier.state = 'idle';
          soldier.morale = Math.min(100, soldier.morale + 0.5 * deltaSeconds);
          break;
          
        case 'retreating':
          // 후퇴 중
          this.handleRouting(soldier, teamId, deltaSeconds);
          soldier.morale = Math.min(100, soldier.morale + 0.2 * deltaSeconds);
          break;
          
        case 'engaging':
          // 교전 중 - 기존 전투 로직 활용
          this.handleEngaging(soldier, squad, time, deltaSeconds);
          break;
          
        case 'advancing':
          // 전진 중
          if (targetPos) {
            soldier.state = 'moving';
            this.moveTowards(soldier, targetPos.x, targetPos.z, deltaSeconds, false);
          } else if (target) {
            soldier.state = 'moving';
            this.moveTowards(soldier, target.position.x, target.position.z, deltaSeconds, false);
          }
          break;
          
        case 'flanking':
          // 측면 공격 중 - 특수 행동 매니저 활용
          if (targetPos) {
            soldier.state = 'moving';
            this.moveTowards(soldier, targetPos.x, targetPos.z, deltaSeconds, false);
          }
          break;
          
        case 'idle':
        default:
          // 대기 - 근처 적 탐색
          this.handleIdleSoldier(soldier, squad, time, deltaSeconds);
          break;
      }
    });
  }
  
  /**
   * 교전 중인 병사 처리
   */
  private handleEngaging(soldier: PVSoldier, squad: PVSquad, time: number, deltaSeconds: number): void {
    const teamId = this.getTeamId(soldier);
    const isRanged = squad.isRanged;
    const range = isRanged ? 50 : 3;
    
    // 이미 교전 중이면 유지
    if (soldier.engagedWith) {
      const enemy = this.soldiers.get(soldier.engagedWith);
      if (!enemy || enemy.state === 'dead') {
        soldier.engagedWith = undefined;
        soldier.state = 'idle';
      } else {
        soldier.state = 'fighting';
        soldier.facing = Math.atan2(
          enemy.position.y - soldier.position.y,
          enemy.position.x - soldier.position.x
        );
        return;
      }
    }
    
    // 가장 가까운 적 찾기 (타겟 선택기 활용)
    const nearbyEnemies = this.getNearby(soldier.position.x, soldier.position.y, isRanged ? range : 30)
      .filter(s => this.getTeamId(s) !== teamId && s.state !== 'dead' && s.state !== 'routing');
    
    if (nearbyEnemies.length === 0) {
      soldier.state = 'idle';
      return;
    }
    
    // 가장 가까운 적
    let closest: PVSoldier | null = null;
    let minDist = Infinity;
    
    for (const enemy of nearbyEnemies) {
      const dist = this.getDistance(soldier, enemy);
      if (dist < minDist) {
        minDist = dist;
        closest = enemy;
      }
    }
    
    if (!closest) return;
    
    if (isRanged) {
      if (minDist <= range) {
        soldier.state = 'fighting';
        soldier.facing = Math.atan2(
          closest.position.y - soldier.position.y,
          closest.position.x - soldier.position.x
        );
      } else {
        soldier.state = 'moving';
        this.moveTowards(soldier, closest.position.x, closest.position.y, deltaSeconds, false);
      }
    } else {
      if (minDist <= range) {
        soldier.engagedWith = closest.id;
        closest.engagedWith = soldier.id;
        soldier.state = 'fighting';
        closest.state = 'fighting';
        soldier.facing = Math.atan2(
          closest.position.y - soldier.position.y,
          closest.position.x - soldier.position.x
        );
      } else if (minDist <= 20) {
        soldier.state = 'charging';
        this.moveTowards(soldier, closest.position.x, closest.position.y, deltaSeconds, true);
      } else {
        soldier.state = 'moving';
        this.moveTowards(soldier, closest.position.x, closest.position.y, deltaSeconds, false);
      }
    }
  }
  
  /**
   * 대기 중인 병사 처리
   */
  private handleIdleSoldier(soldier: PVSoldier, squad: PVSquad, time: number, deltaSeconds: number): void {
    const teamId = this.getTeamId(soldier);
    const enemyTeamId = this.getEnemyTeamId(teamId);
    
    // 가까운 적 탐색
    const nearby = this.getNearby(soldier.position.x, soldier.position.y, 30);
    const enemies = nearby.filter(s => this.getTeamId(s) !== teamId && s.state !== 'dead' && s.state !== 'routing');
    
    if (enemies.length > 0) {
      // 적 발견 - 전진
      let closest: PVSoldier | null = null;
      let minDist = Infinity;
      
      for (const enemy of enemies) {
        const dist = this.getDistance(soldier, enemy);
        if (dist < minDist) {
          minDist = dist;
          closest = enemy;
        }
      }
      
      if (closest) {
        soldier.state = 'moving';
        this.moveTowards(soldier, closest.position.x, closest.position.y, deltaSeconds, false);
      }
    } else {
      // 적 없음 - 적 중심 방향으로 전진
      const enemyCenter = this.getTeamCenter(enemyTeamId);
      if (enemyCenter) {
        soldier.state = 'moving';
        this.moveTowards(soldier, enemyCenter.x, enemyCenter.y, deltaSeconds, false);
      }
    }
  }
  
  /**
   * 고급 사기 시스템 업데이트
   */
  private updateAdvancedMorale(deltaSeconds: number, currentTime: number): void {
    this.squads.forEach(squad => {
      const aliveSoldiers = squad.soldiers.filter(s => s.state !== 'dead');
      if (aliveSoldiers.length === 0) return;
      
      // 부대 상황 분석
      const teamId = squad.teamId;
      const enemyTeamId = this.getEnemyTeamId(teamId);
      
      // 주변 적 수
      const centerX = aliveSoldiers.reduce((sum, s) => sum + s.position.x, 0) / aliveSoldiers.length;
      const centerY = aliveSoldiers.reduce((sum, s) => sum + s.position.y, 0) / aliveSoldiers.length;
      
      const nearbyEnemies = this.getNearby(centerX, centerY, 30)
        .filter(s => this.getTeamId(s) !== teamId && s.state !== 'dead');
      const nearbyAllies = this.getNearby(centerX, centerY, 30)
        .filter(s => this.getTeamId(s) === teamId && s.state !== 'dead');
      
      // 수적 우세/열세
      const numericalAdvantage = (nearbyAllies.length - nearbyEnemies.length) / Math.max(1, Math.max(nearbyAllies.length, nearbyEnemies.length));
      
      // 포위 여부
      const isSurrounded = this.checkIfSurroundedSimple(centerX, centerY, nearbyEnemies);
      
      // 각 병사 사기 업데이트
      aliveSoldiers.forEach(soldierRef => {
        const soldier = this.soldiers.get(soldierRef.id);
        if (!soldier) return;
        
        let moraleChange = 0;
        
        // 수적 우세/열세
        if (numericalAdvantage > 0.1) {
          moraleChange += 0.5 * deltaSeconds * numericalAdvantage;
        } else if (numericalAdvantage < -0.1) {
          moraleChange -= 0.3 * deltaSeconds * Math.abs(numericalAdvantage);
        }
        
        // 포위됨
        if (isSurrounded) {
          moraleChange -= 1.5 * deltaSeconds;
        }
        
        // 교전 중
        if (soldier.state === 'fighting') {
          // 데미지 받으면 감소 (이미 applyDamage에서 처리)
        } else if (soldier.state === 'idle') {
          // 대기 중 회복
          moraleChange += 0.1 * deltaSeconds;
        }
        
        // 적용
        soldier.morale = Math.max(0, Math.min(100, soldier.morale + moraleChange));
        
        // 패주 체크
        if (soldier.morale < 20 && soldier.state !== 'routing' && soldier.state !== 'dead') {
          soldier.state = 'routing';
          soldier.engagedWith = undefined;
        }
      });
      
      // 부대 사기 업데이트
      const avgMorale = aliveSoldiers.reduce((sum, s) => {
        const soldier = this.soldiers.get(s.id);
        return sum + (soldier?.morale || 0);
      }, 0) / aliveSoldiers.length;
      
      squad.morale = avgMorale;
    });
  }
  
  /**
   * 간단한 포위 체크
   */
  private checkIfSurroundedSimple(x: number, y: number, enemies: PVSoldier[]): boolean {
    if (enemies.length < 6) return false;
    
    // 8방향에서 적이 있는지 체크
    const directions = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, -3 * Math.PI / 4, -Math.PI / 2, -Math.PI / 4];
    let coveredDirections = 0;
    
    for (const dir of directions) {
      for (const enemy of enemies) {
        const dx = enemy.position.x - x;
        const dy = enemy.position.y - y;
        const enemyAngle = Math.atan2(dy, dx);
        
        let angleDiff = Math.abs(enemyAngle - dir);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        
        if (angleDiff < Math.PI / 4) {
          coveredDirections++;
          break;
        }
      }
    }
    
    return coveredDirections >= 6;
  }
  
  /**
   * PVSquad를 TWSquad 형태로 변환
   */
  private convertToTWSquads(): Map<string, import('./TotalWarEngine').TWSquad> {
    const result = new Map<string, import('./TotalWarEngine').TWSquad>();
    
    this.squads.forEach((squad, id) => {
      // PVSquad는 이미 TWSquad를 확장하므로 그대로 사용
      result.set(id, squad as unknown as import('./TotalWarEngine').TWSquad);
    });
    
    return result;
  }
  
  /**
   * PVSoldier를 TWSoldier 형태로 변환
   */
  private convertToTWSoldiers(): Map<string, import('./TotalWarEngine').TWSoldier> {
    const result = new Map<string, import('./TotalWarEngine').TWSoldier>();
    
    this.soldiers.forEach((soldier, id) => {
      // 기본 변환 (position.y를 position.z로 변환)
      const converted = {
        ...soldier,
        position: { x: soldier.position.x, z: soldier.position.y },
        targetPosition: { x: soldier.targetPosition.x, z: soldier.targetPosition.y },
        formationSlot: { row: 0, col: 0 },
      } as unknown as import('./TotalWarEngine').TWSoldier;
      
      result.set(id, converted);
    });
    
    return result;
  }
  
  private rebuildSpatialGrid(): void {
    this.spatialGrid.clear();
    
    this.soldiers.forEach((soldier, id) => {
      if (soldier.state === 'dead') return;
      
      const cellX = Math.floor(soldier.position.x / this.gridCellSize);
      const cellZ = Math.floor(soldier.position.y / this.gridCellSize);
      const key = `${cellX},${cellZ}`;
      
      if (!this.spatialGrid.has(key)) {
        this.spatialGrid.set(key, new Set());
      }
      this.spatialGrid.get(key)!.add(id);
    });
  }
  
  private getNearby(x: number, z: number, radius: number): PVSoldier[] {
    const result: PVSoldier[] = [];
    const cellRadius = Math.ceil(radius / this.gridCellSize);
    const centerCellX = Math.floor(x / this.gridCellSize);
    const centerCellZ = Math.floor(z / this.gridCellSize);
    
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const key = `${centerCellX + dx},${centerCellZ + dz}`;
        const cell = this.spatialGrid.get(key);
        
        if (cell) {
          cell.forEach(id => {
            const soldier = this.soldiers.get(id);
            if (soldier && soldier.state !== 'dead') {
              const dist = Math.sqrt((soldier.position.x - x) ** 2 + (soldier.position.y - z) ** 2);
              if (dist <= radius) {
                result.push(soldier);
              }
            }
          });
        }
      }
    }
    
    return result;
  }
  
  private getTeamId(soldier: PVSoldier): TeamId {
    return soldier.teamId;
  }
  
  private getEnemyTeamId(teamId: TeamId): TeamId {
    return teamId === 'attacker' ? 'defender' : 'attacker';
  }
  
  private getTeamCenter(teamId: TeamId): { x: number; y: number } | null {
    if (this.teamCenterCache.has(teamId)) {
      return this.teamCenterCache.get(teamId) ?? null;
    }
    
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    
    this.soldiers.forEach(soldier => {
      if (soldier.state === 'dead' || soldier.state === 'routing') return;
      if (this.getTeamId(soldier) !== teamId) return;
      sumX += soldier.position.x;
      sumY += soldier.position.y;
      count++;
    });
    
    const center = count > 0 ? { x: sumX / count, y: sumY / count } : null;
    this.teamCenterCache.set(teamId, center);
    return center;
  }
  
  private findClosestEnemy(origin: PVSoldier, maxDistance = Infinity): PVSoldier | null {
    const teamId = this.getTeamId(origin);
    let closest: PVSoldier | null = null;
    let minDistance = maxDistance;
    
    this.soldiers.forEach(candidate => {
      if (candidate.id === origin.id) return;
      if (candidate.state === 'dead' || candidate.state === 'routing') return;
      if (this.getTeamId(candidate) === teamId) return;
      
      const distance = this.getDistance(origin, candidate);
      if (distance < minDistance) {
        minDistance = distance;
        closest = candidate;
      }
    });
    
    return closest;
  }
  
  private updateSoldierAI(time: number, deltaSeconds: number): void {
    this.soldiers.forEach(soldier => {
      if (soldier.state === 'dead') return;
      
      const teamId = this.getTeamId(soldier);
      const enemyTeamId = this.getEnemyTeamId(teamId);
      const squad = this.squads.get(soldier.squadId);
      const isRanged = squad?.isRanged || false;
      const range = isRanged ? 50 : 3;
      
      // 패주 처리
      if (soldier.state === 'routing') {
        this.handleRouting(soldier, teamId, deltaSeconds);
        return;
      }
      
      // 이미 교전 중
      if (soldier.engagedWith) {
        const enemy = this.soldiers.get(soldier.engagedWith);
        if (!enemy || enemy.state === 'dead') {
          soldier.engagedWith = undefined;
          soldier.state = 'idle';
        } else {
          soldier.state = 'fighting';
          soldier.facing = Math.atan2(
            enemy.position.y - soldier.position.y,
            enemy.position.x - soldier.position.x
          );
          return;
        }
      }
      
      // 가까운 적 찾기
      const searchRange = isRanged ? range : 30;
      const nearby = this.getNearby(soldier.position.x, soldier.position.y, searchRange);
      const enemies = nearby.filter(s => {
        const sTeam = this.getTeamId(s);
        return sTeam !== teamId && s.state !== 'dead' && s.state !== 'routing';
      });
      
      if (enemies.length === 0) {
        // 적이 없으면 더 넓은 범위에서 탐색
        const widerSearch = this.getNearby(soldier.position.x, soldier.position.y, 100);
        const distantEnemies = widerSearch.filter(s => {
          const sTeam = this.getTeamId(s);
          return sTeam !== teamId && s.state !== 'dead' && s.state !== 'routing';
        });
        
        if (distantEnemies.length > 0) {
          let closestDistant: PVSoldier | null = null;
          let minDistDistant = Infinity;
          for (const enemy of distantEnemies) {
            const dist = this.getDistance(soldier, enemy);
            if (dist < minDistDistant) {
              minDistDistant = dist;
              closestDistant = enemy;
            }
          }
          if (closestDistant) {
            soldier.state = 'moving';
            this.moveTowards(soldier, closestDistant.position.x, closestDistant.position.y, deltaSeconds, false);
            return;
          }
        }
        
        // 글로벌 탐색 - 전장 어딘가에 남은 적을 향해 전진
        const closestAnywhere = this.findClosestEnemy(soldier);
        if (closestAnywhere) {
          soldier.state = 'moving';
          this.moveTowards(soldier, closestAnywhere.position.x, closestAnywhere.position.y, deltaSeconds, false);
          return;
        }
        
        // 적 중심 지점으로 집결
        const enemyCenter = this.getTeamCenter(enemyTeamId);
        if (enemyCenter) {
          soldier.state = 'moving';
          this.moveTowards(soldier, enemyCenter.x, enemyCenter.y, deltaSeconds, false);
          return;
        }
        
        // 마지막 수단: 진형 방향으로 전진
        if (soldier.state !== 'fighting') {
          this.moveTowardsEnemy(soldier, teamId, deltaSeconds);
        }
        return;
      }
      
      // 가장 가까운 적
      let closest: PVSoldier | null = null;
      let minDist = Infinity;
      
      for (const enemy of enemies) {
        const dist = this.getDistance(soldier, enemy);
        if (dist < minDist) {
          minDist = dist;
          closest = enemy;
        }
      }
      
      if (!closest) return;
      
      if (isRanged) {
        // 원거리 유닛
        if (minDist <= range) {
          soldier.state = 'fighting';
          soldier.facing = Math.atan2(
            closest.position.y - soldier.position.y,
            closest.position.x - soldier.position.x
          );
        } else {
          // 사거리 밖 - 적 방향으로 전진
          soldier.state = 'moving';
          this.moveTowards(soldier, closest.position.x, closest.position.y, deltaSeconds, false);
        }
      } else {
        // 근접 유닛
        if (minDist <= range) {
          // 교전!
          soldier.engagedWith = closest.id;
          closest.engagedWith = soldier.id;
          soldier.state = 'fighting';
          closest.state = 'fighting';
          // 서로를 향하도록 facing 설정
          soldier.facing = Math.atan2(
            closest.position.y - soldier.position.y,
            closest.position.x - soldier.position.x
          );
          closest.facing = Math.atan2(
            soldier.position.y - closest.position.y,
            soldier.position.x - closest.position.x
          );
        } else if (minDist <= 20) {
          // 돌격
          soldier.targetPosition = { x: closest.position.x, y: closest.position.y };
          soldier.state = 'charging';
          this.moveTowards(soldier, closest.position.x, closest.position.y, deltaSeconds, true);
        } else {
          // 이동
          soldier.targetPosition = { x: closest.position.x, y: closest.position.y };
          soldier.state = 'moving';
          this.moveTowards(soldier, closest.position.x, closest.position.y, deltaSeconds, false);
        }
      }
    });
  }
  
  private handleRouting(soldier: PVSoldier, teamId: TeamId, deltaSeconds: number): void {
    soldier.engagedWith = undefined;
    
    const retreatAngle = teamId === 'attacker' ? -Math.PI / 2 : Math.PI / 2;
    const speed = 4.5 * deltaSeconds; // 빠른 도주
    
    soldier.position.x += Math.cos(retreatAngle) * speed;
    soldier.position.y += Math.sin(retreatAngle) * speed;
    soldier.position.x += (Math.random() - 0.5) * speed * 0.2;
    soldier.facing = retreatAngle;
    
    // 사기 회복
    soldier.morale = Math.min(100, soldier.morale + 0.5 * deltaSeconds);
    
    if (soldier.morale > 40) {
      soldier.state = 'idle';
    }
  }
  
  private moveTowardsEnemy(soldier: PVSoldier, teamId: TeamId, deltaSeconds: number): void {
    const targetZ = teamId === 'attacker' ? soldier.position.y + 10 : soldier.position.y - 10;
    this.moveTowards(soldier, soldier.position.x, targetZ, deltaSeconds, false);
    soldier.state = 'moving';
  }
  
  // ========================================
  // 부대 단위 회전 시스템
  // ========================================
  
  private updateSquadFacings(deltaSeconds: number): void {
    this.squads.forEach(squad => {
      // 부대의 살아있는 병사들
      const aliveSoldiers = squad.soldiers
        .map(id => this.soldiers.get(id))
        .filter((s): s is PVSoldier => s !== undefined && s.state !== 'dead');
      
      if (aliveSoldiers.length === 0) return;
      
      // 부대 중심 계산
      let centerX = 0, centerY = 0;
      aliveSoldiers.forEach(s => {
        centerX += s.position.x;
        centerY += s.position.y;
      });
      centerX /= aliveSoldiers.length;
      centerY /= aliveSoldiers.length;
      
      // 적 팀 ID
      const enemyTeamId = squad.teamId === 'attacker' ? 'defender' : 'attacker';
      
      // 가장 가까운 적 부대 또는 적 중심 찾기
      let targetAngle: number | null = null;
      
      // 1. 근처 적 병사 찾기
      const nearbyEnemies = this.getNearby(centerX, centerY, 60)
        .filter(s => this.getTeamId(s) === enemyTeamId && s.state !== 'dead');
      
      if (nearbyEnemies.length > 0) {
        // 가장 가까운 적 방향
        let closestEnemy: PVSoldier | null = null;
        let minDist = Infinity;
        for (const enemy of nearbyEnemies) {
          const dist = Math.sqrt(
            Math.pow(enemy.position.x - centerX, 2) + 
            Math.pow(enemy.position.y - centerY, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            closestEnemy = enemy;
          }
        }
        if (closestEnemy) {
          targetAngle = Math.atan2(
            closestEnemy.position.y - centerY,
            closestEnemy.position.x - centerX
          );
        }
      } else {
        // 2. 적 팀 중심 방향
        const enemyCenter = this.getTeamCenter(enemyTeamId);
        if (enemyCenter) {
          targetAngle = Math.atan2(
            enemyCenter.y - centerY,
            enemyCenter.x - centerX
          );
        }
      }
      
      if (targetAngle === null) return;
      
      // 부대 facing을 목표 방향으로 부드럽게 회전
      const currentFacing = squad.facing;
      let angleDiff = targetAngle - currentFacing;
      
      // -PI ~ PI 범위로 정규화
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // 회전 속도 (초당 라디안)
      const rotationSpeed = 1.5 * deltaSeconds;
      
      if (Math.abs(angleDiff) < rotationSpeed) {
        squad.facing = targetAngle;
      } else {
        squad.facing += Math.sign(angleDiff) * rotationSpeed;
      }
      
      // -PI ~ PI 범위로 정규화
      while (squad.facing > Math.PI) squad.facing -= 2 * Math.PI;
      while (squad.facing < -Math.PI) squad.facing += 2 * Math.PI;
      
      // 부대원들의 facing 업데이트 (idle, moving 상태일 때만)
      aliveSoldiers.forEach(soldier => {
        if (soldier.state === 'idle' || soldier.state === 'moving') {
          // 부대 facing을 따름
          soldier.facing = squad.facing;
        }
        // fighting 상태에서는 개별 적을 향함 (기존 로직 유지)
      });
    });
  }
  
  private moveTowards(soldier: PVSoldier, targetX: number, targetZ: number, deltaSeconds: number, isCharging: boolean): void {
    const dx = targetX - soldier.position.x;
    const dz = targetZ - soldier.position.y;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 0.5) return;
    
    const squad = this.squads.get(soldier.squadId);
    const baseSpeed = squad?.isRanged ? 2.8 : 3;
    const speedMult = isCharging ? 1.5 : 1.0;
    const moveSpeed = baseSpeed * speedMult * deltaSeconds;
    const moveDistance = Math.min(moveSpeed, distance);
    
    const dirX = dx / distance;
    const dirZ = dz / distance;
    soldier.position.x += dirX * moveDistance;
    soldier.position.y += dirZ * moveDistance;
    // facing은 부대 단위로 관리됨 (updateSquadFacings에서 처리)
    // 돌격 시에만 개별적으로 적을 향함
    if (isCharging) {
      soldier.facing = Math.atan2(dirZ, dirX);
    }
    
    // 피로도 증가
    soldier.fatigue = Math.min(100, soldier.fatigue + (isCharging ? 2 : 0.5) * deltaSeconds);
  }
  
  private processCombat(time: number): void {
    const attackCooldown = 1500;
    
    this.soldiers.forEach(soldier => {
      if (soldier.state !== 'fighting') return;
      if (time - soldier.lastAttackTime < attackCooldown) return;
      
      soldier.lastAttackTime = time;
      
      const squad = this.squads.get(soldier.squadId);
      const isRanged = squad?.isRanged || false;
      
      if (isRanged) {
        this.processRangedAttack(soldier, squad);
      } else {
        this.processMeleeAttack(soldier, squad);
      }
    });
  }
  
  private processMeleeAttack(attacker: PVSoldier, squad: PVSquad | undefined): void {
    if (!attacker.engagedWith) return;
    
    const target = this.soldiers.get(attacker.engagedWith);
    if (!target || target.state === 'dead') {
      attacker.engagedWith = undefined;
      attacker.state = 'idle';
      return;
    }
    
    // 명중 체크
    if (Math.random() > 0.7) return;
    
    const baseAttack = 40;
    const damage = baseAttack * (0.8 + Math.random() * 0.4);
    const actualDamage = Math.max(1, damage - 25 * 0.3);
    
    this.applyDamage(target, actualDamage, attacker, squad);
  }
  
  private processRangedAttack(attacker: PVSoldier, squad: PVSquad | undefined): void {
    const teamId = this.getTeamId(attacker);
    const range = 50;
    
    const nearby = this.getNearby(attacker.position.x, attacker.position.y, range);
    const enemies = nearby.filter(s => {
      const sTeam = this.getTeamId(s);
      return sTeam !== teamId && s.state !== 'dead';
    });
    
    if (enemies.length === 0) return;
    
    let target: PVSoldier | null = null;
    let minDist = Infinity;
    
    for (const enemy of enemies) {
      const dist = this.getDistance(attacker, enemy);
      if (dist < minDist) {
        minDist = dist;
        target = enemy;
      }
    }
    
    if (!target) return;
    
    // 명중 체크
    const accuracy = 0.5 - (minDist / range) * 0.3;
    if (Math.random() > accuracy) return;
    
    const damage = 40 * 0.6 * (0.8 + Math.random() * 0.4);
    const actualDamage = Math.max(1, damage - 15 * 0.2);
    
    this.applyDamage(target, actualDamage, attacker, squad);
  }
  
  private applyDamage(target: PVSoldier, damage: number, attacker: PVSoldier, attackerSquad: PVSquad | undefined): void {
    target.hp -= damage;
    target.morale -= damage * 0.3;
    
    if (target.hp <= 0) {
      target.hp = 0;
      target.state = 'dead';
      target.engagedWith = undefined;
      attacker.engagedWith = undefined;
      
      // 킬 기록
      if (attackerSquad) attackerSquad.kills++;
      
      const targetSquad = this.squads.get(target.squadId);
      if (targetSquad) {
        targetSquad.losses++;
        targetSquad.aliveSoldiers--;
      }
    } else if (target.morale < 20 && target.state !== 'routing') {
      target.state = 'routing';
      target.engagedWith = undefined;
    }
  }
  
  private updateMorale(deltaSeconds: number): void {
    this.soldiers.forEach(soldier => {
      if (soldier.state === 'dead') return;
      
      const teamId = this.getTeamId(soldier);
      const nearby = this.getNearby(soldier.position.x, soldier.position.y, 15);
      
      let allies = 0, enemies = 0;
      nearby.forEach(other => {
        if (other.state === 'dead') return;
        const otherTeam = this.getTeamId(other);
        if (otherTeam === teamId) allies++;
        else enemies++;
      });
      
      if (enemies > allies * 2) {
        soldier.morale -= 1.5 * deltaSeconds;
      } else if (allies > enemies * 2) {
        soldier.morale += 0.5 * deltaSeconds;
      }
      
      soldier.morale = Math.max(0, Math.min(100, soldier.morale));
      
      if (soldier.morale < 20 && soldier.state !== 'routing' && soldier.state !== 'dead') {
        soldier.state = 'routing';
        soldier.engagedWith = undefined;
      }
    });
  }
  
  private updateStats(): void {
    let attackerAlive = 0, attackerKills = 0;
    let defenderAlive = 0, defenderKills = 0;
    
    this.squads.forEach(squad => {
      const aliveCount = squad.soldiers.filter(s => s.state !== 'dead').length;
      
      if (squad.teamId === 'attacker') {
        attackerAlive += aliveCount;
        attackerKills += squad.kills;
      } else {
        defenderAlive += aliveCount;
        defenderKills += squad.kills;
      }
    });
    
    this.attackerStats.alive = attackerAlive;
    this.attackerStats.kills = attackerKills;
    this.defenderStats.alive = defenderAlive;
    this.defenderStats.kills = defenderKills;
    
    this.onStatsUpdate?.(this.attackerStats, this.defenderStats);
  }
  
  private checkVictory(): void {
    if (this.attackerStats.alive === 0) {
      this.battleState = 'ended';
      this.winner = 'defender';
      this.onBattleEnd?.(this.winner);
    } else if (this.defenderStats.alive === 0) {
      this.battleState = 'ended';
      this.winner = 'attacker';
      this.onBattleEnd?.(this.winner);
    }
  }
  
  private getDistance(a: PVSoldier, b: PVSoldier): number {
    return Math.sqrt((a.position.x - b.position.x) ** 2 + (a.position.y - b.position.y) ** 2);
  }
  
  // ========================================
  // 외부 API
  // ========================================
  
  startBattle(): void {
    this.battleState = 'running';
    console.log('⚔️ Battle started!');
  }
  
  pauseBattle(): void {
    this.battleState = this.battleState === 'running' ? 'paused' : 'running';
  }
  
  setSpeed(speed: number): void {
    this.time.timeScale = speed;
  }
  
  getSoldiers(): Map<string, PVSoldier> {
    return this.soldiers;
  }
  
  getSquads(): Map<string, PVSquad> {
    return this.squads;
  }
}

// ========================================
// Three.js 복셀 렌더러
// ========================================

export class ThreeVoxelRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  
  // 새로운 카메라 컨트롤러
  public cameraController: CameraController;
  private useCameraController: boolean = true; // 새 카메라 시스템 사용 여부
  
  // 복셀 렌더러 (임시 비활성화)
  // private instancedRenderer?: InstancedUnitRenderer;
  private useInstanced: boolean = false;
  
  // 비-인스턴스 렌더링용
  private soldierMeshes: Map<string, THREE.Group> = new Map();
  private voxelTemplateCache: Map<string, THREE.Group> = new Map();
  private indicatorGeometry: THREE.CircleGeometry = new THREE.CircleGeometry(0.85, 20);
  private directionPointerGeometry: THREE.ConeGeometry;
  
  // 시간 추적 (카메라 업데이트용)
  private lastFrameTime: number = 0;
  
  constructor(container: HTMLElement) {
    // 씬
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    
    // 카메라
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 100, 120);
    this.camera.lookAt(0, 0, 0);
    
    // 렌더러
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
    
    // 기존 OrbitControls (폴백용)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    
    // 새로운 카메라 컨트롤러 초기화
    this.cameraController = new CameraController(this.camera, this.renderer.domElement, {
      position: { x: 0, y: 100, z: 120 },
      target: { x: 0, y: 0, z: 0 },
      bounds: { minX: -150, maxX: 150, minZ: -150, maxZ: 150 },
      minZoom: 30,
      maxZoom: 250,
      smoothing: 0.92,
    });
    
    // 새 카메라 시스템 사용 시 OrbitControls 비활성화
    if (this.useCameraController) {
      this.controls.enabled = false;
    }
    
    // 포인터가 -Z 방향(복셀 모델의 얼굴 방향)을 가리키도록 설정
    this.directionPointerGeometry = new THREE.ConeGeometry(0.18, 0.35, 3);
    this.directionPointerGeometry.rotateX(-Math.PI / 2); // -Z 방향으로 회전
    
    // 조명
    this.setupLighting();
    
    // 지형
    this.createTerrain();
    
    // 리사이즈 핸들러
    window.addEventListener('resize', () => this.handleResize(container));
  }
  
  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(50, 100, 50);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    this.scene.add(directional);
  }
  
  private createTerrain(): void {
    const groundGeometry = new THREE.PlaneGeometry(300, 300);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4A7023,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    const grid = new THREE.GridHelper(300, 30, 0x000000, 0x333333);
    grid.position.y = 0.01;
    (grid.material as THREE.Material).opacity = 0.2;
    (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);
  }
  
  private handleResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  // ========================================
  // 복셀 렌더러 초기화
  // ========================================
  
  initInstancedRenderer(squads: Map<string, PVSquad>): void {
    console.log('📦 복셀 유닛 렌더링 초기화');
    this.useInstanced = false;
    this.clearSoldierMeshes();
    this.createVoxelMeshes(squads);
  }
  
  private clearSoldierMeshes(): void {
    this.soldierMeshes.forEach(mesh => this.disposeSoldierMesh(mesh));
    this.soldierMeshes.clear();
  }
  
  private disposeSoldierMesh(mesh: THREE.Group): void {
    const indicator = mesh.userData.stateIndicator as THREE.Mesh | undefined;
    if (indicator) {
      const indicatorMaterial = indicator.material as THREE.Material;
      indicatorMaterial.dispose();
      mesh.remove(indicator);
    }
    const pointer = mesh.userData.directionPointer as THREE.Mesh | undefined;
    if (pointer) {
      (pointer.material as THREE.Material).dispose();
      mesh.remove(pointer);
    }
    const body = mesh.userData.bodyMesh as THREE.Group | undefined;
    if (mesh.userData.requiresDeepDispose && body) {
      this.disposeMeshGeometry(body);
    } else if (mesh.userData.requiresDeepDispose) {
      this.disposeMeshGeometry(mesh);
    }
    
    this.scene.remove(mesh);
  }
  
  private disposeMeshGeometry(root: THREE.Object3D): void {
    root.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach(mat => mat.dispose());
        } else {
          (material as THREE.Material).dispose();
        }
      }
    });
  }
  
  private createVoxelMeshes(squads: Map<string, PVSquad>): void {
    squads.forEach(squad => {
      squad.soldiers.forEach(soldier => {
        const mesh = this.createVoxelSoldierMesh(squad, soldier);
        this.soldierMeshes.set(soldier.id, mesh);
      });
    });
  }
  
  private getTeamPalette(teamId: TeamId) {
    return TEAM_VOXEL_COLORS[teamId] || TEAM_VOXEL_COLORS.attacker;
  }
  
  private getVoxelTemplate(unitTypeId: number, teamId: TeamId): THREE.Group | null {
    const key = `${unitTypeId}-${teamId}`;
    if (this.voxelTemplateCache.has(key)) {
      return this.voxelTemplateCache.get(key)!;
    }
    
    const unitSpec = VOXEL_UNIT_DATABASE[unitTypeId];
    if (!unitSpec) {
      console.warn(`[VoxelRenderer] unitTypeId ${unitTypeId} not found in database`);
      return null;
    }
    
    try {
      const palette = this.getTeamPalette(teamId);
      const template = buildVoxelUnitFromSpec({
        unitId: unitTypeId,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        scale: DEFAULT_VOXEL_SCALE,
      });
      template.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      this.voxelTemplateCache.set(key, template);
      return template;
    } catch (error) {
      console.warn(`[VoxelRenderer] Failed to build voxel template for ${unitTypeId}`, error);
      return null;
    }
  }
  
  private cloneVoxelTemplate(template: THREE.Group): THREE.Group {
    const clone = template.clone(true);
    const sourceMeshes: THREE.Mesh[] = [];
    const clonedMeshes: THREE.Mesh[] = [];
    
    template.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        sourceMeshes.push(obj as THREE.Mesh);
      }
    });
    
    clone.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        clonedMeshes.push(obj as THREE.Mesh);
      }
    });
    
    clonedMeshes.forEach((mesh, index) => {
      const source = sourceMeshes[index];
      mesh.geometry = source.geometry;
      mesh.material = source.material;
      mesh.castShadow = source.castShadow;
      mesh.receiveShadow = source.receiveShadow;
    });
    
    return clone;
  }
  
  private createFallbackMesh(squad: PVSquad): THREE.Group {
    const group = new THREE.Group();
    const palette = this.getTeamPalette(squad.teamId);
      const isCavalry = squad.category.includes('cavalry');
      
    const bodyGeometry = isCavalry
          ? new THREE.BoxGeometry(1.2, 1.5, 0.8)
          : new THREE.BoxGeometry(0.6, 1.5, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: palette.indicator, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = isCavalry ? 0.9 : 0.75;
    body.castShadow = true;
    group.add(body);
    
    const headGeometry = new THREE.SphereGeometry(0.2, 12, 12);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xDEB887 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = isCavalry ? 1.7 : 1.6;
    head.castShadow = true;
    group.add(head);
    
    if (isCavalry) {
      const mountGeometry = new THREE.BoxGeometry(0.8, 0.6, 1.6);
      const mountMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
      const mount = new THREE.Mesh(mountGeometry, mountMaterial);
      mount.position.set(0, 0.4, 0);
      mount.castShadow = true;
      group.add(mount);
    }
    
    return group;
  }
  
  private attachIndicator(mesh: THREE.Group, teamId: TeamId, role: SoldierRole = 'soldier'): void {
    const palette = this.getTeamPalette(teamId);
    
    // 역할별 인디케이터 색상
    let indicatorColor = palette.indicator;
    let indicatorOpacity = 0.35;
    let indicatorScale = 1.0;
    
    if (role === 'flag_bearer') {
      indicatorColor = 0xFFD700; // 금색
      indicatorOpacity = 0.5;
      indicatorScale = 1.3;
    } else if (role === 'drummer') {
      indicatorColor = 0xFF6B00; // 주황색
      indicatorOpacity = 0.5;
      indicatorScale = 1.2;
    } else if (role === 'sergeant') {
      indicatorColor = 0xFFFFFF; // 흰색
      indicatorOpacity = 0.5;
      indicatorScale = 1.2;
    }
    
    const indicatorMaterial = new THREE.MeshBasicMaterial({
      color: indicatorColor,
      transparent: true,
      opacity: indicatorOpacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const indicator = new THREE.Mesh(this.indicatorGeometry, indicatorMaterial);
    indicator.rotation.x = -Math.PI / 2;
    indicator.position.y = 0.02;
    indicator.scale.setScalar(indicatorScale);
    indicator.renderOrder = -1;
    mesh.add(indicator);
    mesh.userData.stateIndicator = indicator;
    mesh.userData.soldierRole = role;

    const pointerMaterial = new THREE.MeshBasicMaterial({
      color: palette.fighting,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const pointer = new THREE.Mesh(this.directionPointerGeometry, pointerMaterial);
    pointer.position.set(0, 0.12, -0.6); // -Z 방향에 배치 (복셀 모델 앞면)
    mesh.add(pointer);
    mesh.userData.directionPointer = pointer;
    
    // 특수 유닛 표시 추가
    if (role === 'flag_bearer') {
      // 깃발 폴
      const poleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 6);
      const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(0.3, 1.25, 0);
      pole.castShadow = true;
      mesh.add(pole);
      
      // 깃발
      const flagGeometry = new THREE.PlaneGeometry(0.8, 0.5);
      const flagColor = teamId === 'attacker' ? 0x2F4F4F : 0x8B0000;
      const flagMaterial = new THREE.MeshStandardMaterial({ 
        color: flagColor, 
        side: THREE.DoubleSide,
        roughness: 0.8,
      });
      const flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set(0.7, 2.2, 0);
      flag.rotation.y = Math.PI / 2;
      flag.castShadow = true;
      mesh.add(flag);
      mesh.userData.flag = flag;
    } else if (role === 'drummer') {
      // 북
      const drumGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 12);
      const drumMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const drum = new THREE.Mesh(drumGeometry, drumMaterial);
      drum.position.set(0, 0.8, 0.3);
      drum.rotation.x = Math.PI / 2;
      drum.castShadow = true;
      mesh.add(drum);
      
      // 북 가죽
      const skinGeometry = new THREE.CircleGeometry(0.24, 12);
      const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xF5DEB3 });
      const skin1 = new THREE.Mesh(skinGeometry, skinMaterial);
      skin1.position.set(0, 0.8, 0.45);
      mesh.add(skin1);
      const skin2 = new THREE.Mesh(skinGeometry, skinMaterial);
      skin2.position.set(0, 0.8, 0.15);
      skin2.rotation.y = Math.PI;
      mesh.add(skin2);
    } else if (role === 'sergeant') {
      // 분대장 표식 (어깨 장식)
      const badgeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.05);
      const badgeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
      const badge1 = new THREE.Mesh(badgeGeometry, badgeMaterial);
      badge1.position.set(0.4, 1.5, 0);
      badge1.castShadow = true;
      mesh.add(badge1);
      const badge2 = new THREE.Mesh(badgeGeometry, badgeMaterial);
      badge2.position.set(-0.4, 1.5, 0);
      badge2.castShadow = true;
      mesh.add(badge2);
    }
  }
  
  private createVoxelSoldierMesh(squad: PVSquad, soldier: PVSoldier): THREE.Group {
    const template = this.getVoxelTemplate(squad.unitTypeId, squad.teamId);
    const body = template
      ? this.cloneVoxelTemplate(template)
      : this.createFallbackMesh(squad);
    
    const holder = new THREE.Group();
    holder.userData.bodyMesh = body;
    holder.userData.requiresDeepDispose = !template;
    holder.add(body);
    this.attachIndicator(holder, squad.teamId, soldier.role);
    holder.position.set(soldier.position.x, 0, soldier.position.y);
    // facing은 2D 좌표계 기준 (+X가 0도, 반시계 방향으로 증가)
    // 복셀 모델 앞면은 -Z 방향
    // facing=0일 때 +X를 바라봐야 함 → rotation.y = PI/2
    // facing=PI/2일 때 +Z를 바라봐야 함 → rotation.y = PI
    // facing=-PI/2일 때 -Z를 바라봐야 함 → rotation.y = 0
    // 공식: rotation.y = facing + PI/2
    holder.rotation.y = soldier.facing + Math.PI / 2;
    this.scene.add(holder);
    return holder;
  }
  
  private ensureSoldierMesh(soldier: PVSoldier, squad: PVSquad): THREE.Group {
    if (this.soldierMeshes.has(soldier.id)) {
      return this.soldierMeshes.get(soldier.id)!;
    }
    const mesh = this.createVoxelSoldierMesh(squad, soldier);
    this.soldierMeshes.set(soldier.id, mesh);
    return mesh;
  }
  
  private updateIndicatorState(mesh: THREE.Group, teamId: TeamId, state: SoldierState): void {
    const indicator = mesh.userData.stateIndicator as THREE.Mesh | undefined;
    if (!indicator) return;
    const material = indicator.material as THREE.MeshBasicMaterial;
    
    if (state === 'dead') {
      indicator.visible = false;
      return;
    }
    
    indicator.visible = true;
    
    if (state === 'routing') {
      material.color.setHex(ROUTING_INDICATOR_COLOR);
      material.opacity = 0.6;
    } else {
      const palette = this.getTeamPalette(teamId);
      if (state === 'fighting') {
        material.color.setHex(palette.fighting);
        material.opacity = 0.5;
      } else {
        material.color.setHex(palette.indicator);
        material.opacity = 0.35;
      }
    }
    
    const pointer = mesh.userData.directionPointer as THREE.Mesh | undefined;
    if (pointer) {
      pointer.visible = indicator.visible;
      const pointerMat = pointer.material as THREE.MeshBasicMaterial;
      if (state === 'routing') {
        pointerMat.color.setHex(ROUTING_INDICATOR_COLOR);
        pointerMat.opacity = 0.7;
      } else if (state === 'fighting') {
        pointerMat.color.setHex(this.getTeamPalette(teamId).fighting);
        pointerMat.opacity = 0.8;
      } else {
        pointerMat.color.setHex(this.getTeamPalette(teamId).fighting);
        pointerMat.opacity = 0.5;
      }
    }
  }
  
  // ========================================
  // 업데이트
  // ========================================
  
  updateSoldiers(soldiers: Map<string, PVSoldier>, squads: Map<string, PVSquad>): void {
    soldiers.forEach(soldier => {
      const squad = squads.get(soldier.squadId);
      if (!squad) return;
      
      const mesh = this.ensureSoldierMesh(soldier, squad);
      mesh.position.set(soldier.position.x, 0, soldier.position.y);
      // facing은 2D 좌표계 기준 (+X가 0도)
      // 복셀 모델 앞면은 -Z 방향
      // 공식: rotation.y = facing + PI/2
      mesh.rotation.y = soldier.facing + Math.PI / 2;
      mesh.visible = soldier.state !== 'dead';
      this.updateIndicatorState(mesh, squad.teamId, soldier.state);
    });
    
    const removable: string[] = [];
    this.soldierMeshes.forEach((_, id) => {
      if (!soldiers.has(id)) {
        removable.push(id);
      }
    });
    
    removable.forEach(id => {
      const mesh = this.soldierMeshes.get(id);
      if (mesh) {
        this.disposeSoldierMesh(mesh);
        this.soldierMeshes.delete(id);
      }
    });
  }
  
  render(): void {
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    
    // 카메라 업데이트
    if (this.useCameraController) {
      this.cameraController.update(deltaTime);
    } else {
      this.controls.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  // ========================================
  // 카메라 제어 API
  // ========================================
  
  /**
   * 카메라 모드 변경
   */
  setCameraMode(mode: CameraModeType): void {
    this.cameraController.setMode(mode);
  }
  
  /**
   * 유닛 추적 시작
   */
  followUnit(target: FollowTarget): void {
    this.cameraController.followUnit(target);
  }
  
  /**
   * 유닛 추적 중지
   */
  stopFollowing(): void {
    this.cameraController.stopFollowing();
  }
  
  /**
   * 추적 대상 위치 업데이트
   */
  updateFollowTargetPosition(position: Vector3Like, velocity?: Vector3Like): void {
    this.cameraController.updateFollowTargetPosition(position, velocity);
  }
  
  /**
   * 전장 전체 보기
   */
  showOverview(bounds?: { minX: number; maxX: number; minZ: number; maxZ: number }): void {
    this.cameraController.showOverview(bounds);
  }
  
  /**
   * 시네마틱 재생
   */
  playCinematic(sequenceId: string): void {
    this.cameraController.playCinematic(sequenceId);
  }
  
  /**
   * 시네마틱 중지
   */
  stopCinematic(): void {
    this.cameraController.stopCinematic();
  }
  
  /**
   * 프리셋 뷰로 이동
   */
  goToPreset(presetKey: string): void {
    this.cameraController.goToPreset(presetKey);
  }
  
  /**
   * 특정 위치로 카메라 이동
   */
  moveCameraTo(position: Vector3Like, target: Vector3Like, duration: number = 0.5): void {
    this.cameraController.transitionTo(position, target, duration);
  }
  
  /**
   * 카메라 컨트롤러 활성화/비활성화
   */
  setCameraControllerEnabled(enabled: boolean): void {
    this.cameraController.setEnabled(enabled);
  }
  
  /**
   * 카메라 컨트롤러 사용 여부 전환
   */
  toggleCameraSystem(useCameraController: boolean): void {
    this.useCameraController = useCameraController;
    this.controls.enabled = !useCameraController;
    this.cameraController.setEnabled(useCameraController);
  }
  
  /**
   * 현재 카메라 상태 가져오기
   */
  getCameraState(): ReturnType<CameraController['getState']> {
    return this.cameraController.getState();
  }
  
  dispose(): void {
    this.clearSoldierMeshes();
    this.voxelTemplateCache.forEach(template => this.disposeMeshGeometry(template));
    this.voxelTemplateCache.clear();
    this.indicatorGeometry.dispose();
    this.directionPointerGeometry.dispose();
    this.cameraController.dispose();
    this.controls.dispose();
    this.renderer.dispose();
  }
}

// ========================================
// 하이브리드 엔진 통합
// ========================================

export class PhaserVoxelEngine {
  public phaserGame?: Phaser.Game;
  public threeRenderer?: ThreeVoxelRenderer;
  public logicScene?: BattleLogicScene;
  
  private animationId?: number;
  private phaserContainer?: HTMLDivElement;
  private isInitialized = false;
  
  async initialize(threeContainer: HTMLElement): Promise<void> {
    // Phaser용 숨겨진 컨테이너
    this.phaserContainer = document.createElement('div');
    this.phaserContainer.style.display = 'none';
    document.body.appendChild(this.phaserContainer);
    
    // Phaser 게임 (로직 전용, 렌더링 없음)
    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.HEADLESS,
      parent: this.phaserContainer,
      width: 1,
      height: 1,
      scene: [BattleLogicScene],
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      fps: {
        target: 60,
        forceSetTimeOut: true,
      },
    };
    
    this.phaserGame = new Phaser.Game(phaserConfig);
    
    // Three.js 렌더러
    this.threeRenderer = new ThreeVoxelRenderer(threeContainer);
    
    // 씬 준비 대기
    await new Promise<void>((resolve) => {
      this.phaserGame!.events.once('ready', () => {
        this.logicScene = this.phaserGame!.scene.getScene('BattleLogicScene') as BattleLogicScene;
        
        // Three.js 동기화 콜백
        this.logicScene.onUpdate = (soldiers, squads) => {
          this.threeRenderer?.updateSoldiers(soldiers, squads);
        };
        
        console.log('✅ Phaser + Three.js 하이브리드 엔진 준비 완료');
        this.isInitialized = true;
        resolve();
      });
    });
    
    // 렌더링 루프 시작
    this.startRenderLoop();
  }
  
  private startRenderLoop(): void {
    const render = () => {
      this.threeRenderer?.render();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }
  
  createSquad(config: Parameters<BattleLogicScene['createSquad']>[0]): PVSquad | undefined {
    return this.logicScene?.createSquad(config);
  }
  
  initializeRenderer(): void {
    if (this.logicScene && this.threeRenderer) {
      this.threeRenderer.initInstancedRenderer(this.logicScene.getSquads());
    }
  }
  
  startBattle(): void {
    this.logicScene?.startBattle();
  }
  
  pauseBattle(): void {
    this.logicScene?.pauseBattle();
  }
  
  setSpeed(speed: number): void {
    this.logicScene?.setSpeed(speed);
  }
  
  setOnStatsUpdate(callback: BattleLogicScene['onStatsUpdate']): void {
    if (this.logicScene) {
      this.logicScene.onStatsUpdate = callback;
    }
  }
  
  setOnBattleEnd(callback: BattleLogicScene['onBattleEnd']): void {
    if (this.logicScene) {
      this.logicScene.onBattleEnd = callback;
    }
  }
  
  // ========================================
  // 카메라 제어 API
  // ========================================
  
  /**
   * 카메라 모드 변경
   */
  setCameraMode(mode: CameraModeType): void {
    this.threeRenderer?.setCameraMode(mode);
  }
  
  /**
   * 유닛 추적 시작
   */
  followUnit(target: FollowTarget): void {
    this.threeRenderer?.followUnit(target);
  }
  
  /**
   * 유닛 추적 (병사 ID로)
   */
  followSoldierById(soldierId: string): void {
    const soldier = this.logicScene?.getSoldiers().get(soldierId);
    if (soldier && this.threeRenderer) {
      this.threeRenderer.followUnit({
        type: 'unit',
        id: soldier.id,
        position: { x: soldier.position.x, y: 0, z: soldier.position.y },
        offset: { x: 0, y: 30, z: 40 },
        lookAhead: true,
      });
    }
  }
  
  /**
   * 부대 추적 (부대 ID로)
   */
  followSquadById(squadId: string): void {
    const squad = this.logicScene?.getSquads().get(squadId);
    if (squad && this.threeRenderer) {
      this.threeRenderer.followUnit({
        type: 'squad',
        id: squad.id,
        position: { x: squad.position.x, y: 0, z: squad.position.y },
        offset: { x: 0, y: 40, z: 60 },
        lookAhead: true,
      });
    }
  }
  
  /**
   * 추적 중지
   */
  stopFollowing(): void {
    this.threeRenderer?.stopFollowing();
  }
  
  /**
   * 전장 전체 보기
   */
  showOverview(): void {
    this.threeRenderer?.showOverview();
  }
  
  /**
   * 시네마틱 재생
   */
  playCinematic(sequenceId: string): void {
    this.threeRenderer?.playCinematic(sequenceId);
  }
  
  /**
   * 시네마틱 중지
   */
  stopCinematic(): void {
    this.threeRenderer?.stopCinematic();
  }
  
  /**
   * 프리셋 뷰로 이동 (1-9)
   */
  goToPreset(presetKey: string): void {
    this.threeRenderer?.goToPreset(presetKey);
  }
  
  /**
   * 카메라 위치 이동
   */
  moveCameraTo(position: Vector3Like, target: Vector3Like, duration?: number): void {
    this.threeRenderer?.moveCameraTo(position, target, duration);
  }
  
  /**
   * 카메라 상태 가져오기
   */
  getCameraState(): ReturnType<CameraController['getState']> | undefined {
    return this.threeRenderer?.getCameraState();
  }
  
  /**
   * 카메라 컨트롤러 직접 접근
   */
  getCameraController(): CameraController | undefined {
    return this.threeRenderer?.cameraController;
  }
  
  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.phaserGame?.destroy(true);
    this.threeRenderer?.dispose();
    this.phaserContainer?.remove();
  }
}

