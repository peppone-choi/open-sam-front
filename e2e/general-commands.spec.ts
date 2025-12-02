import { test, expect } from '@playwright/test';

/**
 * 장수 커맨드 E2E 테스트
 * - 내정 커맨드 (농지개간, 상업투자, 치안강화 등)
 * - 군사 커맨드 (징병, 훈련, 출병 등)
 * - 인사 커맨드 (등용, 해고, 임관 등)
 * - 계략 커맨드 (첩보, 유언비어, 반간 등)
 */

// Mock 장수 데이터
const mockGeneral = {
  no: 1,
  name: '조조',
  nation: 1,
  city: 1,
  gold: 50000,
  rice: 30000,
  crew: 5000,
  train: 80,
  atmos: 85,
  leadership: 92,
  strength: 72,
  intel: 96,
  politics: 95,
  charm: 88,
  turntime: new Date().toISOString(),
  killturn: 5,
};

const mockCity = {
  city: 1,
  name: '낙양',
  nation: 1,
  pop: [80000, 100000],
  agri: [7500, 10000],
  comm: [6000, 10000],
  secu: [8000, 10000],
  def: [5000, 10000],
  wall: [9000, 10000],
  trust: 85,
};

const mockNation = {
  nation: 1,
  name: '위',
  color: '#0066CC',
  gold: 500000,
  rice: 300000,
  tech: 75,
};

// API 목 설정
async function mockCommandRoutes(page: any) {
  // 커맨드 메뉴 조회
  await page.route('**/api/general/command-table', async (route: any) => {
    await route.fulfill({
      json: {
        result: true,
        commands: {
          internal: [
            { name: '농지개간', code: 'develop_agri', category: 'internal', reqTurn: 1 },
            { name: '상업투자', code: 'develop_comm', category: 'internal', reqTurn: 1 },
            { name: '치안강화', code: 'develop_secu', category: 'internal', reqTurn: 1 },
            { name: '성벽보수', code: 'repair_wall', category: 'internal', reqTurn: 1 },
            { name: '민심수습', code: 'boost_trust', category: 'internal', reqTurn: 1 },
          ],
          military: [
            { name: '징병', code: 'conscript', category: 'military', reqTurn: 1 },
            { name: '훈련', code: 'train', category: 'military', reqTurn: 1 },
            { name: '사기진작', code: 'boost_morale', category: 'military', reqTurn: 1 },
            { name: '출병', code: 'war', category: 'military', reqTurn: 2 },
            { name: '소집해제', code: 'dismiss', category: 'military', reqTurn: 1 },
          ],
          personnel: [
            { name: '등용', code: 'recruit', category: 'personnel', reqTurn: 1 },
            { name: '해고', code: 'fire', category: 'personnel', reqTurn: 1 },
            { name: '추천', code: 'recommend', category: 'personnel', reqTurn: 1 },
            { name: '하야', code: 'resign', category: 'personnel', reqTurn: 1 },
          ],
          strategy: [
            { name: '첩보', code: 'spy', category: 'strategy', reqTurn: 2 },
            { name: '유언비어', code: 'rumor', category: 'strategy', reqTurn: 2 },
            { name: '반간', code: 'scout_defect', category: 'strategy', reqTurn: 3 },
            { name: '화계', code: 'arson', category: 'strategy', reqTurn: 2 },
          ],
        },
      },
    });
  });

  // 커맨드 실행
  await page.route('**/api/general/run-command', async (route: any, request: any) => {
    const body = await request.postDataJSON();
    const commandCode = body.command;
    
    const results: Record<string, any> = {
      develop_agri: { 
        result: true, 
        message: '농지개간에 성공했습니다. 농업 +150',
        changes: { agri: 150 }
      },
      develop_comm: { 
        result: true, 
        message: '상업투자에 성공했습니다. 상업 +120',
        changes: { comm: 120 }
      },
      conscript: {
        result: true,
        message: '징병에 성공했습니다. 병력 +500',
        changes: { crew: 500, gold: -1000 }
      },
      train: {
        result: true,
        message: '훈련에 성공했습니다. 훈련도 +5',
        changes: { train: 5 }
      },
      spy: {
        result: true,
        message: '낙양에 첩보를 심었습니다.',
        changes: {}
      },
    };

    await route.fulfill({ json: results[commandCode] || { result: false, message: '알 수 없는 커맨드' } });
  });

  // 프론트 정보
  await page.route('**/api/general/front-info', async (route: any) => {
    await route.fulfill({
      json: {
        success: true,
        general: mockGeneral,
        city: mockCity,
        nation: mockNation,
      },
    });
  });
}

