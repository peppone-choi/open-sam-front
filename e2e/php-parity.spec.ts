import { test, expect } from '@playwright/test';

// E2E focus: verify that the battle UI can display
// backend parity results (PHP vs TS) and that a
// simple end-to-end flow remains stable.

test.describe('PHP Battle Parity (UI level)', () => {
  test('battle UI renders parity-checked result summary', async ({ page }) => {
    // Mock battle state (pre-combat)
    await page.route('**/api/battle/state/**', async (route) => {
      await route.fulfill({
        json: {
          result: true,
          data: {
            battleId: 'php-parity-001',
            phase: 'completed',
            turn: 6,
            maxTurns: 20,
            attackers: [
              {
                generalId: 'gen-a',
                name: '관우',
                leadership: 90,
                strength: 95,
                intelligence: 80,
                troops: 1200,
                maxTroops: 1500,
                morale: 95,
                formation: 'crane',
                status: 'completed',
              },
            ],
            defenders: [
              {
                generalId: 'gen-d',
                name: '장료',
                leadership: 88,
                strength: 92,
                intelligence: 78,
                troops: 0,
                maxTroops: 1400,
                morale: 10,
                formation: 'fish_scale',
                status: 'defeated',
              },
            ],
            terrain: 'plains',
            weather: 'clear',
            logs: [],
          },
        },
      });
    });

    // Mock battle result payload that already embeds
    // PHP vs TS parity information from backend.
    await page.route('**/api/battle/result/**', async (route) => {
      await route.fulfill({
        json: {
          result: true,
          data: {
            battleId: 'php-parity-001',
            winner: 'attacker',
            turns: 6,
            casualties: {
              attacker: 350,
              defender: 1400,
            },
            parity: {
              phpWinner: 'attacker',
              tsWinner: 'attacker',
              phpCasualties: { attacker: 360, defender: 1390 },
              tsCasualties: { attacker: 350, defender: 1400 },
              parityPercent: 98.5,
            },
            logs: [
              { turn: 6, phase: 'end', message: '전투가 종료되었습니다. 공격측 승리!' },
            ],
          },
        },
      });
    });

    await page.goto('/battle/php-parity-001');

    // Basic battle container/phase/result rendering still works.
    await expect(page.getByTestId('battle-container')).toBeVisible();
    const phaseIndicator = page.getByTestId('battle-phase-indicator');
    await expect(phaseIndicator).toContainText('완료');

    const resultScreen = page.getByTestId('battle-result-screen');
    await expect(resultScreen).toBeVisible();
    await expect(resultScreen).toContainText('승리');

    // UI should at least surface casualties from the
    // backend result payload.
    await expect(resultScreen).toContainText('350');
    await expect(resultScreen).toContainText('1400');
  });

  // High-level skeletons for future, deeper parity checks.

  test.skip('command reserve → execute → battle log parity check', async ({ page }) => {
    // Intended flow:
    // 1. Navigate to command reservation UI.
    // 2. Reserve an attack command that triggers a battle.
    // 3. Let backend run PHP+TS parity check for that battle.
    // 4. Validate that the command log surface shows a
    //    parity status (e.g. ≥ 95%) alongside the battle result.
    await page.goto('/commands');
    void page;
  });

  test.skip('city conquest result → diplomacy UI reflection', async ({ page }) => {
    // Intended flow:
    // 1. Start from a battle that can capture a city.
    // 2. Backend applies conquest + diplomacy updates
    //    using the shared battle pipeline.
    // 3. Verify that the map/diplomacy UI reflects
    //    new ownership and relation state consistent
    //    with the backend parity-checked result.
    await page.goto('/map/recent');
    void page;
  });
});
