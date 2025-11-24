import type { Meta, StoryObj } from '@storybook/react';
import StarGrid from './StarGrid';
import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

// Mock the GameStore state for the story
const meta = {
  title: 'Logh/StarGrid',
  component: StarGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'StarGrid displays the galactic strategy map using a 100x100 light-year grid system. Players can pan (drag), zoom (scroll), and click to select grid coordinates. Star systems and fleets are rendered using Canvas API for performance.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-screen h-screen bg-[#050510] relative">
        <Story />
        <div className="absolute bottom-4 left-4 bg-black/70 text-white p-4 text-xs font-mono rounded border border-[#1E90FF] max-w-sm">
          <div className="font-bold mb-2 text-[#1E90FF]">Controls</div>
          <ul className="space-y-1 text-[#9CA3AF]">
            <li>• Drag to pan the map</li>
            <li>• Scroll to zoom in/out</li>
            <li>• Click grid to select coordinates</li>
            <li>• Silver circles = Empire star systems</li>
            <li>• Olive circles = Alliance star systems</li>
            <li>• White/blue triangles = Fleets</li>
          </ul>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof StarGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default view with mock data loaded from gameStore. Shows Astarte (Alliance) and Odin (Empire) star systems with two fleets.',
      },
    },
  },
};

export const EmptyGrid: Story = {
  render: () => {
    const StarGridWrapper = () => {
      const { starSystems, fleets } = useGameStore();
      
      useEffect(() => {
        // Clear mock data for this story
        useGameStore.setState({ starSystems: [], fleets: [] });
        
        return () => {
          // Restore on unmount
          useGameStore.getState().loadMockData();
        };
      }, []);
      
      return <StarGrid />;
    };
    
    return <StarGridWrapper />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty grid showing only the 100x100 coordinate system without any star systems or fleets.',
      },
    },
  },
};

export const DenseGalaxy: Story = {
  render: () => {
    const StarGridWrapper = () => {
      useEffect(() => {
        // Load dense mock data
        useGameStore.setState({
          starSystems: [
            { id: 's1', name: 'Astarte', gridX: 5, gridY: 5, faction: 'alliance', planets: [] },
            { id: 's2', name: 'Odin', gridX: 20, gridY: 20, faction: 'empire', planets: [] },
            { id: 's3', name: 'Heinessen', gridX: 10, gridY: 8, faction: 'alliance', planets: [] },
            { id: 's4', name: 'Iserlohn', gridX: 15, gridY: 12, faction: 'alliance', planets: [] },
            { id: 's5', name: 'Phezzan', gridX: 18, gridY: 10, faction: 'phezzan', planets: [] },
            { id: 's6', name: 'Fezzan Corridor', gridX: 16, gridY: 11, faction: 'none', planets: [] },
            { id: 's7', name: 'Vermillion', gridX: 22, gridY: 18, faction: 'empire', planets: [] },
            { id: 's8', name: 'Dagon', gridX: 12, gridY: 15, faction: 'alliance', planets: [] },
          ],
          fleets: [
            { id: 'f1', commanderName: 'Yang Wen-li', faction: 'alliance', gridX: 5, gridY: 5, size: 15000, status: 'idle' },
            { id: 'f2', commanderName: 'Reinhard', faction: 'empire', gridX: 20, gridY: 20, size: 20000, status: 'idle' },
            { id: 'f3', commanderName: 'Merkatz', faction: 'alliance', gridX: 10, gridY: 8, size: 8000, status: 'moving' },
            { id: 'f4', commanderName: 'Bittenfeld', faction: 'empire', gridX: 22, gridY: 18, size: 12000, status: 'idle' },
            { id: 'f5', commanderName: 'Attenborough', faction: 'alliance', gridX: 15, gridY: 12, size: 5000, status: 'idle' },
          ],
        });
        
        return () => {
          useGameStore.getState().loadMockData();
        };
      }, []);
      
      return <StarGrid />;
    };
    
    return <StarGridWrapper />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Dense galaxy with 8 star systems and 5 fleets. Tests rendering performance and visual clarity.',
      },
    },
  },
};

export const ZoomedIn: Story = {
  render: () => {
    const StarGridWrapper = () => {
      useEffect(() => {
        useGameStore.getState().loadMockData();
        // Set zoomed viewport
        useGameStore.setState({
          viewport: { x: -200, y: -200, zoom: 2.5 }
        });
        
        return () => {
          useGameStore.setState({
            viewport: { x: 0, y: 0, zoom: 1 }
          });
        };
      }, []);
      
      return <StarGrid />;
    };
    
    return <StarGridWrapper />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Zoomed-in view (2.5x) centered on Astarte system. Grid lines and labels should remain clear.',
      },
    },
  },
};

export const ZoomedOut: Story = {
  render: () => {
    const StarGridWrapper = () => {
      useEffect(() => {
        useGameStore.getState().loadMockData();
        // Set zoomed out viewport
        useGameStore.setState({
          viewport: { x: 400, y: 400, zoom: 0.3 }
        });
        
        return () => {
          useGameStore.setState({
            viewport: { x: 0, y: 0, zoom: 1 }
          });
        };
      }, []);
      
      return <StarGrid />;
    };
    
    return <StarGridWrapper />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Zoomed-out overview (0.3x) showing larger area of the galaxy. Good for strategic planning.',
      },
    },
  },
};

export const FocusedBattle: Story = {
  render: () => {
    const StarGridWrapper = () => {
      useEffect(() => {
        // Show battle scenario near Iserlohn
        useGameStore.setState({
          starSystems: [
            { id: 's1', name: 'Iserlohn', gridX: 15, gridY: 15, faction: 'alliance', planets: [] },
          ],
          fleets: [
            { id: 'f1', commanderName: 'Yang Wen-li', faction: 'alliance', gridX: 15, gridY: 15, size: 15000, status: 'battle' },
            { id: 'f2', commanderName: 'Reinhard', faction: 'empire', gridX: 16, gridY: 15, size: 20000, status: 'battle' },
            { id: 'f3', commanderName: 'Merkatz', faction: 'alliance', gridX: 14, gridY: 16, size: 8000, status: 'moving' },
          ],
          viewport: { x: -600, y: -600, zoom: 2 },
          selectedGrid: { x: 15, y: 15 },
        });
        
        return () => {
          useGameStore.getState().loadMockData();
          useGameStore.setState({
            viewport: { x: 0, y: 0, zoom: 1 },
            selectedGrid: null,
          });
        };
      }, []);
      
      return <StarGrid />;
    };
    
    return <StarGridWrapper />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Battle scenario at Iserlohn Fortress with fleets in combat. Shows multiple fleets converging on a strategic location.',
      },
    },
  },
};
