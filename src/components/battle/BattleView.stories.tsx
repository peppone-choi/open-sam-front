import type { Meta, StoryObj } from '@storybook/react';
import BattleView from './BattleView';

const meta: Meta<typeof BattleView> = {
  title: 'Battle/BattleView',
  component: BattleView,
  parameters: {
    layout: 'fullscreen',
    chromatic: { 
      viewports: [375, 768, 1280],
      delay: 300,
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BattleView>;

const mockBattleState = {
  battleId: 'battle-001',
  phase: 'combat',
  turn: 5,
  maxTurns: 20,
  attackers: [
    {
      generalId: 'gen-001',
      name: '조조',
      leadership: 85,
      strength: 92,
      intelligence: 88,
      troops: 8500,
      maxTroops: 12000,
      morale: 80,
      formation: 'crane',
      status: 'active',
    },
  ],
  defenders: [
    {
      generalId: 'gen-002',
      name: '관우',
      leadership: 95,
      strength: 97,
      intelligence: 75,
      troops: 6200,
      maxTroops: 10000,
      morale: 85,
      formation: 'fish_scale',
      status: 'active',
    },
  ],
  terrain: 'plains',
  weather: 'clear',
  logs: [
    { turn: 1, phase: 'charge', message: '조조 부대가 돌격을 시작했습니다!' },
    { turn: 2, phase: 'combat', message: '관우 부대가 반격했습니다!' },
    { turn: 3, phase: 'combat', message: '접전이 벌어지고 있습니다!' },
    { turn: 4, phase: 'combat', message: '조조 부대가 우위를 점하고 있습니다!' },
    { turn: 5, phase: 'combat', message: '관우 부대의 사기가 높습니다!' },
  ],
};

export const Preparation: Story = {
  args: {
    battleState: {
      ...mockBattleState,
      phase: 'preparation',
      turn: 0,
      logs: [],
    },
  },
};

export const ActiveCombat: Story = {
  args: {
    battleState: mockBattleState,
  },
};

export const NearEnd: Story = {
  args: {
    battleState: {
      ...mockBattleState,
      turn: 18,
      attackers: [
        {
          ...mockBattleState.attackers[0],
          troops: 2000,
          morale: 45,
        },
      ],
      defenders: [
        {
          ...mockBattleState.defenders[0],
          troops: 1500,
          morale: 40,
        },
      ],
    },
  },
};

export const AttackerVictory: Story = {
  args: {
    battleState: {
      ...mockBattleState,
      phase: 'completed',
      turn: 12,
      winner: 'attacker',
      result: {
        casualties: {
          attacker: 3500,
          defender: 8500,
        },
        mvp: 'gen-001',
        rewards: {
          exp: 1500,
          gold: 3000,
          items: ['legendary_sword'],
        },
      },
    },
  },
};

export const DefenderVictory: Story = {
  args: {
    battleState: {
      ...mockBattleState,
      phase: 'completed',
      turn: 15,
      winner: 'defender',
      result: {
        casualties: {
          attacker: 9000,
          defender: 4000,
        },
        mvp: 'gen-002',
        rewards: {
          exp: 2000,
          gold: 5000,
          items: [],
        },
      },
    },
  },
};

export const RainyWeather: Story = {
  args: {
    battleState: {
      ...mockBattleState,
      weather: 'rain',
    },
  },
};

export const MountainTerrain: Story = {
  args: {
    battleState: {
      ...mockBattleState,
      terrain: 'mountain',
    },
  },
};
