import type { Meta, StoryObj } from '@storybook/react';
import CommandForm from './CommandForm';

const meta: Meta<typeof CommandForm> = {
  title: 'Command/CommandForm',
  component: CommandForm,
  parameters: {
    layout: 'centered',
    chromatic: {
      viewports: [375, 768, 1280],
      delay: 300,
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CommandForm>;

const mockCommandTypes = [
  { id: 'move', name: '이동', cost: 10, category: 'military' },
  { id: 'attack', name: '공격', cost: 20, category: 'military' },
  { id: 'defend', name: '방어', cost: 15, category: 'military' },
  { id: 'recruit', name: '모병', cost: 30, category: 'domestic' },
  { id: 'train', name: '훈련', cost: 25, category: 'military' },
  { id: 'farm', name: '농사', cost: 20, category: 'domestic' },
  { id: 'commerce', name: '상업', cost: 20, category: 'domestic' },
  { id: 'diplomacy', name: '외교', cost: 15, category: 'diplomacy' },
];

const mockGeneralInfo = {
  id: 'gen-001',
  name: '조조',
  leadership: 85,
  strength: 92,
  intelligence: 88,
  politics: 90,
  availableCP: 50,
  maxCP: 100,
  location: '허창',
};

export const Default: Story = {
  args: {
    commandTypes: mockCommandTypes,
    generalInfo: mockGeneralInfo,
  },
};

export const LowCP: Story = {
  args: {
    commandTypes: mockCommandTypes,
    generalInfo: {
      ...mockGeneralInfo,
      availableCP: 15,
    },
  },
};

export const NoCP: Story = {
  args: {
    commandTypes: mockCommandTypes,
    generalInfo: {
      ...mockGeneralInfo,
      availableCP: 0,
    },
  },
};

export const MilitaryOnly: Story = {
  args: {
    commandTypes: mockCommandTypes.filter((cmd) => cmd.category === 'military'),
    generalInfo: mockGeneralInfo,
  },
};

export const DomesticOnly: Story = {
  args: {
    commandTypes: mockCommandTypes.filter((cmd) => cmd.category === 'domestic'),
    generalInfo: mockGeneralInfo,
  },
};

export const WithSelectedCommand: Story = {
  args: {
    commandTypes: mockCommandTypes,
    generalInfo: mockGeneralInfo,
    selectedCommandId: 'attack',
  },
};

export const WithError: Story = {
  args: {
    commandTypes: mockCommandTypes,
    generalInfo: mockGeneralInfo,
    error: '명령을 실행할 수 없습니다. CP가 부족합니다.',
  },
};

export const Mobile: Story = {
  args: {
    commandTypes: mockCommandTypes,
    generalInfo: mockGeneralInfo,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
