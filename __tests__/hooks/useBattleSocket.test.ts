/**
 * useBattleSocket 훅 테스트
 * 실시간 전투 전용 Socket.IO 훅 테스트
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useBattleSocket, BattleState, BattleCommand } from '@/hooks/useBattleSocket';

// 이벤트 핸들러 저장소
const battleEventHandlers: Record<string, ((...args: any[]) => void)[]> = {};

// 모킹된 onBattleEvent 구현
const mockOnBattleEvent = jest.fn((event: string, callback: (...args: any[]) => void) => {
  if (!battleEventHandlers[event]) {
    battleEventHandlers[event] = [];
  }
  battleEventHandlers[event].push(callback);
  return () => {
    battleEventHandlers[event] = battleEventHandlers[event].filter(h => h !== callback);
  };
});

// 이벤트 발생 시뮬레이션 헬퍼
const emitBattleEvent = (event: string, data: any) => {
  if (battleEventHandlers[event]) {
    battleEventHandlers[event].forEach(handler => handler(data));
  }
};

// 모킹된 socket
const mockSocket = {
  id: 'test-socket-id',
  connected: true,
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

// useSocket 모킹
jest.mock('@/hooks/useSocket', () => ({
  useSocket: jest.fn(() => ({
    socket: mockSocket,
    isConnected: true,
    onBattleEvent: mockOnBattleEvent,
  })),
}));

describe('useBattleSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // 이벤트 핸들러 초기화
    Object.keys(battleEventHandlers).forEach(key => {
      battleEventHandlers[key] = [];
    });
    
    mockSocket.emit.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================================
  // 초기 상태 테스트
  // ============================================================================

  describe('초기 상태', () => {
    it('초기 상태가 올바르게 설정되어야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isJoined).toBe(false);
      expect(result.current.battleState).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.logs).toEqual([]);
    });

    it('소켓이 있어야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      expect(result.current.socket).toBeDefined();
    });
  });

  // ============================================================================
  // 전투 참가 테스트
  // ============================================================================

  describe('전투 참가', () => {
    it('joinBattle이 소켓 이벤트를 emit해야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      act(() => {
        result.current.joinBattle();
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('battle:join', {
        battleId: 'test-battle',
        generalId: 1,
      });
    });

    it('generalId가 없으면 joinBattle이 호출되지 않아야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle' })
      );
      
      act(() => {
        result.current.joinBattle();
      });
      
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('자동 참가가 500ms 후에 발생해야 함', async () => {
      renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      // 타이머 진행
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('battle:join', {
        battleId: 'test-battle',
        generalId: 1,
      });
    });
  });

  // ============================================================================
  // 전투 이벤트 처리 테스트
  // ============================================================================

  describe('전투 이벤트 처리', () => {
    it('joined 이벤트 수신 시 상태가 업데이트되어야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      const mockBattleState: BattleState = {
        battleId: 'test-battle',
        currentTurn: 1,
        attackerUnits: [],
        defenderUnits: [],
        map: { width: 100, height: 100 },
      };
      
      act(() => {
        emitBattleEvent('joined', mockBattleState);
      });
      
      expect(result.current.isJoined).toBe(true);
      expect(result.current.battleState).toEqual(mockBattleState);
    });

    it('state 이벤트 수신 시 battleState가 업데이트되어야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      const mockState: BattleState = {
        battleId: 'test-battle',
        currentTurn: 5,
        attackerUnits: [{ 
          generalId: 1, 
          generalName: '유비', 
          position: { x: 10, y: 20 },
          troops: 100,
          maxTroops: 100,
          morale: 100,
          unitType: 'infantry',
          collisionRadius: 5,
          attackRange: 10,
        }],
        defenderUnits: [],
        map: { width: 100, height: 100 },
      };
      
      act(() => {
        emitBattleEvent('state', mockState);
      });
      
      // requestAnimationFrame 시뮬레이션
      act(() => {
        jest.runAllTimers();
      });
      
      expect(result.current.battleState).toEqual(mockState);
    });

    it('ended 이벤트 수신 시 isJoined가 false가 되어야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      // 먼저 참가
      act(() => {
        emitBattleEvent('joined', { battleId: 'test-battle' });
      });
      
      expect(result.current.isJoined).toBe(true);
      
      // 전투 종료
      act(() => {
        emitBattleEvent('ended', { winner: 'attacker' });
      });
      
      expect(result.current.isJoined).toBe(false);
    });

    it('error 이벤트 수신 시 에러가 설정되어야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      act(() => {
        emitBattleEvent('error', { message: 'Connection failed' });
      });
      
      expect(result.current.error).toBe('Connection failed');
    });

    it('command_acknowledged 이벤트 수신 시 로그가 추가되어야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      act(() => {
        emitBattleEvent('command_acknowledged', { command: 'move' });
      });
      
      expect(result.current.logs).toContain('명령 확인: move');
    });
  });

  // ============================================================================
  // 명령 전송 테스트
  // ============================================================================

  describe('명령 전송', () => {
    it('sendCommand가 소켓 이벤트를 emit해야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      // 먼저 참가
      act(() => {
        emitBattleEvent('joined', { battleId: 'test-battle' });
      });
      
      const command: BattleCommand = {
        generalId: 1,
        command: 'move',
        targetPosition: { x: 50, y: 50 },
      };
      
      act(() => {
        result.current.sendCommand(command);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('battle:command', {
        battleId: 'test-battle',
        ...command,
      });
    });

    it('isJoined가 false일 때 sendCommand가 작동하지 않아야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      const command: BattleCommand = {
        generalId: 1,
        command: 'move',
        targetPosition: { x: 50, y: 50 },
      };
      
      act(() => {
        result.current.sendCommand(command);
      });
      
      // joinBattle emit만 있고 command emit은 없어야 함
      const commandCalls = mockSocket.emit.mock.calls.filter(
        call => call[0] === 'battle:command'
      );
      expect(commandCalls.length).toBe(0);
    });

    it('moveUnit이 올바른 명령을 전송해야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      act(() => {
        emitBattleEvent('joined', { battleId: 'test-battle' });
      });
      
      act(() => {
        result.current.moveUnit(1, { x: 100, y: 200 });
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('battle:command', {
        battleId: 'test-battle',
        generalId: 1,
        command: 'move',
        targetPosition: { x: 100, y: 200 },
      });
    });

    it('attackUnit이 올바른 명령을 전송해야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      act(() => {
        emitBattleEvent('joined', { battleId: 'test-battle' });
      });
      
      act(() => {
        result.current.attackUnit(1, 2);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('battle:command', {
        battleId: 'test-battle',
        generalId: 1,
        command: 'attack',
        targetGeneralId: 2,
      });
    });

    it('holdPosition이 올바른 명령을 전송해야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      act(() => {
        emitBattleEvent('joined', { battleId: 'test-battle' });
      });
      
      act(() => {
        result.current.holdPosition(1);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('battle:command', {
        battleId: 'test-battle',
        generalId: 1,
        command: 'hold',
      });
    });

    it('retreat이 올바른 명령을 전송해야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      act(() => {
        emitBattleEvent('joined', { battleId: 'test-battle' });
      });
      
      act(() => {
        result.current.retreat(1);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('battle:command', {
        battleId: 'test-battle',
        generalId: 1,
        command: 'retreat',
      });
    });

    it('fireVolley가 올바른 명령을 전송해야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      act(() => {
        emitBattleEvent('joined', { battleId: 'test-battle' });
      });
      
      act(() => {
        result.current.fireVolley(1, 2);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('battle:command', {
        battleId: 'test-battle',
        generalId: 1,
        command: 'volley',
        targetGeneralId: 2,
      });
    });
  });

  // ============================================================================
  // 전투 나가기 테스트
  // ============================================================================

  describe('전투 나가기', () => {
    it('leaveBattle이 소켓 이벤트를 emit해야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      act(() => {
        result.current.leaveBattle();
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('battle:leave', {
        battleId: 'test-battle',
        generalId: 1,
      });
    });

    it('leaveBattle 후 isJoined가 false가 되어야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      // 먼저 참가
      act(() => {
        emitBattleEvent('joined', { battleId: 'test-battle' });
      });
      
      expect(result.current.isJoined).toBe(true);
      
      // 나가기
      act(() => {
        result.current.leaveBattle();
      });
      
      expect(result.current.isJoined).toBe(false);
    });
  });

  // ============================================================================
  // 로그 관리 테스트
  // ============================================================================

  describe('로그 관리', () => {
    it('로그가 60개를 초과하면 오래된 것이 제거되어야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      // 65개의 로그 추가
      for (let i = 0; i < 65; i++) {
        act(() => {
          emitBattleEvent('command_acknowledged', { command: `cmd-${i}` });
        });
      }
      
      // 최대 60개만 유지되어야 함
      expect(result.current.logs.length).toBeLessThanOrEqual(60);
    });

    it('플레이어 참가 이벤트가 로그에 추가되어야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      act(() => {
        emitBattleEvent('player_joined', {});
      });
      
      expect(result.current.logs).toContain('새 장수가 전투에 참가했습니다.');
    });

    it('플레이어 퇴장 이벤트가 로그에 추가되어야 함', () => {
      const { result } = renderHook(() => 
        useBattleSocket({ battleId: 'test-battle', generalId: 1 })
      );
      
      act(() => {
        emitBattleEvent('player_left', {});
      });
      
      expect(result.current.logs).toContain('장수가 전투에서 퇴장했습니다.');
    });
  });
});


