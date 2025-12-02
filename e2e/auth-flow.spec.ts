import { test, expect } from '@playwright/test';

/**
 * 인증 플로우 E2E 테스트
 * - 회원가입
 * - 로그인
 * - 로그아웃
 * - 세션 관리
 * - 권한 체크
 */

async function mockAuthRoutes(page: any) {
  // 회원가입
  await page.route('**/api/auth/register', async (route: any, request: any) => {
    const body = await request.postDataJSON();
    
    if (body.username === 'existing_user') {
      return route.fulfill({
        status: 400,
        json: { result: false, error: '이미 존재하는 아이디입니다.' },
      });
    }
    
    if (body.password.length < 6) {
      return route.fulfill({
        status: 400,
        json: { result: false, error: '비밀번호는 6자 이상이어야 합니다.' },
      });
    }

    await route.fulfill({
      json: {
        result: true,
        message: '회원가입이 완료되었습니다.',
        user: { id: 'user-001', username: body.username },
      },
    });
  });

  // 로그인
  await page.route('**/api/auth/login', async (route: any, request: any) => {
    const body = await request.postDataJSON();

    if (body.username === 'testuser' && body.password === 'password123') {
      await route.fulfill({
        json: {
          result: true,
          token: 'mock-jwt-token-12345',
          user: { id: 'user-001', username: 'testuser' },
        },
      });
    } else {
      await route.fulfill({
        status: 401,
        json: { result: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
      });
    }
  });

  // 로그아웃
  await page.route('**/api/auth/logout', async (route: any) => {
    await route.fulfill({ json: { result: true, message: '로그아웃 되었습니다.' } });
  });

  // 토큰 검증
  await page.route('**/api/auth/verify', async (route: any, request: any) => {
    const authHeader = request.headers()['authorization'];
    
    if (authHeader === 'Bearer mock-jwt-token-12345') {
      await route.fulfill({
        json: { result: true, user: { id: 'user-001', username: 'testuser' } },
      });
    } else {
      await route.fulfill({
        status: 401,
        json: { result: false, error: '유효하지 않은 토큰입니다.' },
      });
    }
  });

  // 세션 목록
  await page.route('**/api/session/list', async (route: any) => {
    await route.fulfill({
      json: {
        result: true,
        sessions: [
          { id: 'session-1', name: '삼국지 시즌1', status: 'active', players: 50 },
          { id: 'session-2', name: '삼국지 시즌2', status: 'preparing', players: 20 },
        ],
      },
    });
  });
}

test.describe('인증 시스템', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthRoutes(page);
  });

  test.describe('회원가입', () => {
    test('회원가입 성공', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="username-input"]', 'newuser');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="password-confirm-input"]', 'password123');
      await page.fill('[data-testid="email-input"]', 'newuser@test.com');

      await page.click('[data-testid="register-btn"]');

      await expect(page.locator('text=회원가입이 완료')).toBeVisible({ timeout: 5000 });
      // 로그인 페이지로 이동
      await expect(page).toHaveURL(/\/login/);
    });

    test('중복 아이디 오류', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="username-input"]', 'existing_user');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="password-confirm-input"]', 'password123');

      await page.click('[data-testid="register-btn"]');

      await expect(page.locator('text=이미 존재하는 아이디')).toBeVisible({ timeout: 5000 });
    });

    test('비밀번호 확인 불일치', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="username-input"]', 'newuser');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="password-confirm-input"]', 'different');

      await page.click('[data-testid="register-btn"]');

      await expect(page.locator('text=비밀번호가 일치하지 않습니다')).toBeVisible();
    });

    test('비밀번호 길이 제한', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="username-input"]', 'newuser');
      await page.fill('[data-testid="password-input"]', '12345'); // 5자
      await page.fill('[data-testid="password-confirm-input"]', '12345');

      await page.click('[data-testid="register-btn"]');

      await expect(page.locator('text=6자 이상')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('로그인', () => {
    test('로그인 성공', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="password-input"]', 'password123');

      await page.click('[data-testid="login-btn"]');

      // 세션 선택 페이지로 이동
      await expect(page).toHaveURL(/\/sessions/, { timeout: 5000 });
    });

    test('로그인 실패 - 잘못된 비밀번호', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');

      await page.click('[data-testid="login-btn"]');

      await expect(page.locator('text=아이디 또는 비밀번호가 올바르지 않습니다')).toBeVisible({ timeout: 5000 });
    });

    test('로그인 후 토큰 저장', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-btn"]');

      await expect(page).toHaveURL(/\/sessions/, { timeout: 5000 });

      // localStorage에 토큰 저장 확인
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBe('mock-jwt-token-12345');
    });
  });

  test.describe('로그아웃', () => {
    test('로그아웃 성공', async ({ page }) => {
      // 로그인 상태 시뮬레이션
      await page.goto('/login');
      await page.evaluate(() => {
        localStorage.setItem('token', 'mock-jwt-token-12345');
      });

      await page.goto('/sessions');

      // 로그아웃 버튼 클릭
      await page.click('[data-testid="logout-btn"]');

      // 로그인 페이지로 이동
      await expect(page).toHaveURL(/\/login/);

      // 토큰 삭제 확인
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });
  });

  test.describe('세션 관리', () => {
    test('세션 선택 후 게임 입장', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('token', 'mock-jwt-token-12345');
      });

      await page.goto('/sessions');

      // 세션 목록 표시
      await expect(page.locator('text=삼국지 시즌1')).toBeVisible();
      await expect(page.locator('text=삼국지 시즌2')).toBeVisible();

      // 세션 선택
      await page.click('[data-testid="session-session-1"]');

      // 게임 페이지 또는 장수 생성 페이지로 이동
      await expect(page).toHaveURL(/session-1/);
    });
  });

  test.describe('권한 체크', () => {
    test('미인증 상태로 게임 페이지 접근 시 리다이렉트', async ({ page }) => {
      await page.goto('/session-1/game');

      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/login/);
    });

    test('만료된 토큰으로 접근 시 리다이렉트', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('token', 'expired-token');
      });

      await page.goto('/session-1/game');

      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

test.describe('자동 로그인', () => {
  test('유효한 토큰으로 자동 로그인', async ({ page }) => {
    await page.route('**/api/auth/verify', async (route: any) => {
      await route.fulfill({
        json: { result: true, user: { id: 'user-001', username: 'testuser' } },
      });
    });

    await page.evaluate(() => {
      localStorage.setItem('token', 'valid-token');
    });

    await page.goto('/');

    // 세션 선택 페이지로 이동 (이미 로그인됨)
    await expect(page).toHaveURL(/\/sessions/);
  });
});




