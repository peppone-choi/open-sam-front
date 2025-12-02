/**
 * 결과 수집기 (ResultCollector)
 * 
 * 복셀 전투 결과를 수집하고 취합합니다.
 * 전투 종료 감지, 최종 상태 스냅샷, 이벤트 수집을 담당합니다.
 * 
 * @module ResultCollector
 */

import type { TWSquad, TWSoldier, TWBattleState } from '../TotalWarEngine';
import type {
  VoxelBattleResult,
  VoxelSquad,
  SquadResult,
  BattleEvent,
  BattleEventType,
  BattleStats,
} from '../types/BattleTypes';

// ========================================
// 타입 정의
// ========================================

/** 부대 스냅샷 */
export interface SquadSnapshot {
  squadId: string;
  teamId: 'attacker' | 'defender';
  unitTypeId: number;
  name: string;
  
  // 병력 상태
  initialCount: number;
  currentCount: number;
  casualties: number;
  
  // 사기/상태
  morale: number;
  status: 'active' | 'routed' | 'destroyed';
  
  // 전투 기록
  kills: number;
  damageDealt: number;
  damageReceived: number;
  
  // 위치
  position: { x: number; y: number };
}

/** 전투 스냅샷 */
export interface BattleSnapshot {
  timestamp: number;
  phase: 'preparing' | 'active' | 'ended';
  elapsedTime: number;
  
  attackerSquads: SquadSnapshot[];
  defenderSquads: SquadSnapshot[];
  
  attackerTotalRemaining: number;
  defenderTotalRemaining: number;
  
  events: BattleEvent[];
}

/** 전투 종료 조건 */
export interface EndCondition {
  type: 'annihilation' | 'morale_collapse' | 'time_limit' | 'objective' | 'manual';
  winner: 'attacker' | 'defender' | 'draw';
  reason: string;
}

/** 수집 옵션 */
export interface CollectorOptions {
  /** 스냅샷 간격 (ms) */
  snapshotInterval: number;
  /** 최대 이벤트 수 */
  maxEvents: number;
  /** 최대 전투 시간 (ms) */
  maxBattleTime: number;
  /** 사기 붕괴 임계값 */
  moraleCollapseThreshold: number;
}

/** 기본 수집 옵션 */
const DEFAULT_OPTIONS: CollectorOptions = {
  snapshotInterval: 1000, // 1초
  maxEvents: 10000,
  maxBattleTime: 600000, // 10분
  moraleCollapseThreshold: 10,
};

// ========================================
// ResultCollector 클래스
// ========================================

/**
 * 전투 결과 수집기
 */
export class ResultCollector {
  private battleId: string;
  private startTime: number = 0;
  private endTime: number = 0;
  private options: CollectorOptions;
  
  // 초기 상태
  private initialAttackerSquads: SquadSnapshot[] = [];
  private initialDefenderSquads: SquadSnapshot[] = [];
  private initialAttackerTotal: number = 0;
  private initialDefenderTotal: number = 0;
  
  // 현재 상태
  private currentAttackerSquads: SquadSnapshot[] = [];
  private currentDefenderSquads: SquadSnapshot[] = [];
  
  // 이벤트 수집
  private events: BattleEvent[] = [];
  private snapshotHistory: BattleSnapshot[] = [];
  private lastSnapshotTime: number = 0;
  
  // 전투 통계
  private stats: BattleStats = {
    totalKills: { attacker: 0, defender: 0 },
    totalDamage: { attacker: 0, defender: 0 },
    chargeCount: { attacker: 0, defender: 0 },
    routCount: { attacker: 0, defender: 0 },
  };
  
