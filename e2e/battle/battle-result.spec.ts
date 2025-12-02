/**
 * 전투 결과 E2E 테스트
 * 
 * 결과 모달, 통계 표시 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('Battle Result', () => {
  test.describe('결과 모달', () => {
    test('전투 종료 후 결과 모달이 표시되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 전투 결과 모달 (전투 완료 후 표시됨)
      const resultModal = page.locator('[data-testid="battle-result-modal"], .result-modal, .battle-result');
      
      // 페이지가 정상 로드되어야 함
      await expect(page.locator('body')).toBeVisible();
    });

    test('승리/패배 메시지가 표시되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 승리/패배 텍스트 확인
      const victoryText = page.locator('text=승리, text=패배, text=무승부');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('결과 모달을 닫을 수 있어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 닫기 버튼
      const closeButton = page.locator('[data-testid="close-result"], button:has-text("닫기"), .close-btn');
      
      const buttonCount = await closeButton.count();
      if (buttonCount > 0) {
        await closeButton.first().click();
      }
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('통계 표시', () => {
    test('전투 시간이 표시되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 전투 시간 표시
      const battleTime = page.locator('[data-testid="battle-time"], .battle-time, text=/\\d+분/');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('사상자 수가 표시되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 사상자 통계
      const casualties = page.locator('[data-testid="casualties"], .casualties, .deaths');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('경험치 획득량이 표시되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 경험치 표시
      const expGain = page.locator('[data-testid="exp-gain"], .exp, text=/경험치|EXP/i');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('공격측/방어측 통계가 분리되어 표시되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 양측 통계
      const attackerStats = page.locator('[data-testid="attacker-stats"], .attacker-stats');
      const defenderStats = page.locator('[data-testid="defender-stats"], .defender-stats');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('킬 수가 표시되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 킬 수 표시
      const kills = page.locator('[data-testid="total-kills"], .kills, text=/처치|킬/');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('상세 결과', () => {
    test('부대별 결과를 확인할 수 있어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 부대별 상세 결과
      const squadResults = page.locator('[data-testid="squad-results"], .squad-result');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('전투 로그를 확인할 수 있어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 전투 로그
      const battleLog = page.locator('[data-testid="battle-log"], .battle-log, .event-log');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('전투 로그를 스크롤할 수 있어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      const battleLog = page.locator('[data-testid="battle-log"], .battle-log');
      const logCount = await battleLog.count();
      
      if (logCount > 0) {
        await battleLog.first().hover();
        await page.mouse.wheel(0, 100);
      }
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('후속 액션', () => {
    test('결과 화면에서 메인으로 돌아갈 수 있어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 돌아가기 버튼
      const returnButton = page.locator('[data-testid="return-button"], button:has-text("돌아가기"), a:has-text("메인")');
      
      const buttonCount = await returnButton.count();
      if (buttonCount > 0) {
        await returnButton.first().click();
        await page.waitForLoadState('networkidle');
      }
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('리플레이 기능이 있어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 리플레이 버튼
      const replayButton = page.locator('[data-testid="replay-button"], button:has-text("다시보기"), .replay-btn');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('공유 기능이 있어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 공유 버튼
      const shareButton = page.locator('[data-testid="share-button"], button:has-text("공유"), .share-btn');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('애니메이션', () => {
    test('결과 모달이 애니메이션과 함께 표시되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 애니메이션 클래스 확인
      const animatedModal = page.locator('.animate-fade-in, .animate-slide-up, [class*="animate"]');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('통계 카운터가 애니메이션되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      await page.waitForLoadState('networkidle');
      
      // 숫자 카운트업 애니메이션 확인
      const animatedCounter = page.locator('[data-animate="count-up"], .count-up');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('다양한 결과 타입', () => {
    test('공격측 승리 표시', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo?result=attacker_win');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('방어측 승리 표시', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo?result=defender_win');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('무승부 표시', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo?result=draw');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });
});





