import { test, expect } from '@playwright/test';

/**
 * 멀티스택 전투 E2E 테스트
 * - 토탈 워 스타일 전투
 * - 장수 1명이 여러 병종 스택을 개별 제어
 * - 스택별 명령 (이동, 돌격, 사격 등)
 * - 전투 결과 및 손실 반영
 */

// Mock 멀티스택 전투 데이터
const mockMultiStackBattle = {
  battleId: 'battle-multistack-001',
  sessionId: 'test-session',
  phase: 'planning',
  currentTurn: 1,
  maxTurns: 15,
  turnSeconds: 90,
  
  attackerNationId: 1,
  defenderNationId: 2,
  targetCityId: 10,
  
  // 공격측: 장수 1명이 3개 스택 보유
  attackerUnits: [
    {
      generalId: 101, // 장수no * 100 + 스택인덱스
      generalName: '조조 보병대',
      commanderId: 1, // 실제 장수 번호
      troops: 3000,
      maxTroops: 3000,
      unitType: 'FOOTMAN',
      morale: 85,
      training: 80,
      position: { x: 100, y: 300 },
      formation: 'LINE',
      stance: 'aggressive',
      originStackId: 'stack-001',
      originType: 'generalStack',
      specialSkills: ['방진', '장창'],
    },
    {
      generalId: 102,
      generalName: '조조 궁병대',
      commanderId: 1,
      troops: 2000,
      maxTroops: 2000,
      unitType: 'ARCHER',
      morale: 80,
      training: 75,
      position: { x: 150, y: 350 },
      formation: 'skirmish',
      stance: 'aggressive',
      originStackId: 'stack-002',
      originType: 'generalStack',
      specialSkills: ['일제사격', '화살비'],
    },
    {
      generalId: 103,
      generalName: '조조 기병대',
      commanderId: 1,
      troops: 1500,
      maxTroops: 1500,
      unitType: 'CAVALRY',
      morale: 90,
      training: 85,
      position: { x: 50, y: 400 },
      formation: 'wedge',
      stance: 'aggressive',
      originStackId: 'stack-003',
      originType: 'generalStack',
      specialSkills: ['돌격', '추격'],
    },
  ],
  
  // 방어측: 장수 2명
  defenderUnits: [
    {
      generalId: 201,
      generalName: '관우 보병대',
      commanderId: 2,
      troops: 4000,
      maxTroops: 4000,
      unitType: 'FOOTMAN',
      morale: 95,
      training: 90,
      position: { x: 600, y: 300 },
      formation: 'LINE',
      stance: 'defensive',
      originStackId: 'stack-101',
      originType: 'generalStack',
    },
    {
      generalId: 301,
      generalName: '장비 기병대',
      commanderId: 3,
      troops: 2500,
      maxTroops: 2500,
      unitType: 'CAVALRY',
      morale: 88,
      training: 82,
      position: { x: 650, y: 400 },
      formation: 'wedge',
      stance: 'aggressive',
      originStackId: 'stack-201',
      originType: 'generalStack',
    },
  ],
  
  mapInfo: {
    width: 800,
    height: 600,
    terrain: 'plain',
    castle: null,
  },
};

const mockBattleResult = {
  battleId: 'battle-multistack-001',
  winner: 'attacker',
  turns: 8,
  
  // 스택별 최종 상태
  finalState: {
    attackerUnits: [
      { generalId: 101, troops: 2200, casualties: 800 },
      { generalId: 102, troops: 1800, casualties: 200 },
      { generalId: 103, troops: 1000, casualties: 500 },
    ],
    defenderUnits: [
      { generalId: 201, troops: 1500, casualties: 2500 },
      { generalId: 301, troops: 0, casualties: 2500, destroyed: true },
    ],
  },
  
  // 지휘관별 집계
  commanderSummary: {
    1: { // 조조
      initialTroops: 6500,
      finalTroops: 5000,
      casualties: 1500,
      kills: 3000,
    },
    2: { // 관우
      initialTroops: 4000,
      finalTroops: 1500,
      casualties: 2500,
      kills: 800,
    },
    3: { // 장비 (전멸)
      initialTroops: 2500,
      finalTroops: 0,
      casualties: 2500,
      kills: 700,
      destroyed: true,
    },
  },
  
  battleLog: [
    { turn: 1, message: '조조 기병대가 측면으로 이동합니다.' },
    { turn: 2, message: '조조 궁병대가 일제사격을 발사합니다!' },
    { turn: 3, message: '장비 기병대가 돌격합니다!' },
    { turn: 5, message: '조조 기병대가 장비 기병대와 교전합니다!' },
    { turn: 7, message: '장비 기병대가 전멸했습니다!' },
    { turn: 8, message: '관우 보병대가 후퇴합니다. 공격측 승리!' },
  ],
};

