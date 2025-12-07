import { test, expect } from '@playwright/test';

/**
 * 명예의 전당 E2E 테스트
 * - 메인 페이지 접속
 * - 명예의 전당 메뉴 접근
 * - 랭킹 리스트 로딩 확인
 * - 탭 전환 시 내용 변경 확인
 */

test.describe('명예의 전당 페이지', () => {
  // ============================================================================
  // 기본 접근 테스트
  // ============================================================================

  test.describe('기본 접근', () => {
    test('랭킹 페이지에 직접 접근할 수 있어야 함', async ({ page }) => {
      await page.goto('/ranking');

      // 페이지 제목 확인
      await expect(page.getByText('명예의 전당 · 랭킹')).toBeVisible({ timeout: 10000 });
    });

    test('역사 페이지에 직접 접근할 수 있어야 함', async ({ page }) => {
      await page.goto('/history');

      // 페이지 제목 확인
      await expect(page.getByText('명예의 전당 · 역사')).toBeVisible({ timeout: 10000 });
    });
  });

  // ============================================================================
  // 랭킹 페이지 테스트
  // ============================================================================

  test.describe('랭킹 페이지', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ranking');
      // 페이지 로드 대기
      await page.waitForLoadState('networkidle');
    });

    test('장수 랭킹 탭이 기본으로 표시되어야 함', async ({ page }) => {
      // 장수 랭킹 탭 버튼 확인
      const generalTab = page.getByRole('button', { name: '장수 랭킹' });
      await expect(generalTab).toBeVisible();
    });

    test('국가 랭킹 탭이 표시되어야 함', async ({ page }) => {
      // 국가 랭킹 탭 버튼 확인
      const nationTab = page.getByRole('button', { name: '국가 랭킹' });
      await expect(nationTab).toBeVisible();
    });

    test('정렬 옵션이 표시되어야 함', async ({ page }) => {
      // 정렬 레이블 확인
      await expect(page.getByText('정렬')).toBeVisible();
    });

    test('세션 ID 입력 필드가 표시되어야 함', async ({ page }) => {
      // 세션 ID 입력 필드 확인
      await expect(page.getByPlaceholder('미입력 시 최신 세션')).toBeVisible();
    });

    test('조회 버튼이 표시되어야 함', async ({ page }) => {
      // 조회 버튼 확인
      await expect(page.getByRole('button', { name: '조회' })).toBeVisible();
    });

    test('탭 전환 - 장수에서 국가 랭킹으로', async ({ page }) => {
      // 국가 랭킹 탭 클릭
      await page.getByRole('button', { name: '국가 랭킹' }).click();

      // 국가 랭킹 관련 UI 요소 확인
      await expect(page.getByText('국가 수')).toBeVisible();
    });

    test('탭 전환 - 국가에서 장수 랭킹으로', async ({ page }) => {
      // 먼저 국가 랭킹 탭으로 이동
      await page.getByRole('button', { name: '국가 랭킹' }).click();
      await expect(page.getByText('국가 수')).toBeVisible();

      // 다시 장수 랭킹 탭으로 이동
      await page.getByRole('button', { name: '장수 랭킹' }).click();

      // 장수 랭킹 관련 UI 요소 확인
      await expect(page.getByText('총 랭킹')).toBeVisible();
    });

    test('InfoSummaryCard들이 렌더링되어야 함', async ({ page }) => {
      // 요약 카드들 확인
      await expect(page.getByText('정렬 기준')).toBeVisible();
      await expect(page.getByText('총 랭킹')).toBeVisible();
      await expect(page.getByText('세션')).toBeVisible();
    });
  });

  // ============================================================================
  // 역사 페이지 테스트
  // ============================================================================

  test.describe('역사 페이지', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/history');
      await page.waitForLoadState('networkidle');
    });

    test('필터 패널이 표시되어야 함', async ({ page }) => {
      // 세션 ID 필터
      await expect(page.getByPlaceholder('미입력 시 최신 세션')).toBeVisible();

      // 국가 ID 필터
      await expect(page.getByPlaceholder('0=전역, 비우면 전체')).toBeVisible();
    });

    test('정렬 옵션이 표시되어야 함', async ({ page }) => {
      await expect(page.getByText('정렬')).toBeVisible();
    });

    test('조회 버튼이 동작해야 함', async ({ page }) => {
      const queryButton = page.getByRole('button', { name: '조회' });
      await expect(queryButton).toBeVisible();

      // 버튼 클릭
      await queryButton.click();

      // 페이지가 에러 없이 유지되는지 확인
      await expect(page.getByText('명예의 전당 · 역사')).toBeVisible();
    });

    test('InfoSummaryCard들이 렌더링되어야 함', async ({ page }) => {
      await expect(page.getByText('세션')).toBeVisible();
      await expect(page.getByText('기록 수')).toBeVisible();
      await expect(page.getByText('최신 시점')).toBeVisible();
    });

    test('타임라인 UI 요소가 표시되어야 함 (데이터 있는 경우)', async ({ page }) => {
      // 타임라인 제목 또는 빈 상태 메시지 중 하나가 표시되어야 함
      const hasTimeline = await page.getByText('통일 역사 타임라인').isVisible().catch(() => false);
      const hasEmptyState = await page.getByText('표시할 연혁 데이터가 없습니다.').isVisible().catch(() => false);

      expect(hasTimeline || hasEmptyState).toBe(true);
    });
  });

  // ============================================================================
  // 반응형 테스트
  // ============================================================================

  test.describe('반응형 디자인', () => {
    test('모바일 뷰에서 랭킹 페이지가 정상 표시됨', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/ranking');

      await expect(page.getByText('명예의 전당 · 랭킹')).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: '장수 랭킹' })).toBeVisible();
    });

    test('태블릿 뷰에서 랭킹 페이지가 정상 표시됨', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/ranking');

      await expect(page.getByText('명예의 전당 · 랭킹')).toBeVisible({ timeout: 10000 });
    });

    test('데스크톱 뷰에서 랭킹 페이지가 정상 표시됨', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/ranking');

      await expect(page.getByText('명예의 전당 · 랭킹')).toBeVisible({ timeout: 10000 });
    });
  });

  // ============================================================================
  // 네트워크 에러 핸들링 테스트
  // ============================================================================

  test.describe('에러 핸들링', () => {
    test('API 에러 시 에러 메시지 표시 (랭킹)', async ({ page }) => {
      // API 요청 가로채기
      await page.route('**/api/ranking/**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, message: '서버 오류' }),
        });
      });

      await page.goto('/ranking');

      // 에러 상태 또는 빈 상태 메시지 확인
      const hasError = await page.locator('.text-rose-200').first().isVisible().catch(() => false);
      const hasEmptyState = await page.getByText('표시할 랭킹이 없습니다.').isVisible().catch(() => false);

      // 에러나 빈 상태 중 하나가 표시되어야 함
      expect(hasError || hasEmptyState).toBe(true);
    });

    test('API 에러 시 에러 메시지 표시 (역사)', async ({ page }) => {
      await page.route('**/api/ranking/history**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, message: '서버 오류' }),
        });
      });

      await page.goto('/history');

      // 에러 상태 또는 빈 상태 메시지 확인
      const hasError = await page.locator('.text-rose-200').first().isVisible().catch(() => false);
      const hasEmptyState = await page.getByText('표시할 연혁 데이터가 없습니다.').isVisible().catch(() => false);

      expect(hasError || hasEmptyState).toBe(true);
    });
  });

  // ============================================================================
  // 페이지네이션 테스트
  // ============================================================================

  test.describe('페이지네이션', () => {
    test('페이지네이션 버튼이 표시되어야 함', async ({ page }) => {
      await page.goto('/ranking');
      await page.waitForLoadState('networkidle');

      // 데이터가 있는 경우 페이지네이션 버튼 확인
      const prevButton = page.getByRole('button', { name: '이전' });
      const nextButton = page.getByRole('button', { name: '다음' });

      // 버튼이 존재하거나 빈 상태인지 확인
      const hasPagination = await prevButton.isVisible().catch(() => false);
      const hasEmptyState = await page.getByText('표시할 랭킹이 없습니다.').isVisible().catch(() => false);

      expect(hasPagination || hasEmptyState).toBe(true);
    });

    test('첫 페이지에서 이전 버튼이 비활성화되어야 함', async ({ page }) => {
      await page.goto('/ranking');
      await page.waitForLoadState('networkidle');

      const prevButton = page.getByRole('button', { name: '이전' });
      
      // 버튼이 존재하면 비활성화 확인
      if (await prevButton.isVisible().catch(() => false)) {
        await expect(prevButton).toBeDisabled();
      }
    });
  });

  // ============================================================================
  // 접근성 테스트
  // ============================================================================

  test.describe('접근성', () => {
    test('랭킹 페이지의 주요 요소들이 접근 가능해야 함', async ({ page }) => {
      await page.goto('/ranking');

      // 탭 버튼들이 키보드로 접근 가능해야 함
      const generalTab = page.getByRole('button', { name: '장수 랭킹' });
      await expect(generalTab).toBeVisible();

      // 포커스 가능한지 확인
      await generalTab.focus();
    });

    test('역사 페이지의 주요 요소들이 접근 가능해야 함', async ({ page }) => {
      await page.goto('/history');

      // 조회 버튼이 접근 가능해야 함
      const queryButton = page.getByRole('button', { name: '조회' });
      await expect(queryButton).toBeVisible();
      await queryButton.focus();
    });
  });
});

