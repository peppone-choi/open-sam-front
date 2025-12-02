/**
 * 리플레이 관리자 (ReplayManager)
 * 
 * 전투 리플레이 데이터를 저장, 로드, 재생합니다.
 * 
 * @module ReplayManager
 */

import type {
  VoxelBattleResult,
  VoxelBattleInit,
  BattleEvent,
} from '../types/BattleTypes';
import type { BattleSnapshot } from './ResultCollector';

// ========================================
// 상수 정의
// ========================================

/** 리플레이 설정 */
const REPLAY_CONFIG = {
  /** 현재 버전 */
  VERSION: '1.0.0',
  /** LocalStorage 키 접두사 */
  STORAGE_PREFIX: 'voxel_replay_',
  /** 최대 저장 개수 */
  MAX_STORED_REPLAYS: 10,
  /** 최대 데이터 크기 (bytes) */
  MAX_DATA_SIZE: 5 * 1024 * 1024, // 5MB
  /** 기본 재생 속도 */
  DEFAULT_PLAYBACK_SPEED: 1,
} as const;

// ========================================
// 타입 정의
// ========================================

/** 리플레이 데이터 */
export interface ReplayData {
  /** 리플레이 ID */
  replayId: string;
  /** 버전 */
  version: string;
  /** 생성 시간 */
  createdAt: number;
  /** 전투 ID */
  battleId: string;
  /** 초기 상태 */
  initialState: VoxelBattleInit;
  /** 타임스탬프가 있는 이벤트 목록 */
  events: TimestampedEvent[];
  /** 스냅샷 (선택적) */
  snapshots?: CompressedSnapshot[];
  /** 최종 결과 */
  finalResult: VoxelBattleResult;
  /** 메타데이터 */
  metadata: ReplayMetadata;
}

/** 타임스탬프 이벤트 */
export interface TimestampedEvent extends BattleEvent {
  /** 프레임 번호 */
  frame?: number;
}

/** 압축된 스냅샷 */
export interface CompressedSnapshot {
  /** 타임스탬프 */
  timestamp: number;
  /** 압축된 상태 데이터 */
  data: string;
}

/** 리플레이 메타데이터 */
export interface ReplayMetadata {
  /** 전투 시간 (ms) */
  duration: number;
  /** 승자 */
  winner: 'attacker' | 'defender' | 'draw';
  /** 총 이벤트 수 */
  eventCount: number;
  /** 공격측 이름 */
  attackerName?: string;
  /** 방어측 이름 */
  defenderName?: string;
  /** 압축 여부 */
  isCompressed: boolean;
  /** 데이터 크기 (bytes) */
  dataSize: number;
}

/** 리플레이 정보 (목록용) */
export interface ReplayInfo {
  replayId: string;
  battleId: string;
  createdAt: number;
  duration: number;
  winner: 'attacker' | 'defender' | 'draw';
  attackerName?: string;
  defenderName?: string;
}

/** 재생 상태 */
export interface PlaybackState {
  /** 현재 재생 중 */
  isPlaying: boolean;
  /** 현재 시간 (ms) */
  currentTime: number;
  /** 총 시간 (ms) */
  totalDuration: number;
  /** 재생 속도 */
  speed: number;
  /** 현재 이벤트 인덱스 */
  currentEventIndex: number;
  /** 총 이벤트 수 */
  totalEvents: number;
}

/** 재생 이벤트 콜백 */
export type PlaybackEventHandler = (
  event: TimestampedEvent,
  state: PlaybackState
) => void;

/** 재생 옵션 */
export interface PlaybackOptions {
  /** 시작 시간 (ms) */
  startTime?: number;
  /** 재생 속도 (0.5~4) */
  speed?: number;
  /** 이벤트 콜백 */
  onEvent?: PlaybackEventHandler;
  /** 완료 콜백 */
  onComplete?: (result: VoxelBattleResult) => void;
  /** 일시정지 콜백 */
  onPause?: () => void;
}

// ========================================
// ReplayManager 클래스
// ========================================

/**
 * 리플레이 관리자
 */
export class ReplayManager {
  private currentReplay: ReplayData | null = null;
  private playbackState: PlaybackState | null = null;
  private playbackTimer: ReturnType<typeof setTimeout> | null = null;
  private eventHandlers: PlaybackEventHandler[] = [];
  private onCompleteHandler?: (result: VoxelBattleResult) => void;
  
