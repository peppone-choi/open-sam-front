import { test, expect } from '@playwright/test';

/**
 * 국가 커맨드 E2E 테스트
 * - 군주/수뇌부 전용 커맨드
 * - 외교 (선전포고, 동맹, 휴전 등)
 * - 정책 (세율, 기술투자 등)
 * - 인사 (관직 임명, 해임 등)
 */

const mockLordGeneral = {
  no: 1,
  name: '조조',
  nation: 1,
  city: 1,
  officer_level: 12, // 군주
  gold: 100000,
  rice: 80000,
};

const mockNation = {
  nation: 1,
  name: '위',
  color: '#0066CC',
  gold: 1000000,
  rice: 800000,
  tech: 80,
  capital: 1,
  type: 'che_centralized',
  level: 5,
};

const mockDiplomacy = {
  relations: [
    { nationId: 2, nationName: '촉', relation: 'hostile', value: -50 },
    { nationId: 3, nationName: '오', relation: 'neutral', value: 0 },
    { nationId: 4, nationName: '원소', relation: 'alliance', value: 80 },
  ],
  treaties: [
    { nationId: 4, type: 'alliance', expiresAt: '2025-12-01' },
  ],
  wars: [
    { nationId: 2, startedAt: '2025-01-15', warScore: 150 },
  ],
};

async function mockNationCommandRoutes(page: any) {
  // 국가 커맨드 메뉴
  await page.route('**/api/nation/command-table', async (route: any) => {
    await route.fulfill({
      json: {
        result: true,
        commands: {
          diplomacy: [
            { name: '선전포고', code: 'declare_war', category: 'diplomacy', reqGold: 50000 },
            { name: '동맹제안', code: 'propose_alliance', category: 'diplomacy', reqGold: 30000 },
            { name: '휴전제안', code: 'propose_truce', category: 'diplomacy', reqGold: 20000 },
            { name: '불가침조약', code: 'non_aggression', category: 'diplomacy', reqGold: 10000 },
          ],
          policy: [
            { name: '세율조정', code: 'adjust_tax', category: 'policy' },
            { name: '기술투자', code: 'invest_tech', category: 'policy', reqGold: 100000 },
            { name: '수도이전', code: 'move_capital', category: 'policy', reqGold: 500000 },
            { name: '국가체제변경', code: 'change_government', category: 'policy' },
          ],
          personnel: [
            { name: '관직임명', code: 'appoint_officer', category: 'personnel' },
            { name: '관직해임', code: 'dismiss_officer', category: 'personnel' },
            { name: '후계지명', code: 'designate_heir', category: 'personnel' },
          ],
          military: [
            { name: '대규모징병', code: 'mass_conscript', category: 'military', reqGold: 200000 },
            { name: '총공격령', code: 'total_war', category: 'military' },
            { name: '방어태세', code: 'defense_mode', category: 'military' },
          ],
        },
      },
    });
  });

  // 외교 정보
  await page.route('**/api/nation/diplomacy', async (route: any) => {
    await route.fulfill({ json: { result: true, ...mockDiplomacy } });
  });

  // 국가 장수 목록
  await page.route('**/api/nation/generals', async (route: any) => {
    await route.fulfill({
      json: {
        result: true,
        generals: [
          { no: 1, name: '조조', officer_level: 12, city: 1 },
          { no: 2, name: '하후돈', officer_level: 6, city: 1 },
          { no: 3, name: '하후연', officer_level: 5, city: 2 },
          { no: 4, name: '조인', officer_level: 4, city: 1 },
          { no: 5, name: '순욱', officer_level: 3, city: 1 },
        ],
      },
    });
  });

  // 커맨드 실행
  await page.route('**/api/nation/run-command', async (route: any, request: any) => {
    const body = await request.postDataJSON();
    const results: Record<string, any> = {
      declare_war: {
        result: true,
        message: '촉에 선전포고했습니다. 전쟁이 시작됩니다!',
      },
      propose_alliance: {
        result: true,
        message: '오에 동맹을 제안했습니다. 응답을 기다립니다.',
      },
      adjust_tax: {
        result: true,
        message: '세율을 30%로 조정했습니다.',
      },
      invest_tech: {
        result: true,
        message: '기술 투자에 성공했습니다. 기술력 +5',
        changes: { tech: 5 },
      },
      appoint_officer: {
        result: true,
        message: '하후돈을 대장군으로 임명했습니다.',
      },
    };
    await route.fulfill({ json: results[body.command] || { result: false, message: '실패' } });
  });

  // 프론트 정보
  await page.route('**/api/general/front-info', async (route: any) => {
    await route.fulfill({
      json: {
        success: true,
        general: mockLordGeneral,
        nation: mockNation,
      },
    });
  });
}

