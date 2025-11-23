'use client';

import { ReactNode, useEffect } from 'react';
import { useGin7Store } from '@/stores/gin7Store';
import {
  Gin7ApiBundle,
  Gin7SessionSnapshot,
  Gin7StrategySnapshot,
  Gin7TelemetrySample,
} from '@/types/gin7';
import { CommandType } from '@/types/logh';
import { fullGin7Catalog, sampleAuthorityCardViews } from '@/mocks/fullGin7Catalog';

const strategicCells = Array.from({ length: 96 }).map((_, index) => {
  const x = index % 12;
  const y = Math.floor(index / 12);
  const isSystem = (x + y) % 7 === 0;
  return {
    x,
    y,
    type: isSystem ? 'star_system' : 'space',
    label: isSystem ? `SYS-${x}${y}` : undefined,
    navigable: true,
  } as const;
});

const mockJobCards = sampleAuthorityCardViews.slice(0, 4).map((card) => ({
  id: card.templateId,
  title: card.title,
  rankReq: card.rank,
  commands: card.commandCodes as CommandType[],
  commandCodes: card.commandCodes,
}));

const gin7MockBundle: Gin7ApiBundle = {
  session: {
    profile: {
      id: 'gal-char-02',
      name: 'Yang Wen-li',
      rank: 'Commodore',
      faction: 'alliance',
      pcp: 12,
      mcp: 10,
      maxPcp: 18,
      maxMcp: 22,
      jobCards: mockJobCards,
      sessionId: 's2-story',
    },
    cpRegenSeconds: 660,
    cards: sampleAuthorityCardViews,
    commandCatalog: fullGin7Catalog,
  },
  strategic: {
    gridWidth: 12,
    gridHeight: 8,
    cells: strategicCells,
    fleets: [
      {
        id: 'fleet-emp',
        name: '제국 제7함대',
        faction: 'empire',
        x: 4,
        y: 3,
        status: 'moving',
        cpLoad: { pcp: 7, mcp: 6 },
        isFlagship: true,
      },
      {
        id: 'fleet-all',
        name: '제13함대',
        faction: 'alliance',
        x: 7,
        y: 2,
        status: 'idle',
        cpLoad: { pcp: 6, mcp: 8 },
        isFlagship: false,
      },
    ],
    viewport: { x: 2, y: 2 },
  },
  plans: [
    {
      id: 'plan-1',
      objective: 'occupy',
      target: '오딘',
      plannedStart: '801-07-27T18:00',
      participants: ['라인하르트', '미터마이어'],
      status: 'draft',
      notes: '소탕 30일 규칙 적용',
    },
  ],
  tactical: {
    units: [
      {
        id: 'unit-flagship',
        name: 'Hyperion',
        type: 'flagship',
        hp: 90,
        maxHp: 100,
        energy: 80,
        maxEnergy: 100,
        position: { row: 10, col: 10 },
        heading: 90,
        faction: 'alliance',
      },
      {
        id: 'unit-escort',
        name: 'Patrol Wing',
        type: 'escort',
        hp: 60,
        maxHp: 70,
        energy: 55,
        maxEnergy: 70,
        position: { row: 12, col: 11 },
        heading: 120,
        faction: 'empire',
      },
    ],
    energy: { beam: 24, gun: 18, shield: 20, engine: 14, warp: 12, sensor: 12 },
    radarHeat: 0.32,
  },
  chat: [
    {
      id: 'chat-1',
      channel: 'global',
      author: '양',
      text: '은하계 전역에서 통신 시험 중',
      timestamp: new Date().toISOString(),
    },
  ],
};

