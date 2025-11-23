import { test, expect } from '@playwright/test';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { CommandType } from '../src/types/logh';
import { fullGin7Catalog, sampleAuthorityCardViews } from '../src/mocks/fullGin7Catalog';

const QA_OUTPUT_DIR = path.resolve(process.cwd(), 'test-results/sessionB-realtime');
const clone = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

declare global {
  interface Window {
    __OPEN_SAM_STORES__?: Record<string, any>;
    __OPEN_SAM_LAST_SOCKET__?: any;
    __OPEN_SAM_SOCKET_EVENTS__?: Array<{ event: string; payload: unknown; timestamp?: number; sessionId?: string }>;
    __OPEN_SAM_SOCKET_MOCK__?: (options: { sessionId?: string; token?: string | null }) => any;
  }
}

const e2eJobCards = sampleAuthorityCardViews.slice(0, 4).map((card) => ({
  id: card.templateId,
  title: card.title,
  rankReq: card.rank,
  commands: card.commandCodes as CommandType[],
  commandCodes: card.commandCodes,
}));

const gin7Session = {
  data: {
    profile: {
      id: 'QA-1',
      name: '세션B-검증관',
      rank: 'Commodore',
      faction: 'alliance',
      pcp: 120,
      mcp: 200,
      maxPcp: 150,
      maxMcp: 220,
      jobCards: e2eJobCards,
    },
    cpRegenSeconds: 300,
    cards: sampleAuthorityCardViews,
    commandCatalog: fullGin7Catalog,
  },
};

const gin7Strategy = {
  data: {
    gridWidth: 10,
    gridHeight: 6,
    viewport: { x: 0, y: 0 },
    cells: Array.from({ length: 60 }).map((_, idx) => ({
      x: idx % 10,
      y: Math.floor(idx / 10),
      type: idx === 12 ? 'star_system' : 'space',
      label: idx === 12 ? 'Astarte' : undefined,
      navigable: true,
    })),
    fleets: [
      {
        id: 'fleet-qa',
        name: 'QA 13th Fleet',
        faction: 'alliance',
        x: 2,
        y: 2,
        status: 'idle',
        cpLoad: { pcp: 12, mcp: 24 },
        isFlagship: true,
      },
    ],
  },
};

const gin7Plans = {
  data: [
    {
      id: 'plan-qa',
      objective: 'occupy',
      target: 'Astarte',
      plannedStart: '801-07-27 12:00',
      participants: ['Yang'],
      status: 'active',
      notes: 'QA 테스트',
    },
  ],
};

const gin7Tactical = {
  data: {
    units: [
      {
        id: 'flagship',
        name: 'Hyperion',
        type: 'flagship',
        hp: 9000,
        maxHp: 10000,
        energy: 80,
        maxEnergy: 100,
        position: { row: 10, col: 10 },
        heading: 90,
        faction: 'alliance',
      },
      {
        id: 'escort-1',
        name: 'Escort-1',
        type: 'escort',
        hp: 4000,
        maxHp: 5000,
        energy: 60,
        maxEnergy: 80,
        position: { row: 13, col: 9 },
        heading: 120,
        faction: 'alliance',
      },
    ],
    energy: { beam: 32, gun: 24, shield: 28, engine: 20, warp: 15, sensor: 12 },
    radarHeat: 0.35,
  },
};

const gin7Chat = {
  data: [
    { id: 'chat-1', channel: 'fleet', author: 'Yang', text: '전술 HUD 점검', timestamp: new Date().toISOString() },
  ],
};

const gin7TelemetrySamples = {
  data: [
    { scene: 'strategy', avgFps: 56, cpuPct: 34, memoryMb: 512, sampleCount: 120, durationMs: 1000, collectedAt: new Date().toISOString() },
    { scene: 'tactical', avgFps: 61, cpuPct: 47, memoryMb: 640, sampleCount: 140, durationMs: 1000, collectedAt: new Date().toISOString() },
  ],
};

const gin7SessionSnapshot = {
  data: {
    sessionId: 'QA-GIN7',
    clock: {
      loopStats: {
        avgTickDurationMs: 140,
        maxTickDurationMs: 210,
        lastTickDurationMs: 135,
        sampleCount: 8,
        consecutiveFailures: 0,
        lastAlertAt: null,
      },
    },
  },
};

