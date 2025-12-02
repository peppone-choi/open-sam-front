import { test, expect } from '@playwright/test';

/**
 * 장수 생성 E2E 테스트
 * - 장수 이름/외형 설정
 * - 스탯 배분
 * - 특기 선택
 * - 시작 위치 선택
 * - 국가 선택
 */

const mockJoinInfo = {
  serverInfo: {
    name: '삼국지 시즌1',
    maxStat: 95,
    minStat: 10,
    totalStatPoints: 300,
    startGold: 1000,
    startRice: 500,
  },
  nations: [
    { nation: 1, name: '위', color: '#0066CC', scout: 80, scoutmsg: '조조의 위나라입니다.' },
    { nation: 2, name: '촉', color: '#FF6600', scout: 75, scoutmsg: '유비의 촉나라입니다.' },
    { nation: 3, name: '오', color: '#00AA00', scout: 70, scoutmsg: '손권의 오나라입니다.' },
    { nation: 0, name: '재야', color: '#888888', scout: 100, scoutmsg: '어느 국가에도 속하지 않습니다.' },
  ],
  cities: [
    { id: 1, name: '낙양', nation: 0, x: 400, y: 300 },
    { id: 2, name: '허창', nation: 1, x: 350, y: 350 },
    { id: 10, name: '성도', nation: 2, x: 200, y: 400 },
    { id: 20, name: '건업', nation: 3, x: 600, y: 500 },
  ],
  specialties: [
    { id: 'cavalry', name: '기병', description: '기병 병종 징병 가능, 돌격 보너스' },
    { id: 'archery', name: '궁술', description: '궁병 병종 징병 가능, 사격 보너스' },
    { id: 'tactics', name: '전술', description: '계략 성공률 +10%' },
    { id: 'commerce', name: '상업', description: '상업 수입 +20%' },
    { id: 'agriculture', name: '농업', description: '농업 생산성 +20%' },
    { id: 'diplomacy', name: '외교', description: '외교 성공률 +15%' },
  ],
  inheritPoints: 50, // 상속 포인트
};

async function mockCharacterCreationRoutes(page: any) {
  // 가입 정보 조회
  await page.route('**/api/general/join-info', async (route: any) => {
    await route.fulfill({ json: { result: true, ...mockJoinInfo } });
  });

  // 이름 중복 체크
  await page.route('**/api/general/check-name', async (route: any, request: any) => {
    const body = await request.postDataJSON();
    const duplicates = ['조조', '유비', '손권', '관우', '장비'];
    
    if (duplicates.includes(body.name)) {
      await route.fulfill({ json: { result: false, error: '이미 사용 중인 이름입니다.' } });
    } else {
      await route.fulfill({ json: { result: true, available: true } });
    }
  });

  // 장수 생성
  await page.route('**/api/general/create', async (route: any, request: any) => {
    const body = await request.postDataJSON();

    // 스탯 합계 검증
    const statSum = body.leadership + body.strength + body.intel + body.politics + body.charm;
    if (statSum > 300) {
      return route.fulfill({
        status: 400,
        json: { result: false, error: '스탯 합계가 제한을 초과했습니다.' },
      });
    }

    // 스탯 범위 검증
    const stats = [body.leadership, body.strength, body.intel, body.politics, body.charm];
    if (stats.some(s => s < 10 || s > 95)) {
      return route.fulfill({
        status: 400,
        json: { result: false, error: '스탯은 10~95 사이여야 합니다.' },
      });
    }

    await route.fulfill({
      json: {
        result: true,
        message: '장수가 생성되었습니다!',
        general: {
          no: 100,
          name: body.name,
          nation: body.nation,
          city: body.city,
        },
      },
    });
  });
}

