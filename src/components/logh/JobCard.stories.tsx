import type { Meta, StoryObj } from '@storybook/react';
import JobCard from './JobCard';

const meta = {
  title: 'Logh/JobCard',
  component: JobCard,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    faction: { control: 'radio', options: ['empire', 'alliance'] },
    isActive: { control: 'boolean' },
  },
} satisfies Meta<typeof JobCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmpireCollapsed: Story = {
  args: {
    card: { id: '1', title: 'Imperial Fleet Admiral', rankReq: 'High Admiral', commands: ['warp', 'attack'] },
    faction: 'empire',
    isActive: false,
  },
};

export const EmpireActive: Story = {
  args: {
    ...EmpireCollapsed.args,
    isActive: true,
  },
};

export const AllianceActive: Story = {
  args: {
    card: { id: '2', title: '13th Fleet Commander', rankReq: 'Rear Admiral', commands: ['warp', 'attack', 'supply', 'move'] },
    faction: 'alliance',
    isActive: true,
  },
};
