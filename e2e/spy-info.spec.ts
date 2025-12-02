import { test, expect } from '@playwright/test';

/**
 * 첩보/정보 제한 E2E 테스트
 * - 타국 도시 정보 제한
 * - 첩보 있는 경우 상세 정보 공개
 * - 맵에서의 정보 표시 차이
 */

const mockMyGeneral = {
  no: 1,
  name: '조조',
  nation: 1,
  city: 1,
};

const mockMyNation = {
  nation: 1,
  name: '위',
  color: '#0066CC',
  // 첩보 정보: 도시 10번에 첩보 있음
  spy: { '10': 5 }, // 5턴 남음
};

// 우리 도시 - 전체 정보 공개
const mockOurCity = {
  city: 1,
  name: '낙양',
  nation: 1,
  nationName: '위',
  nationColor: '#0066CC',
  level: 10,
  region: 2,
  pop: [85000, 100000],
  trust: 90,
  agri: [9000, 10000],
  comm: [8500, 10000],
  secu: [8000, 10000],
  def: [7000, 10000],
  wall: [9500, 10000],
  generals: [
    { no: 1, name: '조조', officer_level: 12 },
    { no: 2, name: '하후돈', officer_level: 6 },
  ],
};

// 첩보 있는 타국 도시 - 전체 정보 공개
const mockSpiedCity = {
  city: 10,
  name: '성도',
  nation: 2,
  nationName: '촉',
  nationColor: '#FF6600',
  level: 9,
  region: 4,
  pop: [70000, 90000],
  trust: 85,
  agri: [8000, 10000],
  comm: [7000, 10000],
  secu: [7500, 10000],
  def: [8000, 10000],
  wall: [9000, 10000],
  generals: [
    { no: 10, name: '유비', officer_level: 12 },
    { no: 11, name: '제갈량', officer_level: 11 },
  ],
};

// 첩보 없는 타국 도시 - 제한된 정보
const mockRestrictedCity = {
  city: 20,
  name: '건업',
  nation: 3,
  nationName: '오',
  nationColor: '#00AA00',
  level: 8,
  region: 7,
  // 상세 정보 없음 (null)
  pop: null,
  trust: null,
  agri: null,
  comm: null,
  secu: null,
  def: null,
  wall: null,
  generals: [],
  restricted: true,
};

async function mockSpyRoutes(page: any) {
  // 프론트 정보
  await page.route('**/api/general/front-info', async (route: any) => {
    await route.fulfill({
      json: {
        success: true,
        general: mockMyGeneral,
        nation: mockMyNation,
      },
    });
  });

  // 도시 정보 API
  await page.route('**/api/info/city', async (route: any, request: any) => {
    const body = await request.postDataJSON();
    const cityId = parseInt(body.cityID);

    if (cityId === 1) {
      // 우리 도시
      return route.fulfill({
        json: { result: true, city: mockOurCity, restricted: false },
      });
    } else if (cityId === 10) {
      // 첩보 있는 도시
      return route.fulfill({
        json: { result: true, city: mockSpiedCity, restricted: false },
      });
    } else {
      // 첩보 없는 도시
      return route.fulfill({
        json: {
          result: true,
          city: mockRestrictedCity,
          restricted: true,
          message: '첩보가 없어 일부 정보가 제한됩니다.',
        },
      });
    }
  });

  // 맵 정보
  await page.route('**/api/global/map', async (route: any) => {
    await route.fulfill({
      json: {
        success: true,
        result: true,
        cities: [
          { city: 1, name: '낙양', nation: 1, x: 400, y: 300 },
          { city: 10, name: '성도', nation: 2, x: 200, y: 400 },
          { city: 20, name: '건업', nation: 3, x: 600, y: 500 },
        ],
        nations: [
          { nation: 1, name: '위', color: '#0066CC' },
          { nation: 2, name: '촉', color: '#FF6600' },
          { nation: 3, name: '오', color: '#00AA00' },
        ],
        spyList: { '10': 5 }, // 성도에 첩보
        myCity: 1,
        myNation: 1,
      },
    });
  });
}

