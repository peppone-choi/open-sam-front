import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  BattleStatus,
  BattleParticipant,
  TacticalUnitState,
  ProjectileState,
  EffectState,
  Vector3,
  EnergyDistribution,
  TacticalCommand,
  BattleStartEvent,
  BattleUpdateEvent,
  BattleEndEvent,
  DamageEvent,
  UnitDestroyedEvent,
  DEFAULT_ENERGY_DISTRIBUTION,
} from '@/types/gin7-tactical';

// ============================================================
// Store State Interface
// ============================================================

interface Gin7TacticalState {
  // Connection
  isConnected: boolean;
  battleId: string | null;
  sessionId: string | null;
  myFactionId: string | null;
  myCommanderId: string | null;
  
  // Battle state
  status: BattleStatus;
  tick: number;
  mapSize: { width: number; height: number; depth: number };
  
  // Units & Effects
  units: TacticalUnitState[];
  projectiles: ProjectileState[];
  effects: EffectState[];
  participants: BattleParticipant[];
  
  // Selection
  selectedUnitIds: Set<string>;
  hoveredUnitId: string | null;
  dragSelection: { start: Vector3; end: Vector3 } | null;
  
  // Camera
  cameraPosition: Vector3;
  cameraZoom: number;
  cameraRotation: number;
  
  // UI panels
  showEnergyPanel: boolean;
  showCommandPanel: boolean;
  showRadar: boolean;
  
  // Energy (local state for selected units)
  energyDistribution: EnergyDistribution;
  
  // Pending commands queue
  pendingCommands: TacticalCommand[];
  
  // Event log
  recentDamageEvents: DamageEvent[];
  recentDestroyedEvents: UnitDestroyedEvent[];
  
  // Latency
  latency: number;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setBattleId: (battleId: string | null) => void;
  setSessionInfo: (sessionId: string, factionId: string, commanderId: string) => void;
  
  // Battle events
  handleBattleStart: (event: BattleStartEvent) => void;
  handleBattleUpdate: (event: BattleUpdateEvent) => void;
  handleBattleEnd: (event: BattleEndEvent) => void;
  handleDamage: (event: DamageEvent) => void;
  handleUnitDestroyed: (event: UnitDestroyedEvent) => void;
  
  // Selection
  selectUnit: (unitId: string, additive?: boolean) => void;
  selectUnits: (unitIds: string[]) => void;
  clearSelection: () => void;
  selectAllMyUnits: () => void;
  setHoveredUnit: (unitId: string | null) => void;
  setDragSelection: (selection: { start: Vector3; end: Vector3 } | null) => void;
  selectUnitsInBox: (box: { min: Vector3; max: Vector3 }) => void;
  
  // Camera
  setCameraPosition: (position: Vector3) => void;
  setCameraZoom: (zoom: number) => void;
  setCameraRotation: (rotation: number) => void;
  panCamera: (delta: Vector3) => void;
  
  // UI panels
  toggleEnergyPanel: () => void;
  toggleCommandPanel: () => void;
  toggleRadar: () => void;
  
  // Energy
  setEnergyDistribution: (energy: EnergyDistribution) => void;
  updateEnergy: (key: keyof EnergyDistribution, value: number) => void;
  
  // Commands
  queueCommand: (command: TacticalCommand) => void;
  clearPendingCommands: () => void;
  
  // Utility
  getMyUnits: () => TacticalUnitState[];
  getSelectedUnits: () => TacticalUnitState[];
  getUnitById: (id: string) => TacticalUnitState | undefined;
  setLatency: (latency: number) => void;
  
  // Reset
  reset: () => void;
}

// ============================================================
// Initial State
// ============================================================

const initialState = {
  isConnected: false,
  battleId: null,
  sessionId: null,
  myFactionId: null,
  myCommanderId: null,
  
  status: 'WAITING' as BattleStatus,
  tick: 0,
  mapSize: { width: 10000, height: 10000, depth: 5000 },
  
  units: [] as TacticalUnitState[],
  projectiles: [] as ProjectileState[],
  effects: [] as EffectState[],
  participants: [] as BattleParticipant[],
  
  selectedUnitIds: new Set<string>(),
  hoveredUnitId: null,
  dragSelection: null,
  
  cameraPosition: { x: 0, y: 0, z: 500 },
  cameraZoom: 1,
  cameraRotation: 0,
  
  showEnergyPanel: true,
  showCommandPanel: true,
  showRadar: true,
  
  energyDistribution: {
    beam: 20,
    gun: 20,
    shield: 20,
    engine: 20,
    warp: 0,
    sensor: 20,
  },
  
  pendingCommands: [] as TacticalCommand[],
  
  recentDamageEvents: [] as DamageEvent[],
  recentDestroyedEvents: [] as UnitDestroyedEvent[],
  
  latency: 0,
};

// ============================================================
// Store Implementation
// ============================================================

