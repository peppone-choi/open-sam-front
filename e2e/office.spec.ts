import { test, expect } from '@playwright/test';

test.describe('Office & Personnel UI', () => {
  test('should switch tabs correctly', async ({ page }) => {
    await page.goto('/game/office');

    // Check default tab (Personnel)
    await expect(page.getByRole('button', { name: 'PERSONNEL (人事)' })).toHaveClass(/text-\[#FFD700\]/);
    await expect(page.getByText('PROMOTION LADDER')).toBeVisible();

    // Click Logistics
    await page.getByRole('button', { name: 'LOGISTICS (兵站)' }).click();
    await expect(page.getByText('Production Efficiency')).toBeVisible();

    // Click Finance
    await page.getByRole('button', { name: 'FINANCE (財務)' }).click();
    await expect(page.getByText('ECONOMY MODULE UNDER CONSTRUCTION')).toBeVisible();
  });

  test('should display promotion ladder mock data', async ({ page }) => {
    await page.goto('/game/office');
    await expect(page.getByText('Julian Mintz')).toBeVisible();
    await expect(page.getByText('Sub-Lieutenant')).toBeVisible();
  });
});
