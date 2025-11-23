import { test, expect } from '@playwright/test';

// Mock auction data
const mockAuctions = {
  active: [
    {
      id: 'auction-001',
      itemId: 'item-legendary-sword',
      itemName: '청룡언월도',
      rarity: 'legendary',
      seller: '상인 NPC',
      currentBid: 50000,
      minBid: 45000,
      buyoutPrice: 100000,
      bids: [
        { bidderId: 'gen-001', bidderName: '조조', amount: 50000, timestamp: '2025-11-23T10:00:00Z' },
      ],
      endsAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      status: 'active',
    },
    {
      id: 'auction-002',
      itemId: 'item-rare-armor',
      itemName: '금갑주',
      rarity: 'rare',
      seller: '장수',
      currentBid: 20000,
      minBid: 18000,
      buyoutPrice: 40000,
      bids: [],
      endsAt: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      status: 'active',
    },
  ],
  myBids: [
    {
      auctionId: 'auction-001',
      itemName: '청룡언월도',
      myBid: 50000,
      currentBid: 50000,
      isWinning: true,
      endsAt: new Date(Date.now() + 3600000).toISOString(),
    },
  ],
};

// Mock betting data
const mockBettingEvents = {
  active: [
    {
      id: 'bet-001',
      eventType: 'battle',
      title: '조조 vs 손권 대전',
      description: '적벽대전 재현',
      options: [
        { id: 'opt-1', name: '조조 승리', odds: 1.8, totalBets: 150000 },
        { id: 'opt-2', name: '손권 승리', odds: 2.2, totalBets: 100000 },
      ],
      endsAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      status: 'active',
    },
    {
      id: 'bet-002',
      eventType: 'tournament',
      title: '무술 토너먼트 결승',
      description: '최강 장수 결정전',
      options: [
        { id: 'opt-3', name: '여포', odds: 1.5, totalBets: 200000 },
        { id: 'opt-4', name: '관우', odds: 2.0, totalBets: 120000 },
        { id: 'opt-5', name: '조운', odds: 3.5, totalBets: 80000 },
      ],
      endsAt: new Date(Date.now() + 43200000).toISOString(), // 12 hours from now
      status: 'active',
    },
  ],
  myBets: [
    {
      eventId: 'bet-001',
      title: '조조 vs 손권 대전',
      selectedOption: '조조 승리',
      amount: 10000,
      potentialWin: 18000,
      status: 'pending',
    },
  ],
};

// Mock tournament data
const mockTournaments = {
  current: {
    id: 'tournament-001',
    name: '천하제일무술대회',
    type: 'single-elimination',
    entryFee: 5000,
    prizePool: 500000,
    participants: 32,
    maxParticipants: 64,
    currentRound: 'quarterfinals',
    startTime: new Date(Date.now() - 3600000).toISOString(),
    status: 'ongoing',
    brackets: [
      {
        round: 'quarterfinals',
        matchId: 'match-01',
        fighter1: { id: 'gen-001', name: '여포', wins: 3 },
        fighter2: { id: 'gen-002', name: '관우', wins: 3 },
        winner: null,
        scheduledTime: new Date(Date.now() + 1800000).toISOString(),
      },
    ],
  },
  upcoming: [
    {
      id: 'tournament-002',
      name: '전술 전략대회',
      type: 'round-robin',
      entryFee: 3000,
      prizePool: 200000,
      participants: 8,
      maxParticipants: 16,
      startTime: new Date(Date.now() + 172800000).toISOString(),
      status: 'registration',
    },
  ],
};

