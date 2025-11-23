import { test, expect } from '@playwright/test';

const mockCommanderInfo = {
  no: 1,
  name: '양 웬리',
  faction: 'alliance',
  rank: '제독',
  stats: {
    command: 95,
    tactics: 92,
    strategy: 90,
    politics: 60,
  },
  commandPoints: 12,
  supplies: 5200,
  fleetId: 'mock-fleet-1',
  position: { x: 12, y: 24, z: 1 },
};

const mockCommanderList = {
  data: [
    {
      no: 1,
      name: '양 웬리',
      faction: 'alliance',
      rank: '제독',
      commandPoints: { personal: 80, military: 70 },
    },
  ],
};

const mockFleetInfo = {
  data: {
    id: 'mock-fleet-1',
    commanderName: '양 웬리',
    faction: 'alliance',
    gridX: 10,
    gridY: 10,
    size: 5000,
    status: 'idle',
    formation: 'standard',
    morale: 95,
    supplies: 8200,
    ammo: 7500,
    ships: [],
  },
};

const mockBattleState = {
  id: 'test-battle-1',
  turn: 1,
  phase: 'planning',
  fleets: [
    { fleetId: 'f1', name: '제 13 함대', faction: 'alliance', totalShips: 5000 },
    { fleetId: 'f2', name: '은하제국 함대', faction: 'empire', totalShips: 8000 },
  ],
};

async function mockLoghRoutes(page: any) {
  await page.route('**/api/logh/**', async (route: any, request: any) => {
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname.endsWith('/my-commander')) {
      return route.fulfill({ json: mockCommanderInfo });
    }

    if (pathname.endsWith('/fleet/mock-fleet-1')) {
      return route.fulfill({ json: mockFleetInfo.data });
    }

    if (pathname.endsWith('/fleet/my')) {
      return route.fulfill({ json: mockFleetInfo });
    }

    if (pathname.includes('/galaxy/commanders')) {
      return route.fulfill({ json: mockCommanderList });
    }

    if (pathname.includes('/command/execute')) {
      return route.fulfill({ json: { success: true, message: '명령 접수 완료' } });
    }

    if (pathname.includes('/galaxy/tactical-battles/') && !pathname.endsWith('/resolve')) {
      const battleId = pathname.split('/').pop() ?? 'test-battle-1';
      return route.fulfill({ json: { data: { ...mockBattleState, id: battleId } } });
    }

    if (pathname.endsWith('/galaxy/systems') || pathname.endsWith('/galaxy/fleets')) {
      return route.fulfill({ json: { data: [] } });
    }

    return route.fulfill({ json: { success: true } });
  });
}

test.describe('LOGH Module Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockLoghRoutes(page);
  });

  test('should navigate to game dashboard', async ({ page }) => {
    await page.goto('/logh/game');
    await expect(page).toHaveTitle(/은하영웅전설/);
    await expect(page.locator('h1')).toContainText('은하영웅전설');
  });

  test('should navigate to commander info', async ({ page }) => {
    await page.goto('/logh/info/me');
    await expect(page.getByText('내 제독 정보')).toBeVisible();
  });

  test('should navigate to commands page', async ({ page }) => {
    await page.goto('/logh/commands');
    await expect(page.getByText('작전 커맨드 센터')).toBeVisible();
    await expect(page.getByText('함대 이동')).toBeVisible();
  });

  test('should navigate to fleet page', async ({ page }) => {
    await page.goto('/logh/fleet');
    await expect(page.getByText('함대 관리')).toBeVisible();
    await expect(page.getByText('총 함선')).toBeVisible();
    await expect(page.getByText('양 웬리')).toBeVisible();
  });

  test('should load battle simulation', async ({ page }) => {
    await page.goto('/logh/battle/test-battle-1');
    await expect(page.getByText('전투 #test-b')).toBeVisible();
    await expect(page.getByTestId('tactical-map-canvas')).toBeVisible();
    await expect(page.getByTestId('tactical-hud')).toBeVisible();
  });

  test('should navigate to galaxy info page', async ({ page }) => {
    await page.goto('/logh/info/galaxy');
    await expect(page.getByText('은하 지도 정보')).toBeVisible();
    await expect(page.getByText('세력 현황')).toBeVisible();
    await expect(page.getByTestId('star-grid-canvas')).toBeVisible();
  });
});