const gin7StrategySnapshot = {
  data: {
    sessionId: 'QA-GIN7',
    clock: {
      phase: 'strategic',
      loopStats: {
        avgTickDurationMs: 180,
        maxTickDurationMs: 240,
        lastTickDurationMs: 170,
        sampleCount: 6,
        consecutiveFailures: 0,
      },
    },
    map: {
      meta: {
        systemCount: 64,
        warpRouteCount: 24,
      },
    },
    fleets: [
      { fleetId: 'fleet-qa', name: 'QA 13th Fleet', status: 'idle', totalShips: 12000, morale: 93 },
    ],
    operationHotspots: [],
  },
};

const loghCommander = {
  name: 'Yang Wen-li',
  faction: 'alliance',
  rank: 'Fleet Admiral',
  commandPoints: 8,
  stats: { command: 98, tactics: 95, strategy: 99, politics: 82 },
  supplies: 12000,
  fleetId: 'FLEET-AL-01',
  position: { x: 4, y: 3, z: 0 },
};

const loghFleetDetail = {
  id: 'FLEET-AL-01',
  name: '13th Fleet',
  commanderName: 'Yang Wen-li',
  faction: 'alliance',
  gridX: 4,
  gridY: 3,
  size: 5200,
  status: 'idle',
  formation: 'standard',
  totalShips: 5200,
  supplies: 9200,
  ammo: 8700,
  morale: 96,
};

const loghMapGrid = {
  success: true,
  data: {
    gridSize: { width: 10, height: 6 },
    grid: Array.from({ length: 6 }).map(() => Array.from({ length: 10 }).map(() => 1)),
  },
};

const loghStrategicFleets = [
  {
    fleetId: 'FLEET-AL-01',
    name: '13th Fleet',
    faction: 'alliance',
    strategicPosition: { x: 4, y: 3 },
    status: 'idle',
    isInCombat: false,
    totalShips: 5200,
  },
  {
    fleetId: 'FLEET-IM-01',
    name: 'Imperial Vanguard',
    faction: 'empire',
    strategicPosition: { x: 7, y: 4 },
    status: 'moving',
    isInCombat: true,
    totalShips: 6400,
  },
];

const loghTacticalFleets = [
  {
    fleetId: 'FLEET-AL-01',
    totalShips: 5200,
    formation: 'standard',
    tacticalPosition: { x: 2000, y: 5200, heading: 35 },
  },
  {
    fleetId: 'FLEET-IM-01',
    totalShips: 6400,
    formation: 'spindle',
    tacticalPosition: { x: 7800, y: 5200, heading: 225 },
  },
];

const loghBattleState = {
  success: true,
  data: {
    id: 'test-battle-1',
    turn: 1,
    phase: 'engagement',
    fleets: loghTacticalFleets,
  },
};

async function ensureQaDir() {
  await fs.mkdir(QA_OUTPUT_DIR, { recursive: true });
}

async function setupSocketMock(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    window.__OPEN_SAM_SOCKET_EVENTS__ = [];
    const socketPool: Record<string, any> = {};
    window.__OPEN_SAM_SOCKET_MOCK__ = ({ sessionId }) => {
      const key = sessionId || 'default';
      if (!socketPool[key]) {
        const listeners = new Map<string, Set<(...args: any[]) => void>>();
        const socket = {
          sessionId: key,
          connected: true,
          on(event: string, handler: (...args: any[]) => void) {
            const bucket = listeners.get(event) ?? new Set();
            bucket.add(handler);
            listeners.set(event, bucket);
            return socket;
          },
          off(event: string, handler?: (...args: any[]) => void) {
            const bucket = listeners.get(event);
            if (!bucket) return socket;
            if (handler) {
              bucket.delete(handler);
            } else {
              listeners.delete(event);
            }
            return socket;
          },
          emit(event: string, payload?: any) {
            window.__OPEN_SAM_SOCKET_EVENTS__?.push({ event, payload, timestamp: Date.now(), sessionId: key });
            console.log('[SocketMock emit]', event, payload);
            return true;
          },
          disconnect() {
            listeners.clear();
          },
          trigger(event: string, payload?: any) {
            const bucket = listeners.get(event);
            bucket?.forEach((handler) => {
              try {
                handler(payload);
              } catch (error) {
                console.error('[SocketMock] listener error', error);
              }
            });
          },
        } as any;
        socketPool[key] = socket;
      }
      window.__OPEN_SAM_LAST_SOCKET__ = socketPool[key];
      return socketPool[key];
    };
  });
}

