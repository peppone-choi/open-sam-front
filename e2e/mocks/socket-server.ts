import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import type { AddressInfo } from 'net';

export interface MockSocketServerOptions {
  port?: number;
  scenarios?: {
    battle?: any;
    diplomacy?: any;
    message?: any;
  };
}

export class MockSocketServer {
  private httpServer: ReturnType<typeof createServer>;
  private io: SocketIOServer;
  private port: number;
  private scenarios: any;

  constructor(options: MockSocketServerOptions = {}) {
    this.port = options.port || 0; // 0 = random available port
    this.scenarios = options.scenarios || {};
    this.httpServer = createServer();
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log('[MockSocket] Client connected:', socket.id);

      // Battle events
      socket.on('battle:join', (data) => {
        console.log('[MockSocket] battle:join', data);
        const battleState = this.scenarios.battle?.initialState || {
          battleId: data.battleId || 'battle-mock',
          phase: 'preparation',
          turn: 0,
          participants: [],
        };
        socket.emit('battle:state', battleState);
        socket.join(`battle:${data.battleId}`);
      });

      socket.on('battle:action', (data) => {
        console.log('[MockSocket] battle:action', data);
        const result = this.scenarios.battle?.actionHandler?.(data) || {
          success: true,
          action: data.action,
          result: 'Action executed',
        };
        socket.emit('battle:action-result', result);

        // Broadcast to room
        const updatedState = this.scenarios.battle?.stateUpdater?.(data) || {
          turn: (data.turn || 0) + 1,
          lastAction: data.action,
        };
        this.io.to(`battle:${data.battleId}`).emit('battle:update', updatedState);
      });

      socket.on('battle:leave', (data) => {
        console.log('[MockSocket] battle:leave', data);
        socket.leave(`battle:${data.battleId}`);
        socket.emit('battle:left', { battleId: data.battleId });
      });

      // Diplomacy events
      socket.on('diplomacy:join', (data) => {
        console.log('[MockSocket] diplomacy:join', data);
        const diplomacyState = this.scenarios.diplomacy?.initialState || {
          treaties: [],
          proposals: [],
          relations: {},
        };
        socket.emit('diplomacy:state', diplomacyState);
        socket.join('diplomacy');
      });

      socket.on('diplomacy:propose', (data) => {
        console.log('[MockSocket] diplomacy:propose', data);
        const proposal = this.scenarios.diplomacy?.proposalHandler?.(data) || {
          id: `proposal-${Date.now()}`,
          from: data.from,
          to: data.to,
          type: data.type,
          terms: data.terms,
          status: 'pending',
        };
        socket.emit('diplomacy:proposal-created', proposal);
        this.io.to('diplomacy').emit('diplomacy:new-proposal', proposal);
      });

      socket.on('diplomacy:respond', (data) => {
        console.log('[MockSocket] diplomacy:respond', data);
        const response = this.scenarios.diplomacy?.responseHandler?.(data) || {
          proposalId: data.proposalId,
          accepted: data.accepted,
          timestamp: new Date().toISOString(),
        };
        socket.emit('diplomacy:response-recorded', response);
        this.io.to('diplomacy').emit('diplomacy:proposal-update', {
          proposalId: data.proposalId,
          status: data.accepted ? 'accepted' : 'rejected',
        });
      });

      socket.on('diplomacy:leave', () => {
        console.log('[MockSocket] diplomacy:leave');
        socket.leave('diplomacy');
      });

      // Message/Chat events
      socket.on('message:join', (data) => {
        console.log('[MockSocket] message:join', data);
        const channel = data.channel || 'global';
        socket.join(`chat:${channel}`);
        
        const messageHistory = this.scenarios.message?.history?.[channel] || [];
        socket.emit('message:history', { channel, messages: messageHistory });
      });

      socket.on('message:send', (data) => {
        console.log('[MockSocket] message:send', data);
        const message = {
          id: `msg-${Date.now()}`,
          channel: data.channel || 'global',
          author: data.author,
          content: data.content,
          timestamp: new Date().toISOString(),
        };

        // Store in scenario if handler exists
        if (this.scenarios.message?.messageHandler) {
          this.scenarios.message.messageHandler(message);
        }

        // Broadcast to channel
        this.io.to(`chat:${message.channel}`).emit('message:new', message);
      });

      socket.on('message:leave', (data) => {
        console.log('[MockSocket] message:leave', data);
        socket.leave(`chat:${data.channel}`);
      });

      // Realtime game updates
      socket.on('game:subscribe', (data) => {
        console.log('[MockSocket] game:subscribe', data);
        socket.join(`game:${data.serverId}`);
        
        const gameState = {
          serverId: data.serverId,
          currentTurn: 1,
          phase: 'command',
          timeRemaining: 7200,
        };
        socket.emit('game:state', gameState);
      });

      socket.on('game:unsubscribe', (data) => {
        console.log('[MockSocket] game:unsubscribe', data);
        socket.leave(`game:${data.serverId}`);
      });

      // Turn notifications
      socket.on('turn:subscribe', () => {
        console.log('[MockSocket] turn:subscribe');
        socket.join('turn-updates');
      });

      socket.on('turn:unsubscribe', () => {
        console.log('[MockSocket] turn:unsubscribe');
        socket.leave('turn-updates');
      });

      // Generic event handler for testing
      socket.on('test:echo', (data) => {
        console.log('[MockSocket] test:echo', data);
        socket.emit('test:echo-response', data);
      });

      socket.on('disconnect', (reason) => {
        console.log('[MockSocket] Client disconnected:', socket.id, reason);
      });
    });
  }

  // Utility method to emit events from tests
  public emitToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }

  public emitToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  // Simulate turn progression
  public simulateTurnUpdate(serverId: string, turnData: any) {
    this.io.to(`game:${serverId}`).emit('game:turn-update', turnData);
    this.io.to('turn-updates').emit('turn:new', turnData);
  }

  // Simulate battle events
  public simulateBattleUpdate(battleId: string, updateData: any) {
    this.io.to(`battle:${battleId}`).emit('battle:update', updateData);
  }

  // Simulate diplomacy events
  public simulateDiplomacyUpdate(updateData: any) {
    this.io.to('diplomacy').emit('diplomacy:update', updateData);
  }

  public async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.port, () => {
        const addr = this.httpServer.address() as AddressInfo;
        this.port = addr.port;
        console.log(`[MockSocket] Server started on port ${this.port}`);
        resolve(this.port);
      });

      this.httpServer.on('error', reject);
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.io.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        this.httpServer.close((err) => {
          if (err) {
            reject(err);
            return;
          }
          console.log('[MockSocket] Server stopped');
          resolve();
        });
      });
    });
  }

  public getPort(): number {
    return this.port;
  }

  public getUrl(): string {
    return `http://localhost:${this.port}`;
  }
}

