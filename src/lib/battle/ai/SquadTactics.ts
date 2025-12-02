/**
 * Squad Tactics AI - 부대 단위 전술적 의사결정 시스템
 * 
 * 주요 기능:
 * 1. 위협도 평가 (evaluateThreats)
 * 2. 측면 공격 기회 탐지 (findFlankingOpportunity)
 * 3. 협동 작전 (coordinateAttack)
 * 4. 전술 결정 트리 (decideTactic)
 * 
 * 토탈워 스타일 RTS 전술 AI
 */

import { 
  TWSquad, 
  TWUnitCategory, 
  Vector2,
  FLANKING_BONUS,
  UNIT_COUNTER,
  UNIT_WEAKNESS,
  FORMATION_CONFIG,
  CATEGORY_BASE_STATS,
  TWFormation,
  TWSoldier,
} from '../TotalWarEngine';

// ========================================
// 타입 정의
// ========================================

/** 전술 행동 타입 */
export type TacticActionType = 
  | 'hold'              // 위치 고수
  | 'advance'           // 전진
  | 'charge'            // 돌격
  | 'flank_left'        // 좌측면 우회
  | 'flank_right'       // 우측면 우회
  | 'rear_attack'       // 후방 공격
  | 'retreat'           // 후퇴
  | 'regroup'           // 재집결
  | 'support'           // 아군 지원
  | 'intercept'         // 요격
  | 'kite'              // 카이팅 (원거리 유닛)
  | 'encircle'          // 포위
  | 'feint'             // 양동 작전
  | 'maintain_range';   // 최적 사거리 유지

/** 전술 행동 */
export interface TacticAction {
  type: TacticActionType;
  priority: number;           // 우선순위 (높을수록 중요)
  targetSquadId?: string;     // 공격 대상 부대
  targetPosition?: Vector2;   // 이동 목표 위치
  targetFacing?: number;      // 목표 방향
  supportSquadId?: string;    // 지원 대상 부대
  formation?: TWFormation;    // 권장 진형
  reason: string;             // 전술 선택 이유
}

/** 위협 정보 */
export interface ThreatInfo {
  squadId: string;
  threatLevel: number;        // 0~100 위협 수준
  distance: number;           // 거리
  direction: number;          // 방향 (라디안)
  isCounter: boolean;         // 상성상 불리한 적
  isWeak: boolean;            // 상성상 유리한 적
  isCharging: boolean;        // 돌격 중인지
  canReach: number;           // 도달 예상 시간 (ms)
  flankAngle: FlankAngle;     // 측면 노출 각도
  soldierCount: number;       // 병력 수
  morale: number;             // 사기
  fatigue: number;            // 피로도
}

/** 측면 각도 */
export type FlankAngle = 'front' | 'left_flank' | 'right_flank' | 'rear';

/** 측면 공격 기회 */
export interface FlankingOpportunity {
  targetSquadId: string;
  attackAngle: FlankAngle;    // 공격 가능 각도
  bonusMultiplier: number;    // 예상 데미지 배율
  approachPath: Vector2[];    // 이동 경로
  estimatedTime: number;      // 예상 도달 시간 (ms)
  isBlocked: boolean;         // 경로 차단 여부
  risk: number;               // 위험도 (0~100)
  reward: number;             // 예상 이득 (0~100)
}

/** 협동 공격 계획 */
export interface CoordinatedAttack {
  targetSquadId: string;
  participants: Array<{
    squadId: string;
    role: 'main' | 'flank' | 'rear' | 'support' | 'decoy';
    position: Vector2;
    timing: number;           // 공격 시작 시간 (상대적)
  }>;
  totalForce: number;         // 총 병력
  expectedCasualties: number; // 예상 피해
  successProbability: number; // 성공 확률
}

/** 전술 상황 평가 */
export interface TacticalSituation {
  threats: ThreatInfo[];
  opportunities: FlankingOpportunity[];
  allySupport: number;        // 아군 지원 가능 수준 (0~100)
  squadHealth: number;        // 부대 상태 (0~100)
  morale: number;             // 사기 (0~100)
  fatigue: number;            // 피로도 (0~100)
  isEngaged: boolean;         // 현재 교전 중
  isFlanked: boolean;         // 측면 공격 받는 중
  needsSupport: boolean;      // 지원 필요
  canCharge: boolean;         // 돌격 가능
  canFlank: boolean;          // 측면 공격 가능
}

// ========================================
// 전술 상수
// ========================================

