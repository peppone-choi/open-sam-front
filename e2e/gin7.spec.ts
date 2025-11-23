import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CommandType } from '../src/types/logh';
import { fullGin7Catalog, sampleAuthorityCardViews } from '../src/mocks/fullGin7Catalog';

const e2eJobCards = sampleAuthorityCardViews.slice(0, 4).map((card) => ({
  id: card.templateId,
  title: card.title,
  rankReq: card.rank,
  commands: card.commandCodes as CommandType[],
  commandCodes: card.commandCodes,
}));

const mockSession = {
  data: {
    profile: {
      id: '1',
      name: 'Yang',
      rank: 'Commodore',
      faction: 'alliance',
      pcp: 80,
      mcp: 120,
      maxPcp: 120,
      maxMcp: 150,
      jobCards: e2eJobCards,
    },
    cpRegenSeconds: 300,
    cards: sampleAuthorityCardViews,
    commandCatalog: fullGin7Catalog,
  },
};

const mockStrategy = {
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
      { id: 'fleet-1', name: '13th Fleet', faction: 'alliance', x: 1, y: 1, status: 'idle', cpLoad: { pcp: 10, mcp: 20 }, isFlagship: true },
    ],
  },
};

const mockPlans = {
  data: [
    {
      id: 'plan-1',
      objective: 'occupy',
      target: 'Astarte',
      plannedStart: '801-07-27 12:00',
      participants: ['Yang'],
      status: 'active',
      notes: 'テスト作戦',
    },
  ],
};

const mockTactical = {
  data: {
    units: [
      { id: 'flagship', name: 'Hyperion', type: 'flagship', hp: 9000, maxHp: 10000, energy: 80, maxEnergy: 100, position: { row: 10, col: 10 }, heading: 90, faction: 'alliance' },
    ],
    energy: { beam: 20, gun: 20, shield: 20, engine: 20, warp: 10, sensor: 10 },
    radarHeat: 0.5,
  },
};

const mockChat = {
  data: [
    { id: 'chat-1', channel: 'fleet', author: 'Yang', text: '테스트 메시지', timestamp: new Date().toISOString() },
  ],
};

const mockSessionSnapshot = {
  data: {
    sessionId: 's2-main',
    clock: {
      loopStats: {
        avgTickDurationMs: 320,
        maxTickDurationMs: 540,
        lastAlertAt: null,
      },
    },
  },
};

const mockStrategySnapshot = {
  data: {
    sessionId: 's2-main',
    map: {
      meta: {
        systemCount: 128,
        warpRouteCount: 54,
      },
    },
    clock: {
      loopStats: {
        avgTickDurationMs: 210,
        maxTickDurationMs: 360,
      },
      phase: 'strategic',
    },
    fleets: [
      { fleetId: 'fleet-1', name: '13th Fleet', status: 'idle', totalShips: 16000, morale: 95 },
    ],
    operationHotspots: [
      {
        operationId: 'op-1',
        code: 'OPS-01',
        status: 'ready',
        objectiveType: '점령',
        targetGrid: { x: 4, y: 2 },
        issuedAt: new Date().toISOString(),
        waitHours: 3,
      },
    ],
  },
};

const mockTelemetrySamples = {
  data: [
    { scene: 'strategy', avgFps: 58, cpuPct: 42, collectedAt: new Date().toISOString() },
    { scene: 'tactical', avgFps: 61, cpuPct: 47, collectedAt: new Date().toISOString() },
  ],
};

const QA_OUTPUT_DIR = path.resolve(__dirname, '../test-results/gin7');

async function mockGin7Routes(page: any) {
  await page.route('**/api/gin7/session**', (route: any) => route.fulfill({ json: mockSession }));
  await page.route('**/api/gin7/session/sessions/**', (route: any) => route.fulfill({ json: mockSessionSnapshot }));
  await page.route('**/api/gin7/strategy**', (route: any) => route.fulfill({ json: mockStrategy }));
  await page.route('**/api/gin7/strategy/sessions/**', (route: any) => route.fulfill({ json: mockStrategySnapshot }));
  await page.route('**/api/gin7/operations**', async (route: any, request: any) => {
    if (request.method() === 'POST') {
      const body = request.postDataJSON?.() ?? {};
      const response = {
        data: {
          id: body.id || 'plan-captured',
          objective: body.objective || 'occupy',
          target: body.target || 'Astarte',
          plannedStart: body.plannedStart || new Date().toISOString(),
          participants: body.participants || ['Yang'],
          status: body.status || 'draft',
          notes: body.notes,
        },
      };
      return route.fulfill({ json: response });
    }
    return route.fulfill({ json: mockPlans });
  });
  await page.route('**/api/gin7/tactical/energy**', async (route: any) => {
    route.fulfill({ json: { data: mockTactical.data.energy } });
  });
  await page.route('**/api/gin7/tactical**', (route: any) => route.fulfill({ json: mockTactical }));
  await page.route('**/api/gin7/chat**', (route: any) => route.fulfill({ json: mockChat }));
  await page.route('**/api/gin7/telemetry**', async (route: any, request: any) => {
    if (request.method() === 'POST') {
      return route.fulfill({ json: { success: true } });
    }
    const url = new URL(request.url());
    const limit = Number(url.searchParams.get('limit') ?? mockTelemetrySamples.data.length);
    const data = mockTelemetrySamples.data.slice(0, limit);
    return route.fulfill({ json: { data } });
  });
}

test.describe('GIN7 UI', () => {
  test.beforeEach(async ({ page }) => {
    await mockGin7Routes(page);
  });

  test('renders strategic map and panels', async ({ page }) => {
    await page.goto('/gin7');
    await expect(page.getByTestId('gin7-strategic-canvas')).toBeVisible();
    await expect(page.getByTestId('gin7-command-panel')).toBeVisible();
  });

  test('adjusts energy slider on tactical HUD', async ({ page }) => {
    await page.goto('/gin7');
    const hud = page.getByTestId('gin7-tactical-hud');
    await expect(hud).toBeVisible();
    const slider = hud.locator('input[type="range"]').first();
    await slider.focus();
    await slider.press('ArrowRight');
  });

  test('captures telemetry snapshot for QA evidence', async ({ page }, testInfo) => {
    await page.goto('/gin7');
    await page.waitForTimeout(6000);
    await fs.mkdir(QA_OUTPUT_DIR, { recursive: true });
    const screenshotPath = path.join(QA_OUTPUT_DIR, 'strategy.png');
    const telemetryPath = path.join(QA_OUTPUT_DIR, 'telemetry.json');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const telemetry = await page.evaluate(() => window.__gin7Telemetry ?? {});
    await fs.writeFile(telemetryPath, JSON.stringify(telemetry, null, 2), 'utf-8');
    testInfo.attachments.push({ name: 'gin7-strategy', path: screenshotPath, contentType: 'image/png' });
  });
});
