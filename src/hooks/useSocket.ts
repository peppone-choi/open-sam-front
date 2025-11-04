/**
 * Socket.IO 클라이언트 훅
 * Next.js 프론트엔드에서 Socket.IO를 사용하기 위한 커스텀 훅
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  token?: string | null;
  sessionId?: string;
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { token, sessionId, autoConnect = true } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // 토큰 가져오기 헬퍼 함수
  const getToken = useCallback((): string | null => {
    if (token) return token;
    
    // 브라우저 환경에서만 실행
    if (typeof window === 'undefined') return null;
    
    // 쿠키에서 토큰 찾기
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token' || name === 'authToken') {
        return decodeURIComponent(value);
      }
    }
    
    // localStorage에서 토큰 찾기
    try {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      return storedToken;
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    const authToken = getToken();
    
    if (!autoConnect || !authToken) {
      return;
    }

    // Socket.IO 클라이언트 생성
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const newSocket = io(socketUrl, {
      auth: {
        token: authToken
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // 연결 이벤트
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO 연결 성공:', newSocket.id);
      setIsConnected(true);
      
      // 세션 구독
      if (sessionId) {
        newSocket.emit('game:subscribe', { sessionId });
      }
    });

    // 연결 해제 이벤트
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO 연결 해제:', reason);
      setIsConnected(false);
    });

    // 에러 이벤트
    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO 연결 오류:', error);
      setIsConnected(false);
    });

    // 연결 성공 메시지
    newSocket.on('connected', (data) => {
      console.log('서버 연결 확인:', data);
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    // 정리 함수
    return () => {
      if (socketRef.current) {
        socketRef.current?.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [autoConnect, sessionId, getToken]);

  /**
   * 게임 이벤트 리스너 등록
   */
  const onGameEvent = (event: string, callback: (data: any) => void) => {
    if (!socket) return () => {};
    
    socket.on(`game:${event}`, callback);
    
    return () => {
      socket.off(`game:${event}`, callback);
    };
  };

  /**
   * 장수 이벤트 리스너 등록
   */
  const onGeneralEvent = (event: string, callback: (data: any) => void) => {
    if (!socket) return () => {};
    
    socket.on(`general:${event}`, callback);
    
    return () => {
      socket.off(`general:${event}`, callback);
    };
  };

  /**
   * 국가 이벤트 리스너 등록
   */
  const onNationEvent = (event: string, callback: (data: any) => void) => {
    if (!socket) return () => {};
    
    socket.on(`nation:${event}`, callback);
    
    return () => {
      socket.off(`nation:${event}`, callback);
    };
  };

  /**
   * 전투 이벤트 리스너 등록
   */
  const onBattleEvent = (event: string, callback: (data: any) => void) => {
    if (!socket) return () => {};
    
    socket.on(`battle:${event}`, callback);
    
    return () => {
      socket.off(`battle:${event}`, callback);
    };
  };

  /**
   * 턴 완료 리스너
   */
  const onTurnComplete = (callback: (data: { turnNumber: number; nextTurnAt: Date }) => void) => {
    if (!socket) return () => {};
    
    socket.on('game:turn:complete', callback);
    
    return () => {
      socket.off('game:turn:complete', callback);
    };
  };

  return {
    socket,
    isConnected,
    onGameEvent,
    onGeneralEvent,
    onNationEvent,
    onBattleEvent,
    onTurnComplete
  };
}

