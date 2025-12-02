/**
 * 로그 생성기 (LogGenerator)
 * 
 * 전투 이벤트를 사람이 읽을 수 있는 로그로 변환하고
 * 하이라이트를 추출합니다.
 * 
 * @module LogGenerator
 */

import type {
  BattleEvent,
  BattleEventType,
  VoxelBattleResult,
  SquadResult,
} from '../types/BattleTypes';

// ========================================
// 타입 정의
// ========================================

/** 전투 로그 항목 */
export interface BattleLogEntry {
  /** 타임스탬프 (ms) */
  timestamp: number;
  /** 포맷된 시간 */
  formattedTime: string;
  /** 이벤트 타입 */
  type: BattleEventType;
  /** 로그 메시지 */
  message: string;
  /** 중요도 (1~5) */
  importance: number;
  /** 진영 */
  side?: 'attacker' | 'defender' | 'neutral';
  /** 아이콘 */
  icon?: string;
  /** 원본 이벤트 데이터 */
  rawData: Record<string, unknown>;
}

/** 전투 하이라이트 */
export interface BattleHighlight {
  /** 하이라이트 타입 */
  type: HighlightType;
  /** 타임스탬프 (ms) */
  timestamp: number;
  /** 제목 */
  title: string;
  /** 상세 설명 */
  description: string;
  /** 관련 유닛 */
  involvedUnits: string[];
  /** 수치 (피해량, 킬 수 등) */
  value?: number;
  /** 중요도 (1~5) */
  importance: number;
}

/** 하이라이트 타입 */
export type HighlightType = 
  | 'massive_kill'       // 대량 처치
  | 'charge_success'     // 돌격 성공
  | 'flank_attack'       // 측면 공격
  | 'rear_attack'        // 후방 공격
  | 'squad_routed'       // 부대 붕괴
  | 'squad_destroyed'    // 부대 전멸
  | 'ability_used'       // 특수능력 사용
  | 'duel_victory'       // 결투 승리
  | 'turning_point'      // 전세 역전
  | 'battle_end';        // 전투 종료

/** 전투 요약 */
export interface BattleSummary {
  /** 승자 */
  winner: 'attacker' | 'defender' | 'draw';
  /** 전투 시간 (초) */
  duration: number;
  /** 총 사상자 */
  totalCasualties: {
    attacker: number;
    defender: number;
  };
  /** 핵심 통계 */
  stats: {
    totalKills: { attacker: number; defender: number };
    chargeCount: { attacker: number; defender: number };
    routCount: { attacker: number; defender: number };
  };
  /** 요약 텍스트 */
  text: string;
  /** 핵심 하이라이트 */
  keyHighlights: BattleHighlight[];
}

/** 로그 필터 옵션 */
export interface LogFilterOptions {
  /** 최소 중요도 */
  minImportance?: number;
  /** 이벤트 타입 필터 */
  types?: BattleEventType[];
  /** 진영 필터 */
  sides?: ('attacker' | 'defender' | 'neutral')[];
  /** 시간 범위 */
  timeRange?: { start: number; end: number };
  /** 최대 개수 */
  limit?: number;
}

// ========================================
// 상수 정의
// ========================================

/** 이벤트 타입별 설정 */
const EVENT_CONFIG: Record<BattleEventType, {
  importance: number;
  icon: string;
  template: string;
}> = {
  battle_started: {
    importance: 5,
    icon: '⚔️',
    template: '전투가 시작되었습니다.',
  },
  unit_killed: {
    importance: 2,
    icon: '💀',
    template: '{squadName}에서 {count}명이 전사했습니다.',
  },
  squad_routed: {
    importance: 4,
    icon: '🏃',
    template: '{squadName}가 붕괴되어 도주합니다!',
  },
  squad_rallied: {
    importance: 3,
    icon: '🔄',
    template: '{squadName}가 재집결했습니다.',
  },
  charge_started: {
    importance: 3,
    icon: '🐎',
    template: '{squadName}가 돌격을 시작합니다!',
  },
  charge_impact: {
    importance: 4,
    icon: '💥',
    template: '돌격이 적에게 {damage} 피해를 입혔습니다.',
  },
  flank_attack: {
    importance: 4,
    icon: '↩️',
    template: '측면 공격! {bonus}% 추가 피해.',
  },
  rear_attack: {
    importance: 4,
    icon: '⬇️',
    template: '후방 공격! {bonus}% 추가 피해.',
  },
  ability_used: {
    importance: 4,
    icon: '✨',
    template: '{generalName}이(가) "{abilityName}"을(를) 사용했습니다.',
  },
  morale_broken: {
    importance: 4,
    icon: '💔',
    template: '{squadName}의 사기가 붕괴되었습니다!',
  },
  battle_ended: {
    importance: 5,
    icon: '🏁',
    template: '전투 종료! {winner} 승리.',
  },
};

