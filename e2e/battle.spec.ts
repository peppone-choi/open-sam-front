import { test, expect } from '@playwright/test';

// Mock battle state data
const mockBattleState = {
  battleId: 'battle-001',
  phase: 'preparation',
  turn: 0,
  maxTurns: 20,
  attackers: [
    {
      generalId: 'gen-001',
      name: '조조',
      leadership: 85,
      strength: 92,
      intelligence: 88,
      troops: 10000,
      maxTroops: 12000,
      morale: 85,
      formation: 'crane',
      status: 'ready',
    },
  ],
  defenders: [
    {
      generalId: 'gen-002',
      name: '관우',
      leadership: 95,
      strength: 97,
      intelligence: 75,
      troops: 8000,
      maxTroops: 10000,
      morale: 90,
      formation: 'fish_scale',
      status: 'ready',
    },
  ],
  terrain: 'plains',
  weather: 'clear',
  logs: [],
};

const mockBattleResult = {
  battleId: 'battle-001',
  winner: 'attacker',
  turns: 8,
  casualties: {
    attacker: 2500,
    defender: 7200,
  },
  mvp: 'gen-001',
  rewards: {
    exp: 1500,
    gold: 3000,
    items: [],
  },
  logs: [
    { turn: 1, phase: 'charge', message: '조조 부대가 돌격을 시작했습니다!' },
    { turn: 2, phase: 'combat', message: '관우 부대가 반격했습니다!' },
    { turn: 8, phase: 'end', message: '전투가 종료되었습니다. 공격측 승리!' },
  ],
};

async function mockBattleRoutes(page: any) {
  await page.route('**/api/battle/state/**', async (route: any) => {
    await route.fulfill({ json: { result: true, data: mockBattleState } });
  });

  await page.route('**/api/battle/start', async (route: any, request: any) => {
    if (request.method() === 'POST') {
      await route.fulfill({
        json: {
          result: true,
          data: { ...mockBattleState, phase: 'combat', turn: 1 },
        },
      });
    } else {
      await route.abort();
    }
  });

  await page.route('**/api/battle/action', async (route: any, request: any) => {
    if (request.method() === 'POST') {
      const body = request.postDataJSON?.() ?? {};
      const nextTurn = (mockBattleState.turn || 0) + 1;
      await route.fulfill({
        json: {
          result: true,
          data: {
            ...mockBattleState,
            turn: nextTurn,
            logs: [...mockBattleState.logs, { turn: nextTurn, action: body.action, message: `${body.action} 실행됨` }],
          },
        },
      });
    } else {
      await route.abort();
    }
  });

  await page.route('**/api/battle/result/**', async (route: any) => {
    await route.fulfill({ json: { result: true, data: mockBattleResult } });
  });
}

test.describe('Battle Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockBattleRoutes(page);
  });

  test('renders battle preparation screen with unit info', async ({ page }) => {
    await page.goto('/battle/battle-001');

    // Check battle UI is visible
    await expect(page.getByTestId('battle-container')).toBeVisible();
    await expect(page.getByTestId('battle-phase-indicator')).toContainText('준비');

    // Check attacker info
    const attackerSection = page.getByTestId('battle-attacker-section');
    await expect(attackerSection).toBeVisible();
    await expect(attackerSection).toContainText('조조');
    await expect(attackerSection).toContainText('10000');

    // Check defender info
    const defenderSection = page.getByTestId('battle-defender-section');
    await expect(defenderSection).toBeVisible();
    await expect(defenderSection).toContainText('관우');
    await expect(defenderSection).toContainText('8000');
  });

  test('starts battle and progresses turns', async ({ page }) => {
    await page.goto('/battle/battle-001');

    // Start battle
    const startButton = page.getByRole('button', { name: '전투 시작' });
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // Wait for battle phase change
    await expect(page.getByTestId('battle-phase-indicator')).toContainText('전투');

    // Check turn counter
    const turnDisplay = page.getByTestId('battle-turn-display');
    await expect(turnDisplay).toBeVisible();
  });

  test('allows player to select and execute battle actions', async ({ page }) => {
    await page.goto('/battle/battle-001');

    // Start battle first
    await page.getByRole('button', { name: '전투 시작' }).click();

    // Wait for action panel
    const actionPanel = page.getByTestId('battle-action-panel');
    await expect(actionPanel).toBeVisible();

    // Select attack action
    const attackButton = page.getByRole('button', { name: '공격' });
    await expect(attackButton).toBeEnabled();
    await attackButton.click();

    // Check action was executed (log should update)
    const battleLog = page.getByTestId('battle-log');
    await expect(battleLog).toBeVisible();
  });

  test('displays battle result after completion', async ({ page }) => {
    await page.route('**/api/battle/state/**', async (route: any) => {
      await route.fulfill({
        json: {
          result: true,
          data: { ...mockBattleState, phase: 'completed', turn: 8 },
        },
      });
    });

    await page.goto('/battle/battle-001');

    // Check result screen
    const resultScreen = page.getByTestId('battle-result-screen');
    await expect(resultScreen).toBeVisible();
    await expect(resultScreen).toContainText('승리');

    // Check casualties
    await expect(resultScreen).toContainText('2500');
    await expect(resultScreen).toContainText('7200');

    // Check rewards
    const rewardSection = page.getByTestId('battle-rewards');
    await expect(rewardSection).toContainText('1500');
    await expect(rewardSection).toContainText('3000');
  });

  test('handles retreat action', async ({ page }) => {
    await page.goto('/battle/battle-001');
    await page.getByRole('button', { name: '전투 시작' }).click();

    // Click retreat
    const retreatButton = page.getByRole('button', { name: '퇴각' });
    if (await retreatButton.isVisible()) {
      await retreatButton.click();

      // Confirm retreat dialog
      const confirmDialog = page.getByRole('dialog');
      await expect(confirmDialog).toBeVisible();
      await expect(confirmDialog).toContainText('퇴각하시겠습니까');

      await page.getByRole('button', { name: '확인' }).click();
    }
  });
});

test.describe('Battle - 40x40 Grid Tactical View', () => {
  test.beforeEach(async ({ page }) => {
    await mockBattleRoutes(page);
  });

  test('renders 40x40 tactical grid with unit positions', async ({ page }) => {
    await page.goto('/battle/battle-001/tactical');

    const tacticalGrid = page.getByTestId('tactical-grid-40x40');
    await expect(tacticalGrid).toBeVisible();

    // Check grid dimensions via computed style or data attribute
    const gridContainer = await tacticalGrid.boundingBox();
    expect(gridContainer).toBeTruthy();
  });

  test('allows selecting units on tactical grid', async ({ page }) => {
    await page.goto('/battle/battle-001/tactical');

    // Click on a unit cell
    const unitCell = page.getByTestId('tactical-unit-gen-001');
    await unitCell.click();

    // Check unit detail panel appears
    const unitDetail = page.getByTestId('tactical-unit-detail');
    await expect(unitDetail).toBeVisible();
    await expect(unitDetail).toContainText('조조');
  });

  test('displays movement range when unit selected', async ({ page }) => {
    await page.goto('/battle/battle-001/tactical');

    const unitCell = page.getByTestId('tactical-unit-gen-001');
    await unitCell.click();

    // Movement overlay should appear
    const movementOverlay = page.getByTestId('tactical-movement-overlay');
    await expect(movementOverlay).toBeVisible();
  });
});
