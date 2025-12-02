import { test, expect } from '@playwright/test';

/**
 * 전투 플로우 E2E 테스트
 * - 복셀 전투 데모
 * - 전투 UI 요소
 * - 전투 조작
 */

test.describe('복셀 전투 데모', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/voxel-battle');
  });

  test('전투 페이지가 정상적으로 로드됨', async ({ page }) => {
    // 제목 확인
    await expect(page.getByRole('heading', { name: /복셀 전투 시스템 데모/ })).toBeVisible();
    
    // 설명 텍스트 확인
    await expect(page.getByText('실시간 전술 전투 시스템')).toBeVisible();
  });

  test('전투 리셋 버튼이 존재함', async ({ page }) => {
    await expect(page.getByRole('button', { name: /전투 리셋/ })).toBeVisible();
  });

  test('조작 방법 섹션이 표시됨', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '🎮 조작 방법' })).toBeVisible();
    
    // 조작 방법 목록 확인
    await expect(page.getByText('유닛 클릭 → 선택')).toBeVisible();
    await expect(page.getByText('땅 클릭 → 이동 명령')).toBeVisible();
    await expect(page.getByText('Shift + 적 클릭 → 공격 명령')).toBeVisible();
  });

  test('병종 상성 섹션이 표시됨', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '⚔️ 병종 상성' })).toBeVisible();
    
    // 상성 정보 확인
    await expect(page.getByText('보병 → 궁병 유리')).toBeVisible();
    await expect(page.getByText('궁병 → 기병 유리')).toBeVisible();
    await expect(page.getByText('기병 → 보병 유리')).toBeVisible();
  });

  test('진형 효과 섹션이 표시됨', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '🛡️ 진형 효과' })).toBeVisible();
    
    // 진형 정보 확인
    await expect(page.getByText('쐐기진:')).toBeVisible();
    await expect(page.getByText('방진:')).toBeVisible();
  });

  test('전투 요소 섹션이 표시됨', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '💪 전투 요소' })).toBeVisible();
    
    // 전투 요소 확인
    await expect(page.getByText('사기 20% 이하')).toBeVisible();
    await expect(page.getByText('훈련도')).toBeVisible();
  });

  test('공격군 정보가 표시됨', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /공격군.*위나라/ })).toBeVisible();
    
    // 유닛 정보 확인
    await expect(page.getByText('정규보병')).toBeVisible();
    await expect(page.getByText('조조')).toBeVisible();
    await expect(page.getByText('장궁병').first()).toBeVisible();
    await expect(page.getByText('호표기')).toBeVisible();
  });

  test('방어군 정보가 표시됨', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /방어군.*촉나라/ })).toBeVisible();
    
    // 유닛 정보 확인
    await expect(page.getByText('촉한무위군')).toBeVisible();
    await expect(page.getByText('유비')).toBeVisible();
    await expect(page.getByText('경기병')).toBeVisible();
    await expect(page.getByText('조운')).toBeVisible();
  });

  test('전투 리셋 버튼 활성화 상태', async ({ page }) => {
    const resetButton = page.getByRole('button', { name: /전투 리셋/ });
    await expect(resetButton).toBeEnabled();
  });
});

test.describe('전투 상성 시스템', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/voxel-battle');
  });

  test('보병 vs 궁병 상성 정보 표시', async ({ page }) => {
    // 보병 → 궁병 유리 텍스트 확인
    await expect(page.getByText('보병 → 궁병 유리')).toBeVisible();
    await expect(page.getByText('(+30%)')).toBeVisible();
  });

  test('궁병 vs 기병 상성 정보 표시', async ({ page }) => {
    await expect(page.getByText(/궁병.*기병.*유리/)).toBeVisible();
    await expect(page.getByText('+20%').first()).toBeVisible();
  });

  test('기병 vs 공성 상성 정보 표시', async ({ page }) => {
    await expect(page.getByText('기병 → 공성 매우 유리')).toBeVisible();
    await expect(page.getByText('(+50%)')).toBeVisible();
  });
});

test.describe('전투 진형 시스템', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/voxel-battle');
  });

  test('쐐기진 효과 표시', async ({ page }) => {
    await expect(page.getByText(/쐐기진.*공격\+30%.*방어-30%/)).toBeVisible();
  });

  test('방진 효과 표시', async ({ page }) => {
    await expect(page.getByText(/방진.*공격-20%.*방어\+40%/)).toBeVisible();
  });

  test('학익진 효과 표시', async ({ page }) => {
    await expect(page.getByText(/학익진.*포위/)).toBeVisible();
  });

  test('어린진 효과 표시', async ({ page }) => {
    await expect(page.getByText(/어린진.*기동성/)).toBeVisible();
  });
});

