import { test, expect } from '@playwright/test';

test.describe('Admin surfaces', () => {
  test('renders server dashboard cards and shortcuts', async ({ page }) => {
    await page.route('**/api/gateway/get-server-status', async (route) => {
      await route.fulfill({
        json: {
          result: true,
          server: [
            { color: '#ff6b00', korName: '테스트 1', name: 'test_01', exists: true, enable: true },
            { color: '#3399ff', korName: '베타 2', name: 'beta', exists: true, enable: false },
          ],
        },
      });
    });

    await page.route('**/api/gateway/get-user-info', async (route) => {
      await route.fulfill({
        json: {
          result: true,
          id: 'admin',
          name: '관리자',
          grade: '5',
          acl: 'super',
          picture: '',
          icon: null,
          global_salt: '',
          join_date: '2025-01-01',
          third_use: false,
          oauth_type: null,
          token_valid_until: null,
        },
      });
    });

    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: '관리자 패널' })).toBeVisible();
    const serverCards = page.locator('[data-testid^="server-card-"]');
    await expect(serverCards).toHaveCount(2);
    await expect(page.getByTestId('server-card-test_01')).toContainText('테스트 1');

    const globalLinks = page.getByTestId('global-admin-link');
    await expect(globalLinks).toHaveCount(3);
    await expect(globalLinks.first()).toContainText('사용자 관리');
  });

  test('shows formatted error log entries', async ({ page }) => {
    await page.route('**/api/admin/error-log', async (route) => {
      await route.fulfill({
        json: {
          result: true,
          errorLogs: [
            {
              date: '2025-11-21 02:10:00',
              errstr: 'TypeError: undefined is not a function',
              errpath: '/srv/core/api.php:140',
              trace: 'stack line 1\nstack line 2',
            },
          ],
        },
      });
    });

    await page.goto('/admin/error-log');

    await expect(page.getByRole('heading', { name: '에러 로그' })).toBeVisible();
    await expect(page.getByText('TypeError')).toBeVisible();
    await expect(page.getByRole('button', { name: '이전 100개' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '다음 100개' })).toBeEnabled();
  });
});