export const useGin7TacticalStore = create<Gin7TacticalState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // Connection
    setConnected: (connected) => set({ isConnected: connected }),
    setBattleId: (battleId) => set({ battleId }),
    setSessionInfo: (sessionId, factionId, commanderId) => set({
      sessionId,
      myFactionId: factionId,
      myCommanderId: commanderId,
    }),
    
    // Battle events
    handleBattleStart: (event) => set({
      battleId: event.battleId,
      status: 'COUNTDOWN',
      mapSize: event.mapSize,
      participants: event.participants,
      tick: 0,
    }),
    
    handleBattleUpdate: (event) => set({
      tick: event.tick,
      units: event.units,
      projectiles: event.projectiles,
      effects: event.effects,
      status: 'RUNNING',
    }),
    
    handleBattleEnd: (event) => set({
      status: 'ENDED',
      // Can add result data here if needed
    }),
    
    handleDamage: (event) => set((state) => ({
      recentDamageEvents: [event, ...state.recentDamageEvents].slice(0, 20),
    })),
    
    handleUnitDestroyed: (event) => set((state) => ({
      recentDestroyedEvents: [event, ...state.recentDestroyedEvents].slice(0, 20),
      selectedUnitIds: new Set(
        [...state.selectedUnitIds].filter(id => id !== event.unitId)
      ),
    })),
    
    // Selection
    selectUnit: (unitId, additive = false) => set((state) => {
      const newSelection = new Set(additive ? state.selectedUnitIds : []);
      if (newSelection.has(unitId)) {
        newSelection.delete(unitId);
      } else {
        newSelection.add(unitId);
      }
      return { selectedUnitIds: newSelection };
    }),
    
    selectUnits: (unitIds) => set({ selectedUnitIds: new Set(unitIds) }),
    
    clearSelection: () => set({ selectedUnitIds: new Set() }),
    
    selectAllMyUnits: () => {
      const { units, myFactionId } = get();
      const myUnitIds = units
        .filter(u => u.factionId === myFactionId && !u.isDestroyed)
        .map(u => u.id);
      set({ selectedUnitIds: new Set(myUnitIds) });
    },
    
    setHoveredUnit: (unitId) => set({ hoveredUnitId: unitId }),
    
    setDragSelection: (selection) => set({ dragSelection: selection }),
    
    selectUnitsInBox: (box) => {
      const { units, myFactionId } = get();
      const selected = units.filter(u => {
        if (u.factionId !== myFactionId || u.isDestroyed) return false;
        const p = u.position;
        return (
          p.x >= box.min.x && p.x <= box.max.x &&
          p.y >= box.min.y && p.y <= box.max.y &&
          p.z >= box.min.z && p.z <= box.max.z
        );
      });
      set({ selectedUnitIds: new Set(selected.map(u => u.id)) });
    },
    
    // Camera
    setCameraPosition: (position) => set({ cameraPosition: position }),
    setCameraZoom: (zoom) => set({ cameraZoom: Math.max(0.1, Math.min(5, zoom)) }),
    setCameraRotation: (rotation) => set({ cameraRotation: rotation }),
    panCamera: (delta) => set((state) => ({
      cameraPosition: {
        x: state.cameraPosition.x + delta.x,
        y: state.cameraPosition.y + delta.y,
        z: state.cameraPosition.z + delta.z,
      },
    })),
    
    // UI panels
    toggleEnergyPanel: () => set((state) => ({ showEnergyPanel: !state.showEnergyPanel })),
    toggleCommandPanel: () => set((state) => ({ showCommandPanel: !state.showCommandPanel })),
    toggleRadar: () => set((state) => ({ showRadar: !state.showRadar })),
    
    // Energy
    setEnergyDistribution: (energy) => set({ energyDistribution: energy }),
    updateEnergy: (key, value) => set((state) => {
      const current = state.energyDistribution;
      const currentTotal = Object.values(current).reduce((a, b) => a + b, 0);
      const diff = value - current[key];
      
      // 총합이 100을 넘지 않도록 제한
      if (currentTotal + diff > 100) {
        value = current[key] + (100 - currentTotal);
      }
      
      return {
        energyDistribution: {
          ...current,
          [key]: Math.max(0, Math.min(40, value)),
        },
      };
    }),
    
    // Commands
    queueCommand: (command) => set((state) => ({
      pendingCommands: [...state.pendingCommands, command],
    })),
    clearPendingCommands: () => set({ pendingCommands: [] }),
    
    // Utility
    getMyUnits: () => {
      const { units, myFactionId } = get();
      return units.filter(u => u.factionId === myFactionId && !u.isDestroyed);
    },
    
    getSelectedUnits: () => {
      const { units, selectedUnitIds } = get();
      return units.filter(u => selectedUnitIds.has(u.id));
    },
    
    getUnitById: (id) => {
      const { units } = get();
      return units.find(u => u.id === id);
    },
    
    setLatency: (latency) => set({ latency }),
    
    // Reset
    reset: () => set(initialState),
  }))
);

// ============================================================
// Selectors
// ============================================================

export const selectMyUnits = (state: Gin7TacticalState) => 
  state.units.filter(u => u.factionId === state.myFactionId && !u.isDestroyed);

export const selectEnemyUnits = (state: Gin7TacticalState) =>
  state.units.filter(u => u.factionId !== state.myFactionId && !u.isDestroyed);

export const selectSelectedUnits = (state: Gin7TacticalState) =>
  state.units.filter(u => state.selectedUnitIds.has(u.id));

export const selectBattleInfo = (state: Gin7TacticalState) => ({
  battleId: state.battleId,
  status: state.status,
  tick: state.tick,
  participants: state.participants,
});

// ============================================================
// Debug (dev only)
// ============================================================

if (typeof window !== 'undefined') {
  const globalWindow = window as Window & { __OPEN_SAM_STORES__?: Record<string, unknown> };
  globalWindow.__OPEN_SAM_STORES__ = globalWindow.__OPEN_SAM_STORES__ ?? {};
  globalWindow.__OPEN_SAM_STORES__.gin7Tactical = useGin7TacticalStore;
}















