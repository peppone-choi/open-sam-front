/**
 * Global type declarations for Open Sam Front
 */

import type { Socket } from 'socket.io-client';

declare global {
  interface Window {
    /**
     * Socket.IO mock factory for testing
     */
    __OPEN_SAM_SOCKET_MOCK__?: (options: {
      sessionId?: string;
      token?: string | null;
    }) => Partial<Socket> & {
      trigger?: (event: string, payload?: any) => void;
    };

    /**
     * Last created socket instance for testing
     */
    __OPEN_SAM_LAST_SOCKET__?: Partial<Socket> & {
      trigger?: (event: string, payload?: any) => void;
    };

    /**
     * Socket events log for testing
     */
    __OPEN_SAM_SOCKET_EVENTS__?: Array<{
      event: string;
      payload: unknown;
      timestamp: number;
      sessionId?: string;
    }>;

    /**
     * Store instances for debugging
     */
    __OPEN_SAM_STORES__?: Record<string, any>;
  }
}

export {};
