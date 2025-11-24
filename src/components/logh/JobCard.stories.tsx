import type { Meta, StoryObj } from '@storybook/react';
import JobCard from './JobCard';
import { JobCard as JobCardType } from '@/types/logh';

const meta = {
  title: 'Logh/JobCard',
  component: JobCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'JobCard component displays command authority cards that can be expanded/collapsed. Empire theme uses gold/silver colors with serif fonts, while Alliance uses olive/blue with monospace fonts.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-[#050510] p-8 min-h-[500px] flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    faction: { 
      control: 'radio', 
      options: ['empire', 'alliance'],
      description: 'Faction determines visual theme and styling',
    },
    isActive: { 
      control: 'boolean',
      description: 'Whether the card is expanded to show commands',
    },
  },
} satisfies Meta<typeof JobCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockOnSelect = () => console.log('Card selected');
const mockOnCommand = (cmd: string) => console.log('Command executed:', cmd);

// Empire Stories
export const EmpireCollapsed: Story = {
  args: {
    card: { 
      id: '1', 
      title: 'Imperial Fleet Admiral', 
      rankReq: 'High Admiral', 
      commands: ['warp', 'attack'] 
    },
    faction: 'empire',
    isActive: false,
    onSelect: mockOnSelect,
    onCommand: mockOnCommand,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empire card in collapsed state. Shows title and rank requirement only.',
      },
    },
  },
};

export const EmpireExpanded: Story = {
  args: {
    ...EmpireCollapsed.args,
    isActive: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empire card expanded to show warp and attack commands. Note the gold gradient and serif typography.',
      },
    },
  },
};

export const EmpireWithWarpRisk: Story = {
  args: {
    card: { 
      id: '1a', 
      title: 'Lohengramm Squadron', 
      rankReq: 'Admiral', 
      commands: ['warp', 'attack', 'move'] 
    },
    faction: 'empire',
    isActive: true,
    onSelect: mockOnSelect,
    onCommand: mockOnCommand,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empire card with warp command shows "WARP RISK" badge when expanded.',
      },
    },
  },
};

// Alliance Stories
export const AllianceCollapsed: Story = {
  args: {
    card: { 
      id: '2', 
      title: '13th Fleet Commander', 
      rankReq: 'Rear Admiral', 
      commands: ['warp', 'attack', 'supply', 'move'] 
    },
    faction: 'alliance',
    isActive: false,
    onSelect: mockOnSelect,
    onCommand: mockOnCommand,
  },
  parameters: {
    docs: {
      description: {
        story: 'Alliance card in collapsed state with olive/blue theme.',
      },
    },
  },
};

export const AllianceExpanded: Story = {
  args: {
    ...AllianceCollapsed.args,
    isActive: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Alliance card expanded showing all 4 commands. Note the monospace font and olive gradient.',
      },
    },
  },
};

export const AllianceSupplyOfficer: Story = {
  args: {
    card: { 
      id: '3', 
      title: 'Logistics Coordinator', 
      rankReq: 'Commander', 
      commands: ['supply', 'move'] 
    },
    faction: 'alliance',
    isActive: true,
    onSelect: mockOnSelect,
    onCommand: mockOnCommand,
  },
  parameters: {
    docs: {
      description: {
        story: 'Alliance non-combat role with only supply and move commands.',
      },
    },
  },
};

// Comparison View
export const ThemeComparison: Story = {
  render: () => (
    <div className="flex gap-8 items-start">
      <JobCard
        card={{ id: '1', title: 'Imperial Fleet Admiral', rankReq: 'High Admiral', commands: ['warp', 'attack'] }}
        faction="empire"
        isActive={true}
        onSelect={mockOnSelect}
        onCommand={mockOnCommand}
      />
      <JobCard
        card={{ id: '2', title: '13th Fleet Commander', rankReq: 'Rear Admiral', commands: ['warp', 'attack', 'supply', 'move'] }}
        faction="alliance"
        isActive={true}
        onSelect={mockOnSelect}
        onCommand={mockOnCommand}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of Empire (gold/silver, serif) vs Alliance (olive/blue, monospace) themes.',
      },
    },
  },
};
