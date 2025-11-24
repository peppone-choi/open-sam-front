import type { Meta, StoryObj } from '@storybook/react';
import SteeringPanel from './SteeringPanel';

const meta = {
  title: 'Logh/SteeringPanel',
  component: SteeringPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'SteeringPanel allows players to distribute energy across 6 ship systems (BEAM, GUN, SHIELD, ENGINE, WARP, SENSOR). Total distribution can exceed 100% but will trigger an overload warning.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-[#050510] p-8 min-h-[600px] flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SteeringPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default balanced energy distribution (20% each for BEAM, GUN, SHIELD, ENGINE, SENSOR; 0% for WARP). Total: 100%',
      },
    },
  },
};

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Interactive story - adjust sliders to test energy distribution. Watch for red overload warning when total exceeds 100%.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // This story is meant for manual interaction testing
    console.log('Interact with sliders to test energy distribution limits');
  },
};

export const OverloadWarning: Story = {
  render: () => {
    const SteeringPanelWrapper = () => {
      const [mounted, setMounted] = React.useState(false);
      
      React.useEffect(() => {
        setMounted(true);
      }, []);

      React.useEffect(() => {
        if (!mounted) return;
        
        // Programmatically set overload state after mount
        const sliders = document.querySelectorAll('input[type="range"]');
        if (sliders.length > 0) {
          // Set first 3 sliders to 50% to trigger overload (150% > 100%)
          (sliders[0] as HTMLInputElement).value = '50';
          (sliders[0] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          
          setTimeout(() => {
            (sliders[1] as HTMLInputElement).value = '50';
            (sliders[1] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 100);
          
          setTimeout(() => {
            (sliders[2] as HTMLInputElement).value = '50';
            (sliders[2] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 200);
        }
      }, [mounted]);

      return <SteeringPanel />;
    };

    return <SteeringPanelWrapper />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates overload state when total energy distribution exceeds 100%. The total percentage turns red and pulses.',
      },
    },
  },
};

export const HighPowerBeams: Story = {
  render: () => {
    const SteeringPanelWrapper = () => {
      const [mounted, setMounted] = React.useState(false);
      
      React.useEffect(() => {
        setMounted(true);
      }, []);

      React.useEffect(() => {
        if (!mounted) return;
        
        const sliders = document.querySelectorAll('input[type="range"]');
        if (sliders.length >= 1) {
          // Set BEAM to 80% (triggers red bar)
          (sliders[0] as HTMLInputElement).value = '80';
          (sliders[0] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, [mounted]);

      return <SteeringPanel />;
    };

    return <SteeringPanelWrapper />;
  },
  parameters: {
    docs: {
      description: {
        story: 'High power beam configuration (80%). Individual bars turn red when exceeding 80% threshold.',
      },
    },
  },
};

export const WarpJumpConfiguration: Story = {
  render: () => {
    const SteeringPanelWrapper = () => {
      const [mounted, setMounted] = React.useState(false);
      
      React.useEffect(() => {
        setMounted(true);
      }, []);

      React.useEffect(() => {
        if (!mounted) return;
        
        const sliders = document.querySelectorAll('input[type="range"]');
        if (sliders.length >= 5) {
          // Warp-focused config: WARP=60, ENGINE=30, SENSOR=10, others=0
          (sliders[0] as HTMLInputElement).value = '0'; // BEAM
          (sliders[0] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          
          setTimeout(() => {
            (sliders[1] as HTMLInputElement).value = '0'; // GUN
            (sliders[1] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 50);
          
          setTimeout(() => {
            (sliders[2] as HTMLInputElement).value = '0'; // SHIELD
            (sliders[2] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 100);
          
          setTimeout(() => {
            (sliders[3] as HTMLInputElement).value = '30'; // ENGINE
            (sliders[3] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 150);
          
          setTimeout(() => {
            (sliders[4] as HTMLInputElement).value = '60'; // WARP
            (sliders[4] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 200);
          
          setTimeout(() => {
            (sliders[5] as HTMLInputElement).value = '10'; // SENSOR
            (sliders[5] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 250);
        }
      }, [mounted]);

      return <SteeringPanel />;
    };

    return <SteeringPanelWrapper />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Warp jump energy configuration: prioritize WARP (60%) and ENGINE (30%) for long-distance travel.',
      },
    },
  },
};

export const CombatConfiguration: Story = {
  render: () => {
    const SteeringPanelWrapper = () => {
      const [mounted, setMounted] = React.useState(false);
      
      React.useEffect(() => {
        setMounted(true);
      }, []);

      React.useEffect(() => {
        if (!mounted) return;
        
        const sliders = document.querySelectorAll('input[type="range"]');
        if (sliders.length >= 6) {
          // Combat config: BEAM=35, GUN=35, SHIELD=30, ENGINE=0, WARP=0, SENSOR=0
          (sliders[0] as HTMLInputElement).value = '35'; // BEAM
          (sliders[0] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          
          setTimeout(() => {
            (sliders[1] as HTMLInputElement).value = '35'; // GUN
            (sliders[1] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 50);
          
          setTimeout(() => {
            (sliders[2] as HTMLInputElement).value = '30'; // SHIELD
            (sliders[2] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 100);
          
          setTimeout(() => {
            (sliders[3] as HTMLInputElement).value = '0'; // ENGINE
            (sliders[3] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 150);
          
          setTimeout(() => {
            (sliders[4] as HTMLInputElement).value = '0'; // WARP
            (sliders[4] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 200);
          
          setTimeout(() => {
            (sliders[5] as HTMLInputElement).value = '0'; // SENSOR
            (sliders[5] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
          }, 250);
        }
      }, [mounted]);

      return <SteeringPanel />;
    };

    return <SteeringPanelWrapper />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Combat-focused energy distribution: maximize weapons (BEAM 35%, GUN 35%) and defense (SHIELD 30%).',
      },
    },
  },
};

// Need React import for the wrapper components
import React from 'react';