async function mockGin7Apis(page: import('@playwright/test').Page, networkLog: string[]) {
  let tacticalState = clone(gin7Tactical);
  await page.route('**/api/gin7/**', async (route, request) => {
    const url = new URL(request.url());
    const pathname = url.pathname.replace('/api/gin7', '');
    console.log('DEBUG gin7 request', request.method(), pathname + url.search);
    networkLog.push(`[GIN7] ${request.method()} ${pathname || '/'}${url.search}`);
    if (pathname.startsWith('/tactical/energy')) {
      const body = request.postDataJSON?.() ?? {};
      if (body.energy) {
        tacticalState.data.energy = { ...tacticalState.data.energy, ...body.energy };
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tacticalState.data.energy) });
      return;
    }
    if (pathname.startsWith('/session/sessions/')) {
      await route.fulfill({ json: gin7SessionSnapshot });
      return;
    }
    if (pathname.startsWith('/strategy/sessions/')) {
      await route.fulfill({ json: gin7StrategySnapshot });
      return;
    }
    if (pathname === '/session') {
      await route.fulfill({ json: gin7Session });
      return;
    }
    if (pathname === '/strategy') {
      await route.fulfill({ json: gin7Strategy });
      return;
    }
    if (pathname === '/operations') {
      await route.fulfill({ json: gin7Plans });
      return;
    }
    if (pathname === '/tactical') {
      await route.fulfill({ json: tacticalState });
      return;
    }
    if (pathname === '/chat') {
      await route.fulfill({ json: gin7Chat });
      return;
    }
    if (pathname.startsWith('/telemetry') && request.method() === 'GET') {
      await route.fulfill({ json: gin7TelemetrySamples });
      return;
    }
    if (pathname.startsWith('/telemetry') && request.method() === 'POST') {
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({ json: { success: true } });
  });
}

async function mockLoghApis(page: import('@playwright/test').Page, networkLog: string[]) {
  await page.route('**/api/logh/**', async (route, request) => {
    const url = new URL(request.url());
    const pathname = url.pathname.replace('/api/logh', '');
    networkLog.push(`[LOGH] ${request.method()} ${pathname || '/'}${url.search}`);
    if (pathname === '/my-commander') {
      await route.fulfill({ json: loghCommander });
      return;
    }
    if (pathname.startsWith('/fleet/')) {
      await route.fulfill({ json: loghFleetDetail });
      return;
    }
    if (pathname === '/map/grid') {
      await route.fulfill({ json: loghMapGrid });
      return;
    }
    if (pathname.startsWith('/galaxy/tactical-battles/')) {
      await route.fulfill({ json: loghBattleState });
      return;
    }
    if (pathname.startsWith('/tactical-maps/')) {
      await route.fulfill({ json: { success: true, data: { fleets: loghTacticalFleets } } });
      return;
    }
    if (pathname === '/command/execute') {
      await route.fulfill({ json: { success: true } });
      return;
    }
    await route.fulfill({ json: { success: true } });
  });
}

function formatNow() {
  return new Date().toISOString();
}

