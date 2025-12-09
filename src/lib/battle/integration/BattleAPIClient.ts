/**
 * 전투 API 클라이언트 구현체
 * 
 * 메인 게임과 전투 시스템 간의 통신을 담당합니다.
 */

import { io, Socket } from 'socket.io-client';
import {
  StartBattleRequest,
  StartBattleResponse,
  BattleResultRequest,
  BattleStatus,
  BattleAPIClient,
  BattleCommand,
  BattleUpdate,
  BattleSnapshot,
  BattleEvent,
} from './BattleAPI';

// ============================================
// 설정
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';

// ============================================
// HTTP 클라이언트
// ============================================

/**
 * 인증 토큰 가져오기
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * CSRF 토큰 가져오기
 */
function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * API 요청 헬퍼
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const csrfToken = getCSRFToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '요청 실패' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// ============================================
// 전투 API 클라이언트 구현
// ============================================

/**
 * 전투 API 클라이언트 구현체
 */
class BattleAPIClientImpl implements BattleAPIClient {
  private socket: Socket | null = null;
  private battleId: string | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * 전투 시작
   */
  async startBattle(request: StartBattleRequest): Promise<StartBattleResponse> {
    const response = await apiRequest<{
      success: boolean;
      data: {
        battleId: string;
        battle: any;
        websocketUrl: string;
        estimatedDuration: number;
      };
    }>('/battle/start', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: request.attacker.factionId.split('_')[0], // 세션 ID 추출
        attackerNationId: Number(request.attacker.factionId.split('_')[1]),
        defenderNationId: Number(request.defender.factionId.split('_')[1]),
        attackerGeneralIds: request.attacker.generals.map(g => Number(g.generalId)),
        targetCityId: Number(request.locationId),
        battleType: request.battleType,
        multiStackMode: true,
        environment: request.environment,
      }),
    });

    if (!response.success) {
      throw new Error('전투 시작 실패');
    }

    return {
      battleId: response.data.battleId,
      battleConfig: {
        mapSize: { width: 800, height: 600 },
        terrain: response.data.battle?.terrain,
        environment: request.environment || { 
          weather: 'clear', 
          timeOfDay: 'noon' 
        },
      },
      websocketUrl: response.data.websocketUrl,
      estimatedDuration: response.data.estimatedDuration,
    };
  }

  /**
   * 전투 결과 제출
   */
  async submitResult(request: BattleResultRequest): Promise<void> {
    await apiRequest<{ success: boolean }>(`/battle/${request.battleId}/result`, {
      method: 'POST',
      body: JSON.stringify({
        winner: request.winner,
        duration: request.duration,
        attackerResult: request.attackerResult,
        defenderResult: request.defenderResult,
        rewards: request.rewards,
        replayData: request.replayData,
      }),
    });
  }

  /**
   * 전투 상태 조회
   */
  async getBattleStatus(battleId: string): Promise<BattleStatus> {
    const response = await apiRequest<{
      success: boolean;
      data: {
        battleId: string;
        status: string;
        currentTick?: number;
        winner?: string;
      };
    }>(`/battle/${battleId}/state`);

    return {
      battleId: response.data.battleId,
      status: this.mapStatus(response.data.status),
      currentTime: response.data.currentTick,
      winner: response.data.winner as 'attacker' | 'defender' | 'draw' | undefined,
    };
  }

  /**
   * 상태 매핑
   */
  private mapStatus(status: string): BattleStatus['status'] {
    switch (status) {
      case 'preparing':
      case 'deploying':
        return 'preparing';
      case 'in_progress':
        return 'active';
      case 'completed':
        return 'finished';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'preparing';
    }
  }

  /**
   * WebSocket 연결
   */
  connectWebSocket(battleId: string): WebSocket {
    // Socket.IO 클라이언트 초기화
    const token = getAuthToken();
    
    this.socket = io(WS_URL || window.location.origin, {
      auth: { token },
      query: { battleId },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    this.battleId = battleId;

    // 이벤트 핸들러 설정
    this.setupSocketHandlers();

    // WebSocket-like 래퍼 반환 (호환성용)
    return this.createWebSocketWrapper();
  }

  /**
   * Socket.IO 이벤트 핸들러 설정
   */
  private setupSocketHandlers(): void {
    if (!this.socket) return;

    // 연결 이벤트
    this.socket.on('connect', () => {
      console.log('[BattleAPI] WebSocket 연결됨');
      if (this.battleId) {
        this.socket?.emit('battle:join', {
          battleId: this.battleId,
          generalId: this.getCurrentGeneralId(),
        });
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[BattleAPI] WebSocket 연결 해제:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[BattleAPI] WebSocket 연결 에러:', error);
    });

    // 전투 이벤트
    this.socket.on('battle:joined', (data: any) => {
      this.emit('joined', data);
    });

    this.socket.on('battle:started', (data: any) => {
      this.emit('started', data);
    });

    this.socket.on('battle:state', (data: any) => {
      this.emit('state', this.convertToSnapshot(data));
    });

    this.socket.on('battle:turn_resolved', (data: any) => {
      this.emit('turn_resolved', data);
    });

    this.socket.on('battle:ended', (data: any) => {
      this.emit('ended', data);
    });

    this.socket.on('battle:command_acknowledged', (data: any) => {
      this.emit('command_ack', data);
    });

    this.socket.on('battle:player_joined', (data: any) => {
      this.emit('player_joined', data);
    });

    this.socket.on('battle:player_left', (data: any) => {
      this.emit('player_left', data);
    });

    this.socket.on('battle:player_ready', (data: any) => {
      this.emit('player_ready', data);
    });

    this.socket.on('battle:log', (data: any) => {
      this.emit('log', data);
    });

    this.socket.on('battle:error', (data: any) => {
      this.emit('error', data);
    });

    this.socket.on('battle:surrender', (data: any) => {
      this.emit('surrender', data);
    });

    this.socket.on('battle:cancelled', (data: any) => {
      this.emit('cancelled', data);
    });
  }

  /**
   * 스냅샷 변환
   */
  private convertToSnapshot(data: any): BattleSnapshot {
    return {
      currentTime: data.tick || 0,
      squads: [...(data.attackerUnits || []), ...(data.defenderUnits || [])].map(unit => ({
        id: String(unit.id || unit.generalId),
        teamId: unit.nationId === data.attackerNationId ? 'attacker' : 'defender',
        position: unit.position || { x: 0, y: 0 },
        facing: unit.facing || 0,
        state: unit.status || 'active',
        aliveSoldiers: unit.troops || 0,
        morale: unit.morale || 100,
        formation: unit.formation || 'line',
      })),
      projectiles: data.projectiles || [],
      events: data.events || [],
    };
  }

  /**
   * WebSocket-like 래퍼 생성
   */
  private createWebSocketWrapper(): WebSocket {
    const self = this;
    
    return {
      get readyState() {
        if (!self.socket) return WebSocket.CLOSED;
        return self.socket.connected ? WebSocket.OPEN : WebSocket.CONNECTING;
      },
      send(data: string) {
        const parsed = JSON.parse(data) as BattleCommand;
        self.sendCommand(parsed);
      },
      close() {
        self.disconnect();
      },
      addEventListener(event: string, listener: Function) {
        self.on(event, listener as any);
      },
      removeEventListener(event: string, listener: Function) {
        self.off(event, listener as any);
      },
    } as unknown as WebSocket;
  }

  /**
   * 현재 장수 ID 가져오기
   */
  private getCurrentGeneralId(): number {
    if (typeof window === 'undefined') return 0;
    const generalId = localStorage.getItem('currentGeneralId');
    return generalId ? Number(generalId) : 0;
  }

  // ============================================
  // 추가 메서드
  // ============================================

  /**
   * 전투 명령 전송
   */
  sendCommand(command: BattleCommand): void {
    if (!this.socket || !this.battleId) {
      console.error('[BattleAPI] WebSocket 연결 없음');
      return;
    }

    this.socket.emit('battle:command', {
      battleId: this.battleId,
      generalId: this.getCurrentGeneralId(),
      command: command.type,
      params: command.data,
      unitId: command.squadId,
    });
  }

  /**
   * 유닛 배치
   */
  deployUnit(unitId: string, position: { x: number; y: number }, formation?: string): void {
    if (!this.socket || !this.battleId) return;

    this.socket.emit('battle:deploy', {
      battleId: this.battleId,
      generalId: this.getCurrentGeneralId(),
      unitId,
      position,
      formation,
    });
  }

  /**
   * 준비 완료 신호
   */
  markReady(): void {
    if (!this.socket || !this.battleId) return;

    this.socket.emit('battle:ready', {
      battleId: this.battleId,
      generalId: this.getCurrentGeneralId(),
    });
  }

  /**
   * 항복
   */
  surrender(): void {
    if (!this.socket || !this.battleId) return;

    this.socket.emit('battle:surrender', {
      battleId: this.battleId,
      generalId: this.getCurrentGeneralId(),
    });
  }

  /**
   * 채팅 메시지 전송
   */
  sendChat(message: string, teamOnly: boolean = false): void {
    if (!this.socket || !this.battleId) return;

    this.socket.emit('battle:chat', {
      battleId: this.battleId,
      senderId: this.getCurrentGeneralId(),
      message,
      teamOnly,
    });
  }

  /**
   * 연결 해제
   */
  disconnect(): void {
    if (this.socket) {
      if (this.battleId) {
        this.socket.emit('battle:leave', {
          battleId: this.battleId,
          generalId: this.getCurrentGeneralId(),
        });
      }
      this.socket.disconnect();
      this.socket = null;
      this.battleId = null;
    }
  }

  // ============================================
  // 이벤트 에미터
  // ============================================

  /**
   * 이벤트 리스너 등록
   */
  on(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 이벤트 리스너 해제
   */
  off(event: string, listener: (data: any) => void): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  /**
   * 이벤트 발행
   */
  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`[BattleAPI] 이벤트 핸들러 에러 (${event}):`, error);
      }
    });
  }
}

