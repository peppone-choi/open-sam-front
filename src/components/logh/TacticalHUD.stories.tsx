import type { Meta, StoryObj } from '@storybook/react';
import TacticalHUD from './TacticalHUD';

const meta = {
  title: 'Logh/TacticalHUD',
  component: TacticalHUD,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="w-screen h-screen bg-[#050510]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TacticalHUD>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    battleId: 'test-battle-1'
  },
};