// Preset scenarios for common test cases
export const battleScenario = {
  initialState: {
    battleId: 'test-battle-001',
    phase: 'preparation',
    turn: 0,
    maxTurns: 20,
    attackers: [
      { generalId: 'gen-001', name: '조조', troops: 10000, morale: 85 },
    ],
    defenders: [
      { generalId: 'gen-002', name: '관우', troops: 8000, morale: 90 },
    ],
  },
  actionHandler: (data: any) => ({
    success: true,
    action: data.action,
    casualties: Math.floor(Math.random() * 500),
    damage: Math.floor(Math.random() * 1000),
  }),
  stateUpdater: (data: any) => ({
    turn: (data.turn || 0) + 1,
    lastAction: data.action,
    timestamp: new Date().toISOString(),
  }),
};

export const diplomacyScenario = {
  initialState: {
    treaties: [
      { id: 'treaty-001', type: 'alliance', parties: ['위', '촉'], status: 'active' },
    ],
    proposals: [],
    relations: {
      '위-촉': 60,
      '위-오': 30,
      '촉-오': 50,
    },
  },
  proposalHandler: (data: any) => ({
    id: `proposal-${Date.now()}`,
    from: data.from,
    to: data.to,
    type: data.type,
    terms: data.terms,
    status: 'pending',
    timestamp: new Date().toISOString(),
  }),
  responseHandler: (data: any) => ({
    proposalId: data.proposalId,
    accepted: data.accepted,
    timestamp: new Date().toISOString(),
  }),
};

export const messageScenario = {
  history: {
    global: [
      { id: 'msg-1', author: '시스템', content: '서버가 시작되었습니다.', timestamp: new Date(Date.now() - 60000).toISOString() },
      { id: 'msg-2', author: '관리자', content: '안녕하세요!', timestamp: new Date(Date.now() - 30000).toISOString() },
    ],
    nation: [
      { id: 'msg-3', author: '조조', content: '전략 회의를 시작합니다.', timestamp: new Date(Date.now() - 15000).toISOString() },
    ],
  },
  messageHandler: (message: any) => {
    // Store message for later retrieval
    if (!messageScenario.history[message.channel]) {
      messageScenario.history[message.channel] = [];
    }
    messageScenario.history[message.channel].push(message);
  },
};
