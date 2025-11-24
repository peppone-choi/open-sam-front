import { test, expect } from '@playwright/test';

// 최소 모바일 스모크: 좁은 뷰포트에서 핵심 UI가 깨지지 않는지만 확인

test('mobile smoke - main layout and menu', async ({ page }) => {
  // 모바일 해상도 수준으로 뷰포트 설정 (iPhone 13 세로 기준 근사치)
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');

  // 메인 컨테이너가 렌더되는지 확인
  const appContainer = page.getByTestId('app-container');
  await expect(appContainer).toBeVisible();

  // 모바일 메뉴 버튼이 보여야 함 (헤더 우측 햄버거 등)
  const menuButton = page.getByRole('button', { name: /메뉴/ });
  await expect(menuButton).toBeVisible();

  // 메뉴를 열었을 때 드로어가 표시되는지만 확인
  await menuButton.click();
  const menuDrawer = page.getByTestId('mobile-menu-drawer');
  await expect(menuDrawer).toBeVisible();
});