  constructor() {}
  
  // ========================================
  // 저장
  // ========================================
  
  /**
   * 리플레이 데이터 생성
   */
  createReplayData(
    initialState: VoxelBattleInit,
    events: BattleEvent[],
    finalResult: VoxelBattleResult,
    snapshots?: BattleSnapshot[]
  ): ReplayData {
    const replayId = this.generateReplayId();
    
    // 이벤트에 프레임 번호 추가
    const timestampedEvents: TimestampedEvent[] = events.map((event, index) => ({
      ...event,
      frame: index,
    }));
    
    // 스냅샷 압축 (선택적)
    const compressedSnapshots = snapshots?.map(snapshot => ({
      timestamp: snapshot.timestamp,
      data: this.compressSnapshot(snapshot),
    }));
    
    const metadata: ReplayMetadata = {
      duration: finalResult.duration,
      winner: finalResult.winner,
      eventCount: events.length,
      attackerName: initialState.attacker.factionName,
      defenderName: initialState.defender.factionName,
      isCompressed: false,
      dataSize: 0,
    };
    
    const replayData: ReplayData = {
      replayId,
      version: REPLAY_CONFIG.VERSION,
      createdAt: Date.now(),
      battleId: finalResult.battleId,
      initialState,
      events: timestampedEvents,
      snapshots: compressedSnapshots,
      finalResult,
      metadata,
    };
    
    // 데이터 크기 계산
    metadata.dataSize = JSON.stringify(replayData).length;
    
    return replayData;
  }
  
  /**
   * 로컬 저장소에 저장
   */
  saveToLocalStorage(replay: ReplayData): { success: boolean; error?: string } {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { success: false, error: '로컬 저장소를 사용할 수 없습니다' };
      }
      
      const key = `${REPLAY_CONFIG.STORAGE_PREFIX}${replay.replayId}`;
      const data = JSON.stringify(replay);
      
      // 크기 체크
      if (data.length > REPLAY_CONFIG.MAX_DATA_SIZE) {
        return { success: false, error: '데이터 크기가 너무 큽니다' };
      }
      
      // 기존 리플레이 정리
      this.cleanupOldReplays();
      
      localStorage.setItem(key, data);
      
      // 목록 업데이트
      this.updateReplayIndex(replay);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
  
