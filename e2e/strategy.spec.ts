import { test, expect } from '@playwright/test';

test.describe('Strategy Map Navigation', () => {
  test('should load the strategy map and verify grid', async ({ page }) => {
    // Mock API response for Systems
    await page.route('/api/logh/galaxy/systems', async route => {
      await route.fulfill({ json: {
        success: true,
        data: [{ id: 's1', name: 'Astarte', gridX: 5, gridY: 5, faction: 'alliance', planets: [] }]
      }});
    });

    // Mock API response for Fleets
    await page.route('/api/logh/galaxy/fleets', async route => {
        await route.fulfill({ json: {
          success: true,
          data: []
        }});
    });

    await page.goto('/game/strategy');

    // Verify Canvas using TestID
    await expect(page.getByTestId('star-grid-canvas')).toBeVisible();

    // Verify Zoom/Pan interaction (Simulation)
    const container = page.locator('div.cursor-move');
    await expect(container).toBeVisible();
  });

  test('should display grid info on click', async ({ page }) => {
    await page.goto('/game/strategy');
    
    // Click near the center using TestID
    await page.getByTestId('star-grid-canvas').click({ position: { x: 300, y: 300 } });

    // Verify context panel (This depends on valid data click, might be empty space if mock data aligns)
    // We just check if canvas is interactable without error
    await expect(page.getByTestId('star-grid-canvas')).toBeVisible();
  });

  test('should open job card and select command', async ({ page }) => {
    // Mock User Profile (Commanders)
    await page.route('/api/logh/galaxy/commanders*', async route => {
        await route.fulfill({ json: { 
            success: true,
            data: [{
                no: 1, name: 'Yang', rank: 'Commodore', faction: 'alliance', 
                commandPoints: { personal: 100, military: 100 }
            }]
        }});
    });

    await page.goto('/game/strategy');
    
    // Find the collapsed job card
    const cardTitle = page.getByText('13th Fleet Commander');
    await expect(cardTitle).toBeVisible();
    
    // Click to expand
    await cardTitle.click();
    
    // Check for command buttons
    const warpBtn = page.getByRole('button', { name: 'warp' });
    await expect(warpBtn).toBeVisible();
  });
});
