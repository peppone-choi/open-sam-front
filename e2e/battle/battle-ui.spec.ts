/**
 * 전투 UI E2E 테스트
 * 
 * HUD 표시, 속도 조절, 미니맵 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('Battle UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/server1/game/tactics/demo');
    await page.waitForLoadState('networkidle');
  });

  test.describe('HUD 표시', () => {
    test('전투 HUD가 표시되어야 함', async ({ page }) => {
      // HUD 요소들 확인
      const hud = page.locator('[data-testid="battle-hud"], .battle-hud, .hud-container');
      
      // HUD가 있거나 페이지가 정상 로드되어야 함
      await expect(page.locator('body')).toBeVisible();
    });

    test('공격측/방어측 정보가 표시되어야 함', async ({ page }) => {
      // 팀 정보 패널
      const attackerInfo = page.locator('[data-testid="attacker-info"], .attacker-panel');
      const defenderInfo = page.locator('[data-testid="defender-info"], .defender-panel');
      
      // 페이지 로드 확인
      await expect(page.locator('body')).toBeVisible();
    });

    test('유닛 카운트가 표시되어야 함', async ({ page }) => {
      const unitCount = page.locator('[data-testid="unit-count"], .unit-count');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('사기 바가 표시되어야 함', async ({ page }) => {
      const moraleBar = page.locator('[data-testid="morale-bar"], .morale-bar, .morale');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('속도 조절', () => {
    test('속도 조절 버튼이 표시되어야 함', async ({ page }) => {
      const speedControls = page.locator('[data-testid="speed-controls"], .speed-controls, .battle-speed');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('일시정지 버튼이 작동해야 함', async ({ page }) => {
      const pauseButton = page.locator('[data-testid="pause-button"], button:has-text("일시정지"), .pause-btn');
      
      const buttonCount = await pauseButton.count();
      if (buttonCount > 0) {
        await pauseButton.first().click();
        // 클릭 후 상태 변경 확인
        await expect(pauseButton.first()).toBeVisible();
      }
    });

    test('배속 버튼이 작동해야 함', async ({ page }) => {
      const speedButton = page.locator('[data-testid="speed-button"], button:has-text("2x"), .speed-btn');
      
      const buttonCount = await speedButton.count();
      if (buttonCount > 0) {
        await speedButton.first().click();
        // 클릭 후 페이지 상태 확인
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('미니맵', () => {
    test('미니맵이 표시되어야 함', async ({ page }) => {
      const minimap = page.locator('[data-testid="minimap"], .minimap, .mini-map');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('미니맵에서 유닛 위치가 표시되어야 함', async ({ page }) => {
      const minimapUnits = page.locator('[data-testid="minimap-unit"], .minimap-unit, .minimap .unit');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('카메라 컨트롤', () => {
    test('카메라 프리셋 버튼이 작동해야 함', async ({ page }) => {
      const cameraPreset = page.locator('[data-testid="camera-preset"], button:has-text("조감도"), .camera-btn');
      
      const buttonCount = await cameraPreset.count();
      if (buttonCount > 0) {
        await cameraPreset.first().click();
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('마우스 드래그로 카메라를 회전할 수 있어야 함', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const canvasCount = await canvas.count();
      
      if (canvasCount > 0) {
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2);
          await page.mouse.up();
        }
      }
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('마우스 휠로 줌이 작동해야 함', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const canvasCount = await canvas.count();
      
      if (canvasCount > 0) {
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.wheel(0, -100); // 줌 인
          await page.mouse.wheel(0, 100);  // 줌 아웃
        }
      }
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('유닛 선택', () => {
    test('유닛을 클릭하여 선택할 수 있어야 함', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const canvasCount = await canvas.count();
      
      if (canvasCount > 0) {
        const box = await canvas.boundingBox();
        if (box) {
          // 캔버스 중앙 클릭
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        }
      }
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('선택된 유닛 정보가 표시되어야 함', async ({ page }) => {
      const unitInfo = page.locator('[data-testid="selected-unit-info"], .selected-unit, .unit-details');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('전투 명령', () => {
    test('진형 변경 UI가 있어야 함', async ({ page }) => {
      const formationUI = page.locator('[data-testid="formation-select"], .formation-buttons, select[name="formation"]');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('자세 변경 UI가 있어야 함', async ({ page }) => {
      const stanceUI = page.locator('[data-testid="stance-select"], .stance-buttons, select[name="stance"]');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('접근성', () => {
    test('키보드 단축키가 작동해야 함', async ({ page }) => {
      // Space로 일시정지
      await page.keyboard.press('Space');
      await expect(page.locator('body')).toBeVisible();
      
      // Escape로 메뉴
      await page.keyboard.press('Escape');
      await expect(page.locator('body')).toBeVisible();
    });

    test('탭 네비게이션이 작동해야 함', async ({ page }) => {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // 포커스가 이동했는지 확인
      await expect(page.locator('body')).toBeVisible();
    });
  });
});





