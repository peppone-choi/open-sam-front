/**
 * Socket.IO 클라이언트 훅
 * Next.js 프론트엔드에서 Socket.IO를 사용하기 위한 커스텀 훅
 */

'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

// 전역 소켓 인스턴스 (HMR 중에도 유지)
let globalSocket: Socket | null = null;
let globalSocketToken: string | null = null;
let globalSocketSessionId: string | null = null;

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
  const connectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // 전역 소켓이 있고 토큰/세션이 같으면 재사용
    if (globalSocket && 
        globalSocketToken === authToken && 
        globalSocketSessionId === sessionId &&
        globalSocket.connected) {
      setSocket(globalSocket);
      socketRef.current = globalSocket;
      setIsConnected(true);
      return;
    }

    // 이미 연결 중이면 스킵 (HMR 중복 연결 방지)
    if (connectingRef.current || socketRef.current?.connected) {
      return;
    }

    // 기존 전역 소켓이 있으면 정리
    if (globalSocket && (globalSocketToken !== authToken || globalSocketSessionId !== sessionId)) {
      globalSocket.disconnect();
      globalSocket = null;
    }

    // 기존 소켓이 있으면 재사용
    if (socketRef.current && !socketRef.current.connected) {
      connectingRef.current = true;
      socketRef.current.connect();
      return;
    }

    connectingRef.current = true;

    // Socket.IO 클라이언트 생성
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const newSocket = io(socketUrl, {
      auth: {
        token: authToken
      },
      query: {
        sessionId: sessionId || ''
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity, // 무한 재연결
      timeout: 20000,
      forceNew: false, // 기존 연결 재사용
      upgrade: true,
      rememberUpgrade: true
    });

    // 전역 소켓에 저장
    globalSocket = newSocket;
    globalSocketToken = authToken;
    globalSocketSessionId = sessionId || null;

    // 연결 이벤트
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO 연결 성공:', newSocket.id);
      setIsConnected(true);
      connectingRef.current = false;
      
      // 재연결 타임아웃 클리어
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // 세션 구독
      if (sessionId) {
        newSocket.emit('game:subscribe', { sessionId });
      }
    });

    // 연결 해제 이벤트
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO 연결 해제:', reason);
      setIsConnected(false);
      connectingRef.current = false;
      
      // HMR이나 클라이언트 disconnect가 아닌 경우에만 재연결 시도
      if (reason !== 'io client disconnect' && reason !== 'transport close') {
        // 짧은 딜레이 후 재연결 시도
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            if (socketRef.current && !socketRef.current.connected) {
              socketRef.current.connect();
            }
          }, 2000);
        }
      }
    });

    // 에러 이벤트
    newSocket.on('connect_error', (error) => {
      const message = (error && (error as any).message) ? (error as any).message : String(error);

      // JWT 만료/유효하지 않은 토큰 오류는 콘솔 에러로 띄우지 않고 조용히 처리
      if (message.includes('유효하지 않은 토큰입니다')) {
        console.warn('Socket.IO 인증 실패(유효하지 않은 토큰):', message);
        setIsConnected(false);
        connectingRef.current = false;
        return;
      }

      console.warn('Socket.IO 연결 오류:', error);
      setIsConnected(false);
      connectingRef.current = false;
      
      // transport error는 무시 (재연결 시도됨)
      if (message.includes('transport')) {
        return;
      }
    });

    // 연결 성공 메시지
    newSocket.on('connected', (data) => {
      console.log('서버 연결 확인:', data);
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    // 정리 함수
    return () => {
      // 재연결 타임아웃 클리어
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // 개발 모드에서는 HMR 중에도 연결 유지 (전역 인스턴스 사용)
      // 프로덕션에서는 완전히 정리
      if (process.env.NODE_ENV === 'production') {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
          setIsConnected(false);
        }
        if (globalSocket) {
          globalSocket.disconnect();
          globalSocket = null;
          globalSocketToken = null;
          globalSocketSessionId = null;
        }
      }
      
      connectingRef.current = false;
    };
  }, [autoConnect, sessionId, getToken]);

  const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
    const target = socketRef.current;
    if (!target) {
      return () => {};
    }

    target.on(channel, callback);
    return () => {
      target.off(channel, callback);
    };
  }, []);

  const createNamespacedSubscriber = useCallback(
    (namespace: string) => (event: string, callback: (data: any) => void) =>
      subscribe(`${namespace}:${event}`, callback),
    [subscribe]
  );

  /**
   * 게임 이벤트 리스너 등록
   */
  const onGameEvent = useMemo(() => createNamespacedSubscriber('game'), [createNamespacedSubscriber]);

  /**
   * 장수 이벤트 리스너 등록
   */
  const onGeneralEvent = useMemo(() => createNamespacedSubscriber('general'), [createNamespacedSubscriber]);

  /**
   * 국가 이벤트 리스너 등록
   */
  const onNationEvent = useMemo(() => createNamespacedSubscriber('nation'), [createNamespacedSubscriber]);

  /**
   * 전투 이벤트 리스너 등록
   */
  const onBattleEvent = useMemo(() => createNamespacedSubscriber('battle'), [createNamespacedSubscriber]);

  /**
   * 턴 완료 리스너
   */
  const onTurnComplete = (callback: (data: { turnNumber: number; nextTurnAt: Date }) => void) =>
    subscribe('game:turn:complete', callback);

  /**
   * 로그 업데이트 리스너
   */
  const onLogUpdate = (callback: (data: {
    sessionId: string;
    generalId: number;
    logType: 'action' | 'history';
    logId: number;
    logText: string;
    timestamp: Date;
  }) => void) => subscribe('log:updated', callback);

  return {
    socket,
    isConnected,
    onGameEvent,
    onGeneralEvent,
    onNationEvent,
    onBattleEvent,
    onTurnComplete,
    onLogUpdate
  };
}

