import { create } from 'zustand';
import { Coordinates, Fleet, GameState, StarSystem, UserProfile } from '@/types/logh';

interface GameStore {
  // Global State
  gameState: GameState;
  userProfile: UserProfile | null;
  
  // Strategy Map State
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  selectedGrid: Coordinates | null;
  selectedObject: { type: 'fleet' | 'system', id: string } | null;
  
  // Tactical State
  selectedUnitId: string | null;
  selectUnit: (id: string | null) => void;
  
  // Data (Mock for now)
  starSystems: StarSystem[];
  fleets: Fleet[];

  // Actions
  setViewport: (x: number, y: number, zoom?: number) => void;
  selectGrid: (x: number, y: number) => void;
  selectObject: (type: 'fleet' | 'system', id: string) => void;
  refreshUserProfile: (profile: UserProfile) => void; // Added for hook compatibility
  updateCP: (pcpDelta: number, mcpDelta: number) => void; // Added for command execution

  // Mock Loaders
  loadMockData: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: { year: 796, month: 1, day: 1, hour: 12 },
  userProfile: {
    id: 'u1',
    name: 'Yang Wen-li',
    rank: 'Commodore',
    faction: 'alliance',
    pcp: 100,
    mcp: 120,
    maxPcp: 100,
    maxMcp: 150,
    jobCards: [
      { id: 'c1', title: '13th Fleet Commander', rankReq: 'Rear Admiral', commands: ['warp', 'attack', 'supply'] }
    ]
  },
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedGrid: null,
  selectedObject: null,
  selectedUnitId: null,
  starSystems: [],
  fleets: [],

  setViewport: (x, y, zoom) => set((state) => ({ 
    viewport: { ...state.viewport, x, y, zoom: zoom ?? state.viewport.zoom } 
  })),
  
  selectGrid: (x, y) => set({ selectedGrid: { x, y }, selectedObject: null }),
  
  selectObject: (type, id) => set({ selectedObject: { type, id } }),
  
  selectUnit: (id) => set({ selectedUnitId: id }),

  refreshUserProfile: (profile) => set({ userProfile: profile }),

  updateCP: (pcpDelta, mcpDelta) => set((state) => {
    if (!state.userProfile) return state;
    return {
      userProfile: {
        ...state.userProfile,
        pcp: Math.max(0, state.userProfile.pcp + pcpDelta),
        mcp: Math.max(0, state.userProfile.mcp + mcpDelta),
      }
    };
  }),

  loadMockData: () => set({
    starSystems: [
      { 
        id: 's1', name: 'Astarte', gridX: 5, gridY: 5, faction: 'alliance', 
        planets: [{ id: 'p1', name: 'Astarte IV', type: 'planet', population: 200000000 }] 
      },
      { 
        id: 's2', name: 'Odin', gridX: 20, gridY: 20, faction: 'empire', 
        planets: [{ id: 'p2', name: 'Odin', type: 'planet', population: 2500000000 }] 
      }
    ],
    fleets: [
      { id: 'f1', commanderName: 'Yang Wen-li', faction: 'alliance', gridX: 5, gridY: 5, size: 15000, status: 'idle' },
      { id: 'f2', commanderName: 'Reinhard von Lohengramm', faction: 'empire', gridX: 6, gridY: 5, size: 20000, status: 'moving' }
    ]
  })
}));