// ============================================================================
// 사용자 시나리오 테스트
// ============================================================================

test.describe('사용자 시나리오', () => {
  test('사용자가 랭킹 페이지에서 정보를 조회하는 전체 흐름', async ({ page }) => {
    // 1. 랭킹 페이지 접속
    await page.goto('/ranking');
    await expect(page.getByText('명예의 전당 · 랭킹')).toBeVisible({ timeout: 10000 });

    // 2. 장수 랭킹 확인
    await expect(page.getByRole('button', { name: '장수 랭킹' })).toBeVisible();

    // 3. 국가 랭킹 탭으로 전환
    await page.getByRole('button', { name: '국가 랭킹' }).click();
    await expect(page.getByText('국가 수')).toBeVisible();

    // 4. 다시 장수 랭킹으로 전환
    await page.getByRole('button', { name: '장수 랭킹' }).click();
    await expect(page.getByText('총 랭킹')).toBeVisible();

    // 5. 조회 버튼 클릭
    await page.getByRole('button', { name: '조회' }).click();

    // 6. 페이지가 정상 동작하는지 확인
    await expect(page.getByText('명예의 전당 · 랭킹')).toBeVisible();
  });

  test('사용자가 역사 페이지에서 기록을 조회하는 전체 흐름', async ({ page }) => {
    // 1. 역사 페이지 접속
    await page.goto('/history');
    await expect(page.getByText('명예의 전당 · 역사')).toBeVisible({ timeout: 10000 });

    // 2. 필터 패널 확인
    await expect(page.getByPlaceholder('미입력 시 최신 세션')).toBeVisible();

    // 3. 조회 버튼 클릭
    await page.getByRole('button', { name: '조회' }).click();

    // 4. 페이지가 정상 동작하는지 확인
    await expect(page.getByText('명예의 전당 · 역사')).toBeVisible();

    // 5. InfoSummaryCard 확인
    await expect(page.getByText('기록 수')).toBeVisible();
  });
});