async function mockMultiStackBattleRoutes(page: any) {
  // 전투 상태 조회
  await page.route('**/api/battle/state/**', async (route: any) => {
    await route.fulfill({ json: { result: true, data: mockMultiStackBattle } });
  });

  // 턴 액션 제출
  await page.route('**/api/battle/submit-actions', async (route: any, request: any) => {
    const body = await request.postDataJSON();
    await route.fulfill({
      json: {
        result: true,
        message: `${body.actions.length}개 명령 제출 완료`,
      },
    });
  });

  // 개별 유닛 명령
  await page.route('**/api/battle/unit-command', async (route: any, request: any) => {
    const body = await request.postDataJSON();
    await route.fulfill({
      json: {
        result: true,
        message: `유닛 ${body.generalId}에 ${body.command} 명령`,
      },
    });
  });

  // 전투 결과
  await page.route('**/api/battle/result/**', async (route: any) => {
    await route.fulfill({ json: { result: true, data: mockBattleResult } });
  });
}

test.describe('멀티스택 전투 시스템', () => {
  test.beforeEach(async ({ page }) => {
    await mockMultiStackBattleRoutes(page);
  });

  test.describe('전투 UI', () => {
    test('멀티스택 유닛 목록 표시', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001');
      
      // 공격측 유닛 3개 표시
      await expect(page.locator('[data-testid="attacker-units"]')).toBeVisible();
      await expect(page.locator('[data-testid="unit-101"]')).toBeVisible(); // 보병
      await expect(page.locator('[data-testid="unit-102"]')).toBeVisible(); // 궁병
      await expect(page.locator('[data-testid="unit-103"]')).toBeVisible(); // 기병
      
      // 방어측 유닛 2개 표시
      await expect(page.locator('[data-testid="defender-units"]')).toBeVisible();
      await expect(page.locator('[data-testid="unit-201"]')).toBeVisible();
      await expect(page.locator('[data-testid="unit-301"]')).toBeVisible();
    });

    test('같은 지휘관 유닛 그룹 표시', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001');
      
      // 조조 휘하 유닛들이 그룹화되어 표시
      const commanderGroup = page.locator('[data-testid="commander-group-1"]');
      await expect(commanderGroup).toBeVisible();
      await expect(commanderGroup.locator('[data-testid="unit-101"]')).toBeVisible();
      await expect(commanderGroup.locator('[data-testid="unit-102"]')).toBeVisible();
      await expect(commanderGroup.locator('[data-testid="unit-103"]')).toBeVisible();
    });

    test('유닛 정보 패널', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001');
      
      // 보병대 클릭
      await page.click('[data-testid="unit-101"]');
      
      // 상세 정보 패널
      const infoPanel = page.locator('[data-testid="unit-info-panel"]');
      await expect(infoPanel).toBeVisible();
      await expect(infoPanel.locator('text=조조 보병대')).toBeVisible();
      await expect(infoPanel.locator('text=3000')).toBeVisible(); // 병력
      await expect(infoPanel.locator('text=방진')).toBeVisible(); // 특수스킬
      await expect(infoPanel.locator('text=장창')).toBeVisible();
    });
  });

  test.describe('유닛 개별 명령', () => {
    test('유닛 이동 명령', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001');
      
      // 기병대 선택
      await page.click('[data-testid="unit-103"]');
      
      // 이동 명령 버튼
      await page.click('[data-testid="cmd-move"]');
      
      // 맵에서 목표 위치 클릭
      await page.click('[data-testid="battle-map"]', { position: { x: 400, y: 300 } });
      
      // 이동 경로 표시 확인
      await expect(page.locator('[data-testid="move-path-103"]')).toBeVisible();
    });

    test('궁병 일제사격 명령', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001');
      
      // 궁병대 선택
      await page.click('[data-testid="unit-102"]');
      
      // 일제사격 버튼
      await page.click('[data-testid="cmd-volley"]');
      
      // 목표 선택
      await page.click('[data-testid="unit-201"]'); // 관우 보병대
      
      await expect(page.locator('text=일제사격')).toBeVisible();
    });

    test('기병 돌격 명령', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001');
      
      // 기병대 선택
      await page.click('[data-testid="unit-103"]');
      
      // 돌격 버튼
      await page.click('[data-testid="cmd-charge"]');
      
      // 목표 선택
      await page.click('[data-testid="unit-301"]'); // 장비 기병대
      
      await expect(page.locator('text=돌격')).toBeVisible();
    });

    test('보병 진형 변경', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001');
      
      // 보병대 선택
      await page.click('[data-testid="unit-101"]');
      
      // 진형 변경 버튼
      await page.click('[data-testid="cmd-formation"]');
      
      // 방진 선택
      await page.click('[data-testid="formation-square"]');
      
      await expect(page.locator('[data-testid="unit-101"][data-formation="square"]')).toBeVisible();
    });
  });

  test.describe('전체 명령 제출', () => {
    test('턴 종료 시 모든 명령 제출', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001');
      
      // 여러 유닛에 명령
      await page.click('[data-testid="unit-101"]');
      await page.click('[data-testid="cmd-move"]');
      await page.click('[data-testid="battle-map"]', { position: { x: 300, y: 300 } });
      
      await page.click('[data-testid="unit-102"]');
      await page.click('[data-testid="cmd-volley"]');
      await page.click('[data-testid="unit-201"]');
      
      // 턴 종료
      await page.click('[data-testid="end-turn-btn"]');
      
      // 확인
      await expect(page.locator('text=명령 제출 완료')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('전투 결과', () => {
    test('스택별 손실 표시', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001/result');
      
      // 공격측 결과
      await expect(page.locator('text=조조 보병대')).toBeVisible();
      await expect(page.locator('text=2200')).toBeVisible(); // 생존
      await expect(page.locator('text=-800')).toBeVisible(); // 손실
      
      // 전멸 유닛
      await expect(page.locator('text=장비 기병대')).toBeVisible();
      await expect(page.locator('[data-testid="unit-301-destroyed"]')).toBeVisible();
    });

    test('지휘관별 집계 표시', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001/result');
      
      // 조조 총계
      const jojosummary = page.locator('[data-testid="commander-summary-1"]');
      await expect(jojosummary.locator('text=5000')).toBeVisible(); // 최종 병력
      await expect(jojosummary.locator('text=1500')).toBeVisible(); // 손실
      
      // 장비 전멸
      const zhangfei = page.locator('[data-testid="commander-summary-3"]');
      await expect(zhangfei.locator('text=전멸')).toBeVisible();
    });

    test('전투 로그 표시', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001/result');
      
      await page.click('[data-testid="show-battle-log"]');
      
      const log = page.locator('[data-testid="battle-log"]');
      await expect(log.locator('text=일제사격')).toBeVisible();
      await expect(log.locator('text=전멸했습니다')).toBeVisible();
      await expect(log.locator('text=공격측 승리')).toBeVisible();
    });
  });

  test.describe('병종별 특수 능력', () => {
    test('기병 돌격 보너스', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001');
      
      await page.click('[data-testid="unit-103"]'); // 기병
      
      // 돌격 가능 표시
      const chargeBtn = page.locator('[data-testid="cmd-charge"]');
      await expect(chargeBtn).toBeEnabled();
      
      // 돌격 보너스 툴팁
      await chargeBtn.hover();
      await expect(page.locator('text=돌격 데미지 +50%')).toBeVisible();
    });

    test('궁병 사거리 표시', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001');
      
      await page.click('[data-testid="unit-102"]'); // 궁병
      
      // 사거리 원 표시
      await expect(page.locator('[data-testid="range-indicator-102"]')).toBeVisible();
    });

    test('보병 방진 방어 보너스', async ({ page }) => {
      await page.goto('/test-server/battle/battle-multistack-001');
      
      await page.click('[data-testid="unit-101"]'); // 보병
      await page.click('[data-testid="cmd-formation"]');
      await page.click('[data-testid="formation-square"]');
      
      // 방어 보너스 표시
      await expect(page.locator('text=방어력 +30%')).toBeVisible();
      await expect(page.locator('text=이동속도 -50%')).toBeVisible();
    });
  });
});