test.describe('국가 커맨드 시스템', () => {
  test.beforeEach(async ({ page }) => {
    await mockNationCommandRoutes(page);
  });

  test.describe('외교 커맨드', () => {
    test('선전포고 - 대상 국가 선택 및 확인', async ({ page }) => {
      await page.goto('/test-server/nation');
      
      // 외교 탭
      await page.click('[data-testid="tab-diplomacy"]');
      
      // 선전포고 클릭
      await page.click('[data-testid="cmd-declare_war"]');
      
      // 대상 국가 선택
      await expect(page.locator('[data-testid="target-nation-select"]')).toBeVisible();
      await page.selectOption('[data-testid="target-nation-select"]', '3'); // 오
      
      // 경고 모달 확인
      await expect(page.locator('text=선전포고')).toBeVisible();
      await expect(page.locator('text=전쟁')).toBeVisible();
      
      // 확인
      await page.click('[data-testid="confirm-btn"]');
      
      await expect(page.locator('text=선전포고했습니다')).toBeVisible({ timeout: 5000 });
    });

    test('이미 전쟁 중인 국가에 선전포고 불가', async ({ page }) => {
      await page.goto('/test-server/nation');
      await page.click('[data-testid="tab-diplomacy"]');
      await page.click('[data-testid="cmd-declare_war"]');
      
      // 촉 선택 (이미 전쟁 중)
      const option = page.locator('[data-testid="target-nation-select"] option[value="2"]');
      await expect(option).toBeDisabled();
    });

    test('동맹 제안', async ({ page }) => {
      await page.goto('/test-server/nation');
      await page.click('[data-testid="tab-diplomacy"]');
      await page.click('[data-testid="cmd-propose_alliance"]');
      
      await page.selectOption('[data-testid="target-nation-select"]', '3'); // 오 (중립)
      await page.click('[data-testid="confirm-btn"]');
      
      await expect(page.locator('text=동맹을 제안')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('정책 커맨드', () => {
    test('세율 조정', async ({ page }) => {
      await page.goto('/test-server/nation');
      await page.click('[data-testid="tab-policy"]');
      await page.click('[data-testid="cmd-adjust_tax"]');
      
      // 세율 슬라이더 또는 입력
      await expect(page.locator('[data-testid="tax-rate-input"]')).toBeVisible();
      await page.fill('[data-testid="tax-rate-input"]', '30');
      
      await page.click('[data-testid="execute-btn"]');
      await expect(page.locator('text=세율을 30%')).toBeVisible({ timeout: 5000 });
    });

    test('기술 투자', async ({ page }) => {
      await page.goto('/test-server/nation');
      await page.click('[data-testid="tab-policy"]');
      await page.click('[data-testid="cmd-invest_tech"]');
      
      // 투자 금액 선택
      await page.selectOption('[data-testid="invest-amount"]', '100000');
      await page.click('[data-testid="confirm-btn"]');
      
      await expect(page.locator('text=기술 투자에 성공')).toBeVisible({ timeout: 5000 });
    });

    test('금 부족 시 기술투자 제한', async ({ page }) => {
      await page.route('**/api/general/front-info', async (route: any) => {
        await route.fulfill({
          json: {
            success: true,
            general: mockLordGeneral,
            nation: { ...mockNation, gold: 10000 }, // 금 부족
          },
        });
      });

      await page.goto('/test-server/nation');
      await page.click('[data-testid="tab-policy"]');
      
      const investBtn = page.locator('[data-testid="cmd-invest_tech"]');
      await expect(investBtn).toBeDisabled();
    });
  });

  test.describe('인사 커맨드', () => {
    test('관직 임명', async ({ page }) => {
      await page.goto('/test-server/nation');
      await page.click('[data-testid="tab-personnel"]');
      await page.click('[data-testid="cmd-appoint_officer"]');
      
      // 대상 장수 선택
      await page.selectOption('[data-testid="target-general"]', '2'); // 하후돈
      
      // 관직 선택
      await page.selectOption('[data-testid="officer-level"]', '8'); // 대장군
      
      await page.click('[data-testid="confirm-btn"]');
      await expect(page.locator('text=대장군으로 임명')).toBeVisible({ timeout: 5000 });
    });

    test('후계 지명 (군주 전용)', async ({ page }) => {
      await page.goto('/test-server/nation');
      await page.click('[data-testid="tab-personnel"]');
      await page.click('[data-testid="cmd-designate_heir"]');
      
      // 후계자 선택
      await page.selectOption('[data-testid="heir-select"]', '2'); // 하후돈
      await page.click('[data-testid="confirm-btn"]');
      
      await expect(page.locator('text=후계')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('권한 체크', () => {
    test('일반 장수는 국가 커맨드 접근 불가', async ({ page }) => {
      await page.route('**/api/general/front-info', async (route: any) => {
        await route.fulfill({
          json: {
            success: true,
            general: { ...mockLordGeneral, officer_level: 1 }, // 일반 장수
            nation: mockNation,
          },
        });
      });

      await page.goto('/test-server/nation');
      
      // 권한 없음 메시지 또는 리다이렉트
      await expect(page.locator('text=권한이 없습니다')).toBeVisible();
    });

    test('수뇌부는 일부 커맨드만 접근 가능', async ({ page }) => {
      await page.route('**/api/general/front-info', async (route: any) => {
        await route.fulfill({
          json: {
            success: true,
            general: { ...mockLordGeneral, officer_level: 6 }, // 수뇌부
            nation: mockNation,
          },
        });
      });

      await page.goto('/test-server/nation');
      await page.click('[data-testid="tab-personnel"]');
      
      // 후계 지명은 군주만 가능
      const heirBtn = page.locator('[data-testid="cmd-designate_heir"]');
      await expect(heirBtn).not.toBeVisible();
    });
  });
});