/** 하이라이트 생성 임계값 */
const HIGHLIGHT_THRESHOLDS = {
  /** 대량 처치 기준 */
  MASSIVE_KILL: 50,
  /** 돌격 피해 기준 */
  CHARGE_DAMAGE: 100,
  /** 측면/후방 보너스 기준 */
  FLANK_BONUS: 30,
};

// ========================================
// LogGenerator 클래스
// ========================================

/**
 * 전투 로그 생성기
 */
export class LogGenerator {
  private events: BattleEvent[] = [];
  private logs: BattleLogEntry[] = [];
  private highlights: BattleHighlight[] = [];
  
  constructor(events: BattleEvent[] = []) {
    this.events = events;
    if (events.length > 0) {
      this.processEvents();
    }
  }
  
  // ========================================
  // 이벤트 처리
  // ========================================
  
  /**
   * 이벤트 목록 설정 및 처리
   */
  setEvents(events: BattleEvent[]): void {
    this.events = events;
    this.processEvents();
  }
  
  /**
   * 이벤트 추가
   */
  addEvent(event: BattleEvent): void {
    this.events.push(event);
    this.processEvent(event);
  }
  
  /**
   * 모든 이벤트 처리
   */
  private processEvents(): void {
    this.logs = [];
    this.highlights = [];
    
    for (const event of this.events) {
      this.processEvent(event);
    }
  }
  
  /**
   * 단일 이벤트 처리
   */
  private processEvent(event: BattleEvent): void {
    // 로그 항목 생성
    const logEntry = this.createLogEntry(event);
    if (logEntry) {
      this.logs.push(logEntry);
    }
    
    // 하이라이트 체크
    const highlight = this.checkHighlight(event);
    if (highlight) {
      this.highlights.push(highlight);
    }
  }
  
  // ========================================
  // 로그 생성
  // ========================================
  
  /**
   * 이벤트 → 로그 항목 변환
   */
  private createLogEntry(event: BattleEvent): BattleLogEntry | null {
    const config = EVENT_CONFIG[event.type];
    if (!config) return null;
    
    const message = this.formatMessage(config.template, event.data);
    const side = this.determineSide(event);
    
    return {
      timestamp: event.timestamp,
      formattedTime: this.formatTime(event.timestamp),
      type: event.type,
      message,
      importance: config.importance,
      side,
      icon: config.icon,
      rawData: event.data,
    };
  }
  
  /**
   * 템플릿 메시지 포맷
   */
  private formatMessage(template: string, data: Record<string, unknown>): string {
    let message = template;
    
    // {key} 패턴 치환
    const matches = template.match(/\{(\w+)\}/g);
    if (matches) {
      for (const match of matches) {
        const key = match.slice(1, -1);
        const value = data[key];
        if (value !== undefined) {
          message = message.replace(match, String(value));
        }
      }
    }
    
    // 특수 처리
    if (data.winner) {
      const winnerText = data.winner === 'attacker' ? '공격측' :
                         data.winner === 'defender' ? '방어측' : '무승부';
      message = message.replace('{winner}', winnerText);
    }
    
    return message;
  }
  
  /**
   * 진영 결정
   */
  private determineSide(event: BattleEvent): 'attacker' | 'defender' | 'neutral' {
    const data = event.data;
    
    // teamId가 있는 경우
    if (data.teamId) {
      return data.teamId as 'attacker' | 'defender';
    }
    
    // side가 있는 경우
    if (data.side) {
      return data.side as 'attacker' | 'defender';
    }
    
    // 중립 이벤트
    if (['battle_started', 'battle_ended'].includes(event.type)) {
      return 'neutral';
    }
    
    return 'neutral';
  }
  