const gin7SessionSnapshotMock: Gin7SessionSnapshot = {
  schemaVersion: '2025-11-22.session.2',
  session: {
    sessionId: 's2-story',
    title: 'LOGH Session 2',
    status: 'running',
    logisticWindowHours: 72,
    factions: [
      { name: 'empire', slots: 120, activePlayers: 87, status: 'open' },
      { name: 'alliance', slots: 120, activePlayers: 84, status: 'open' },
    ],
    notifications: [
      { message: 'UC 797.04 전략 루프 가동', createdAt: new Date().toISOString(), manualRef: 'gin7manual.txt:299-304' },
    ],
  },
  clock: {
    gameTime: '0797-04-18T00:00:00.000Z',
    lastRealTickAt: new Date().toISOString(),
    phase: 'strategic',
    manuallyPaused: false,
    loopStats: {
      lastTickDurationMs: 1320,
      avgTickDurationMs: 1488,
      maxTickDurationMs: 2480,
      sampleCount: 86,
      consecutiveFailures: 0,
      lastTickCompletedAt: new Date().toISOString(),
    },
  },
  cards: {
    total: 128,
    byStatus: { available: 41, assigned: 79, locked: 6, revoked: 2 },
    byCategory: { personal: 32, fleet: 28, logistics: 24, politics: 22, intel: 22 },
    recentAssignments: [
      { cardId: 'card.logistics.officer:empire', title: '병참 참모 카드', holderCharacterId: 'gal-char-77', lastIssuedAt: new Date().toISOString() },
    ],
  },
  commandPoints: {
    rosterSize: 171,
    totals: { pcp: 1462, mcp: 1638 },
    average: { pcp: 8.55, mcp: 9.58 },
    lowCapacity: 23,
    substitutionDebt: 11,
    lastRecoverySample: [
      {
        characterId: 'gal-char-02',
        displayName: 'Yang Wen-li',
        faction: 'alliance',
        rank: 'Commodore',
        pcp: 12,
        mcp: 12,
        lastRecoveredAt: new Date().toISOString(),
      },
    ],
  },
  shortcuts: [
    {
      cardId: 'card.politics.chief:alliance',
      title: '국가정책 카드',
      category: 'politics',
      status: 'assigned',
      commandGroups: ['정치', '인사'],
      commandCodes: ['set-tax', 'appoint-governor'],
      holderCharacterId: 'gal-char-11',
    },
  ],
};

const gin7StrategySnapshotMock: Gin7StrategySnapshot = {
  schemaVersion: '2025-11-22.strategy.2',
  session: { sessionId: 's2-story', title: 'LOGH Session 2', status: 'running' },
  clock: {
    phase: 'strategic',
    loopStats: {
      lastTickDurationMs: 1300,
      avgTickDurationMs: 1500,
      maxTickDurationMs: 2600,
      sampleCount: 60,
      consecutiveFailures: 0,
    },
  },
  map: {
    meta: { width: 100, height: 50, systemCount: 82, warpRouteCount: 244 },
    starSystems: [
      { systemId: 'odin', systemNumber: 1, name: '오딘', faction: 'empire', grid: { x: 42, y: 18 }, strategicValue: 'critical', warpRoutes: ['fezzan'] },
    ],
  },
  fleets: [
    {
      fleetId: 'emp-fleet-03',
      name: 'Reuenthal Fleet',
      faction: 'empire',
      status: 'moving',
      commanderName: 'Reuenthal',
      position: { x: 47, y: 21 },
      destination: { x: 48, y: 22 },
      isMoving: true,
      movementSpeed: 1,
      movementRange: 5,
      totalShips: 5400,
      morale: 78,
      supplies: 8000,
      fuel: 500,
      formation: 'offensive',
      inCombat: false,
      updatedAt: new Date().toISOString(),
    },
  ],
  operationHotspots: [
    {
      operationId: 'OP-EMP-044',
      code: '소탕03',
      objectiveType: 'sweep',
      status: 'issued',
      targetGrid: { x: 52, y: 19 },
      waitHours: 6,
      executionHours: 24,
      issuedAt: new Date().toISOString(),
      participants: [
        { characterId: 'gal-char-02', role: 'author', status: 'approved' },
      ],
    },
  ],
};

const gin7TelemetrySamplesMock: Gin7TelemetrySample[] = [
  {
    scene: 'strategy',
    avgFps: 58,
    cpuPct: 42,
    memoryMb: 380,
    sampleCount: 300,
    durationMs: 5000,
    collectedAt: new Date().toISOString(),
  },
  {
    scene: 'tactical',
    avgFps: 48,
    cpuPct: 52,
    memoryMb: 410,
    sampleCount: 300,
    durationMs: 5000,
    collectedAt: new Date(Date.now() - 60000).toISOString(),
  },
];

export function Gin7StoryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    useGin7Store.setState((state) => ({
      ...state,
      loading: false,
      sessionId: 's2-story',
      session: gin7MockBundle.session,
      commandCatalog: gin7MockBundle.session.commandCatalog,
      strategic: gin7MockBundle.strategic,
      plans: gin7MockBundle.plans,
      tactical: gin7MockBundle.tactical,
      chat: gin7MockBundle.chat,
      sessionSnapshot: gin7SessionSnapshotMock,
      strategySnapshot: gin7StrategySnapshotMock,
      telemetrySamples: gin7TelemetrySamplesMock,
      localTelemetry: {},
      hoveredCell: null,
      selectedFleetId: null,
    }));
  }, []);
  return <>{children}</>;
}
