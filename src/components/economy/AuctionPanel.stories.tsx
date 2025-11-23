import type { Meta, StoryObj } from '@storybook/react';
import AuctionPanel from './AuctionPanel';

const meta: Meta<typeof AuctionPanel> = {
  title: 'Economy/AuctionPanel',
  component: AuctionPanel,
  parameters: {
    layout: 'padded',
    chromatic: {
      viewports: [375, 768, 1280],
      delay: 300,
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AuctionPanel>;

const mockAuctions = [
  {
    id: 'auction-001',
    itemId: 'item-legendary-sword',
    itemName: '청룡언월도',
    itemDescription: '전설적인 무기. 무력 +15',
    rarity: 'legendary',
    seller: '상인 NPC',
    currentBid: 50000,
    minBid: 45000,
    buyoutPrice: 100000,
    bids: [
      { bidderId: 'gen-001', bidderName: '조조', amount: 50000, timestamp: '2025-11-23T10:00:00Z' },
      { bidderId: 'gen-002', bidderName: '손권', amount: 48000, timestamp: '2025-11-23T09:55:00Z' },
    ],
    endsAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    status: 'active',
  },
  {
    id: 'auction-002',
    itemId: 'item-rare-armor',
    itemName: '금갑주',
    itemDescription: '희귀한 갑옷. 방어력 +10',
    rarity: 'rare',
    seller: '장수',
    currentBid: 20000,
    minBid: 18000,
    buyoutPrice: 40000,
    bids: [],
    endsAt: new Date(Date.now() + 7200000).toISOString(), // 2 hours
    status: 'active',
  },
  {
    id: 'auction-003',
    itemId: 'item-common-horse',
    itemName: '적토마',
    itemDescription: '빠른 말. 이동력 +5',
    rarity: 'epic',
    seller: '마구간',
    currentBid: 80000,
    minBid: 75000,
    buyoutPrice: 150000,
    bids: [
      { bidderId: 'gen-003', bidderName: '여포', amount: 80000, timestamp: '2025-11-23T10:30:00Z' },
    ],
    endsAt: new Date(Date.now() + 1800000).toISOString(), // 30 min
    status: 'active',
  },
];

export const Default: Story = {
  args: {
    auctions: mockAuctions,
  },
};

export const Empty: Story = {
  args: {
    auctions: [],
  },
};

export const SingleAuction: Story = {
  args: {
    auctions: [mockAuctions[0]],
  },
};

export const NoBids: Story = {
  args: {
    auctions: mockAuctions.filter((a) => a.bids.length === 0),
  },
};

export const EndingSoon: Story = {
  args: {
    auctions: [
      {
        ...mockAuctions[2],
        endsAt: new Date(Date.now() + 300000).toISOString(), // 5 min
      },
    ],
  },
};

export const Expired: Story = {
  args: {
    auctions: [
      {
        ...mockAuctions[0],
        status: 'expired',
        endsAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
};

export const WithUserBid: Story = {
  args: {
    auctions: mockAuctions,
    currentUserId: 'gen-001',
  },
};

export const LongList: Story = {
  args: {
    auctions: [
      ...mockAuctions,
      ...Array.from({ length: 10 }).map((_, i) => ({
        id: `auction-${100 + i}`,
        itemId: `item-${100 + i}`,
        itemName: `아이템 ${i + 1}`,
        itemDescription: '일반 아이템',
        rarity: ['common', 'rare', 'epic'][i % 3] as 'common' | 'rare' | 'epic',
        seller: '상인',
        currentBid: 10000 + i * 1000,
        minBid: 9000 + i * 1000,
        buyoutPrice: 20000 + i * 2000,
        bids: [],
        endsAt: new Date(Date.now() + (i + 1) * 3600000).toISOString(),
        status: 'active' as const,
      })),
    ],
  },
};

export const Mobile: Story = {
  args: {
    auctions: mockAuctions,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const GridView: Story = {
  args: {
    auctions: mockAuctions,
    viewMode: 'grid',
  },
};

export const ListView: Story = {
  args: {
    auctions: mockAuctions,
    viewMode: 'list',
  },
};
