import { test, expect } from '@playwright/test';

test.describe('Office & Personnel UI', () => {
  test('should switch tabs correctly', async ({ page }) => {
    await page.goto('/game/office');

    // Check default tab (인사)
    await expect(page.getByRole('button', { name: '인사 (人事)' })).toHaveClass(/text-\[#FFD700\]/);
    await expect(page.getByText('승진 단계')).toBeVisible();

    // Click Logistics
    await page.getByRole('button', { name: '병참 (兵站)' }).click();
    await expect(page.getByText('생산 효율')).toBeVisible();

    // Click Finance
    await page.getByRole('button', { name: '재정 (財務)' }).click();
    await expect(page.getByText('재정 기록')).toBeVisible();
  });

  test('should display promotion ladder mock data', async ({ page }) => {
    await page.goto('/game/office');
    await expect(page.getByText('줄리안 민츠')).toBeVisible();
    await expect(page.getByText('소위')).toBeVisible();
  });
});
