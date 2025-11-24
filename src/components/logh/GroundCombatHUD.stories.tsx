import type { Meta, StoryObj } from '@storybook/react';
import GroundCombatHUD from './GroundCombatHUD';

const meta: Meta<typeof GroundCombatHUD> = {
  title: 'LOGH/GroundCombatHUD',
  component: GroundCombatHUD,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#000000' }],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GroundCombatHUD>;

export const Default: Story = {
  args: {
    battleId: 'battle-ground-001',
    sessionId: 'session-test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Ground Combat HUD showing occupation status, supply distribution, and warehouse inventory.',
      },
    },
    msw: {
      handlers: [
        {
          method: 'get',
          path: '/api/logh/ground-combat/:battleId',
          response: {
            success: true,
            data: {
              battleId: 'battle-ground-001',
              gridCoordinates: { x: 15, y: 23 },
              combatPhase: 'engagement',
              occupationStatus: [
                {
                  planetId: 'planet-001',
                  planetName: 'Phezzan',
                  controllingFaction: 'empire',
                  occupationProgress: 65,
                  defenseStrength: 75,
                  garrisonUnits: 1200,
                  supplyLines: ['supply-line-1', 'supply-line-2'],
                  status: 'contested',
                },
                {
                  planetId: 'planet-002',
                  planetName: 'Heinessen',
                  controllingFaction: 'alliance',
                  occupationProgress: 90,
                  defenseStrength: 95,
                  garrisonUnits: 3000,
                  supplyLines: ['supply-line-3'],
                  status: 'secured',
                },
                {
                  planetId: 'planet-003',
                  planetName: 'Iserlohn',
                  controllingFaction: 'rebel',
                  occupationProgress: 30,
                  defenseStrength: 40,
                  garrisonUnits: 800,
                  supplyLines: [],
                  status: 'under_siege',
                },
              ],
              supplyBatches: [
                {
                  batchId: 'batch-001',
                  type: 'fuel',
                  quantity: 1500,
                  location: 'landing-zone-empire',
                  assignedUnits: ['unit-1', 'unit-2'],
                  status: 'available',
                },
                {
                  batchId: 'batch-002',
                  type: 'ammunition',
                  quantity: 800,
                  location: 'forward-base-alpha',
                  assignedUnits: ['unit-3'],
                  status: 'deployed',
                },
                {
                  batchId: 'batch-003',
                  type: 'rations',
                  quantity: 0,
                  location: 'supply-depot-1',
                  assignedUnits: [],
                  status: 'exhausted',
                },
                {
                  batchId: 'batch-004',
                  type: 'medical',
                  quantity: 400,
                  location: 'landing-zone-alliance',
                  assignedUnits: [],
                  status: 'available',
                },
              ],
              warehouseStocks: [
                {
                  warehouseId: 'warehouse-001',
                  planetId: 'planet-001',
                  faction: 'empire',
                  inventory: {
                    fuel: 450,
                    ammunition: 300,
                    rations: 500,
                    medical: 150,
                    equipment: 200,
                  },
                  capacity: 2000,
                  lastUpdated: new Date().toISOString(),
                },
                {
                  warehouseId: 'warehouse-002',
                  planetId: 'planet-002',
                  faction: 'alliance',
                  inventory: {
                    fuel: 800,
                    ammunition: 600,
                    rations: 300,
                    medical: 200,
                    equipment: 100,
                  },
                  capacity: 2000,
                  lastUpdated: new Date().toISOString(),
                },
              ],
              lastUpdateAt: new Date().toISOString(),
            },
            compliance: [
              {
                manualRef: 'gin7manual.txt:P.40-P.51',
                status: '✅',
                note: 'Ground combat state retrieved successfully',
              },
            ],
          },
        },
      ],
    },
  },
};

export const LandingPhase: Story = {
  args: {
    battleId: 'battle-ground-002',
    sessionId: 'session-test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Ground Combat HUD during the landing phase - initial deployment.',
      },
    },
    msw: {
      handlers: [
        {
          method: 'get',
          path: '/api/logh/ground-combat/:battleId',
          response: {
            success: true,
            data: {
              battleId: 'battle-ground-002',
              gridCoordinates: { x: 10, y: 15 },
              combatPhase: 'landing',
              occupationStatus: [
                {
                  planetId: 'planet-004',
                  planetName: 'Odin',
                  controllingFaction: 'neutral',
                  occupationProgress: 0,
                  defenseStrength: 100,
                  garrisonUnits: 0,
                  supplyLines: [],
                  status: 'contested',
                },
              ],
              supplyBatches: [
                {
                  batchId: 'batch-005',
                  type: 'fuel',
                  quantity: 2000,
                  location: 'orbital-drop-zone',
                  assignedUnits: [],
                  status: 'available',
                },
              ],
              warehouseStocks: [
                {
                  warehouseId: 'warehouse-003',
                  planetId: 'planet-004',
                  faction: 'neutral',
                  inventory: {
                    fuel: 100,
                    ammunition: 50,
                    rations: 200,
                    medical: 75,
                    equipment: 25,
                  },
                  capacity: 2000,
                  lastUpdated: new Date().toISOString(),
                },
              ],
              lastUpdateAt: new Date().toISOString(),
            },
          },
        },
      ],
    },
  },
};

export const CompletedBattle: Story = {
  args: {
    battleId: 'battle-ground-003',
    sessionId: 'session-test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Ground Combat HUD showing a completed battle with full occupation.',
      },
    },
    msw: {
      handlers: [
        {
          method: 'get',
          path: '/api/logh/ground-combat/:battleId',
          response: {
            success: true,
            data: {
              battleId: 'battle-ground-003',
              gridCoordinates: { x: 20, y: 30 },
              combatPhase: 'completed',
              occupationStatus: [
                {
                  planetId: 'planet-005',
                  planetName: 'Vermillion',
                  controllingFaction: 'alliance',
                  occupationProgress: 100,
                  defenseStrength: 100,
                  garrisonUnits: 5000,
                  supplyLines: ['supply-line-4', 'supply-line-5', 'supply-line-6'],
                  status: 'secured',
                },
              ],
              supplyBatches: [
                {
                  batchId: 'batch-006',
                  type: 'fuel',
                  quantity: 500,
                  location: 'main-base',
                  assignedUnits: ['unit-5', 'unit-6', 'unit-7'],
                  status: 'deployed',
                },
              ],
              warehouseStocks: [
                {
                  warehouseId: 'warehouse-004',
                  planetId: 'planet-005',
                  faction: 'alliance',
                  inventory: {
                    fuel: 1800,
                    ammunition: 1500,
                    rations: 1200,
                    medical: 800,
                    equipment: 700,
                  },
                  capacity: 6000,
                  lastUpdated: new Date().toISOString(),
                },
              ],
              lastUpdateAt: new Date().toISOString(),
            },
          },
        },
      ],
    },
  },
};