// ============================================
// 추가 API 함수
// ============================================

/**
 * 전투 목록 조회
 */
export async function fetchBattleList(params: {
  sessionId: string;
  status?: 'active' | 'completed' | 'all';
  nationId?: number;
  limit?: number;
}): Promise<any[]> {
  const query = new URLSearchParams({
    sessionId: params.sessionId,
    ...(params.status && { status: params.status }),
    ...(params.nationId && { nationId: String(params.nationId) }),
    ...(params.limit && { limit: String(params.limit) }),
  });

  const response = await apiRequest<{
    success: boolean;
    data: any[];
  }>(`/battle?${query}`);

  return response.data;
}

/**
 * 전투 상세 조회
 */
export async function fetchBattleDetail(battleId: string): Promise<any> {
  const response = await apiRequest<{
    success: boolean;
    data: any;
  }>(`/battle/${battleId}`);

  return response.data;
}

/**
 * 전투 기록 조회
 */
export async function fetchBattleHistory(params: {
  sessionId: string;
  nationId?: number;
  generalId?: number;
  page?: number;
  limit?: number;
}): Promise<{ battles: any[]; total: number; totalPages: number }> {
  const query = new URLSearchParams({
    ...(params.nationId && { nationId: String(params.nationId) }),
    ...(params.generalId && { generalId: String(params.generalId) }),
    ...(params.page && { page: String(params.page) }),
    ...(params.limit && { limit: String(params.limit) }),
  });

  const response = await apiRequest<{
    success: boolean;
    data: any[];
    meta: { total: number; totalPages: number };
  }>(`/battle/history/${params.sessionId}?${query}`);

  return {
    battles: response.data,
    total: response.meta.total,
    totalPages: response.meta.totalPages,
  };
}

/**
 * 리플레이 데이터 조회
 */
export async function fetchBattleReplay(battleId: string): Promise<any> {
  const response = await apiRequest<{
    success: boolean;
    data: any;
  }>(`/battle/${battleId}/replay`);

  return response.data;
}

// ============================================
// 싱글톤 인스턴스
// ============================================

let battleAPIClientInstance: BattleAPIClientImpl | null = null;

/**
 * 전투 API 클라이언트 싱글톤 획득
 */
export function getBattleAPIClient(): BattleAPIClientImpl {
  if (!battleAPIClientInstance) {
    battleAPIClientInstance = new BattleAPIClientImpl();
  }
  return battleAPIClientInstance;
}

/**
 * 전투 API 클라이언트 초기화 (테스트용)
 */
export function resetBattleAPIClient(): void {
  if (battleAPIClientInstance) {
    battleAPIClientInstance.disconnect();
    battleAPIClientInstance = null;
  }
}

// 기본 export
export default BattleAPIClientImpl;





