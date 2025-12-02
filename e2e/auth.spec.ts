import { test, expect } from '@playwright/test';

/**
 * 인증 플로우 E2E 테스트 (실제 페이지 구조 기반)
 * - 회원가입
 * - 로그인
 * - 로그아웃
 */

test.describe('인증 시스템', () => {
  test.describe('로그인 페이지', () => {
    test('로그인 페이지가 정상적으로 로드됨', async ({ page }) => {
      await page.goto('/');

      // 로그인 헤딩 확인
      await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
      
      // 입력 필드 확인
      await expect(page.getByRole('textbox', { name: '계정명' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: '비밀번호' })).toBeVisible();
      
      // 버튼 확인
      await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '카카오톡으로 로그인' })).toBeVisible();
    });

    test('빈 폼 제출 시 에러 표시', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('button', { name: '로그인', exact: true }).click();

      // 에러 메시지 확인 (특정 텍스트 포함)
      await expect(page.getByText('계정명과 비밀번호를 입력해주세요')).toBeVisible({ timeout: 5000 });
    });

    test('로그인 폼 입력 가능', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('textbox', { name: '계정명' }).fill('testuser');
      await page.getByRole('textbox', { name: '비밀번호' }).fill('password123');

      // 입력값 확인
      await expect(page.getByRole('textbox', { name: '계정명' })).toHaveValue('testuser');
      await expect(page.getByRole('textbox', { name: '비밀번호' })).toHaveValue('password123');
    });

    test('추가 옵션 드롭다운 동작', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('button', { name: '추가 옵션' }).click();

      // 회원가입 링크 확인
      await expect(page.getByRole('link', { name: '회원가입' })).toBeVisible();
      await expect(page.getByRole('link', { name: '비밀번호 초기화' })).toBeVisible();
    });
  });

  test.describe('회원가입 페이지', () => {
    test('회원가입 페이지가 정상적으로 로드됨', async ({ page }) => {
      await page.goto('/register');

      // 회원가입 헤딩 확인
      await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
      
      // 필수 입력 필드 확인
      await expect(page.getByRole('textbox', { name: '계정명 *' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: '비밀번호 *' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: '비밀번호 확인 *' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: '닉네임 *' })).toBeVisible();
      
      // 약관 동의 체크박스 확인
      await expect(page.getByRole('checkbox', { name: '이용 약관에 동의합니다' })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: '개인정보 제공 및 이용에 동의합니다' })).toBeVisible();
      
      // 가입하기 버튼 확인
      await expect(page.getByRole('button', { name: '가입하기' })).toBeVisible();
    });

    test('회원가입 폼 입력 및 체크박스 선택', async ({ page }) => {
      await page.goto('/register');

      // 폼 입력
      await page.getByRole('textbox', { name: '계정명 *' }).fill('newuser');
      await page.getByRole('textbox', { name: '비밀번호 *' }).fill('password123');
      await page.getByRole('textbox', { name: '비밀번호 확인 *' }).fill('password123');
      await page.getByRole('textbox', { name: '닉네임 *' }).fill('테스트닉네임');

      // 체크박스 선택
      await page.getByRole('checkbox', { name: '이용 약관에 동의합니다' }).check();
      await page.getByRole('checkbox', { name: '개인정보 제공 및 이용에 동의합니다' }).check();

      // 입력값 및 체크 상태 확인
      await expect(page.getByRole('textbox', { name: '계정명 *' })).toHaveValue('newuser');
      await expect(page.getByRole('checkbox', { name: '이용 약관에 동의합니다' })).toBeChecked();
      await expect(page.getByRole('checkbox', { name: '개인정보 제공 및 이용에 동의합니다' })).toBeChecked();
    });

    test('로그인 페이지로 돌아가기', async ({ page }) => {
      await page.goto('/register');

      await page.getByRole('link', { name: '로그인' }).click();

      await expect(page).toHaveURL('/');
    });
  });

  test.describe('네비게이션', () => {
    test('로그인 페이지에서 회원가입으로 이동', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('button', { name: '추가 옵션' }).click();
      await page.getByRole('link', { name: '회원가입' }).click();

      await expect(page).toHaveURL('/register');
    });

    test('회원가입 페이지에서 로그인으로 이동', async ({ page }) => {
      await page.goto('/register');

      // 페이지 하단의 로그인 링크 클릭
      await page.getByRole('link', { name: '로그인', exact: true }).click();

      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('OpenSAM 로고 클릭시 메인으로 이동', async ({ page }) => {
      await page.goto('/register');

      await page.getByRole('link', { name: '오픈삼국 OpenSAM' }).click();

      await expect(page).toHaveURL('/');
    });
  });
});

test.describe('접근성', () => {
  test('본문으로 바로가기 링크 존재', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.getByRole('link', { name: '본문으로 바로가기' });
    await expect(skipLink).toBeAttached();
  });

  test('폼 필드에 레이블 연결됨', async ({ page }) => {
    await page.goto('/');

    // 계정명 필드에 포커스
    await page.getByRole('textbox', { name: '계정명' }).focus();
    await expect(page.getByRole('textbox', { name: '계정명' })).toBeFocused();
  });
});

