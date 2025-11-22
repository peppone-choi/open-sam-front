import { test, expect } from '@playwright/test';

test.describe('LOGH Module Navigation', () => {
  test('should navigate to game dashboard', async ({ page }) => {
    await page.goto('/logh/game');
    await expect(page).toHaveTitle(/은하영웅전설/); // Assuming title or heading check
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
    // Check for mock data presence
    await expect(page.getByText('Yang Wen-li')).toBeVisible();
  });

  test('should load battle simulation', async ({ page }) => {
    await page.goto('/logh/battle/test-battle-1');
    await expect(page.getByText('BATTLE #test-b')).toBeVisible();
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