test.describe('첩보 및 정보 제한 시스템', () => {
  test.beforeEach(async ({ page }) => {
    await mockSpyRoutes(page);
  });

  test.describe('도시 정보 조회', () => {
    test('아군 도시 - 전체 정보 표시', async ({ page }) => {
      await page.goto('/test-server/info/current-city?cityId=1');

      // 전체 정보 표시
      await expect(page.locator('text=낙양')).toBeVisible();
      await expect(page.locator('text=85,000')).toBeVisible(); // 인구
      await expect(page.locator('text=90')).toBeVisible(); // 민심
      await expect(page.locator('text=조조')).toBeVisible(); // 태수
      
      // 제한 표시 없음
      await expect(page.locator('text=첩보 필요')).not.toBeVisible();
    });

    test('첩보 있는 타국 도시 - 전체 정보 표시', async ({ page }) => {
      await page.goto('/test-server/info/current-city?cityId=10');

      // 전체 정보 표시
      await expect(page.locator('text=성도')).toBeVisible();
      await expect(page.locator('text=촉')).toBeVisible();
      await expect(page.locator('text=70,000')).toBeVisible(); // 인구
      await expect(page.locator('text=유비')).toBeVisible();
      
      // 첩보 잔여 턴 표시 (옵션)
      // await expect(page.locator('text=첩보 5턴')).toBeVisible();
    });

    test('첩보 없는 타국 도시 - 제한된 정보', async ({ page }) => {
      await page.goto('/test-server/info/current-city?cityId=20');

      // 기본 정보만 표시
      await expect(page.locator('text=건업')).toBeVisible();
      await expect(page.locator('text=오')).toBeVisible();
      
      // 제한 알림
      await expect(page.locator('text=첩보 필요')).toBeVisible();
      
      // 상세 정보 마스킹
      const maskedItems = page.locator('text=???');
      await expect(maskedItems.first()).toBeVisible();
      
      // 장수 목록 비공개
      await expect(page.locator('text=손권')).not.toBeVisible();
    });
  });

  test.describe('맵 뷰', () => {
    test('첩보 상태에 따른 도시 아이콘 차이', async ({ page }) => {
      await page.goto('/test-server/map/recent');

      // 아군 도시 - 상세 정보 표시
      const ourCity = page.locator('[data-testid="city-marker-1"]');
      await ourCity.hover();
      await expect(page.locator('text=낙양')).toBeVisible();
      await expect(page.locator('[data-testid="city-tooltip-1"]')).toContainText('인구');

      // 첩보 도시 - 상세 정보 표시 + 첩보 아이콘
      const spiedCity = page.locator('[data-testid="city-marker-10"]');
      await expect(spiedCity.locator('[data-testid="spy-icon"]')).toBeVisible();
      await spiedCity.hover();
      await expect(page.locator('[data-testid="city-tooltip-10"]')).toContainText('인구');

      // 첩보 없는 도시 - 제한된 정보
      const unknownCity = page.locator('[data-testid="city-marker-20"]');
      await unknownCity.hover();
      await expect(page.locator('[data-testid="city-tooltip-20"]')).not.toContainText('인구');
      await expect(page.locator('[data-testid="city-tooltip-20"]')).toContainText('???');
    });

    test('첩보 없는 도시 클릭 시 제한 모달', async ({ page }) => {
      await page.goto('/test-server/map/recent');

      // 첩보 없는 도시 클릭
      await page.click('[data-testid="city-marker-20"]');

      // 제한 정보 모달
      await expect(page.locator('[data-testid="restricted-city-modal"]')).toBeVisible();
      await expect(page.locator('text=첩보를 심으면')).toBeVisible();
    });
  });

  test.describe('첩보 커맨드 연동', () => {
    test('첩보 성공 후 도시 정보 갱신', async ({ page }) => {
      // 첩보 실행 후 응답 목
      await page.route('**/api/general/run-command', async (route: any, request: any) => {
        const body = await request.postDataJSON();
        if (body.command === 'spy' && body.targetCity === 20) {
          await route.fulfill({
            json: {
              result: true,
              message: '건업에 첩보를 심었습니다.',
            },
          });
        }
      });

      await page.goto('/test-server/game');

      // 첩보 커맨드 실행
      await page.click('[data-testid="tab-strategy"]');
      await page.click('[data-testid="cmd-spy"]');
      await page.selectOption('[data-testid="target-city-select"]', '20');
      await page.click('[data-testid="execute-btn"]');

      await expect(page.locator('text=건업에 첩보를 심었습니다')).toBeVisible({ timeout: 5000 });

      // 갱신 후 정보 확인 (목 데이터 변경 필요)
      // await page.goto('/test-server/info/current-city?cityId=20');
      // await expect(page.locator('text=첩보 필요')).not.toBeVisible();
    });
  });

  test.describe('첩보 만료', () => {
    test('첩보 잔여 턴 표시', async ({ page }) => {
      await page.goto('/test-server/map/recent');

      // 첩보 있는 도시에 잔여 턴 표시
      const spiedCity = page.locator('[data-testid="city-marker-10"]');
      await expect(spiedCity.locator('[data-testid="spy-remaining"]')).toContainText('5');
    });
  });
});

test.describe('외교 상태에 따른 정보 공개', () => {
  test('동맹국 도시는 첩보 없이도 기본 정보 공개', async ({ page }) => {
    // 동맹국 설정
    await page.route('**/api/nation/diplomacy', async (route: any) => {
      await route.fulfill({
        json: {
          result: true,
          relations: [
            { nationId: 3, nationName: '오', relation: 'alliance', value: 80 },
          ],
        },
      });
    });

    // 동맹국 도시 목 (일부 정보 공개)
    await page.route('**/api/info/city', async (route: any, request: any) => {
      const body = await request.postDataJSON();
      if (parseInt(body.cityID) === 20) {
        await route.fulfill({
          json: {
            result: true,
            city: {
              ...mockRestrictedCity,
              restricted: false,
              pop: [50000, 80000], // 동맹국은 인구 정도는 공개
              generals: [{ no: 20, name: '손권', officer_level: 12 }],
            },
          },
        });
      }
    });

    await page.goto('/test-server/info/current-city?cityId=20');

    // 동맹국 도시는 일부 정보 공개
    await expect(page.locator('text=건업')).toBeVisible();
    await expect(page.locator('text=손권')).toBeVisible();
  });
});




