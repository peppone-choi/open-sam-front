import type { Meta, StoryObj } from '@storybook/react';
import SteeringPanel from './SteeringPanel';

const meta = {
  title: 'Logh/SteeringPanel',
  component: SteeringPanel,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="bg-[#050510] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SteeringPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
