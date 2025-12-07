import { create } from 'zustand';
import { Coordinates } from '@/types/logh';

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface MapSelection {
  type: 'cell' | 'fleet' | 'system' | 'planet' | null;
  id: string | null;
  coordinates?: Coordinates;
}

interface Gin7MapStoreState {
  // 뷰포트 상태
  viewport: ViewportState;
  setViewport: (viewport: Partial<ViewportState>) => void;
  resetViewport: () => void;

  // 줌/팬 컨트롤
  zoomIn: () => void;
  zoomOut: () => void;
  panTo: (x: number, y: number) => void;

  // 선택 상태
  selection: MapSelection;
  setSelection: (selection: MapSelection) => void;
  clearSelection: () => void;

  // 호버 상태
  hoveredCell: Coordinates | null;
  setHoveredCell: (cell: Coordinates | null) => void;

  // 레이어 가시성
  layers: {
    grid: boolean;
    fleets: boolean;
    routes: boolean;
    labels: boolean;
    territories: boolean;
  };
  toggleLayer: (layer: keyof Gin7MapStoreState['layers']) => void;

  // 청크 로딩 상태
  loadedChunks: Set<string>;
  markChunkLoaded: (chunkId: string) => void;
  isChunkLoaded: (chunkId: string) => boolean;
}

const DEFAULT_VIEWPORT: ViewportState = {
  x: 0,
  y: 0,
  zoom: 1,
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export const useGin7MapStore = create<Gin7MapStoreState>((set, get) => ({
  // 뷰포트 상태
  viewport: DEFAULT_VIEWPORT,
  
  setViewport: (partial) =>
    set((state) => ({
      viewport: { ...state.viewport, ...partial },
    })),

  resetViewport: () => set({ viewport: DEFAULT_VIEWPORT }),

  // 줌 컨트롤
  zoomIn: () =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.min(state.viewport.zoom + ZOOM_STEP, MAX_ZOOM),
      },
    })),

  zoomOut: () =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.max(state.viewport.zoom - ZOOM_STEP, MIN_ZOOM),
      },
    })),

  panTo: (x, y) =>
    set((state) => ({
      viewport: { ...state.viewport, x, y },
    })),

  // 선택 상태
  selection: { type: null, id: null },
  
  setSelection: (selection) => set({ selection }),
  
  clearSelection: () => set({ selection: { type: null, id: null } }),

  // 호버 상태
  hoveredCell: null,
  setHoveredCell: (cell) => set({ hoveredCell: cell }),

  // 레이어 가시성
  layers: {
    grid: true,
    fleets: true,
    routes: true,
    labels: true,
    territories: true,
  },

  toggleLayer: (layer) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: !state.layers[layer],
      },
    })),

  // 청크 로딩 상태
  loadedChunks: new Set<string>(),
  
  markChunkLoaded: (chunkId) =>
    set((state) => {
      const newChunks = new Set(state.loadedChunks);
      newChunks.add(chunkId);
      return { loadedChunks: newChunks };
    }),

  isChunkLoaded: (chunkId) => get().loadedChunks.has(chunkId),
}));

// Window에 스토어 노출 (디버깅용)
if (typeof window !== 'undefined') {
  const globalWindow = window as Window & { __OPEN_SAM_STORES__?: Record<string, unknown> };
  globalWindow.__OPEN_SAM_STORES__ = globalWindow.__OPEN_SAM_STORES__ ?? {};
  globalWindow.__OPEN_SAM_STORES__.gin7Map = useGin7MapStore;
}