/** 전술 임계값 */
export const TACTICS_CONFIG = {
  // 거리 임계값
  CHARGE_DISTANCE: 15,          // 돌격 시작 거리
  MELEE_RANGE: 3,               // 근접 전투 거리
  FLANK_SAFE_DISTANCE: 20,      // 측면 우회 안전 거리
  SUPPORT_RANGE: 25,            // 지원 범위
  
  // 사기/피로 임계값
  LOW_MORALE: 40,               // 낮은 사기 (후퇴 고려)
  CRITICAL_MORALE: 20,          // 치명적 사기 (후퇴 필수)
  HIGH_FATIGUE: 70,             // 높은 피로 (휴식 필요)
  
  // 병력 비율 임계값
  OVERWHELMING_RATIO: 2.0,      // 압도적 병력 비율
  DANGEROUS_RATIO: 0.5,         // 위험한 병력 비율
  
  // 협동 공격 임계값
  MIN_ENCIRCLE_SQUADS: 3,       // 포위에 필요한 최소 부대 수
  
  // 시간 관련 (ms)
  CHARGE_IMPACT_TIME: 3000,     // 돌격 충돌까지 시간
  FLANK_APPROACH_TIME: 8000,    // 측면 우회 시간
};

// ========================================
// 메인 전술 AI 클래스
// ========================================

export class SquadTacticsAI {
  private squadStates: Map<string, TacticalSituation> = new Map();
  private pendingCoordinatedAttacks: CoordinatedAttack[] = [];
  
  constructor(
    private getSquad: (id: string) => TWSquad | undefined,
    private getAllSquads: () => TWSquad[],
    private getSoldier: (id: string) => TWSoldier | undefined
  ) {}

  // ========================================
  // 메인 의사결정 함수
  // ========================================

  /**
   * 전술 결정 트리
   * 부대의 현재 상황을 평가하고 최적의 전술 행동을 결정
   */
  decideTactic(squadId: string): TacticAction {
    const squad = this.getSquad(squadId);
    if (!squad || squad.state === 'destroyed' || squad.state === 'routed') {
      return { type: 'hold', priority: 0, reason: '부대 무력화' };
    }

    // 1. 전술 상황 평가
    const situation = this.evaluateSituation(squad);
    this.squadStates.set(squadId, situation);

    // 2. 치명적 상황 처리 (최우선)
    if (situation.morale < TACTICS_CONFIG.CRITICAL_MORALE) {
      return {
        type: 'retreat',
        priority: 100,
        targetPosition: this.calculateRetreatPosition(squad),
        reason: '사기 붕괴 - 긴급 후퇴',
      };
    }

    // 3. 지원 필요 여부
    if (situation.needsSupport && situation.allySupport < 30) {
      // 아군 지원이 부족하면 전략적 후퇴
      if (situation.squadHealth < 50) {
        return {
          type: 'retreat',
          priority: 80,
          targetPosition: this.calculateRetreatPosition(squad),
          reason: '지원 부족 - 전략적 후퇴',
        };
      }
    }

    // 4. 측면 공격 기회 탐색
    const flankOpportunity = this.findBestFlankingOpportunity(squad, situation);
    if (flankOpportunity && flankOpportunity.risk < 60 && flankOpportunity.reward > 50) {
      return this.createFlankAction(squad, flankOpportunity);
    }

    // 5. 협동 작전 참여 여부
    const coordinated = this.findCoordinatedAttackPlan(squadId);
    if (coordinated) {
      return this.executeCoordinatedRole(squad, coordinated);
    }

    // 6. 기본 행동 결정 (유닛 타입별)
    return this.decideDefaultAction(squad, situation);
  }

  // ========================================
  // 위협도 평가
  // ========================================

  /**
   * 모든 적 부대에 대한 위협 평가
   */
  evaluateThreats(squad: TWSquad): ThreatInfo[] {
    const threats: ThreatInfo[] = [];
    const allSquads = this.getAllSquads();

    for (const enemy of allSquads) {
      if (enemy.teamId === squad.teamId) continue;
      if (enemy.state === 'destroyed' || enemy.state === 'routed') continue;
      if (enemy.aliveSoldiers <= 0) continue;

      const threat = this.calculateThreat(squad, enemy);
      threats.push(threat);
    }

    // 위협도 순으로 정렬
    threats.sort((a, b) => b.threatLevel - a.threatLevel);
    return threats;
  }

  /**
   * 단일 적 부대에 대한 위협 계산
   */
  private calculateThreat(squad: TWSquad, enemy: TWSquad): ThreatInfo {
    const distance = this.getDistance(squad.position, enemy.position);
    const direction = Math.atan2(
      enemy.position.z - squad.position.z,
      enemy.position.x - squad.position.x
    );

    // 상성 체크
    const isCounter = UNIT_WEAKNESS[squad.category]?.includes(enemy.category) ?? false;
    const isWeak = UNIT_COUNTER[squad.category]?.includes(enemy.category) ?? false;

    // 돌격 체크
    const isCharging = enemy.state === 'engaging' && 
      ['cavalry', 'shock_cavalry', 'chariot'].includes(enemy.category);

    // 도달 시간 계산
    const enemySpeed = CATEGORY_BASE_STATS[enemy.category].speed;
    const canReach = (distance / enemySpeed) * 1000;

    // 측면 노출 각도 계산
    const flankAngle = this.calculateFlankAngle(squad, enemy);

    // 위협도 계산
    let threatLevel = 50; // 기본 위협도

    // 거리 기반 (가까울수록 위협)
    threatLevel += Math.max(0, (30 - distance) * 2);

    // 병력 비율
    const forceRatio = enemy.aliveSoldiers / Math.max(1, squad.aliveSoldiers);
    threatLevel += (forceRatio - 1) * 20;

    // 상성
    if (isCounter) threatLevel += 25;
    if (isWeak) threatLevel -= 15;

    // 돌격 중
    if (isCharging) threatLevel += 20;

    // 측면 공격
    if (flankAngle !== 'front') threatLevel += 15;

    // 사기
    threatLevel += (enemy.morale - squad.morale) * 0.2;

    // 범위 제한
    threatLevel = Math.max(0, Math.min(100, threatLevel));

    return {
      squadId: enemy.id,
      threatLevel,
      distance,
      direction,
      isCounter,
      isWeak,
      isCharging,
      canReach,
      flankAngle,
      soldierCount: enemy.aliveSoldiers,
      morale: enemy.morale,
      fatigue: enemy.fatigue,
    };
  }

