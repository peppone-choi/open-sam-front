/**
 * useSocket 훅 테스트
 * Socket.IO 클라이언트 훅 테스트
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSocket } from '@/hooks/useSocket';

// Socket.IO 모킹
const mockSocket = {
  id: 'test-socket-id',
  connected: false,
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

// 이벤트 핸들러 저장소
const eventHandlers: Record<string, ((...args: any[]) => void)[]> = {};

// mockSocket.on 구현
mockSocket.on.mockImplementation((event: string, handler: (...args: any[]) => void) => {
  if (!eventHandlers[event]) {
    eventHandlers[event] = [];
  }
  eventHandlers[event].push(handler);
  return mockSocket;
});

// mockSocket.off 구현
mockSocket.off.mockImplementation((event: string, handler?: (...args: any[]) => void) => {
  if (handler && eventHandlers[event]) {
    eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
  } else if (eventHandlers[event]) {
    eventHandlers[event] = [];
  }
  return mockSocket;
});

// 이벤트 발생 시뮬레이션 헬퍼
const emitEvent = (event: string, ...args: any[]) => {
  if (eventHandlers[event]) {
    eventHandlers[event].forEach(handler => handler(...args));
  }
};

// socket.io-client 모킹
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

describe('useSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.connected = false;
    // 이벤트 핸들러 초기화
    Object.keys(eventHandlers).forEach(key => {
      eventHandlers[key] = [];
    });
    
    // window mock 초기화
    if (typeof window !== 'undefined') {
      delete (window as any).__OPEN_SAM_SOCKET_MOCK__;
      delete (window as any).__OPEN_SAM_LAST_SOCKET__;
    }
  });

  // ============================================================================
  // 기본 동작 테스트
  // ============================================================================

  describe('기본 동작', () => {
    it('토큰 없이 autoConnect가 true일 때 연결하지 않아야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      expect(result.current.socket).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });

    it('autoConnect가 false일 때 연결하지 않아야 함', () => {
      const { result } = renderHook(() => useSocket({ 
        token: 'test-token', 
        autoConnect: false 
      }));
      
      expect(result.current.socket).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });
  });

  // ============================================================================
  // 목 소켓 테스트
  // ============================================================================

  describe('목 소켓 팩토리', () => {
    beforeEach(() => {
      // 목 소켓 팩토리 설정
      (window as any).__OPEN_SAM_SOCKET_MOCK__ = jest.fn(() => ({
        ...mockSocket,
        connected: true,
        disconnect: jest.fn(),
      }));
    });

    it('목 소켓 팩토리가 있으면 목 소켓을 사용해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      expect(result.current.socket).not.toBeNull();
      expect(result.current.isConnected).toBe(true);
      expect((window as any).__OPEN_SAM_SOCKET_MOCK__).toHaveBeenCalled();
    });

    it('목 소켓 팩토리에 올바른 옵션이 전달되어야 함', () => {
      renderHook(() => useSocket({ 
        token: 'my-token', 
        sessionId: 'my-session',
        autoConnect: true 
      }));
      
      expect((window as any).__OPEN_SAM_SOCKET_MOCK__).toHaveBeenCalledWith({
        sessionId: 'my-session',
        token: 'my-token',
      });
    });
  });

  // ============================================================================
  // 이벤트 구독 테스트
  // ============================================================================

  describe('이벤트 구독', () => {
    beforeEach(() => {
      (window as any).__OPEN_SAM_SOCKET_MOCK__ = jest.fn(() => ({
        ...mockSocket,
        connected: true,
        on: mockSocket.on,
        off: mockSocket.off,
        disconnect: jest.fn(),
      }));
    });

    it('onGameEvent가 game: 접두사로 이벤트를 구독해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      act(() => {
        result.current.onGameEvent('update', callback);
      });
      
      // game:update 이벤트 발생
      act(() => {
        emitEvent('game:update', { data: 'test' });
      });
      
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('onBattleEvent가 battle: 접두사로 이벤트를 구독해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      act(() => {
        result.current.onBattleEvent('state', callback);
      });
      
      act(() => {
        emitEvent('battle:state', { battleId: 'test' });
      });
      
      expect(callback).toHaveBeenCalledWith({ battleId: 'test' });
    });

    it('onGeneralEvent가 general: 접두사로 이벤트를 구독해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      act(() => {
        result.current.onGeneralEvent('update', callback);
      });
      
      act(() => {
        emitEvent('general:update', { generalId: 1 });
      });
      
      expect(callback).toHaveBeenCalledWith({ generalId: 1 });
    });

    it('onNationEvent가 nation: 접두사로 이벤트를 구독해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      act(() => {
        result.current.onNationEvent('diplomacy', callback);
      });
      
      act(() => {
        emitEvent('nation:diplomacy', { nationId: 1 });
      });
      
      expect(callback).toHaveBeenCalledWith({ nationId: 1 });
    });

    it('구독 해제 함수가 올바르게 작동해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      let unsubscribe: () => void;
      
      act(() => {
        unsubscribe = result.current.onGameEvent('update', callback);
      });
      
      // 구독 해제
      act(() => {
        unsubscribe();
      });
      
      // 이벤트 발생해도 콜백이 호출되지 않아야 함
      act(() => {
        emitEvent('game:update', { data: 'test' });
      });
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 통신 이벤트 테스트
  // ============================================================================

  describe('통신 이벤트', () => {
    beforeEach(() => {
      (window as any).__OPEN_SAM_SOCKET_MOCK__ = jest.fn(() => ({
        ...mockSocket,
        connected: true,
        on: mockSocket.on,
        off: mockSocket.off,
        disconnect: jest.fn(),
      }));
    });

    it('onCommEvent가 comm: 접두사로 이벤트를 구독해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      act(() => {
        result.current.onCommEvent('message', callback);
      });
      
      act(() => {
        emitEvent('comm:message', { from: 'user1', text: 'hello' });
      });
      
      expect(callback).toHaveBeenCalledWith({ from: 'user1', text: 'hello' });
    });

    it('onTurnComplete가 턴 완료 이벤트를 구독해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      act(() => {
        result.current.onTurnComplete(callback);
      });
      
      const turnData = { turnNumber: 10, nextTurnAt: new Date() };
      act(() => {
        emitEvent('game:turn:complete', turnData);
      });
      
      expect(callback).toHaveBeenCalledWith(turnData);
    });

    it('onLogUpdate가 로그 업데이트 이벤트를 구독해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      act(() => {
        result.current.onLogUpdate(callback);
      });
      
      const logData = {
        sessionId: 'session1',
        generalId: 1,
        logType: 'action' as const,
        logId: 100,
        logText: 'Test log',
        timestamp: new Date(),
      };
      
      act(() => {
        emitEvent('log:updated', logData);
      });
      
      expect(callback).toHaveBeenCalledWith(logData);
    });

    it('onNewChatMessage가 새 채팅 메시지 이벤트를 구독해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      act(() => {
        result.current.onNewChatMessage(callback);
      });
      
      const chatData = {
        messageId: 'msg1',
        channelType: 'global',
        senderName: 'User1',
        message: 'Hello world',
      };
      
      act(() => {
        emitEvent('comm:chat:new', chatData);
      });
      
      expect(callback).toHaveBeenCalledWith(chatData);
    });

    it('onNewMail가 새 메일 이벤트를 구독해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      act(() => {
        result.current.onNewMail(callback);
      });
      
      const mailData = {
        mailId: 'mail1',
        fromName: 'User1',
        subject: 'Test mail',
      };
      
      act(() => {
        emitEvent('comm:mail:new', mailData);
      });
      
      expect(callback).toHaveBeenCalledWith(mailData);
    });

    it('onNewHandshake가 명함 교환 요청 이벤트를 구독해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      act(() => {
        result.current.onNewHandshake(callback);
      });
      
      const handshakeData = {
        handshakeId: 'hs1',
        requesterName: 'User1',
        targetCharacterId: 'char1',
      };
      
      act(() => {
        emitEvent('comm:handshake:new', handshakeData);
      });
      
      expect(callback).toHaveBeenCalledWith(handshakeData);
    });

    it('onHandshakeResponse가 명함 교환 응답 이벤트를 구독해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: true }));
      
      const callback = jest.fn();
      act(() => {
        result.current.onHandshakeResponse(callback);
      });
      
      const responseData = {
        handshakeId: 'hs1',
        status: 'accepted' as const,
        requesterCharacterId: 'char1',
      };
      
      act(() => {
        emitEvent('comm:handshake:response', responseData);
      });
      
      expect(callback).toHaveBeenCalledWith(responseData);
    });
  });

  // ============================================================================
  // 소켓 없을 때 안전성 테스트
  // ============================================================================

  describe('소켓 없을 때 안전성', () => {
    it('소켓이 없을 때 구독 함수가 빈 함수를 반환해야 함', () => {
      const { result } = renderHook(() => useSocket({ autoConnect: false }));
      
      const callback = jest.fn();
      let unsubscribe: () => void;
      
      act(() => {
        unsubscribe = result.current.onGameEvent('update', callback);
      });
      
      // unsubscribe가 함수여야 하고 에러 없이 호출 가능해야 함
      expect(typeof unsubscribe!).toBe('function');
      expect(() => unsubscribe!()).not.toThrow();
    });
  });
});


