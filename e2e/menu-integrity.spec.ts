import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { GetFrontInfoResponse, GetMapResponse } from '../src/lib/api/sammo';
import type { MenuItem } from '../src/components/game/GlobalMenu';

const SESSION_ID = 'sangokushi_default';
const QA_OUTPUT_DIR = path.resolve(process.cwd(), 'test-results/sessionB-menu');

type MessageTab = 'system' | 'public' | 'national' | 'private' | 'diplomacy';

const mockFrontInfo: GetFrontInfoResponse = {
  success: true,
  result: true,
  global: {
    serverName: '세션B QA 서버',
    scenarioText: '테스트 시나리오',
    extendedGeneral: 1,
    isFiction: 1,
    npcMode: 1,
    joinMode: 'onlyRandom',
    startyear: 201,
    year: 201,
    month: 3,
    autorunUser: {
      limit_minutes: 30,
      options: {},
    },
    turnterm: 30,
    turnTime: '2025-11-23 09:00:00',
    lastExecuted: '2025-11-23 08:55:00',
    lastVoteID: 1,
    develCost: 1000,
    noticeMsg: 0,
    onlineNations: 'QA연합',
    onlineUserCnt: 12,
    apiLimit: 100,
    auctionCount: 2,
    isTournamentActive: false,
    isTournamentApplicationOpen: true,
    isBettingActive: true,
    isLocked: false,
    tournamentType: null,
    tournamentState: 0,
    tournamentTime: '2025-11-24 12:00:00',
    genCount: [[11, 24]],
    generalCntLimit: 300,
    serverCnt: 7,
    lastVote: null,
  },
  general: {
    no: 9101,
    name: '세션B-검증관',
    officerLevel: 5,
    officerLevelText: '태위',
    permission: 3,
    officer_city: 1,
    city: 1,
    turntime: '2025-11-23 08:50:00',
    leadership: 92,
    strength: 88,
    intel: 81,
    politics: 77,
    charm: 79,
    leadership_exp: 5400,
    strength_exp: 5200,
    intel_exp: 5100,
    politics_exp: 5000,
    charm_exp: 4800,
    lbonus: 2,
    sbonus: 2,
    ibonus: 1,
    pbonus: 1,
    cbonus: 1,
    horse: '적토마',
    weapon: '청룡언월도',
    gold: 12000,
    rice: 26000,
    crewtype: { id: 1110, label: '근위기병' },
    crew: 18000,
    personal: '충의',
    train: 98,
    atmos: 85,
    troop: 28000,
    troopInfo: {
      name: '근위혼성군',
      leader: {
        city: 1,
        reservedCommand: [],
      },
    },
    refreshScoreTotal: 12,
    refreshScore: 2,
    picture: 'default',
    imgsvr: 0,
    unitStacks: null,
  },
  nation: {
    id: 501,
    name: 'QA연합',
    color: '#2563EB',
    level: 3,
    type: 'republic',
    capital: 1,
    onlineGen: 8,
    cityCnt: 5,
    generalCnt: 30,
    notice: {
      msg: '<p>방침: 글로벌 메뉴 전수 조사</p>',
      author: '세션B-검증관',
      authorID: 9101,
      date: '2025-11-23 08:40:00',
    },
    policy: {
      blockScout: false,
      blockWar: false,
      rate: 2,
      bill: 2,
      secretLimit: 3,
    },
  },
  city: {
    id: 1,
    name: '낙양',
    nationInfo: {
      id: 501,
      name: 'QA연합',
      color: '#2563EB',
    },
    level: 8,
    trust: 85,
    pop: [120000, 140000],
    agri: [90000, 92000],
    comm: [71000, 76000],
    secu: [95, 100],
    def: [54000, 58000],
    wall: [42000, 46000],
    trade: 3000,
    officerList: {
      2: { officer_level: 2, name: '사령관', npc: 0 },
      3: null,
      4: null,
    },
    defense: {
      wall: [54000, 58000],
      gate: [32000, 38000],
    },
  },
  recentRecord: {
    history: [[1, '개인 기록: 안정적입니다.']],
    global: [[1, '전국 정세: 평화 모드']],
    general: [[1, '장수 동향: 검증 절차 진행']],
    flushHistory: 1,
    flushGlobal: 1,
    flushGeneral: 1,
  },
  cityConstMap: {
    1: { name: '낙양' },
  },
};