  /**
   * 측면 노출 각도 계산
   * 내 부대가 적에게 어느 방향으로 노출되어 있는지
   */
  private calculateFlankAngle(squad: TWSquad, enemy: TWSquad): FlankAngle {
    // 적이 나를 바라보는 방향
    const attackAngle = Math.atan2(
      squad.position.z - enemy.position.z,
      squad.position.x - enemy.position.x
    );

    // 내 facing과의 차이
    let angleDiff = attackAngle - squad.facing;
    
    // -π ~ π 범위로 정규화
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    const absDiff = Math.abs(angleDiff);

    if (absDiff < Math.PI / 3) {
      return 'front';
    } else if (absDiff > 2 * Math.PI / 3) {
      return 'rear';
    } else if (angleDiff > 0) {
      return 'right_flank';
    } else {
      return 'left_flank';
    }
  }

  // ========================================
  // 측면 공격 기회 탐지
  // ========================================

  /**
   * 측면 공격 기회 탐색
   * 모든 적 부대에 대해 측면/후방 공격 가능성 평가
   */
  findFlankingOpportunities(squad: TWSquad): FlankingOpportunity[] {
    const opportunities: FlankingOpportunity[] = [];
    const allSquads = this.getAllSquads();

    for (const enemy of allSquads) {
      if (enemy.teamId === squad.teamId) continue;
      if (enemy.state === 'destroyed' || enemy.state === 'routed') continue;

      // 각 측면에 대한 기회 평가
      const angles: FlankAngle[] = ['left_flank', 'right_flank', 'rear'];
      
      for (const angle of angles) {
        const opportunity = this.evaluateFlankingOpportunity(squad, enemy, angle);
        if (opportunity && opportunity.reward > 20) {
          opportunities.push(opportunity);
        }
      }
    }

    // 보상-위험 비율로 정렬
    opportunities.sort((a, b) => (b.reward - b.risk) - (a.reward - a.risk));
    return opportunities;
  }

  /**
   * 특정 측면 공격 기회 평가
   */
  private evaluateFlankingOpportunity(
    squad: TWSquad,
    enemy: TWSquad,
    attackAngle: FlankAngle
  ): FlankingOpportunity | null {
    // 공격 위치 계산
    const attackPosition = this.calculateFlankPosition(enemy, attackAngle);
    const currentDistance = this.getDistance(squad.position, enemy.position);
    const approachDistance = this.getDistance(squad.position, attackPosition);

    // 너무 멀면 제외
    if (approachDistance > TACTICS_CONFIG.FLANK_SAFE_DISTANCE * 2) {
      return null;
    }

    // 이동 경로 계산
    const approachPath = this.calculateApproachPath(squad.position, attackPosition, enemy.position);

    // 경로 차단 여부 확인
    const isBlocked = this.isPathBlocked(approachPath, squad.teamId);

    // 예상 도달 시간
    const speed = CATEGORY_BASE_STATS[squad.category].speed;
    const estimatedTime = (approachDistance / speed) * 1000;

    // 보너스 배율
    const bonusMultiplier = attackAngle === 'rear' 
      ? FLANKING_BONUS.rear 
      : FLANKING_BONUS.flank;

    // 위험도 계산
    let risk = 30; // 기본 위험도

    // 경로가 차단되면 위험 증가
    if (isBlocked) risk += 30;

    // 적이 기병이면 위험
    if (['cavalry', 'shock_cavalry'].includes(enemy.category)) {
      risk += 15;
    }

    // 우리가 원거리 유닛이면 근접 회피
    if (['archer', 'crossbow'].includes(squad.category)) {
      risk += 20;
    }

    // 이동 거리가 길면 위험
    risk += (approachDistance / 10);

    // 보상 계산
    let reward = 40; // 기본 보상

    // 측면/후방 보너스
    reward += (bonusMultiplier - 1) * 50;

    // 적이 이미 교전 중이면 보상 증가
    if (enemy.state === 'engaging') {
      reward += 20;
    }

    // 우리가 기병이면 측면 공격 효과적
    if (['cavalry', 'shock_cavalry'].includes(squad.category)) {
      reward += 25;
    }

    // 상성 유리하면 보상 증가
    if (UNIT_COUNTER[squad.category]?.includes(enemy.category)) {
      reward += 15;
    }

    return {
      targetSquadId: enemy.id,
      attackAngle,
      bonusMultiplier,
      approachPath,
      estimatedTime,
      isBlocked,
      risk: Math.min(100, Math.max(0, risk)),
      reward: Math.min(100, Math.max(0, reward)),
    };
  }