  /**
   * 시간 포맷 (mm:ss)
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // ========================================
  // 하이라이트 추출
  // ========================================
  
  /**
   * 하이라이트 체크
   */
  private checkHighlight(event: BattleEvent): BattleHighlight | null {
    const data = event.data;
    
    switch (event.type) {
      case 'unit_killed':
        if ((data.count as number) >= HIGHLIGHT_THRESHOLDS.MASSIVE_KILL) {
          return {
            type: 'massive_kill',
            timestamp: event.timestamp,
            title: '대량 처치!',
            description: `${data.squadName || '부대'}에서 ${data.count}명이 한 번에 전사`,
            involvedUnits: [data.squadId as string].filter(Boolean),
            value: data.count as number,
            importance: 4,
          };
        }
        break;
        
      case 'charge_impact':
        if ((data.damage as number) >= HIGHLIGHT_THRESHOLDS.CHARGE_DAMAGE) {
          return {
            type: 'charge_success',
            timestamp: event.timestamp,
            title: '강력한 돌격!',
            description: `돌격으로 ${data.damage} 피해를 입힘`,
            involvedUnits: [data.squadId as string].filter(Boolean),
            value: data.damage as number,
            importance: 4,
          };
        }
        break;
        
      case 'flank_attack':
        if ((data.bonus as number) >= HIGHLIGHT_THRESHOLDS.FLANK_BONUS) {
          return {
            type: 'flank_attack',
            timestamp: event.timestamp,
            title: '측면 기습!',
            description: `측면 공격으로 ${data.bonus}% 추가 피해`,
            involvedUnits: [data.squadId as string, data.targetSquadId as string].filter(Boolean),
            value: data.bonus as number,
            importance: 4,
          };
        }
        break;
        
      case 'rear_attack':
        return {
          type: 'rear_attack',
          timestamp: event.timestamp,
          title: '후방 기습!',
          description: `후방 공격으로 ${data.bonus}% 추가 피해`,
          involvedUnits: [data.squadId as string, data.targetSquadId as string].filter(Boolean),
          value: data.bonus as number,
          importance: 5,
        };
        
      case 'squad_routed':
        if (data.destroyed) {
          return {
            type: 'squad_destroyed',
            timestamp: event.timestamp,
            title: '부대 전멸!',
            description: `${data.squadName || '부대'}가 전멸했습니다`,
            involvedUnits: [data.squadId as string].filter(Boolean),
            importance: 5,
          };
        }
        return {
          type: 'squad_routed',
          timestamp: event.timestamp,
          title: '부대 붕괴!',
          description: `${data.squadName || '부대'}가 도주합니다`,
          involvedUnits: [data.squadId as string].filter(Boolean),
          importance: 4,
        };
        
      case 'ability_used':
        return {
          type: 'ability_used',
          timestamp: event.timestamp,
          title: `${data.generalName}의 특기!`,
          description: `"${data.abilityName}" 발동`,
          involvedUnits: [],
          importance: 4,
        };
        
      case 'battle_ended':
        return {
          type: 'battle_end',
          timestamp: event.timestamp,
          title: '전투 종료',
          description: data.winner === 'attacker' ? '공격측 승리' :
                       data.winner === 'defender' ? '방어측 승리' : '무승부',
          involvedUnits: [],
          importance: 5,
        };
    }
    
    return null;
  }
  
  // ========================================
  // 조회 메서드
  // ========================================
  
  /**
   * 전체 로그 반환
   */
  getLogs(filter?: LogFilterOptions): BattleLogEntry[] {
    let result = [...this.logs];
    
    if (filter) {
      // 중요도 필터
      if (filter.minImportance !== undefined) {
        result = result.filter(log => log.importance >= filter.minImportance!);
      }
      
      // 타입 필터
      if (filter.types && filter.types.length > 0) {
        result = result.filter(log => filter.types!.includes(log.type));
      }
      
      // 진영 필터
      if (filter.sides && filter.sides.length > 0) {
        result = result.filter(log => log.side && filter.sides!.includes(log.side));
      }
      
      // 시간 범위 필터
      if (filter.timeRange) {
        result = result.filter(log => 
          log.timestamp >= filter.timeRange!.start &&
          log.timestamp <= filter.timeRange!.end
        );
      }
      
      // 개수 제한
      if (filter.limit !== undefined) {
        result = result.slice(-filter.limit);
      }
    }
    
    return result;
  }
  
  /**
   * 문자열 로그 배열 반환
   */
  getLogStrings(filter?: LogFilterOptions): string[] {
    return this.getLogs(filter).map(log => 
      `[${log.formattedTime}] ${log.icon || ''} ${log.message}`
    );
  }
  