async function mockEconomyRoutes(page: any) {
  // Auction routes
  await page.route('**/api/economy/auctions**', async (route: any) => {
    await route.fulfill({ json: { result: true, data: mockAuctions } });
  });

  await page.route('**/api/economy/auction/*/bid', async (route: any, request: any) => {
    if (request.method() === 'POST') {
      const body = request.postDataJSON?.() ?? {};
      await route.fulfill({
        json: {
          result: true,
          data: {
            bidId: 'bid-new',
            amount: body.amount,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } else {
      await route.abort();
    }
  });

  await page.route('**/api/economy/auction/*/buyout', async (route: any, request: any) => {
    if (request.method() === 'POST') {
      await route.fulfill({
        json: {
          result: true,
          data: { purchased: true, itemId: 'item-legendary-sword' },
        },
      });
    } else {
      await route.abort();
    }
  });

  // Betting routes
  await page.route('**/api/economy/betting/events**', async (route: any) => {
    await route.fulfill({ json: { result: true, data: mockBettingEvents } });
  });

  await page.route('**/api/economy/betting/place', async (route: any, request: any) => {
    if (request.method() === 'POST') {
      const body = request.postDataJSON?.() ?? {};
      await route.fulfill({
        json: {
          result: true,
          data: {
            betId: 'bet-new',
            eventId: body.eventId,
            optionId: body.optionId,
            amount: body.amount,
            potentialWin: body.amount * 1.8,
          },
        },
      });
    } else {
      await route.abort();
    }
  });

  // Tournament routes
  await page.route('**/api/economy/tournaments**', async (route: any) => {
    await route.fulfill({ json: { result: true, data: mockTournaments } });
  });

  await page.route('**/api/economy/tournament/*/register', async (route: any, request: any) => {
    if (request.method() === 'POST') {
      await route.fulfill({
        json: {
          result: true,
          data: { registered: true, tournamentId: 'tournament-002' },
        },
      });
    } else {
      await route.abort();
    }
  });
}

test.describe('Economy - Auction House', () => {
  test.beforeEach(async ({ page }) => {
    await mockEconomyRoutes(page);
  });

  test('displays active auctions with item details', async ({ page }) => {
    await page.goto('/economy/auction');

    await expect(page.getByRole('heading', { name: '경매장' })).toBeVisible();

    // Check auction items are displayed
    const auctionList = page.getByTestId('auction-list');
    await expect(auctionList).toBeVisible();

    const firstAuction = page.getByTestId('auction-item-auction-001');
    await expect(firstAuction).toBeVisible();
    await expect(firstAuction).toContainText('청룡언월도');
    await expect(firstAuction).toContainText('50000');
    await expect(firstAuction).toContainText('100000'); // buyout price
  });

  test('allows placing a bid on auction item', async ({ page }) => {
    await page.goto('/economy/auction');

    const auctionItem = page.getByTestId('auction-item-auction-002');
    await auctionItem.click();

    // Bid panel should appear
    const bidPanel = page.getByTestId('auction-bid-panel');
    await expect(bidPanel).toBeVisible();

    // Enter bid amount
    const bidInput = bidPanel.getByRole('spinbutton', { name: /입찰 금액/ });
    await bidInput.fill('25000');

    // Submit bid
    const bidButton = page.getByRole('button', { name: '입찰하기' });
    await bidButton.click();

    // Success message should appear
    await expect(page.getByText(/입찰.*성공/)).toBeVisible();
  });

  test('allows instant buyout of auction item', async ({ page }) => {
    await page.goto('/economy/auction');

    const auctionItem = page.getByTestId('auction-item-auction-001');
    await auctionItem.click();

    // Click buyout button
    const buyoutButton = page.getByRole('button', { name: '즉시 구매' });
    await expect(buyoutButton).toBeEnabled();
    await buyoutButton.click();

    // Confirm dialog
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText('100000');

    await page.getByRole('button', { name: '확인' }).click();

    // Success message
    await expect(page.getByText(/구매.*완료/)).toBeVisible();
  });

  test('displays user active bids', async ({ page }) => {
    await page.goto('/economy/auction/my-bids');

    const myBidsSection = page.getByTestId('my-bids-section');
    await expect(myBidsSection).toBeVisible();

    const firstBid = page.getByTestId('my-bid-auction-001');
    await expect(firstBid).toContainText('청룡언월도');
    await expect(firstBid).toContainText('50000');
    await expect(firstBid).toContainText('선두'); // winning indicator
  });

  test('shows countdown timer for auction ending', async ({ page }) => {
    await page.goto('/economy/auction');

    const auctionItem = page.getByTestId('auction-item-auction-001');
    const timer = auctionItem.getByTestId('auction-timer');
    await expect(timer).toBeVisible();
    await expect(timer.textContent()).toBeTruthy();
  });
});

test.describe('Economy - Betting System', () => {
  test.beforeEach(async ({ page }) => {
    await mockEconomyRoutes(page);
  });

  test('displays active betting events', async ({ page }) => {
    await page.goto('/economy/betting');

    await expect(page.getByRole('heading', { name: '베팅' })).toBeVisible();

    const eventList = page.getByTestId('betting-events-list');
    await expect(eventList).toBeVisible();

    const firstEvent = page.getByTestId('betting-event-bet-001');
    await expect(firstEvent).toBeVisible();
    await expect(firstEvent).toContainText('조조 vs 손권 대전');
  });

  test('shows betting odds for each option', async ({ page }) => {
    await page.goto('/economy/betting');

    const event = page.getByTestId('betting-event-bet-001');
    await event.click();

    const optionsPanel = page.getByTestId('betting-options-panel');
    await expect(optionsPanel).toBeVisible();

    // Check odds are displayed
    await expect(optionsPanel).toContainText('1.8');
    await expect(optionsPanel).toContainText('2.2');
  });

  test('allows placing a bet on event outcome', async ({ page }) => {
    await page.goto('/economy/betting');

    const event = page.getByTestId('betting-event-bet-002');
    await event.click();

    // Select option
    const option = page.getByTestId('betting-option-opt-3');
    await option.click();

    // Enter bet amount
    const amountInput = page.getByRole('spinbutton', { name: /베팅 금액/ });
    await amountInput.fill('5000');

    // Check potential win calculation
    const potentialWin = page.getByTestId('potential-win');
    await expect(potentialWin).toContainText('7500'); // 5000 * 1.5

    // Place bet
    const placeBetButton = page.getByRole('button', { name: '베팅하기' });
    await placeBetButton.click();

    await expect(page.getByText(/베팅.*성공/)).toBeVisible();
  });

  test('displays user active bets', async ({ page }) => {
    await page.goto('/economy/betting/my-bets');

    const myBetsSection = page.getByTestId('my-bets-section');
    await expect(myBetsSection).toBeVisible();

    const firstBet = page.getByTestId('my-bet-bet-001');
    await expect(firstBet).toContainText('조조 vs 손권 대전');
    await expect(firstBet).toContainText('조조 승리');
    await expect(firstBet).toContainText('10000');
    await expect(firstBet).toContainText('18000');
  });
});

test.describe('Economy - Tournament', () => {
  test.beforeEach(async ({ page }) => {
    await mockEconomyRoutes(page);
  });

  test('displays current tournament status and brackets', async ({ page }) => {
    await page.goto('/economy/tournament');

    await expect(page.getByRole('heading', { name: '토너먼트' })).toBeVisible();

    const currentTournament = page.getByTestId('current-tournament');
    await expect(currentTournament).toBeVisible();
    await expect(currentTournament).toContainText('천하제일무술대회');
    await expect(currentTournament).toContainText('500000'); // prize pool

    // Check brackets
    const brackets = page.getByTestId('tournament-brackets');
    await expect(brackets).toBeVisible();
    await expect(brackets).toContainText('여포');
    await expect(brackets).toContainText('관우');
  });

  test('shows upcoming tournaments for registration', async ({ page }) => {
    await page.goto('/economy/tournament');

    const upcomingSection = page.getByTestId('upcoming-tournaments');
    await expect(upcomingSection).toBeVisible();

    const upcomingTournament = page.getByTestId('tournament-tournament-002');
    await expect(upcomingTournament).toContainText('전술 전략대회');
    await expect(upcomingTournament).toContainText('3000'); // entry fee
  });

  test('allows registering for upcoming tournament', async ({ page }) => {
    await page.goto('/economy/tournament');

    const upcomingTournament = page.getByTestId('tournament-tournament-002');
    const registerButton = upcomingTournament.getByRole('button', { name: '등록' });
    await expect(registerButton).toBeEnabled();
    await registerButton.click();

    // Confirm dialog
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText('3000'); // entry fee

    await page.getByRole('button', { name: '확인' }).click();

    await expect(page.getByText(/등록.*완료/)).toBeVisible();
  });

  test('displays tournament match schedule', async ({ page }) => {
    await page.goto('/economy/tournament/tournament-001');

    const schedule = page.getByTestId('tournament-schedule');
    await expect(schedule).toBeVisible();

    const match = page.getByTestId('tournament-match-match-01');
    await expect(match).toBeVisible();
    await expect(match).toContainText('여포');
    await expect(match).toContainText('관우');
  });
});