  /**
   * 측면 공격 위치 계산
   */
  private calculateFlankPosition(target: TWSquad, angle: FlankAngle): Vector2 {
    const distance = TACTICS_CONFIG.MELEE_RANGE + 2;
    let offsetAngle = target.facing;

    switch (angle) {
      case 'left_flank':
        offsetAngle += Math.PI / 2;
        break;
      case 'right_flank':
        offsetAngle -= Math.PI / 2;
        break;
      case 'rear':
        offsetAngle += Math.PI;
        break;
      default:
        break;
    }

    return {
      x: target.position.x + Math.cos(offsetAngle) * distance,
      z: target.position.z + Math.sin(offsetAngle) * distance,
    };
  }

  /**
   * 접근 경로 계산 (단순 직선 + 우회)
   */
  private calculateApproachPath(
    from: Vector2,
    to: Vector2,
    enemyPos: Vector2
  ): Vector2[] {
    const path: Vector2[] = [];

    // 직접 경로 vs 우회 경로
    const directDistance = this.getDistance(from, to);
    const passByEnemy = this.getDistance(
      { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 },
      enemyPos
    );

    if (passByEnemy < 5) {
      // 적 근처를 지나감 - 우회 필요
      const midpoint = {
        x: (from.x + to.x) / 2 + (from.z - to.z) * 0.3,
        z: (from.z + to.z) / 2 - (from.x - to.x) * 0.3,
      };
      path.push(from, midpoint, to);
    } else {
      // 직접 경로
      path.push(from, to);
    }

    return path;
  }

