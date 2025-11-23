import { test, expect } from '@playwright/test';
import { LOGH_TEXT } from '../src/constants/uiText';

test.describe('Tactical Map Interaction', () => {
  test('should load map and HUD', async ({ page }) => {
    await page.goto('/game/tactics/battle-1');

    // Verify Canvas
    await expect(page.getByTestId('tactical-map-canvas')).toBeVisible();

    // Verify HUD
    await expect(page.getByTestId('tactical-hud')).toBeVisible();
    await expect(page.getByText(LOGH_TEXT.radarActive)).toBeVisible();
    
    // Verify Shortcuts (한글)
    for (const shortcut of LOGH_TEXT.shortcuts) {
      await expect(page.getByText(shortcut)).toBeVisible();
    }
  });
});
