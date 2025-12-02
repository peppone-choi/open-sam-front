import { test, expect } from '@playwright/test';

/**
 * 게임 플로우 E2E 테스트
 * - 서버 선택(entrance) 페이지
 * - 데모 페이지들
 */

test.describe('서버 선택 페이지', () => {
  test('서버 선택 페이지가 정상적으로 로드됨', async ({ page }) => {
    await page.goto('/entrance');

    // 서버 선택 헤딩 확인
    await expect(page.getByRole('heading', { name: '서버 선택' })).toBeVisible();
    
    // 경고 알림 확인
    await expect(page.getByRole('heading', { name: '중요 알림' })).toBeVisible();
    
    // 로그아웃 버튼 확인
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
  });

  test('계정 설정 링크들이 존재함', async ({ page }) => {
    await page.goto('/entrance');

    // 계정 설정 섹션
    await expect(page.getByRole('heading', { name: '계정 설정' })).toBeVisible();
    
    // 링크 확인
    await expect(page.getByRole('link', { name: /비밀번호.*정보 수정/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /전용 아이콘 관리/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /회원 탈퇴/ })).toBeVisible();
  });

  test('서버 안내 섹션이 표시됨', async ({ page }) => {
    await page.goto('/entrance');

    // 서버 안내 섹션
    await expect(page.getByRole('heading', { name: '서버 안내' })).toBeVisible();
    
    // 서버 설명 확인
    await expect(page.getByText('체섭')).toBeVisible();
    await expect(page.getByText('메인서버입니다')).toBeVisible();
  });

  test('로그아웃 버튼 클릭시 로그인 페이지로 이동', async ({ page }) => {
    await page.goto('/entrance');

    await page.getByRole('button', { name: '로그아웃' }).click();

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL('/');
  });
});

test.describe('데모 페이지들', () => {
  test('VFX 테스트 페이지 로드', async ({ page }) => {
    await page.goto('/demo/vfx-test');

    await expect(page.getByRole('heading', { name: 'VFX 시스템 테스트' })).toBeVisible();
    
    // 품질 설정 버튼들 확인
    await expect(page.getByRole('button', { name: 'LOW' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'HIGH' })).toBeVisible();
  });

  test('VFX 품질 설정 변경 가능', async ({ page }) => {
    await page.goto('/demo/vfx-test');

    // HIGH 버튼 클릭
    await page.getByRole('button', { name: 'HIGH' }).click();
    
    // LOW 버튼 클릭
    await page.getByRole('button', { name: 'LOW' }).click();
    
    // ULTRA 버튼 클릭
    await page.getByRole('button', { name: 'ULTRA' }).click();
  });

  test('VFX 투사체 버튼 동작', async ({ page }) => {
    await page.goto('/demo/vfx-test');

    // 화살 볼리 버튼 확인 및 클릭
    await expect(page.getByRole('button', { name: '화살 볼리' })).toBeVisible();
    await page.getByRole('button', { name: '화살 볼리' }).click();
    
    // 불화살 버튼 확인 및 클릭
    await expect(page.getByRole('button', { name: '불화살' })).toBeVisible();
    await page.getByRole('button', { name: '불화살' }).click();
  });

  test('VFX 마법 이펙트 버튼 동작', async ({ page }) => {
    await page.goto('/demo/vfx-test');

    // 마법 이펙트 버튼들 확인 및 클릭
    await expect(page.getByRole('button', { name: '화염구' })).toBeVisible();
    await page.getByRole('button', { name: '화염구' }).click();
    
    await expect(page.getByRole('button', { name: '번개' })).toBeVisible();
    await page.getByRole('button', { name: '번개' }).click();
  });

  test('VFX 날씨 버튼 동작', async ({ page }) => {
    await page.goto('/demo/vfx-test');

    // 날씨 버튼들 확인 및 클릭
    await expect(page.getByRole('button', { name: '맑음' })).toBeVisible();
    await page.getByRole('button', { name: '맑음' }).click();
    
    await expect(page.getByRole('button', { name: '비' })).toBeVisible();
    await page.getByRole('button', { name: '비' }).click();
    
    await expect(page.getByRole('button', { name: '눈' })).toBeVisible();
    await page.getByRole('button', { name: '눈' }).click();
  });

  test('VFX 스트레스 테스트 및 초기화', async ({ page }) => {
    await page.goto('/demo/vfx-test');

    // 스트레스 테스트 버튼
    await expect(page.getByRole('button', { name: /스트레스 테스트/ })).toBeVisible();
    await page.getByRole('button', { name: /스트레스 테스트/ }).click();
    
    // 모두 지우기 버튼
    await expect(page.getByRole('button', { name: /모두 지우기/ })).toBeVisible();
    await page.getByRole('button', { name: /모두 지우기/ }).click();
  });
});