const mockMap: GetMapResponse = {
  success: true,
  result: true,
  cityList: [
    [1, 9, 0, 501, 2, 1, '낙양', 10, 10],
    [2, 7, 0, 0, 2, 0, '허창', 14, 12],
    [3, 6, 0, 502, 3, 1, '건업', 20, 18],
  ],
  nationList: [
    [501, 'QA연합', '#2563EB', 1, '', 'auto', '#2563EB', '#FFFFFF'],
    [502, '경쟁국', '#EE6352', 3, '', 'auto', '#EE6352', '#FFFFFF'],
  ],
  myCity: 1,
  myNation: 501,
  spyList: {},
  shownByGeneralList: [1, 2],
  startYear: 201,
  year: 201,
  month: 3,
  version: 1,
  tileMap: {
    columns: 4,
    rows: 4,
    tileSize: 32,
    tiles: [],
  },
};

const mockGlobalMenu: MenuItem[] = [
  {
    type: 'item',
    name: '글로벌 뉴스',
    url: '/history',
  },
  {
    type: 'multi',
    name: '세계 행정',
    subMenu: [
      { type: 'item', name: '국가 순위', url: '/info/nation' },
      { type: 'item', name: '도시 순찰', url: '/info/city' },
    ],
  },
  {
    type: 'split',
    name: '전투 지원',
    main: { name: '전선 상황', url: '/battle' },
    subMenu: [
      { type: 'item', name: '전투 로그', url: '/battle-center' },
      { type: 'item', name: '전투 중계', url: '/battle-simulator' },
    ],
  },
];

const mockMessageStore: Record<MessageTab, any[]> = {
  system: [
    { id: 1, type: 'system', text: '시스템: 메뉴 무결성 점검이 시작되었습니다.', date: '2025-11-23 08:50:00' },
  ],
  public: [
    { id: 2, type: 'public', src_general_name: '공지관', text: '전체: 글로벌 메뉴 점검중', date: '2025-11-23 08:51:00' },
  ],
  national: [
    { id: 3, type: 'national', src_nation_name: 'QA연합', text: '국가: 국가 메뉴 스팟 점검', date: '2025-11-23 08:52:00' },
  ],
  private: [
    { id: 4, type: 'private', src_general_name: '세션B-검증관', dest_general_name: '동료 장수', text: '비밀 친서: 개인 메뉴도 정상입니다.', date: '2025-11-23 08:53:00' },
  ],
  diplomacy: [
    { id: 5, type: 'diplomacy', src_nation_name: '경쟁국', text: '외교 전문: 전투 준비상황 공유 요청', date: '2025-11-23 08:54:00' },
  ],
};

const mockContacts = [
  { mailbox: 1000001, name: '위나라', color: 1, general: [[2001, '사마의', 0]] },
  { mailbox: 1000002, name: '오나라', color: 2, general: [[3001, '주유', 0]] },
  { mailbox: 0, name: '재야', color: 0, general: [[4001, '무소속 장수', 0]] },
];

async function ensureQaDir() {
  await fs.mkdir(QA_OUTPUT_DIR, { recursive: true });
}