test.describe('장수 커맨드 시스템', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommandRoutes(page);
  });

  test.describe('내정 커맨드', () => {
    test('농지개간 커맨드 실행', async ({ page }) => {
      await page.goto('/test-server/game');
      
      // 커맨드 패널 확인
      await expect(page.locator('[data-testid="command-panel"]')).toBeVisible({ timeout: 10000 });
      
      // 내정 탭 클릭
      await page.click('[data-testid="tab-internal"]');
      
      // 농지개간 버튼 클릭
      await page.click('[data-testid="cmd-develop_agri"]');
      
      // 확인 모달
      await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
      await page.click('[data-testid="confirm-btn"]');
      
      // 결과 토스트
      await expect(page.locator('text=농지개간에 성공')).toBeVisible({ timeout: 5000 });
    });

    test('상업투자 커맨드 실행', async ({ page }) => {
      await page.goto('/test-server/game');
      await page.click('[data-testid="tab-internal"]');
      await page.click('[data-testid="cmd-develop_comm"]');
      await page.click('[data-testid="confirm-btn"]');
      await expect(page.locator('text=상업투자에 성공')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('군사 커맨드', () => {
    test('징병 커맨드 - 병종 선택', async ({ page }) => {
      await page.goto('/test-server/game');
      
      // 군사 탭
      await page.click('[data-testid="tab-military"]');
      
      // 징병 클릭
      await page.click('[data-testid="cmd-conscript"]');
      
      // 병종 선택 폼 확인
      await expect(page.locator('[data-testid="crew-type-select"]')).toBeVisible();
      
      // 기병 선택
      await page.selectOption('[data-testid="crew-type-select"]', 'cavalry');
      
      // 수량 입력
      await page.fill('[data-testid="crew-amount-input"]', '500');
      
      // 실행
      await page.click('[data-testid="execute-btn"]');
      
      await expect(page.locator('text=징병에 성공')).toBeVisible({ timeout: 5000 });
    });

    test('훈련 커맨드 실행', async ({ page }) => {
      await page.goto('/test-server/game');
      await page.click('[data-testid="tab-military"]');
      await page.click('[data-testid="cmd-train"]');
      await page.click('[data-testid="confirm-btn"]');
      await expect(page.locator('text=훈련에 성공')).toBeVisible({ timeout: 5000 });
    });

    test('병력 부족 시 출병 제한', async ({ page }) => {
      // 병력 0 목
      await page.route('**/api/general/front-info', async (route: any) => {
        await route.fulfill({
          json: {
            success: true,
            general: { ...mockGeneral, crew: 0 },
            city: mockCity,
            nation: mockNation,
          },
        });
      });

      await page.goto('/test-server/game');
      await page.click('[data-testid="tab-military"]');
      
      // 출병 버튼 비활성화 확인
      const warBtn = page.locator('[data-testid="cmd-war"]');
      await expect(warBtn).toBeDisabled();
    });
  });

  test.describe('계략 커맨드', () => {
    test('첩보 커맨드 - 도시 선택', async ({ page }) => {
      await page.goto('/test-server/game');
      
      // 계략 탭
      await page.click('[data-testid="tab-strategy"]');
      
      // 첩보 클릭
      await page.click('[data-testid="cmd-spy"]');
      
      // 목표 도시 선택
      await expect(page.locator('[data-testid="target-city-select"]')).toBeVisible();
      await page.selectOption('[data-testid="target-city-select"]', '2'); // 허창
      
      // 실행
      await page.click('[data-testid="execute-btn"]');
      
      await expect(page.locator('text=첩보를 심었습니다')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('커맨드 제약 조건', () => {
    test('금/쌀 부족 시 커맨드 제한', async ({ page }) => {
      await page.route('**/api/general/front-info', async (route: any) => {
        await route.fulfill({
          json: {
            success: true,
            general: { ...mockGeneral, gold: 0, rice: 0 },
            city: mockCity,
            nation: mockNation,
          },
        });
      });

      await page.goto('/test-server/game');
      await page.click('[data-testid="tab-military"]');
      
      // 징병 버튼 비활성화 또는 경고
      const conscriptBtn = page.locator('[data-testid="cmd-conscript"]');
      // 비용 표시 확인
      await expect(page.locator('text=비용 부족')).toBeVisible();
    });

    test('턴 부족 시 커맨드 제한', async ({ page }) => {
      await page.route('**/api/general/front-info', async (route: any) => {
        await route.fulfill({
          json: {
            success: true,
            general: { ...mockGeneral, killturn: 0 }, // 턴 0
            city: mockCity,
            nation: mockNation,
          },
        });
      });

      await page.goto('/test-server/game');
      
      // 턴 부족 메시지
      await expect(page.locator('text=턴이 부족')).toBeVisible();
    });
  });
});