test.describe('장수 생성', () => {
  test.beforeEach(async ({ page }) => {
    await mockCharacterCreationRoutes(page);
  });

  test.describe('기본 정보 입력', () => {
    test('장수 이름 입력 및 중복 체크', async ({ page }) => {
      await page.goto('/test-server/join');

      // 이름 입력
      await page.fill('[data-testid="name-input"]', '신규장수');

      // 중복 체크 버튼
      await page.click('[data-testid="check-name-btn"]');

      await expect(page.locator('text=사용 가능')).toBeVisible({ timeout: 5000 });
    });

    test('중복된 이름 경고', async ({ page }) => {
      await page.goto('/test-server/join');

      await page.fill('[data-testid="name-input"]', '조조');
      await page.click('[data-testid="check-name-btn"]');

      await expect(page.locator('text=이미 사용 중')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('스탯 배분', () => {
    test('스탯 슬라이더/입력 조작', async ({ page }) => {
      await page.goto('/test-server/join');

      // 통솔 스탯 조정
      await page.fill('[data-testid="stat-leadership"]', '80');
      
      // 무력 스탯 조정
      await page.fill('[data-testid="stat-strength"]', '70');
      
      // 지력 스탯 조정
      await page.fill('[data-testid="stat-intel"]', '60');
      
      // 정치 스탯 조정
      await page.fill('[data-testid="stat-politics"]', '50');
      
      // 매력 스탯 조정
      await page.fill('[data-testid="stat-charm"]', '40');

      // 합계 표시 (300)
      await expect(page.locator('[data-testid="stat-total"]')).toContainText('300');
    });

    test('스탯 합계 초과 시 경고', async ({ page }) => {
      await page.goto('/test-server/join');

      // 모든 스탯 최대로
      await page.fill('[data-testid="stat-leadership"]', '95');
      await page.fill('[data-testid="stat-strength"]', '95');
      await page.fill('[data-testid="stat-intel"]', '95');
      await page.fill('[data-testid="stat-politics"]', '95');
      await page.fill('[data-testid="stat-charm"]', '95'); // 475 > 300

      // 경고 표시
      await expect(page.locator('text=스탯 합계 초과')).toBeVisible();
      
      // 생성 버튼 비활성화
      const createBtn = page.locator('[data-testid="create-btn"]');
      await expect(createBtn).toBeDisabled();
    });

    test('스탯 범위 제한', async ({ page }) => {
      await page.goto('/test-server/join');

      // 최소값 미만 입력 시도
      await page.fill('[data-testid="stat-leadership"]', '5');
      
      // 자동으로 최소값으로 조정되거나 경고
      const leadershipInput = page.locator('[data-testid="stat-leadership"]');
      await expect(leadershipInput).toHaveValue('10');
    });

    test('상속 포인트 사용', async ({ page }) => {
      await page.goto('/test-server/join');

      // 상속 포인트 표시
      await expect(page.locator('[data-testid="inherit-points"]')).toContainText('50');

      // 상속 포인트 사용 버튼
      await page.click('[data-testid="use-inherit-btn"]');

      // 스탯 합계 증가 (300 + 50 = 350)
      await expect(page.locator('[data-testid="stat-max"]')).toContainText('350');
    });
  });

  test.describe('특기 선택', () => {
    test('특기 목록 표시 및 선택', async ({ page }) => {
      await page.goto('/test-server/join');

      // 특기 탭 클릭
      await page.click('[data-testid="tab-specialty"]');

      // 특기 목록
      await expect(page.locator('text=기병')).toBeVisible();
      await expect(page.locator('text=궁술')).toBeVisible();
      await expect(page.locator('text=전술')).toBeVisible();

      // 기병 특기 선택
      await page.click('[data-testid="specialty-cavalry"]');

      // 선택됨 표시
      await expect(page.locator('[data-testid="specialty-cavalry"][data-selected="true"]')).toBeVisible();
    });

    test('특기 설명 툴팁', async ({ page }) => {
      await page.goto('/test-server/join');
      await page.click('[data-testid="tab-specialty"]');

      // 특기에 호버
      await page.hover('[data-testid="specialty-tactics"]');

      // 설명 툴팁
      await expect(page.locator('text=계략 성공률 +10%')).toBeVisible();
    });
  });

  test.describe('시작 위치/국가 선택', () => {
    test('국가 목록 표시', async ({ page }) => {
      await page.goto('/test-server/join');

      // 국가 탭
      await page.click('[data-testid="tab-nation"]');

      // 국가 목록
      await expect(page.locator('text=위')).toBeVisible();
      await expect(page.locator('text=촉')).toBeVisible();
      await expect(page.locator('text=오')).toBeVisible();
      await expect(page.locator('text=재야')).toBeVisible();
    });

    test('국가 선택 시 도시 필터링', async ({ page }) => {
      await page.goto('/test-server/join');
      await page.click('[data-testid="tab-nation"]');

      // 위 선택
      await page.click('[data-testid="nation-1"]');

      // 위 소속 도시만 표시
      await expect(page.locator('[data-testid="city-2"]')).toBeVisible(); // 허창
      await expect(page.locator('[data-testid="city-10"]')).not.toBeVisible(); // 성도 (촉)
    });

    test('재야 선택 시 모든 공백지 표시', async ({ page }) => {
      await page.goto('/test-server/join');
      await page.click('[data-testid="tab-nation"]');

      // 재야 선택
      await page.click('[data-testid="nation-0"]');

      // 공백지만 표시
      await expect(page.locator('[data-testid="city-1"]')).toBeVisible(); // 낙양 (공백지)
    });

    test('맵에서 시작 도시 선택', async ({ page }) => {
      await page.goto('/test-server/join');
      await page.click('[data-testid="tab-nation"]');
      await page.click('[data-testid="nation-1"]'); // 위

      // 맵에서 도시 클릭
      await page.click('[data-testid="map-city-2"]'); // 허창

      // 선택됨 표시
      await expect(page.locator('[data-testid="selected-city"]')).toContainText('허창');
    });
  });

  test.describe('장수 생성 완료', () => {
    test('모든 정보 입력 후 생성 성공', async ({ page }) => {
      await page.goto('/test-server/join');

      // 이름 입력
      await page.fill('[data-testid="name-input"]', '신규장수');

      // 스탯 배분
      await page.fill('[data-testid="stat-leadership"]', '70');
      await page.fill('[data-testid="stat-strength"]', '60');
      await page.fill('[data-testid="stat-intel"]', '70');
      await page.fill('[data-testid="stat-politics"]', '50');
      await page.fill('[data-testid="stat-charm"]', '50');

      // 특기 선택
      await page.click('[data-testid="tab-specialty"]');
      await page.click('[data-testid="specialty-cavalry"]');

      // 국가/도시 선택
      await page.click('[data-testid="tab-nation"]');
      await page.click('[data-testid="nation-1"]');
      await page.click('[data-testid="city-2"]');

      // 생성 버튼
      await page.click('[data-testid="create-btn"]');

      // 성공 메시지
      await expect(page.locator('text=장수가 생성되었습니다')).toBeVisible({ timeout: 5000 });

      // 게임 페이지로 이동
      await expect(page).toHaveURL(/\/game/);
    });

    test('필수 정보 누락 시 생성 불가', async ({ page }) => {
      await page.goto('/test-server/join');

      // 이름만 입력
      await page.fill('[data-testid="name-input"]', '신규장수');

      // 생성 버튼 클릭
      await page.click('[data-testid="create-btn"]');

      // 오류 메시지 (국가/도시 미선택)
      await expect(page.locator('text=국가를 선택')).toBeVisible();
    });
  });

  test.describe('외형 커스터마이징', () => {
    test('초상화 선택', async ({ page }) => {
      await page.goto('/test-server/join');

      // 외형 탭
      await page.click('[data-testid="tab-appearance"]');

      // 초상화 갤러리
      await expect(page.locator('[data-testid="portrait-gallery"]')).toBeVisible();

      // 초상화 선택
      await page.click('[data-testid="portrait-1"]');

      // 미리보기 업데이트
      await expect(page.locator('[data-testid="preview-portrait"]')).toHaveAttribute('src', /portrait-1/);
    });
  });
});