async function setupGamePageMocks(page: Page) {
  await page.route('**/api/general/get-front-info**', async (route) => {
    await route.fulfill({ json: mockFrontInfo });
  });
  await page.route('**/api/global/get-map**', async (route) => {
    await route.fulfill({ json: mockMap });
  });
  await page.route('**/api/global/get-global-menu**', async (route) => {
    await route.fulfill({ json: { success: true, result: true, menu: mockGlobalMenu, version: 5 } });
  });
  await page.route('**/api/global/get-const**', async (route) => {
    await route.fulfill({ json: { result: true, data: { gameUnitConst: {} } } });
  });
  await page.route('**/api/message/get-messages**', async (route) => {
    const url = new URL(route.request().url());
    const type = (url.searchParams.get('type') || 'system') as MessageTab;
    await route.fulfill({ json: { success: true, result: true, hasMore: false, messages: mockMessageStore[type] ?? [] } });
  });
  await page.route('**/api/message/get-contact-list**', async (route) => {
    await route.fulfill({ json: { success: true, result: true, nation: mockContacts } });
  });
  await page.route('**/api/message/send-message**', async (route) => {
    await route.fulfill({ json: { success: true, result: true } });
  });
}

async function disableNextDevOverlay(page: Page) {
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = `
      nextjs-portal, nextjs-portal * {
        pointer-events: none !important;
        display: none !important;
      }
      script[data-nextjs-dev-overlay] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    document.querySelectorAll('nextjs-portal').forEach((node) => node.remove());
  });
}

const logFiles = {
  script: path.join(QA_OUTPUT_DIR, 'sessionB-menu-playwright.log'),
  checklist: path.join(QA_OUTPUT_DIR, 'sessionB-menu-checklist.md'),
  network: path.join(QA_OUTPUT_DIR, 'sessionB-menu-network.log'),
  trace: path.join(QA_OUTPUT_DIR, 'sessionB-menu-trace.zip'),
  screenshots: {
    global: path.join(QA_OUTPUT_DIR, 'sessionB-global-menu.png'),
    nation: path.join(QA_OUTPUT_DIR, 'sessionB-nation-menu.png'),
    personal: path.join(QA_OUTPUT_DIR, 'sessionB-personal-menu.png'),
    battle: path.join(QA_OUTPUT_DIR, 'sessionB-battle-menu.png'),
  },
};

test.describe('세션 B - 프론트엔드 메뉴 무결성', () => {
  test.beforeEach(async ({ page }) => {
    await ensureQaDir();
    await setupGamePageMocks(page);
  });

  test('글로벌/국가/개인/전투 메뉴 순회', async ({ page }, testInfo) => {
    const scriptLog: string[] = [];
    const networkLog: string[] = [];
    const checklist: string[] = [];
    const requestFlags = {
      frontInfo: false,
      map: false,
      menu: false,
      messages: new Set<MessageTab>(),
    };

    const log = (message: string) => {
      const line = `[${new Date().toISOString()}] ${message}`;
      scriptLog.push(line);
      console.log(line);
    };

    page.on('requestfinished', (request) => {
      const url = request.url();
      if (url.includes('/api/general/get-front-info')) {
        requestFlags.frontInfo = true;
        networkLog.push(`[성공] 전면 정보 API 호출 완료: ${url}`);
      } else if (url.includes('/api/global/get-map')) {
        requestFlags.map = true;
        networkLog.push(`[성공] 월드 맵 API 호출 완료: ${url}`);
      } else if (url.includes('/api/global/get-global-menu')) {
        requestFlags.menu = true;
        networkLog.push(`[성공] 글로벌 메뉴 API 호출 완료: ${url}`);
      } else if (url.includes('/api/message/get-messages')) {
        const type = (new URL(url).searchParams.get('type') || 'system') as MessageTab;
        requestFlags.messages.add(type);
        networkLog.push(`[성공] 메시지 API(${type}) 호출 완료: ${url}`);
      }
    });

    page.on('requestfailed', (request) => {
      networkLog.push(`[실패] ${request.url()} - ${request.failure()?.errorText || '원인 미상'}`);
    });

    await test.step('게임 화면 진입', async () => {
      log('게임 메인 화면으로 이동합니다.');
      await page.goto(`/${SESSION_ID}/game`);
      await expect(page.getByText('전략 맵')).toBeVisible();
      await expect(page.getByRole('heading', { name: '메시지' })).toBeVisible();
      await disableNextDevOverlay(page);
      log('기본 레이아웃 요소가 모두 표시되었습니다.');
    });

    await test.step('글로벌 메뉴 확인', async () => {
      log('하단 외부 버튼을 눌러 글로벌 메뉴를 엽니다.');
      await page.getByRole('button', { name: '외부' }).click();
      await expect(page.getByRole('link', { name: '글로벌 뉴스' })).toBeVisible();
      await page.getByRole('button', { name: /세계 행정/ }).click();
      await expect(page.getByRole('link', { name: '도시 순찰' })).toBeVisible();
      await page.screenshot({ path: logFiles.screenshots.global, fullPage: true });
      await testInfo.attach('세션B-글로벌-메뉴', { path: logFiles.screenshots.global, contentType: 'image/png' });
      checklist.push('✅ 글로벌 메뉴: 외부 서랍/드롭다운 정상 작동');
      await page.mouse.click(10, 10);
    });

    await test.step('국가 메뉴 확인', async () => {
      log('하단 국가 버튼으로 메인 컨트롤 패널을 확인합니다.');
      await page.getByRole('button', { name: '국가' }).click();
      await expect(page.getByRole('link', { name: /회 의 실/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /사 령 부/ })).toBeVisible();
      await page.screenshot({ path: logFiles.screenshots.nation, fullPage: true });
      await testInfo.attach('세션B-국가-메뉴', { path: logFiles.screenshots.nation, contentType: 'image/png' });
      checklist.push('✅ 국가 메뉴: 내정/군사 서브 메뉴 노출');
      await page.mouse.click(10, 10);
    });

    await test.step('개인 메시지 탭 확인', async () => {
      log('메시지 패널의 개인 탭을 선택합니다.');
      const messageHeading = page.getByRole('heading', { name: '메시지' });
      await messageHeading.scrollIntoViewIfNeeded();
      const messagePanelContainer = messageHeading.locator('xpath=../../..');
      await messagePanelContainer.locator('div', { hasText: /^개인$/ }).first().click();
      await expect(messagePanelContainer.getByText('비밀 친서')).toBeVisible();
      await page.screenshot({ path: logFiles.screenshots.personal, fullPage: true });
      await testInfo.attach('세션B-개인-메뉴', { path: logFiles.screenshots.personal, contentType: 'image/png' });
      checklist.push('✅ 개인 메뉴: 메시지 개인 탭 데이터 수신');
    });

    await test.step('전술(전투) 메뉴 확인', async () => {
      log('전술 맵 탭으로 전환해 전투 UI를 확인합니다.');
      await page.getByRole('button', { name: '전술 맵' }).click();
      await expect(page.getByText('현재 도시 전술 전투 참가')).toBeVisible();
      await page.screenshot({ path: logFiles.screenshots.battle, fullPage: true });
      await testInfo.attach('세션B-전투-메뉴', { path: logFiles.screenshots.battle, contentType: 'image/png' });
      checklist.push('✅ 전투 메뉴: 전술 맵 전환 및 행동 버튼 노출');
    });

    expect(requestFlags.frontInfo).toBeTruthy();
    expect(requestFlags.map).toBeTruthy();
    expect(requestFlags.menu).toBeTruthy();
    expect(requestFlags.messages.has('system')).toBeTruthy();
    expect(requestFlags.messages.has('private')).toBeTruthy();

    await fs.writeFile(logFiles.script, scriptLog.join('\n'), 'utf-8');
    await fs.writeFile(logFiles.network, networkLog.join('\n'), 'utf-8');
    await fs.writeFile(logFiles.checklist, checklist.map((item) => `- ${item}`).join('\n'), 'utf-8');
  });
});
