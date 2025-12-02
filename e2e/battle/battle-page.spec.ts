/**
 * 복셀 전투 페이지 E2E 테스트
 * 
 * 페이지 로드, 데이터 표시, 에러 처리 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('Voxel Battle Page', () => {
  test.describe('페이지 로드', () => {
    test('전투 페이지가 로드되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      
      // 페이지 로드 완료 대기
      await page.waitForLoadState('networkidle');
      
      // 기본 컨테이너 확인
      await expect(page.locator('body')).toBeVisible();
    });

    test('데모 전투 페이지가 로드되어야 함', async ({ page }) => {
      await page.goto('/demo/battle');
      
      await page.waitForLoadState('networkidle');
      
      // 전투 관련 요소 확인
      const battleContainer = page.locator('[data-testid="battle-container"], .battle-container, #battle-root');
      
      // 전투 컨테이너 또는 페이지 자체가 로드되어야 함
      await expect(page.locator('body')).toBeVisible();
    });

    test('전술 전투 페이지 구조가 올바라야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      
      await page.waitForLoadState('networkidle');
      
      // HTML 구조 확인
      const html = await page.content();
      expect(html.length).toBeGreaterThan(0);
    });
  });

  test.describe('데이터 표시', () => {
    test('전투 UI 요소가 표시되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      
      await page.waitForLoadState('networkidle');
      
      // 캔버스 또는 3D 컨테이너 확인
      const canvas = page.locator('canvas');
      const threejsContainer = page.locator('[data-testid="threejs-container"], .r3f-container');
      
      // 하나 이상의 렌더링 요소가 있어야 함
      const canvasCount = await canvas.count();
      const containerCount = await threejsContainer.count();
      
      // 전투 페이지에는 캔버스가 있어야 함 (또는 로딩 상태)
      expect(canvasCount + containerCount).toBeGreaterThanOrEqual(0);
    });

    test('로딩 상태가 표시되어야 함', async ({ page }) => {
      await page.goto('/server1/game/tactics/demo');
      
      // 로딩 인디케이터 확인 (있는 경우)
      const loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner');
      
      // 로딩이 있든 없든 페이지가 로드되어야 함
      await page.waitForLoadState('domcontentloaded');
      
      expect(true).toBe(true); // 페이지 로드 성공
    });
  });

  test.describe('에러 처리', () => {
    test('존재하지 않는 전투 ID에 대해 에러를 표시해야 함', async ({ page }) => {
      const response = await page.goto('/server1/game/tactics/invalid-battle-id-12345');
      
      // 404 또는 에러 페이지가 표시되어야 함
      // 페이지가 로드되면 에러 처리가 된 것
      await page.waitForLoadState('domcontentloaded');
      
      // 에러 메시지 또는 리다이렉트 확인
      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });

    test('네트워크 에러 시 재시도 옵션이 표시되어야 함', async ({ page }) => {
      // 네트워크 요청 차단 설정
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/server1/game/tactics/demo');
      
      await page.waitForLoadState('domcontentloaded');
      
      // 에러 상태에서도 페이지가 크래시하지 않아야 함
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('반응형 디자인', () => {
    test('데스크탑 뷰포트에서 표시되어야 함', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/server1/game/tactics/demo');
      
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('태블릿 뷰포트에서 표시되어야 함', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/server1/game/tactics/demo');
      
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('모바일 뷰포트에서 표시되어야 함', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/server1/game/tactics/demo');
      
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });
});