  /**
   * 하이라이트 반환
   */
  getHighlights(minImportance: number = 3): BattleHighlight[] {
    return this.highlights.filter(h => h.importance >= minImportance);
  }
  
  /**
   * 최근 로그 반환
   */
  getRecentLogs(count: number = 10): BattleLogEntry[] {
    return this.logs.slice(-count);
  }
  
  // ========================================
  // 요약 생성
  // ========================================
  
  /**
   * 전투 요약 생성
   */
  generateSummary(result: VoxelBattleResult): BattleSummary {
    const attackerInitial = result.attackerSquads.reduce(
      (sum, s) => sum + s.originalUnits, 0
    );
    const defenderInitial = result.defenderSquads.reduce(
      (sum, s) => sum + s.originalUnits, 0
    );
    
    const totalCasualties = {
      attacker: attackerInitial - result.attackerRemaining,
      defender: defenderInitial - result.defenderRemaining,
    };
    
    const duration = Math.round(result.duration / 1000);
    const winnerText = result.winner === 'attacker' ? '공격측' :
                       result.winner === 'defender' ? '방어측' : '무승부';
    
    // 요약 텍스트 생성
    const text = this.generateSummaryText(result, totalCasualties, duration);
    
    // 핵심 하이라이트 (상위 5개)
    const keyHighlights = this.highlights
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);
    
    return {
      winner: result.winner,
      duration,
      totalCasualties,
      stats: result.stats,
      text,
      keyHighlights,
    };
  }
  
  /**
   * 요약 텍스트 생성
   */
  private generateSummaryText(
    result: VoxelBattleResult,
    casualties: { attacker: number; defender: number },
    duration: number
  ): string {
    const lines: string[] = [];
    
    // 결과
    const winnerText = result.winner === 'attacker' ? '공격측 승리!' :
                       result.winner === 'defender' ? '방어측 승리!' : '무승부!';
    lines.push(`🏆 ${winnerText}`);
    
    // 전투 시간
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    lines.push(`⏱️ 전투 시간: ${minutes}분 ${seconds}초`);
    
    // 사상자
    lines.push(`⚔️ 공격측 사상자: ${casualties.attacker}명`);
    lines.push(`🛡️ 방어측 사상자: ${casualties.defender}명`);
    
    // 통계
    lines.push(`💀 처치 - 공격: ${result.stats.totalKills.attacker}, 방어: ${result.stats.totalKills.defender}`);
    
    if (result.stats.chargeCount.attacker > 0 || result.stats.chargeCount.defender > 0) {
      lines.push(`🐎 돌격 - 공격: ${result.stats.chargeCount.attacker}회, 방어: ${result.stats.chargeCount.defender}회`);
    }
    
    return lines.join('\n');
  }
  
  // ========================================
  // 압축/직렬화
  // ========================================
  
  /**
   * 로그 압축 (저장용)
   */
  compressLogs(): string {
    const compressed = this.logs.map(log => ({
      t: log.timestamp,
      y: log.type,
      m: log.message,
      i: log.importance,
    }));
    
    return JSON.stringify(compressed);
  }
  
  /**
   * 압축 해제
   */
  static decompressLogs(compressed: string): BattleLogEntry[] {
    try {
      const data = JSON.parse(compressed) as Array<{
        t: number;
        y: BattleEventType;
        m: string;
        i: number;
      }>;
      
      return data.map(item => ({
        timestamp: item.t,
        formattedTime: new LogGenerator([]).formatTime(item.t),
        type: item.y,
        message: item.m,
        importance: item.i,
        rawData: {},
      }));
    } catch {
      return [];
    }
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * 이벤트에서 로그 생성
 */
export function generateBattleLog(events: BattleEvent[]): string[] {
  const generator = new LogGenerator(events);
  return generator.getLogStrings();
}

/**
 * 이벤트에서 하이라이트 추출
 */
export function extractHighlights(events: BattleEvent[]): BattleHighlight[] {
  const generator = new LogGenerator(events);
  return generator.getHighlights();
}

/**
 * 전투 결과 요약 생성
 */
export function generateBattleSummary(result: VoxelBattleResult): BattleSummary {
  const generator = new LogGenerator(result.events);
  return generator.generateSummary(result);
}

/**
 * LogGenerator 생성
 */
export function createLogGenerator(events?: BattleEvent[]): LogGenerator {
  return new LogGenerator(events);
}






