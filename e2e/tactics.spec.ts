import { test, expect } from '@playwright/test';

test.describe('Tactical Map Interaction', () => {
  test('should load map and HUD', async ({ page }) => {
    await page.goto('/game/tactics/battle-1');

    // Verify Canvas
    await expect(page.getByTestId('tactical-map-canvas')).toBeVisible();

    // Verify HUD
    await expect(page.getByTestId('tactical-hud')).toBeVisible();
    await expect(page.getByText('RADAR ACTIVE')).toBeVisible();
    
    // Verify Shortcuts
    await expect(page.getByText('F: Move')).toBeVisible();
  });
});
