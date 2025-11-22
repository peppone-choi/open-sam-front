import type { Meta, StoryObj } from '@storybook/react';
import StarGrid from './StarGrid';

// Mock the GameStore state for the story
const meta = {
  title: 'Logh/StarGrid',
  component: StarGrid,
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
} satisfies Meta<typeof StarGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
