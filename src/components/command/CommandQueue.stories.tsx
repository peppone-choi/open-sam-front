import type { Meta, StoryObj } from '@storybook/react';
import CommandQueue from './CommandQueue';

const meta: Meta<typeof CommandQueue> = {
  title: 'Command/CommandQueue',
  component: CommandQueue,
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
type Story = StoryObj<typeof CommandQueue>;

const mockCommands = [
  {
    id: 'cmd-001',
    type: 'move',
    typeName: '이동',
    generalId: 'gen-001',
    generalName: '조조',
    target: '낙양',
    status: 'pending',
    scheduledTurn: 15,
    cpCost: 10,
    submittedAt: '2025-11-23T10:00:00Z',
  },
  {
    id: 'cmd-002',
    type: 'attack',
    typeName: '공격',
    generalId: 'gen-002',
    generalName: '관우',
    target: '양양',
    status: 'executing',
    scheduledTurn: 14,
    cpCost: 20,
    submittedAt: '2025-11-23T09:30:00Z',
    progress: 65,
  },
  {
    id: 'cmd-003',
    type: 'recruit',
    typeName: '모병',
    generalId: 'gen-003',
    generalName: '장비',
    target: '서주',
    status: 'completed',
    scheduledTurn: 13,
    cpCost: 30,
    submittedAt: '2025-11-23T09:00:00Z',
    completedAt: '2025-11-23T10:30:00Z',
    result: {
      success: true,
      recruited: 5000,
    },
  },
  {
    id: 'cmd-004',
    type: 'farm',
    typeName: '농사',
    generalId: 'gen-004',
    generalName: '손권',
    target: '강동',
    status: 'failed',
    scheduledTurn: 13,
    cpCost: 20,
    submittedAt: '2025-11-23T08:30:00Z',
    failedAt: '2025-11-23T09:45:00Z',
    error: '날씨가 좋지 않아 실패했습니다.',
  },
];

export const Default: Story = {
  args: {
    commands: mockCommands,
  },
};

export const Empty: Story = {
  args: {
    commands: [],
  },
};

export const PendingOnly: Story = {
  args: {
    commands: mockCommands.filter((cmd) => cmd.status === 'pending'),
  },
};

export const ExecutingOnly: Story = {
  args: {
    commands: mockCommands.filter((cmd) => cmd.status === 'executing'),
  },
};

export const CompletedOnly: Story = {
  args: {
    commands: mockCommands.filter((cmd) => cmd.status === 'completed'),
  },
};

export const WithFailures: Story = {
  args: {
    commands: mockCommands.filter((cmd) => cmd.status === 'failed' || cmd.status === 'completed'),
  },
};

export const LongQueue: Story = {
  args: {
    commands: [
      ...mockCommands,
      ...Array.from({ length: 10 }).map((_, i) => ({
        id: `cmd-${100 + i}`,
        type: 'train',
        typeName: '훈련',
        generalId: `gen-${100 + i}`,
        generalName: `장수${i + 1}`,
        target: '병영',
        status: 'pending' as const,
        scheduledTurn: 16 + i,
        cpCost: 25,
        submittedAt: new Date(Date.now() - i * 60000).toISOString(),
      })),
    ],
  },
};

export const WithCancelAction: Story = {
  args: {
    commands: mockCommands.filter((cmd) => cmd.status === 'pending'),
    onCancel: (commandId: string) => {
      console.log('Cancel command:', commandId);
    },
  },
};

export const Mobile: Story = {
  args: {
    commands: mockCommands,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Compact: Story = {
  args: {
    commands: mockCommands,
    compact: true,
  },
};