  constructor(battleId: string, options: Partial<CollectorOptions> = {}) {
    this.battleId = battleId;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  // ========================================
  // 초기화
  // ========================================
  
  /**
   * 전투 시작 시 초기 상태 설정
   */
  initializeBattle(
    attackerSquads: TWSquad[] | VoxelSquad[],
    defenderSquads: TWSquad[] | VoxelSquad[]
  ): void {
    this.startTime = Date.now();
    this.lastSnapshotTime = this.startTime;
    
    // 초기 스냅샷 생성
    this.initialAttackerSquads = this.createSquadSnapshots(attackerSquads, 'attacker');
    this.initialDefenderSquads = this.createSquadSnapshots(defenderSquads, 'defender');
    
    // 초기 병력 총합
    this.initialAttackerTotal = this.calculateTotalTroops(this.initialAttackerSquads);
    this.initialDefenderTotal = this.calculateTotalTroops(this.initialDefenderSquads);
    
    // 현재 상태 복사
    this.currentAttackerSquads = JSON.parse(JSON.stringify(this.initialAttackerSquads));
    this.currentDefenderSquads = JSON.parse(JSON.stringify(this.initialDefenderSquads));
    
    // 시작 이벤트 추가
    this.addEvent('battle_started', {
      attackerTotal: this.initialAttackerTotal,
      defenderTotal: this.initialDefenderTotal,
    });
  }
  
  /**
   * TWSquad/VoxelSquad → SquadSnapshot 변환
   */
  private createSquadSnapshots(
    squads: TWSquad[] | VoxelSquad[],
    teamId: 'attacker' | 'defender'
  ): SquadSnapshot[] {
    return squads.map(squad => {
      // TWSquad 형식
      if ('soldiers' in squad) {
        const twSquad = squad as TWSquad;
        return {
          squadId: twSquad.id,
          teamId,
          unitTypeId: twSquad.unitTypeId,
          name: twSquad.name,
          initialCount: twSquad.soldiers.length,
          currentCount: twSquad.aliveSoldiers,
          casualties: twSquad.losses,
          morale: twSquad.morale,
          status: this.getSquadStatus(twSquad),
          kills: twSquad.kills,
          damageDealt: 0,
          damageReceived: 0,
          position: { x: twSquad.position.x, y: (twSquad.position as unknown as {x: number; y?: number; z?: number}).y ?? (twSquad.position as unknown as {x: number; z: number}).z },
        };
      }
      
      // VoxelSquad 형식
      const voxelSquad = squad as VoxelSquad;
      return {
        squadId: voxelSquad.squadId,
        teamId,
        unitTypeId: voxelSquad.unitTypeId,
        name: voxelSquad.name,
        initialCount: voxelSquad.unitCount,
        currentCount: voxelSquad.unitCount,
        casualties: 0,
        morale: voxelSquad.morale,
        status: 'active' as const,
        kills: 0,
        damageDealt: 0,
        damageReceived: 0,
        position: { x: 0, y: 0 },
      };
    });
  }
  
  /**
   * TWSquad의 상태 판정
   */
  private getSquadStatus(squad: TWSquad): 'active' | 'routed' | 'destroyed' {
    if (squad.aliveSoldiers === 0) return 'destroyed';
    if (squad.state === 'routing') return 'routed';
    return 'active';
  }
  
  /**
   * 총 병력 계산
   */
  private calculateTotalTroops(squads: SquadSnapshot[]): number {
    return squads.reduce((sum, s) => sum + s.currentCount, 0);
  }
  
  // ========================================
  // 상태 업데이트
  // ========================================
  
  /**
   * 부대 상태 업데이트
   */
  updateSquadState(squadId: string, update: Partial<SquadSnapshot>): void {
    const attackerSquad = this.currentAttackerSquads.find(s => s.squadId === squadId);
    const defenderSquad = this.currentDefenderSquads.find(s => s.squadId === squadId);
    
    const squad = attackerSquad || defenderSquad;
    if (squad) {
      // 이전 상태 저장 (이벤트 감지용)
      const prevStatus = squad.status;
      const prevCount = squad.currentCount;
      
      // 상태 업데이트
      Object.assign(squad, update);
      squad.casualties = squad.initialCount - squad.currentCount;
      
      // 통계 업데이트
      const side = attackerSquad ? 'attacker' : 'defender';
      if (update.kills !== undefined) {
        this.stats.totalKills[side] = this.currentAttackerSquads.reduce(
          (sum, s) => sum + s.kills, 0
        );
      }
      
      // 이벤트 감지
      if (prevStatus !== squad.status) {
        if (squad.status === 'routed') {
          this.addEvent('squad_routed', { squadName: squad.name, squadId });
          this.stats.routCount[side]++;
        } else if (squad.status === 'destroyed') {
          this.addEvent('squad_routed', { squadName: squad.name, squadId, destroyed: true });
        }
      }
      
      // 사망자 이벤트
      if (prevCount > squad.currentCount) {
        const casualties = prevCount - squad.currentCount;
        this.addEvent('unit_killed', { 
          squadName: squad.name, 
          squadId, 
          count: casualties 
        });
      }
    }
  }
  
  /**
   * TWSquad 배열에서 직접 업데이트
   */
  updateFromTWSquads(
    attackerSquads: TWSquad[],
    defenderSquads: TWSquad[]
  ): void {
    this.currentAttackerSquads = this.createSquadSnapshots(attackerSquads, 'attacker');
    this.currentDefenderSquads = this.createSquadSnapshots(defenderSquads, 'defender');
    
    // 통계 업데이트
    this.stats.totalKills.attacker = attackerSquads.reduce((sum, s) => sum + s.kills, 0);
    this.stats.totalKills.defender = defenderSquads.reduce((sum, s) => sum + s.kills, 0);
    
    // 스냅샷 기록 (간격 확인)
    const now = Date.now();
    if (now - this.lastSnapshotTime >= this.options.snapshotInterval) {
      this.recordSnapshot();
      this.lastSnapshotTime = now;
    }
  }
  
  // ========================================
  // 이벤트 수집
  // ========================================
  
  /**
   * 이벤트 추가
   */
  addEvent(type: BattleEventType, data: Record<string, unknown> = {}): void {
    if (this.events.length >= this.options.maxEvents) {
      // 오래된 이벤트 제거 (중요 이벤트 제외)
      const importantTypes: BattleEventType[] = [
        'battle_started', 'battle_ended', 'squad_routed', 'ability_used'
      ];
      this.events = this.events.filter(e => importantTypes.includes(e.type));
    }
    
    this.events.push({
      type,
      timestamp: Date.now() - this.startTime,
      data,
    });
  }
  
  /**
   * 돌격 이벤트 기록
   */
  recordCharge(
    squadId: string,
    targetSquadId: string,
    damage: number,
    teamId: 'attacker' | 'defender'
  ): void {
    this.stats.chargeCount[teamId]++;
    this.addEvent('charge_started', { squadId, targetSquadId });
    this.addEvent('charge_impact', { squadId, targetSquadId, damage });
  }
  
  /**
   * 측면/후방 공격 기록
   */
  recordFlankAttack(
    squadId: string,
    targetSquadId: string,
    attackType: 'flank' | 'rear',
    bonus: number
  ): void {
    this.addEvent(attackType === 'flank' ? 'flank_attack' : 'rear_attack', {
      squadId,
      targetSquadId,
      bonus,
    });
  }
  
  /**
   * 특수능력 사용 기록
   */
  recordAbilityUsed(
    generalName: string,
    abilityName: string,
    data: Record<string, unknown> = {}
  ): void {
    this.addEvent('ability_used', {
      generalName,
      abilityName,
      ...data,
    });
  }
  
  // ========================================
  // 스냅샷 관리
  // ========================================
  
  /**
   * 현재 상태 스냅샷 기록
   */
  recordSnapshot(): void {
    const snapshot: BattleSnapshot = {
      timestamp: Date.now(),
      phase: 'active',
      elapsedTime: Date.now() - this.startTime,
      attackerSquads: JSON.parse(JSON.stringify(this.currentAttackerSquads)),
      defenderSquads: JSON.parse(JSON.stringify(this.currentDefenderSquads)),
      attackerTotalRemaining: this.calculateTotalTroops(this.currentAttackerSquads),
      defenderTotalRemaining: this.calculateTotalTroops(this.currentDefenderSquads),
      events: [...this.events],
    };
    
    this.snapshotHistory.push(snapshot);
    
    // 히스토리 크기 제한 (최근 100개)
    if (this.snapshotHistory.length > 100) {
      this.snapshotHistory = this.snapshotHistory.slice(-100);
    }
  }
  
  /**
   * 최종 스냅샷 반환
   */
  getFinalSnapshot(): BattleSnapshot {
    return {
      timestamp: Date.now(),
      phase: 'ended',
      elapsedTime: this.endTime - this.startTime,
      attackerSquads: this.currentAttackerSquads,
      defenderSquads: this.currentDefenderSquads,
      attackerTotalRemaining: this.calculateTotalTroops(this.currentAttackerSquads),
      defenderTotalRemaining: this.calculateTotalTroops(this.currentDefenderSquads),
      events: this.events,
    };
  }
  
  // ========================================
  // 종료 조건 확인
  // ========================================
  
  /**
   * 전투 종료 조건 확인
   */
  checkEndConditions(): EndCondition | null {
    const attackerRemaining = this.calculateTotalTroops(this.currentAttackerSquads);
    const defenderRemaining = this.calculateTotalTroops(this.currentDefenderSquads);
    const elapsedTime = Date.now() - this.startTime;
    
    // 1. 전멸 확인
    if (attackerRemaining === 0 && defenderRemaining === 0) {
      return {
        type: 'annihilation',
        winner: 'draw',
        reason: '양측 전멸',
      };
    }
    
    if (attackerRemaining === 0) {
      return {
        type: 'annihilation',
        winner: 'defender',
        reason: '공격측 전멸',
      };
    }
    
    if (defenderRemaining === 0) {
      return {
        type: 'annihilation',
        winner: 'attacker',
        reason: '방어측 전멸',
      };
    }
    
    // 2. 사기 붕괴 확인
    const attackerAvgMorale = this.calculateAverageMorale(this.currentAttackerSquads);
    const defenderAvgMorale = this.calculateAverageMorale(this.currentDefenderSquads);
    
    if (attackerAvgMorale < this.options.moraleCollapseThreshold) {
      return {
        type: 'morale_collapse',
        winner: 'defender',
        reason: '공격측 사기 붕괴',
      };
    }
    
    if (defenderAvgMorale < this.options.moraleCollapseThreshold) {
      return {
        type: 'morale_collapse',
        winner: 'attacker',
        reason: '방어측 사기 붕괴',
      };
    }
    
    // 3. 시간 초과 확인
    if (elapsedTime >= this.options.maxBattleTime) {
      // 남은 병력 비율로 승자 결정
      const attackerRatio = attackerRemaining / this.initialAttackerTotal;
      const defenderRatio = defenderRemaining / this.initialDefenderTotal;
      
      let winner: 'attacker' | 'defender' | 'draw';
      if (Math.abs(attackerRatio - defenderRatio) < 0.1) {
        winner = 'draw';
      } else {
        winner = attackerRatio > defenderRatio ? 'attacker' : 'defender';
      }
      
      return {
        type: 'time_limit',
        winner,
        reason: '시간 초과 - 잔존 병력 비교',
      };
    }
    
    return null;
  }
  
  /**
   * 평균 사기 계산
   */
  private calculateAverageMorale(squads: SquadSnapshot[]): number {
    const activeSquads = squads.filter(s => s.status === 'active');
    if (activeSquads.length === 0) return 0;
    
    const totalMorale = activeSquads.reduce((sum, s) => sum + s.morale, 0);
    return totalMorale / activeSquads.length;
  }
  
  // ========================================
  // 최종 결과 수집
  // ========================================
  
  /**
   * 전투 종료 및 결과 수집
   */
  finalizeBattle(condition: EndCondition): VoxelBattleResult {
    this.endTime = Date.now();
    
    // 종료 이벤트 추가
    this.addEvent('battle_ended', {
      winner: condition.winner,
      reason: condition.reason,
    });
    
    // 부대 결과 변환
    const attackerSquadResults = this.convertToSquadResults(this.currentAttackerSquads);
    const defenderSquadResults = this.convertToSquadResults(this.currentDefenderSquads);
    
    // 최종 결과 생성
    const result: VoxelBattleResult = {
      battleId: this.battleId,
      winner: condition.winner,
      duration: this.endTime - this.startTime,
      attackerRemaining: this.calculateTotalTroops(this.currentAttackerSquads),
      defenderRemaining: this.calculateTotalTroops(this.currentDefenderSquads),
      attackerSquads: attackerSquadResults,
      defenderSquads: defenderSquadResults,
      events: this.events,
      stats: this.stats,
    };
    
    return result;
  }
  
  /**
   * SquadSnapshot → SquadResult 변환
   */
  private convertToSquadResults(squads: SquadSnapshot[]): SquadResult[] {
    return squads.map(squad => ({
      squadId: squad.squadId,
      unitTypeId: squad.unitTypeId,
      survivingUnits: squad.currentCount,
      originalUnits: squad.initialCount,
      kills: squad.kills,
      finalMorale: squad.morale,
      status: squad.status,
    }));
  }
  
  // ========================================
  // 조회 메서드
  // ========================================
  
  /** 현재 이벤트 목록 반환 */
  getEvents(): BattleEvent[] {
    return [...this.events];
  }
  
  /** 최근 이벤트 반환 */
  getRecentEvents(count: number = 10): BattleEvent[] {
    return this.events.slice(-count);
  }
  
  /** 스냅샷 히스토리 반환 */
  getSnapshotHistory(): BattleSnapshot[] {
    return [...this.snapshotHistory];
  }
  
  /** 현재 통계 반환 */
  getStats(): BattleStats {
    return { ...this.stats };
  }
  
  /** 경과 시간 반환 (ms) */
  getElapsedTime(): number {
    if (this.endTime > 0) {
      return this.endTime - this.startTime;
    }
    return Date.now() - this.startTime;
  }
  
  /** 초기 병력 반환 */
  getInitialTroops(): { attacker: number; defender: number } {
    return {
      attacker: this.initialAttackerTotal,
      defender: this.initialDefenderTotal,
    };
  }
  
  /** 현재 병력 반환 */
  getCurrentTroops(): { attacker: number; defender: number } {
    return {
      attacker: this.calculateTotalTroops(this.currentAttackerSquads),
      defender: this.calculateTotalTroops(this.currentDefenderSquads),
    };
  }
  
  /** 전투 ID 반환 */
  getBattleId(): string {
    return this.battleId;
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * ResultCollector 생성 헬퍼
 */
export function createResultCollector(
  battleId: string,
  options?: Partial<CollectorOptions>
): ResultCollector {
  return new ResultCollector(battleId, options);
}




