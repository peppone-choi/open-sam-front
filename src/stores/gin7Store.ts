import { create } from 'zustand';
import { gin7Api } from '@/lib/api/gin7';
import {
  Gin7CommandPlan,
  Gin7EnergyProfile,
  Gin7SessionOverview,
  Gin7StrategicState,
  Gin7TacticalState,
  Gin7ChatMessage,
  Gin7SessionSnapshot,
  Gin7StrategySnapshot,
  Gin7TelemetrySample,
} from '@/types/gin7';
import { Coordinates } from '@/types/logh';
import { useGameStore } from '@/stores/gameStore';
import { resolveGin7SessionId } from '@/config/gin7';

interface Gin7StoreState {
  loading: boolean;
  sessionId: string;
  session: Gin7SessionOverview | null;
  strategic: Gin7StrategicState | null;
  plans: Gin7CommandPlan[];
  tactical: Gin7TacticalState | null;
  chat: Gin7ChatMessage[];
  sessionSnapshot: Gin7SessionSnapshot | null;
  strategySnapshot: Gin7StrategySnapshot | null;
  telemetrySamples: Gin7TelemetrySample[];
  localTelemetry: Record<string, Gin7TelemetrySample>;
  hoveredCell: Coordinates | null;
  selectedFleetId: string | null;
  hydrate: () => Promise<void>;
  setHoveredCell: (cell: Coordinates | null) => void;
  selectFleet: (id: string | null) => void;
  recordLocalTelemetry: (scene: string, sample: Gin7TelemetrySample) => void;
  updateEnergy: (key: keyof Gin7EnergyProfile, value: number) => Promise<void>;
  savePlan: (plan: Partial<Gin7CommandPlan>) => Promise<void>;
}

const DEFAULT_SESSION_ID = resolveGin7SessionId();

export const useGin7Store = create<Gin7StoreState>((set, get) => ({
  loading: true,
  sessionId: DEFAULT_SESSION_ID,
  session: null,
  strategic: null,
  plans: [],
  tactical: null,
  chat: [],
  sessionSnapshot: null,
  strategySnapshot: null,
  telemetrySamples: [],
  localTelemetry: {},
  hoveredCell: null,
  selectedFleetId: null,

  hydrate: async () => {
    set({ loading: true });
    try {
      const targetSessionId = get().sessionId || DEFAULT_SESSION_ID;
      const [bundle, sessionSnapshot, strategySnapshot, telemetrySamples] = await Promise.all([
        gin7Api.getBundle(targetSessionId),
        gin7Api.getSessionSnapshot(targetSessionId),
        gin7Api.getStrategySnapshot(targetSessionId),
        gin7Api.getTelemetrySamples(targetSessionId, 8),
      ]);

      const resolvedSessionId = bundle.session.profile.sessionId || targetSessionId;
      const refreshUserProfile = useGameStore.getState().refreshUserProfile;
      refreshUserProfile(bundle.session.profile);

      set({
        sessionId: resolvedSessionId,
        session: bundle.session,
        strategic: bundle.strategic,
        plans: bundle.plans,
        tactical: bundle.tactical,
        chat: bundle.chat,
        sessionSnapshot,
        strategySnapshot,
        telemetrySamples,
        localTelemetry: {},
        loading: false,
      });
    } catch (error) {
      console.error('[gin7Store] hydrate error', error);
      set({ loading: false });
    }
  },

  setHoveredCell: (cell) => set({ hoveredCell: cell }),
  selectFleet: (id) => set({ selectedFleetId: id }),

  recordLocalTelemetry: (scene, sample) => {
    set((state) => ({
      localTelemetry: {
        ...state.localTelemetry,
        [scene]: sample,
      },
    }));
  },

  updateEnergy: async (key, value) => {
    const current = get().tactical;
    if (!current) return;
    const sessionId = get().sessionId || DEFAULT_SESSION_ID;
    const nextEnergy: Gin7EnergyProfile = { ...current.energy, [key]: value } as Gin7EnergyProfile;
    set({ tactical: { ...current, energy: nextEnergy } });
    const persisted = await gin7Api.updateEnergyProfile(nextEnergy, sessionId);
    set({ tactical: { ...current, energy: persisted } });
  },

  savePlan: async (plan) => {
    const sessionId = get().sessionId || DEFAULT_SESSION_ID;
    const saved = await gin7Api.upsertPlan(plan, sessionId);
    const plans = get().plans;
    const idx = plans.findIndex((p) => p.id === saved.id);
    if (idx >= 0) {
      const next = [...plans];
      next[idx] = saved;
      set({ plans: next });
    } else {
      set({ plans: [saved, ...plans] });
    }
  },
}));