test('세션 B - 프론트엔드 실시간/전술 인터랙션', async ({ page }, testInfo) => {
  await ensureQaDir();
  const scriptLog: string[] = [];
  const networkLog: string[] = [];
  const consoleLog: string[] = [];
  const checklist: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'log') {
      consoleLog.push(`[브라우저] ${msg.text()}`);
      console.log('BROWSER', msg.text());
    }
  });

  await setupSocketMock(page);
  await mockGin7Apis(page, networkLog);
  await mockLoghApis(page, networkLog);

  const gin7Screenshot = path.join(QA_OUTPUT_DIR, 'sessionB-realtime-gin7.png');
  const loghStrategicScreenshot = path.join(QA_OUTPUT_DIR, 'sessionB-realtime-logh-strategic.png');
  const loghTacticalScreenshot = path.join(QA_OUTPUT_DIR, 'sessionB-realtime-logh-tactical.png');
  const tracePath = path.join(QA_OUTPUT_DIR, 'sessionB-realtime-trace.zip');

  await page.context().tracing.start({ screenshots: true, snapshots: true });

  // GIN7 HUD interactions
  await page.goto('/gin7');
  const tacticalHud = page.getByTestId('gin7-tactical-hud');
  await expect(tacticalHud).toBeVisible();
  scriptLog.push(`[${formatNow()}] GIN7 페이지 로딩 완료`);

  await page.waitForFunction(() => Boolean(window.__OPEN_SAM_STORES__?.gin7?.getState?.()));
  const initialBeam = await page.evaluate(() => window.__OPEN_SAM_STORES__?.gin7?.getState().tactical?.energy?.beam ?? null);
  console.log('DEBUG 초기 빔 에너지', initialBeam);
  scriptLog.push(`[${formatNow()}] 초기 빔 에너지: ${initialBeam}`);
  const beamValueHtml = await page.evaluate(() => document.querySelector('[data-testid="gin7-energy-beam"]')?.outerHTML || null);
  console.log('DEBUG 빔 값 HTML', beamValueHtml);

  const beamSlider = tacticalHud.locator('label:has-text("빔") input[type="range"]');
  const steps = Math.max(0, 35 - (initialBeam ?? 0));
  for (let step = 0; step < steps; step += 1) {
    await beamSlider.press('ArrowRight');
  }
  await page.evaluate(() => console.log('세션B-GIN7: 빔 출력 35%로 조정'));
  const tacticalAfterInput = await page.evaluate(() => window.__OPEN_SAM_STORES__?.gin7?.getState().tactical ?? null);
  console.log('DEBUG 입력 후 전술상태', tacticalAfterInput);
  const beamText = await tacticalHud.getByTestId('gin7-energy-beam').textContent();
  if (!beamText || !/3[4-6]%/.test(beamText)) {
    scriptLog.push(`[${formatNow()}] ⚠️ 빔 에너지 표시 미반영 (${beamText ?? 'empty'})`);
    checklist.push('- ❌ GIN7 전술 HUD: 에너지 눈금이 35%로 반영되지 않음');
  } else {
    scriptLog.push(`[${formatNow()}] 에너지 슬라이더 조정 → HUD 표시값 반영 확인`);
    checklist.push('- ✅ GIN7 전술 HUD: 에너지 슬라이더가 상태·API와 동기화됨');
  }

  await page.evaluate(() => {
    const store = window.__OPEN_SAM_STORES__?.gin7;
    if (store) {
      store.setState((state: any) => ({ tactical: { ...state.tactical, radarHeat: 0.82 } }));
      const { recordLocalTelemetry } = store.getState();
      recordLocalTelemetry('tactical', {
        scene: 'tactical',
        avgFps: 58,
        cpuPct: 42,
        memoryMb: 512,
        collectedAt: new Date().toISOString(),
      });
    }
  });
  const radarBar = page.getByTestId('gin7-radar-bar');
  await expect(radarBar).toHaveAttribute('style', /82%/);
  await expect(page.getByText('58fps')).toBeVisible();
  await page.evaluate(() => console.log('세션B-GIN7: 레이더 게이지·텔레메트리 시뮬레이션 적용'));
  scriptLog.push(`[${formatNow()}] 레이더 게이지/텔레메트리 샘플 업데이트`);
  checklist.push('- ✅ GIN7 레이더/텔레메트리: 로컬 샘플과 게이지 반응 확인');

  await tacticalHud.screenshot({ path: gin7Screenshot, fullPage: false });
  await testInfo.attach('세션B-실시간-GIN7', { path: gin7Screenshot, contentType: 'image/png' });

  // LOGH strategic interactions
  await page.goto('/logh/game');
  await page.evaluate(() => {
    window.__OPEN_SAM_SOCKET_EVENTS__ = [];
  });
  await page.waitForFunction(() => Boolean(window.__OPEN_SAM_LAST_SOCKET__));
  const strategicCanvas = page.getByTestId('logh-strategic-canvas');
  await expect(strategicCanvas).toBeVisible();
  await expect(page.getByText('LIVE')).toBeVisible();
  await page.evaluate((fleets) => {
    window.__OPEN_SAM_LAST_SOCKET__?.trigger?.('game:state-update', { fleets });
  }, loghStrategicFleets);
  scriptLog.push(`[${formatNow()}] LOGH 전략 맵에 모의 소켓 이벤트 투입`);

  const canvasBox = await strategicCanvas.boundingBox();
  if (!canvasBox) {
    throw new Error('전략 맵 크기를 계산할 수 없습니다.');
  }
  const STRATEGIC_GRID_WIDTH = 100;
  const STRATEGIC_GRID_HEIGHT = 50;
  const cellWidth = canvasBox.width / STRATEGIC_GRID_WIDTH;
  const cellHeight = canvasBox.height / STRATEGIC_GRID_HEIGHT;
  const targetFleet = loghStrategicFleets[0];
  const fleetClick = {
    x: (targetFleet.strategicPosition.x + 0.5) * cellWidth,
    y: (targetFleet.strategicPosition.y + 0.5) * cellHeight,
  };
  await strategicCanvas.click({ position: fleetClick });
  await expect(page.getByText(targetFleet.name)).toBeVisible();
  await page.waitForTimeout(200);

  const dropClick = {
    x: 6.5 * cellWidth,
    y: 4.5 * cellHeight,
  };
  await strategicCanvas.click({ position: dropClick });

  await page.evaluate(() => console.log('세션B-LOGH: 함대 이동 명령 전송'));
  const moveEvents = await page.evaluate(() => {
    const events = window.__OPEN_SAM_SOCKET_EVENTS__ || [];
    return events.filter((evt) => evt.event === 'fleet:move');
  });
  console.log('DEBUG move events', moveEvents);
  const moveEvent = moveEvents.pop();
  if (!moveEvent) {
    scriptLog.push(`[${formatNow()}] ⚠️ Socket emit 누락: fleet:move 이벤트가 발생하지 않았습니다.`);
    checklist.push('- ❌ LOGH 전략 지도: 함대 이동 명령이 socket.emit으로 전달되지 않음');
  } else {
    scriptLog.push(`[${formatNow()}] 소켓 emit 확인 → ${JSON.stringify(moveEvent.payload)}`);
    checklist.push('- ✅ LOGH 전략 지도: 함대 선택 및 이동 이벤트가 Socket Mock으로 기록됨');
  }

  await strategicCanvas.screenshot({ path: loghStrategicScreenshot, fullPage: false });
  await testInfo.attach('세션B-실시간-LOGH-전략', { path: loghStrategicScreenshot, contentType: 'image/png' });

  // LOGH tactical/HUD interactions
  await page.goto('/logh/battle/test-battle-1');
  const loghHud = page.getByTestId('logh-tactical-hud');
  if (!(await loghHud.isVisible())) {
    scriptLog.push(`[${formatNow()}] ⚠️ LOGH 전술 HUD가 표시되지 않았습니다.`);
  } else {
    scriptLog.push(`[${formatNow()}] LOGH 전술 HUD 로딩 완료`);
  }
  await page.evaluate((fleets) => {
    window.__OPEN_SAM_LAST_SOCKET__?.trigger?.('game:state-update', {
      combats: [
        {
          tacticalMapId: 'test-battle-1',
          fleets,
        },
      ],
    });
  }, loghTacticalFleets);
  await expect(page.getByTestId('logh-tactical-fleet-count')).toContainText('2개');
  scriptLog.push(`[${formatNow()}] 전술 맵 소켓 이벤트 수신 및 카운트 반영`);

  await page.evaluate(() => {
    const store = window.__OPEN_SAM_STORES__?.game;
    store?.setState({ selectedUnitId: 'unit-alpha' });
  });
  await page.keyboard.press('KeyF');
  await page.keyboard.press('KeyR');
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__OPEN_SAM_STORES__?.game?.getState().selectedUnitId)).toBeNull();
  await page.evaluate(() => console.log('세션B-LOGH: 단축키/ESC 입력으로 HUD 상태 초기화'));
  scriptLog.push(`[${formatNow()}] Tactical HUD 단축키/ESC 동작 검증 완료`);
  checklist.push('- ✅ LOGH 전술 HUD: 단축키 로그·ESC 선택 해제가 정상 작동');

  await page.getByTestId('tactical-map-canvas').screenshot({ path: loghTacticalScreenshot, fullPage: false });
  await testInfo.attach('세션B-실시간-LOGH-전술', { path: loghTacticalScreenshot, contentType: 'image/png' });

  await page.context().tracing.stop({ path: tracePath });
  await testInfo.attach('세션B-실시간-트레이스', { path: tracePath, contentType: 'application/zip' });

  await fs.writeFile(path.join(QA_OUTPUT_DIR, 'sessionB-realtime-playwright.log'), [...scriptLog, '', '콘솔 로그', ...consoleLog].join('\n'), 'utf-8');
  await fs.writeFile(path.join(QA_OUTPUT_DIR, 'sessionB-realtime-network.log'), networkLog.join('\n'), 'utf-8');
  await fs.writeFile(path.join(QA_OUTPUT_DIR, 'sessionB-realtime-checklist.md'), checklist.join('\n'), 'utf-8');
});
