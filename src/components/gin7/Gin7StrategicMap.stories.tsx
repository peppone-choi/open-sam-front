import type { Meta, StoryObj } from '@storybook/react';
import Gin7StrategicMap from './Gin7StrategicMap';
import { Gin7StoryProvider } from '@/stories/mocks/gin7Mocks';

const meta = {
  title: 'Gin7/StrategicMap',
  component: Gin7StrategicMap,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#030711] p-6">
        <Gin7StoryProvider>
          <Story />
        </Gin7StoryProvider>
      </div>
    ),
  ],
} satisfies Meta<typeof Gin7StrategicMap>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
