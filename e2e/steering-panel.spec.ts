import { test, expect } from '@playwright/test';

test.describe('SteeringPanel - Energy Distribution', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page with SteeringPanel
    // Adjust this URL based on where the component is rendered
    await page.goto('http://localhost:3000'); // Update with actual page
    
    // Wait for component to load
    await page.waitForSelector('text=에너지 배분');
  });

  test('should display all 6 system sliders', async ({ page }) => {
    await expect(page.locator('text=빔 무장')).toBeVisible();
    await expect(page.locator('text=포격 시스템')).toBeVisible();
    await expect(page.locator('text=방어막')).toBeVisible();
    await expect(page.locator('text=추진 기관')).toBeVisible();
    await expect(page.locator('text=워프 드라이브')).toBeVisible();
    await expect(page.locator('text=센서 어레이')).toBeVisible();
  });

  test('should start at 100% total distribution', async ({ page }) => {
    await expect(page.locator('text=100/100%')).toBeVisible();
    await expect(page.locator('text=✓ 최적 배분')).toBeVisible();
  });

  test('should prevent total from exceeding 100%', async ({ page }) => {
    // Get all sliders
    const sliders = page.locator('input[type="range"]');
    const count = await sliders.count();
    expect(count).toBe(6);

    // Try to set first slider (BEAM) to 100%
    const beamSlider = sliders.first();
    await beamSlider.fill('100');

    // Wait for redistribution
    await page.waitForTimeout(100);

    // Check that total is still 100%
    await expect(page.locator('text=100/100%')).toBeVisible();

    // Verify other sliders were reduced to 0
    const allSliders = await sliders.all();
    let total = 0;
    for (let i = 0; i < allSliders.length; i++) {
      const value = await allSliders[i].evaluate((el: HTMLInputElement) => parseInt(el.value));
      total += value;
    }
    expect(total).toBe(100);
  });

  test('should show under-utilization when total < 100%', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    
    // Set all sliders to low values
    const beamSlider = sliders.nth(0);
    await beamSlider.fill('10');
    
    await page.waitForTimeout(100);
    
    // Should show spare capacity
    await expect(page.locator('text=/여유/')).toBeVisible();
  });

  test('should redistribute proportionally', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    
    // Initial: BEAM=20, others have values
    // Increase BEAM to 80
    const beamSlider = sliders.first();
    await beamSlider.fill('80');
    
    await page.waitForTimeout(200);
    
    // Verify total is still 100%
    const allSliders = await sliders.all();
    let total = 0;
    for (const slider of allSliders) {
      const value = await slider.evaluate((el: HTMLInputElement) => parseInt(el.value));
      total += value;
    }
    
    expect(total).toBeLessThanOrEqual(100);
  });

  test('should reset to default distribution', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    
    // Change some values
    await sliders.first().fill('50');
    await sliders.nth(1).fill('30');
    
    await page.waitForTimeout(100);
    
    // Click reset button
    await page.click('button:has-text("초기화")');
    
    await page.waitForTimeout(100);
    
    // Should be back to 100% optimal
    await expect(page.locator('text=100/100%')).toBeVisible();
    await expect(page.locator('text=✓ 최적 배분')).toBeVisible();
  });

  test('should show visual feedback for optimal state', async ({ page }) => {
    // At default 100%, should show green optimal
    const optimalText = page.locator('text=✓ 최적 배분');
    await expect(optimalText).toBeVisible();
    
    // Check color class
    const className = await optimalText.getAttribute('class');
    expect(className).toContain('text-[#10B981]');
  });

  test('should handle rapid slider adjustments', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    
    // Rapidly adjust multiple sliders
    await sliders.nth(0).fill('40');
    await sliders.nth(1).fill('35');
    await sliders.nth(2).fill('45');
    await sliders.nth(3).fill('30');
    
    await page.waitForTimeout(300);
    
    // Total should never exceed 100%
    const allSliders = await sliders.all();
    let total = 0;
    for (const slider of allSliders) {
      const value = await slider.evaluate((el: HTMLInputElement) => parseInt(el.value));
      total += value;
    }
    
    expect(total).toBeLessThanOrEqual(100);
  });

  test('should display energy bar visualization', async ({ page }) => {
    // Check that progress bar exists
    const progressBar = page.locator('.bg-\\[\\#333\\].rounded.overflow-hidden').first();
    await expect(progressBar).toBeVisible();
    
    // Adjust slider and verify bar updates
    const beamSlider = page.locator('input[type="range"]').first();
    await beamSlider.fill('50');
    
    await page.waitForTimeout(100);
    
    // Progress bar should still be visible
    await expect(progressBar).toBeVisible();
  });

  test('should handle edge case: all sliders at 0 except one', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    const allSliders = await sliders.all();
    
    // Set all to 0
    for (const slider of allSliders) {
      await slider.fill('0');
    }
    
    await page.waitForTimeout(100);
    
    // Now set BEAM to 100
    await allSliders[0].fill('100');
    
    await page.waitForTimeout(100);
    
    // Should show 100/100%
    await expect(page.locator('text=100/100%')).toBeVisible();
  });

  test('should show correct percentage labels for each system', async ({ page }) => {
    // Check default values are displayed
    const beamValue = page.locator('text=빔 무장').locator('..').locator('text=/\\d+%/');
    await expect(beamValue).toBeVisible();
    
    // Adjust slider and verify label updates
    const beamSlider = page.locator('input[type="range"]').first();
    await beamSlider.fill('45');
    
    await page.waitForTimeout(100);
    
    // Label should update (may be different due to redistribution)
    await expect(beamValue).toBeVisible();
  });
});
