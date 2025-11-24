import type { Meta, StoryObj } from '@storybook/react';
import Gin7TacticalHUD from './Gin7TacticalHUD';
import { Gin7StoryProvider } from '@/stories/mocks/gin7Mocks';

const meta = {
  title: 'Gin7/TacticalHUD',
  component: Gin7TacticalHUD,
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#01030a] p-6">
        <Gin7StoryProvider>
          <Story />
        </Gin7StoryProvider>
      </div>
    ),
  ],
} satisfies Meta<typeof Gin7TacticalHUD>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