  /**
   * 경로가 적에게 차단되는지 확인
   */
  private isPathBlocked(path: Vector2[], friendlyTeam: 'attacker' | 'defender'): boolean {
    const allSquads = this.getAllSquads();

    for (const squad of allSquads) {
      if (squad.teamId === friendlyTeam) continue;
      if (squad.state === 'destroyed') continue;

      // 경로 상의 각 지점과 적 부대의 거리 확인
      for (let i = 0; i < path.length - 1; i++) {
        const segmentMid = {
          x: (path[i].x + path[i + 1].x) / 2,
          z: (path[i].z + path[i + 1].z) / 2,
        };
        if (this.getDistance(segmentMid, squad.position) < 8) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 최적의 측면 공격 기회 선택
   */
  private findBestFlankingOpportunity(
    squad: TWSquad,
    situation: TacticalSituation
  ): FlankingOpportunity | null {
    const opportunities = this.findFlankingOpportunities(squad);
    
    if (opportunities.length === 0) return null;

    // 기병은 측면 공격 선호
    if (['cavalry', 'shock_cavalry', 'chariot'].includes(squad.category)) {
      return opportunities[0];
    }

    // 보병은 신중하게
    const safeOpportunity = opportunities.find(o => o.risk < 50 && !o.isBlocked);
    return safeOpportunity || null;
  }

  // ========================================
  // 협동 작전
  // ========================================

  /**
   * 협동 공격 계획 수립
   * 여러 부대가 동시에 한 적을 공격
   */
  planCoordinatedAttack(targetSquadId: string): CoordinatedAttack | null {
    const target = this.getSquad(targetSquadId);
    if (!target || target.state === 'destroyed') return null;

    const allSquads = this.getAllSquads();
    const friendlySquads = allSquads.filter(s => 
      s.teamId !== target.teamId && 
      s.state !== 'destroyed' && 
      s.state !== 'routed'
    );

    if (friendlySquads.length < 2) return null;

    // 참여 가능한 부대 선별
    const participants: CoordinatedAttack['participants'] = [];
    let mainAttacker: TWSquad | null = null;

    // 메인 공격자 선정 (가장 강력한 근접 부대)
    for (const squad of friendlySquads) {
      const distance = this.getDistance(squad.position, target.position);
      if (distance > TACTICS_CONFIG.SUPPORT_RANGE) continue;

      if (['sword_infantry', 'halberd_infantry', 'spear_guard'].includes(squad.category)) {
        if (!mainAttacker || squad.aliveSoldiers > mainAttacker.aliveSoldiers) {
          mainAttacker = squad;
        }
      }
    }

    if (!mainAttacker) {
      // 근접 부대가 없으면 가장 가까운 부대
      mainAttacker = friendlySquads.reduce((closest, s) => {
        const d1 = this.getDistance(closest.position, target.position);
        const d2 = this.getDistance(s.position, target.position);
        return d2 < d1 ? s : closest;
      });
    }

    participants.push({
      squadId: mainAttacker.id,
      role: 'main',
      position: target.position,
      timing: 0,
    });

    // 측면/후방 공격자 배치
    for (const squad of friendlySquads) {
      if (squad.id === mainAttacker.id) continue;
      
      const distance = this.getDistance(squad.position, target.position);
      if (distance > TACTICS_CONFIG.SUPPORT_RANGE * 1.5) continue;

      // 기병은 측면/후방
      if (['cavalry', 'shock_cavalry'].includes(squad.category)) {
        const flankPos = this.calculateFlankPosition(target, 'left_flank');
        participants.push({
          squadId: squad.id,
          role: 'flank',
          position: flankPos,
          timing: 500, // 약간 늦게
        });
      }
      // 원거리는 지원
      else if (['archer', 'crossbow'].includes(squad.category)) {
        participants.push({
          squadId: squad.id,
          role: 'support',
          position: squad.position, // 제자리에서 지원
          timing: 0,
        });
      }
      // 나머지 보병은 보조 공격
      else {
        const rearPos = this.calculateFlankPosition(target, 'rear');
        participants.push({
          squadId: squad.id,
          role: 'rear',
          position: rearPos,
          timing: 1000,
        });
      }

      // 최대 5개 부대
      if (participants.length >= 5) break;
    }

    // 포위 가능 여부
    if (participants.length >= TACTICS_CONFIG.MIN_ENCIRCLE_SQUADS) {
      // 포위 진형으로 재배치
      this.arrangeEncirclement(participants, target);
    }

    // 총 병력 및 성공 확률 계산
    const totalForce = participants.reduce((sum, p) => {
      const s = this.getSquad(p.squadId);
      return sum + (s?.aliveSoldiers || 0);
    }, 0);

    const forceRatio = totalForce / Math.max(1, target.aliveSoldiers);
    const successProbability = Math.min(95, forceRatio * 30 + participants.length * 10);

    return {
      targetSquadId,
      participants,
      totalForce,
      expectedCasualties: Math.round(target.aliveSoldiers * 0.2 / Math.max(1, forceRatio)),
      successProbability,
    };
  }

  /**
   * 포위 진형 배치
   */
  private arrangeEncirclement(
    participants: CoordinatedAttack['participants'],
    target: TWSquad
  ): void {
    const angleStep = (2 * Math.PI) / participants.length;
    const encircleRadius = 6;

    participants.forEach((p, index) => {
      const angle = target.facing + angleStep * index;
      p.position = {
        x: target.position.x + Math.cos(angle) * encircleRadius,
        z: target.position.z + Math.sin(angle) * encircleRadius,
      };
      // 동시 공격
      p.timing = index * 200;
    });
  }

  /**
   * 기존 협동 공격 계획 찾기
   */
  private findCoordinatedAttackPlan(squadId: string): CoordinatedAttack | null {
    return this.pendingCoordinatedAttacks.find(
      plan => plan.participants.some(p => p.squadId === squadId)
    ) || null;
  }

  /**
   * 협동 공격에서 역할 수행
   */
  private executeCoordinatedRole(
    squad: TWSquad,
    plan: CoordinatedAttack
  ): TacticAction {
    const myRole = plan.participants.find(p => p.squadId === squad.id);
    if (!myRole) return { type: 'hold', priority: 0, reason: '역할 없음' };

    switch (myRole.role) {
      case 'main':
        return {
          type: 'charge',
          priority: 90,
          targetSquadId: plan.targetSquadId,
          targetPosition: myRole.position,
          formation: 'wedge',
          reason: '협동 공격 - 메인 돌격',
        };

      case 'flank':
        return {
          type: 'flank_left',
          priority: 85,
          targetSquadId: plan.targetSquadId,
          targetPosition: myRole.position,
          reason: '협동 공격 - 측면 우회',
        };

      case 'rear':
        return {
          type: 'rear_attack',
          priority: 85,
          targetSquadId: plan.targetSquadId,
          targetPosition: myRole.position,
          reason: '협동 공격 - 후방 공격',
        };

      case 'support':
        return {
          type: 'maintain_range',
          priority: 70,
          targetSquadId: plan.targetSquadId,
          reason: '협동 공격 - 원거리 지원',
        };

      case 'decoy':
        return {
          type: 'feint',
          priority: 60,
          targetSquadId: plan.targetSquadId,
          reason: '협동 공격 - 양동',
        };

      default:
        return { type: 'advance', priority: 50, reason: '협동 공격 참여' };
    }
  }

  /**
   * 협동 공격 등록
   */
  registerCoordinatedAttack(plan: CoordinatedAttack): void {
    this.pendingCoordinatedAttacks.push(plan);
  }

  /**
   * 완료된 협동 공격 제거
   */
  removeCoordinatedAttack(targetSquadId: string): void {
    this.pendingCoordinatedAttacks = this.pendingCoordinatedAttacks.filter(
      p => p.targetSquadId !== targetSquadId
    );
  }

  // ========================================
  // 상황 평가
  // ========================================

  /**
   * 전술 상황 종합 평가
   */
  private evaluateSituation(squad: TWSquad): TacticalSituation {
    const threats = this.evaluateThreats(squad);
    const opportunities = this.findFlankingOpportunities(squad);

    // 아군 지원 수준
    const allySupport = this.calculateAllySupport(squad);

    // 부대 상태
    const squadHealth = (squad.aliveSoldiers / Math.max(1, squad.soldiers.length)) * 100;
    
    // 교전 중인지
    const isEngaged = squad.state === 'engaging' || 
      squad.soldiers.some(s => s.state === 'fighting');

    // 측면 공격 받는 중
    const isFlanked = threats.some(t => 
      t.distance < 5 && (t.flankAngle === 'left_flank' || t.flankAngle === 'right_flank' || t.flankAngle === 'rear')
    );

    // 지원 필요
    const needsSupport = squadHealth < 50 || squad.morale < TACTICS_CONFIG.LOW_MORALE || 
      threats.filter(t => t.threatLevel > 60).length >= 2;

    // 돌격 가능
    const canCharge = ['cavalry', 'shock_cavalry', 'chariot'].includes(squad.category) &&
      squad.morale > 60 && squad.fatigue < TACTICS_CONFIG.HIGH_FATIGUE;

    // 측면 공격 가능
    const canFlank = opportunities.some(o => o.risk < 50 && o.reward > 40);

    return {
      threats,
      opportunities,
      allySupport,
      squadHealth,
      morale: squad.morale,
      fatigue: squad.fatigue,
      isEngaged,
      isFlanked,
      needsSupport,
      canCharge,
      canFlank,
    };
  }

  /**
   * 아군 지원 수준 계산
   */
  private calculateAllySupport(squad: TWSquad): number {
    const allSquads = this.getAllSquads();
    let support = 0;

    for (const ally of allSquads) {
      if (ally.teamId !== squad.teamId) continue;
      if (ally.id === squad.id) continue;
      if (ally.state === 'destroyed' || ally.state === 'routed') continue;

      const distance = this.getDistance(squad.position, ally.position);
      if (distance < TACTICS_CONFIG.SUPPORT_RANGE) {
        support += (1 - distance / TACTICS_CONFIG.SUPPORT_RANGE) * 30;
        support += ally.aliveSoldiers * 0.5;
      }
    }

    return Math.min(100, support);
  }

  // ========================================
  // 유닛 타입별 기본 행동
  // ========================================

  /**
   * 유닛 타입에 따른 기본 전술 행동 결정
   */
  private decideDefaultAction(
    squad: TWSquad,
    situation: TacticalSituation
  ): TacticAction {
    const category = squad.category;
    const topThreat = situation.threats[0];

    // 원거리 유닛
    if (['archer', 'crossbow', 'horse_archer'].includes(category)) {
      return this.decideRangedAction(squad, situation);
    }

    // 기병
    if (['cavalry', 'shock_cavalry'].includes(category)) {
      return this.decideCavalryAction(squad, situation);
    }

    // 전차
    if (category === 'chariot') {
      return this.decideChariotAction(squad, situation);
    }

    // 공성
    if (category === 'siege') {
      return this.decideSiegeAction(squad, situation);
    }

    // 책사
    if (category === 'strategist') {
      return this.decideStrategistAction(squad, situation);
    }

    // 보병 (기본)
    return this.decideInfantryAction(squad, situation);
  }

  /**
   * 보병 행동 결정
   */
  private decideInfantryAction(
    squad: TWSquad,
    situation: TacticalSituation
  ): TacticAction {
    const topThreat = situation.threats[0];

    if (!topThreat) {
      return { type: 'hold', priority: 10, reason: '적 없음 - 대기' };
    }

    // 측면 공격 받으면 진형 전환
    if (situation.isFlanked) {
      return {
        type: 'regroup',
        priority: 75,
        formation: 'square',
        reason: '측면 공격 대응 - 방진 전환',
      };
    }

    // 교전 중
    if (situation.isEngaged) {
      // 수적 우세면 공격적
      if (topThreat.soldierCount < squad.aliveSoldiers * 0.7) {
        return {
          type: 'advance',
          priority: 60,
          targetSquadId: topThreat.squadId,
          reason: '수적 우세 - 공격',
        };
      }
      // 열세면 방어적
      return {
        type: 'hold',
        priority: 55,
        formation: 'shield_wall',
        reason: '교전 중 - 진형 유지',
      };
    }

    // 적이 가까이 오면 진형 유지하며 대기
    if (topThreat.distance < TACTICS_CONFIG.CHARGE_DISTANCE) {
      return {
        type: 'hold',
        priority: 50,
        targetSquadId: topThreat.squadId,
        reason: '적 접근 - 진형 유지',
      };
    }

    // 전진
    return {
      type: 'advance',
      priority: 45,
      targetSquadId: topThreat.squadId,
      targetPosition: topThreat.squadId ? this.getSquad(topThreat.squadId)?.position : undefined,
      reason: '전진',
    };
  }

  /**
   * 원거리 유닛 행동 결정
   */
  private decideRangedAction(
    squad: TWSquad,
    situation: TacticalSituation
  ): TacticAction {
    const topThreat = situation.threats[0];

    if (!topThreat) {
      return { type: 'hold', priority: 10, reason: '적 없음' };
    }

    // 최소 사거리 미만이면 후퇴
    const stats = CATEGORY_BASE_STATS[squad.category];
    const minRange = stats.range ? stats.range * 0.1 : 3;

    if (topThreat.distance < minRange) {
      return {
        type: 'retreat',
        priority: 85,
        targetPosition: this.calculateRetreatPosition(squad),
        reason: '최소 사거리 미만 - 후퇴',
      };
    }

    // 최적 사거리 유지 (카이팅)
    const optimalRange = stats.range ? stats.range * 0.7 : 8;
    if (topThreat.distance < optimalRange * 0.8) {
      return {
        type: 'kite',
        priority: 70,
        targetSquadId: topThreat.squadId,
        targetPosition: this.calculateKitePosition(squad, topThreat),
        reason: '거리 유지 - 카이팅',
      };
    }

    // 사거리 내면 사격
    if (topThreat.distance <= (stats.range || 15)) {
      return {
        type: 'maintain_range',
        priority: 60,
        targetSquadId: topThreat.squadId,
        reason: '최적 사거리 - 사격',
      };
    }

    // 사거리 밖이면 접근
    return {
      type: 'advance',
      priority: 40,
      targetSquadId: topThreat.squadId,
      reason: '사거리 외 - 접근',
    };
  }

  /**
   * 기병 행동 결정
   */
  private decideCavalryAction(
    squad: TWSquad,
    situation: TacticalSituation
  ): TacticAction {
    const topThreat = situation.threats[0];

    if (!topThreat) {
      return { type: 'hold', priority: 10, reason: '적 없음' };
    }

    // 창병 회피 (대기병 상성)
    if (['ji_infantry', 'spear_guard', 'halberd_infantry'].includes(
      this.getSquad(topThreat.squadId)?.category || ''
    )) {
      // 다른 대상 찾기
      const altTarget = situation.threats.find(t => 
        !['ji_infantry', 'spear_guard', 'halberd_infantry'].includes(
          this.getSquad(t.squadId)?.category || ''
        )
      );

      if (altTarget) {
        return {
          type: 'flank_left',
          priority: 75,
          targetSquadId: altTarget.squadId,
          reason: '창병 회피 - 대체 대상 측면 공격',
        };
      }
    }

    // 측면 공격 기회가 있으면 실행
    if (situation.canFlank && situation.opportunities.length > 0) {
      const bestOpp = situation.opportunities[0];
      return this.createFlankAction(squad, bestOpp);
    }

    // 원거리 유닛 우선 공격
    const rangedTarget = situation.threats.find(t =>
      ['archer', 'crossbow', 'strategist'].includes(
        this.getSquad(t.squadId)?.category || ''
      )
    );

    if (rangedTarget) {
      return {
        type: 'charge',
        priority: 80,
        targetSquadId: rangedTarget.squadId,
        formation: 'wedge',
        reason: '원거리 유닛 돌격',
      };
    }

    // 기본 돌격
    if (topThreat.distance < TACTICS_CONFIG.CHARGE_DISTANCE) {
      return {
        type: 'charge',
        priority: 70,
        targetSquadId: topThreat.squadId,
        formation: 'wedge',
        reason: '돌격',
      };
    }

    // 접근
    return {
      type: 'advance',
      priority: 50,
      targetSquadId: topThreat.squadId,
      reason: '적 접근',
    };
  }

  /**
   * 전차 행동 결정
   */
  private decideChariotAction(
    squad: TWSquad,
    situation: TacticalSituation
  ): TacticAction {
    // 전차는 측면 돌격 특화
    const flankOpp = situation.opportunities.find(o => 
      o.attackAngle !== 'front' && o.risk < 60
    );

    if (flankOpp) {
      return this.createFlankAction(squad, flankOpp);
    }

    // 없으면 기병처럼 행동
    return this.decideCavalryAction(squad, situation);
  }

  /**
   * 공성 유닛 행동 결정
   */
  private decideSiegeAction(
    squad: TWSquad,
    situation: TacticalSituation
  ): TacticAction {
    const topThreat = situation.threats[0];

    // 공성은 항상 후방에서 지원
    if (!topThreat) {
      return { type: 'hold', priority: 10, reason: '대기' };
    }

    // 적이 가까이 오면 후퇴
    if (topThreat.distance < 10) {
      return {
        type: 'retreat',
        priority: 90,
        targetPosition: this.calculateRetreatPosition(squad),
        reason: '공성 - 후퇴',
      };
    }

    // 사거리 내면 공격
    return {
      type: 'maintain_range',
      priority: 60,
      targetSquadId: topThreat.squadId,
      reason: '공성 - 포격',
    };
  }

  /**
   * 책사 행동 결정
   */
  private decideStrategistAction(
    squad: TWSquad,
    situation: TacticalSituation
  ): TacticAction {
    // 책사는 항상 아군 뒤에서 지원
    const friendlyInfantry = this.getAllSquads().find(s => 
      s.teamId === squad.teamId &&
      s.id !== squad.id &&
      ['sword_infantry', 'ji_infantry', 'spear_guard'].includes(s.category) &&
      s.state !== 'destroyed'
    );

    if (friendlyInfantry) {
      const supportPos = {
        x: friendlyInfantry.position.x - Math.cos(friendlyInfantry.facing) * 5,
        z: friendlyInfantry.position.z - Math.sin(friendlyInfantry.facing) * 5,
      };

      return {
        type: 'support',
        priority: 65,
        supportSquadId: friendlyInfantry.id,
        targetPosition: supportPos,
        reason: '아군 지원',
      };
    }

    // 아군이 없으면 후퇴
    return {
      type: 'retreat',
      priority: 70,
      targetPosition: this.calculateRetreatPosition(squad),
      reason: '아군 없음 - 후퇴',
    };
  }

  // ========================================
  // 유틸리티 함수
  // ========================================

  /**
   * 측면 공격 액션 생성
   */
  private createFlankAction(
    squad: TWSquad,
    opportunity: FlankingOpportunity
  ): TacticAction {
    let actionType: TacticActionType = 'advance';
    
    switch (opportunity.attackAngle) {
      case 'left_flank':
        actionType = 'flank_left';
        break;
      case 'right_flank':
        actionType = 'flank_right';
        break;
      case 'rear':
        actionType = 'rear_attack';
        break;
    }

    const finalPosition = opportunity.approachPath[opportunity.approachPath.length - 1];

    return {
      type: actionType,
      priority: 75,
      targetSquadId: opportunity.targetSquadId,
      targetPosition: finalPosition,
      reason: `측면 공격 기회 (보상: ${opportunity.reward.toFixed(0)}, 위험: ${opportunity.risk.toFixed(0)})`,
    };
  }

  /**
   * 후퇴 위치 계산
   */
  private calculateRetreatPosition(squad: TWSquad): Vector2 {
    // 진영 방향으로 후퇴
    const retreatDirection = squad.teamId === 'attacker' ? -1 : 1;
    const retreatDistance = 30;

    return {
      x: squad.position.x + retreatDirection * retreatDistance,
      z: squad.position.z,
    };
  }

  /**
   * 카이팅 위치 계산
   */
  private calculateKitePosition(squad: TWSquad, threat: ThreatInfo): Vector2 {
    const retreatAngle = threat.direction + Math.PI;
    const kiteDistance = 8;

    return {
      x: squad.position.x + Math.cos(retreatAngle) * kiteDistance,
      z: squad.position.z + Math.sin(retreatAngle) * kiteDistance,
    };
  }

  /**
   * 거리 계산
   */
  private getDistance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ========================================
  // 디버그/분석
  // ========================================

  /**
   * 전술 상황 요약
   */
  getTacticalSummary(squadId: string): string {
    const situation = this.squadStates.get(squadId);
    if (!situation) return '상황 정보 없음';

    const threats = situation.threats.slice(0, 3).map(t => 
      `  - ${t.squadId}: 위협도 ${t.threatLevel.toFixed(0)}, 거리 ${t.distance.toFixed(1)}`
    ).join('\n');

    const opps = situation.opportunities.slice(0, 2).map(o =>
      `  - ${o.targetSquadId} ${o.attackAngle}: 보상 ${o.reward.toFixed(0)}, 위험 ${o.risk.toFixed(0)}`
    ).join('\n');

    return `
전술 상황 분석 [${squadId}]
━━━━━━━━━━━━━━━━━━━━━━━━━━
부대 상태: ${situation.squadHealth.toFixed(0)}%
사기: ${situation.morale.toFixed(0)} | 피로: ${situation.fatigue.toFixed(0)}
교전 중: ${situation.isEngaged ? '예' : '아니오'} | 측면공격 받음: ${situation.isFlanked ? '예' : '아니오'}
지원 필요: ${situation.needsSupport ? '예' : '아니오'} | 아군 지원: ${situation.allySupport.toFixed(0)}%

주요 위협:
${threats || '  (없음)'}

측면 공격 기회:
${opps || '  (없음)'}
━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * TotalWarEngine과 연동된 SquadTacticsAI 생성
 */
export function createSquadTacticsAI(engine: {
  getSquad: (id: string) => TWSquad | undefined;
  getAllSquads: () => TWSquad[];
  getSoldier: (id: string) => TWSoldier | undefined;
}): SquadTacticsAI {
  return new SquadTacticsAI(
    engine.getSquad.bind(engine),
    engine.getAllSquads.bind(engine),
    engine.getSoldier.bind(engine)
  );
}

export default SquadTacticsAI;






