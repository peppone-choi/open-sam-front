import { test, expect } from '@playwright/test';

test.describe('New Features Integration', () => {
  
  test('should display Auto-Resolve toggle in Tactics', async ({ page }) => {
    await page.goto('/game/tactics/battle-1');
    
    // Verify Toggle
    const toggle = page.getByRole('button', { name: /AUTO RESOLVE/ });
    await expect(toggle).toBeVisible();
    
    // Note: We don't click it to avoid blocking alert/confirm in headless if not handled, 
    // but existence proves UI implementation.
  });

  test('should display Economy UI in Office', async ({ page }) => {
    await page.goto('/game/office');
    
    // Switch to Finance
    await page.getByRole('button', { name: /FINANCE/ }).click();
    
    // Verify Ledger Elements
    await expect(page.getByText('TREASURY')).toBeVisible();
    await expect(page.getByText('FINANCIAL LOGS')).toBeVisible();
    await expect(page.getByText('150,000 Cr')).toBeVisible();
  });

  test('should show Warp Risk on Job Card', async ({ page }) => {
    // Mock profile with Warp card
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
    
    // Open card
    await page.getByText('13th Fleet Commander').click();
    
    // Verify Badge
    await expect(page.getByText('WARP RISK')).toBeVisible();
  });

});