  /**
   * 서버에 저장
   */
  async saveToServer(
    replay: ReplayData,
    apiUrl: string = '/api/replay'
  ): Promise<{ success: boolean; replayId?: string; error?: string }> {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(replay),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      return { success: true, replayId: result.replayId };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
  
  // ========================================
  // 로드
  // ========================================
  
  /**
   * 로컬 저장소에서 로드
   */
  loadFromLocalStorage(replayId: string): ReplayData | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      
      const key = `${REPLAY_CONFIG.STORAGE_PREFIX}${replayId}`;
      const data = localStorage.getItem(key);
      
      if (!data) return null;
      
      return JSON.parse(data) as ReplayData;
    } catch {
      return null;
    }
  }
  
  /**
   * 서버에서 로드
   */
  async loadFromServer(
    replayId: string,
    apiUrl: string = '/api/replay'
  ): Promise<ReplayData | null> {
    try {
      const response = await fetch(`${apiUrl}/${replayId}`);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json() as ReplayData;
    } catch {
      return null;
    }
  }
  
  /**
   * 저장된 리플레이 목록 조회
   */
  getReplayList(): ReplayInfo[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return [];
      }
      
      const indexKey = `${REPLAY_CONFIG.STORAGE_PREFIX}index`;
      const indexData = localStorage.getItem(indexKey);
      
      if (!indexData) return [];
      
      return JSON.parse(indexData) as ReplayInfo[];
    } catch {
      return [];
    }
  }
  
  /**
   * 리플레이 삭제
   */
  deleteReplay(replayId: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      const key = `${REPLAY_CONFIG.STORAGE_PREFIX}${replayId}`;
      localStorage.removeItem(key);
      
      // 목록에서 제거
      const list = this.getReplayList().filter(r => r.replayId !== replayId);
      localStorage.setItem(
        `${REPLAY_CONFIG.STORAGE_PREFIX}index`,
        JSON.stringify(list)
      );
      
      return true;
    } catch {
      return false;
    }
  }
  
  // ========================================
  // 재생
  // ========================================
  
  /**
   * 리플레이 시작
   */
  startPlayback(replay: ReplayData, options?: PlaybackOptions): void {
    this.currentReplay = replay;
    
    // 이벤트 핸들러 등록
    if (options?.onEvent) {
      this.eventHandlers = [options.onEvent];
    }
    this.onCompleteHandler = options?.onComplete;
    
    // 재생 상태 초기화
    this.playbackState = {
      isPlaying: true,
      currentTime: options?.startTime ?? 0,
      totalDuration: replay.metadata.duration,
      speed: options?.speed ?? REPLAY_CONFIG.DEFAULT_PLAYBACK_SPEED,
      currentEventIndex: 0,
      totalEvents: replay.events.length,
    };
    
    // 시작 위치 찾기
    if (options?.startTime && options.startTime > 0) {
      this.seekTo(options.startTime);
    }
    
    // 재생 시작
    this.scheduleNextEvent();
  }
  
  /**
   * 재생 일시정지
   */
  pause(): void {
    if (this.playbackState) {
      this.playbackState.isPlaying = false;
    }
    
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
  }
  
  /**
   * 재생 재개
   */
  resume(): void {
    if (this.playbackState && !this.playbackState.isPlaying) {
      this.playbackState.isPlaying = true;
      this.scheduleNextEvent();
    }
  }
  
  /**
   * 재생 중지
   */
  stop(): void {
    this.pause();
    this.currentReplay = null;
    this.playbackState = null;
    this.eventHandlers = [];
    this.onCompleteHandler = undefined;
  }
  
  /**
   * 특정 시간으로 이동
   */
  seekTo(timeMs: number): void {
    if (!this.playbackState || !this.currentReplay) return;
    
    this.playbackState.currentTime = Math.max(0, Math.min(timeMs, this.playbackState.totalDuration));
    
    // 해당 시간의 이벤트 인덱스 찾기
    const events = this.currentReplay.events;
    let index = 0;
    for (let i = 0; i < events.length; i++) {
      if (events[i].timestamp > this.playbackState.currentTime) {
        break;
      }
      index = i;
    }
    
    this.playbackState.currentEventIndex = index;
    
    // 재생 중이면 다음 이벤트 스케줄링
    if (this.playbackState.isPlaying) {
      if (this.playbackTimer) {
        clearTimeout(this.playbackTimer);
      }
      this.scheduleNextEvent();
    }
  }
  
  /**
   * 재생 속도 설정
   */
  setSpeed(speed: number): void {
    if (this.playbackState) {
      this.playbackState.speed = Math.max(0.5, Math.min(4, speed));
    }
  }
  
  /**
   * 다음 이벤트 스케줄링
   */
  private scheduleNextEvent(): void {
    if (!this.playbackState || !this.currentReplay || !this.playbackState.isPlaying) {
      return;
    }
    
    const { currentEventIndex, totalEvents, currentTime, speed } = this.playbackState;
    
    // 모든 이벤트 재생 완료
    if (currentEventIndex >= totalEvents) {
      this.playbackState.isPlaying = false;
      if (this.onCompleteHandler) {
        this.onCompleteHandler(this.currentReplay.finalResult);
      }
      return;
    }
    
    const event = this.currentReplay.events[currentEventIndex];
    const delay = Math.max(0, (event.timestamp - currentTime) / speed);
    
    this.playbackTimer = setTimeout(() => {
      if (!this.playbackState || !this.currentReplay) return;
      
      // 이벤트 발생
      for (const handler of this.eventHandlers) {
        handler(event, this.playbackState);
      }
      
      // 상태 업데이트
      this.playbackState.currentEventIndex++;
      this.playbackState.currentTime = event.timestamp;
      
      // 다음 이벤트 스케줄링
      this.scheduleNextEvent();
    }, delay);
  }
  
  // ========================================
  // 상태 조회
  // ========================================
  
  /**
   * 현재 재생 상태 반환
   */
  getPlaybackState(): PlaybackState | null {
    return this.playbackState ? { ...this.playbackState } : null;
  }
  
  /**
   * 현재 리플레이 반환
   */
  getCurrentReplay(): ReplayData | null {
    return this.currentReplay;
  }
  
  /**
   * 재생 중인지 확인
   */
  isPlaying(): boolean {
    return this.playbackState?.isPlaying ?? false;
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 리플레이 ID 생성
   */
  private generateReplayId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `replay_${timestamp}_${random}`;
  }
  
  /**
   * 스냅샷 압축
   */
  private compressSnapshot(snapshot: BattleSnapshot): string {
    // 간단한 JSON 압축 (실제로는 더 효율적인 압축 사용 가능)
    return JSON.stringify({
      t: snapshot.timestamp,
      et: snapshot.elapsedTime,
      a: snapshot.attackerTotalRemaining,
      d: snapshot.defenderTotalRemaining,
      // 부대 정보는 간략화
      as: snapshot.attackerSquads.map(s => ({
        id: s.squadId,
        c: s.currentCount,
        m: s.morale,
      })),
      ds: snapshot.defenderSquads.map(s => ({
        id: s.squadId,
        c: s.currentCount,
        m: s.morale,
      })),
    });
  }
  
  /**
   * 스냅샷 압축 해제
   */
  private decompressSnapshot(data: string): Partial<BattleSnapshot> {
    try {
      const parsed = JSON.parse(data);
      return {
        timestamp: parsed.t,
        elapsedTime: parsed.et,
        attackerTotalRemaining: parsed.a,
        defenderTotalRemaining: parsed.d,
      };
    } catch {
      return {};
    }
  }
  
  /**
   * 오래된 리플레이 정리
   */
  private cleanupOldReplays(): void {
    const list = this.getReplayList();
    
    if (list.length >= REPLAY_CONFIG.MAX_STORED_REPLAYS) {
      // 오래된 순서로 정렬
      const sorted = [...list].sort((a, b) => a.createdAt - b.createdAt);
      
      // 초과분 삭제
      const toDelete = sorted.slice(0, list.length - REPLAY_CONFIG.MAX_STORED_REPLAYS + 1);
      for (const replay of toDelete) {
        this.deleteReplay(replay.replayId);
      }
    }
  }
  
  /**
   * 리플레이 인덱스 업데이트
   */
  private updateReplayIndex(replay: ReplayData): void {
    const list = this.getReplayList();
    
    // 기존 항목 제거
    const filtered = list.filter(r => r.replayId !== replay.replayId);
    
    // 새 항목 추가
    filtered.push({
      replayId: replay.replayId,
      battleId: replay.battleId,
      createdAt: replay.createdAt,
      duration: replay.metadata.duration,
      winner: replay.metadata.winner,
      attackerName: replay.metadata.attackerName,
      defenderName: replay.metadata.defenderName,
    });
    
    // 저장
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(
        `${REPLAY_CONFIG.STORAGE_PREFIX}index`,
        JSON.stringify(filtered)
      );
    }
  }
}

// ========================================
// 팩토리 함수 및 싱글톤
// ========================================

let defaultManager: ReplayManager | null = null;

/**
 * 기본 ReplayManager 인스턴스 반환
 */
export function getReplayManager(): ReplayManager {
  if (!defaultManager) {
    defaultManager = new ReplayManager();
  }
  return defaultManager;
}

/**
 * 새 ReplayManager 생성
 */
export function createReplayManager(): ReplayManager {
  return new ReplayManager();
}

/**
 * 리플레이 저장 (간편 함수)
 */
export function saveReplay(
  initialState: VoxelBattleInit,
  events: BattleEvent[],
  finalResult: VoxelBattleResult,
  snapshots?: BattleSnapshot[]
): { success: boolean; replayId?: string; error?: string } {
  const manager = getReplayManager();
  const replayData = manager.createReplayData(initialState, events, finalResult, snapshots);
  const result = manager.saveToLocalStorage(replayData);
  
  return {
    ...result,
    replayId: result.success ? replayData.replayId : undefined,
  };
}

/**
 * 리플레이 로드 (간편 함수)
 */
export function loadReplay(replayId: string): ReplayData | null {
  const manager = getReplayManager();
  return manager.loadFromLocalStorage(replayId);
}






