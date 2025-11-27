/**
 * Sammo 게임 상수 스토어
 * Vue GameConstStore.ts 대응
 */

import { create } from 'zustand';
import { SammoAPI } from '@/lib/api/sammo';

// 게임 상수 타입 정의
export interface GameConstType {
  // 기본 게임 설정
  turnTerm?: number;
  maxTurn?: number;
  maxGeneral?: number;
  maxCity?: number;
  maxNation?: number;
  // 스탯 관련
  statMin?: number;
  statMax?: number;
  statTotal?: number;
  // 병종 관련
  defaultCrewType?: number;
  maxCrew?: number;
  // 기타
  [key: string]: any;
}

export interface GameUnitType {
  id: number;
  type: string;
  name: string;
  cost?: {
    gold?: number;
    rice?: number;
  };
  stats?: {
    offense?: number;
    defense?: number;
    defenseRange?: number;
    attackRange?: number;
    speed?: number;
    avoid?: number;
    magic?: number;
    tech?: number;
  };
  requirements?: {
    year?: number;
    regions?: string[];
    cities?: string[];
  };
  attacks?: Record<string, number>;
  defenses?: Record<string, number>;
  description?: string[];
  constraints?: Array<{ type: string; value?: any }>;
  skills?: {
    init?: any;
    phase?: any;
    actions?: any;
  };
}

export interface GameCityDefault {
  id: number;
  name: string;
  region: number;
  level: number;
  x?: number;
  y?: number;
  supply?: number;
  pop_max?: number;
  agri_max?: number;
  comm_max?: number;
  secu_max?: number;
  def_max?: number;
  wall_max?: number;
  [key: string]: any;
}

export interface GameIActionInfo {
  name: string;
  simpleName?: string;
  reqArg?: number;
  possible?: boolean;
  compensation?: number;
  title?: string;
  category?: string;
  [key: string]: any;
}

export type GameIActionCategory = 'common' | 'battle' | 'nation' | 'chief' | string;
export type GameIActionKey = string;
export type CityID = number;
export type CrewTypeID = number | string;

interface SammoStoreState {
  // 로딩 상태
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  // 게임 상수 데이터
  gameConst: GameConstType | null;
  gameUnitConst: Record<CrewTypeID, GameUnitType> | null;
  cityConst: Record<CityID, GameCityDefault> | null;
  cityConstMap: {
    region: Record<number | string, string | number>;
    level: Record<number | string, string | number>;
  } | null;
  iActionInfo: Record<GameIActionCategory, Record<GameIActionKey, GameIActionInfo>> | null;
  iActionKeyMap: Record<string, GameIActionCategory> | null;
  version: string | null;

  // 액션
  loadGameConst: () => Promise<void>;
  reset: () => void;

  // 헬퍼
  getUnitByType: (crewTypeId: CrewTypeID) => GameUnitType | null;
  getCityById: (cityId: CityID) => GameCityDefault | null;
  getActionInfo: (actionKey: string) => GameIActionInfo | null;
  getRegionName: (regionId: number | string) => string;
  getCityLevelName: (level: number | string) => string;
}

export const useSammoStore = create<SammoStoreState>((set, get) => ({
  // 초기 상태
  isLoading: false,
  isLoaded: false,
  error: null,
  gameConst: null,
  gameUnitConst: null,
  cityConst: null,
  cityConstMap: null,
  iActionInfo: null,
  iActionKeyMap: null,
  version: null,

  // 게임 상수 로드
  loadGameConst: async () => {
    const state = get();
    
    // 이미 로드됨
    if (state.isLoaded && state.gameConst) {
      return;
    }
    
    // 이미 로딩 중
    if (state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const result = await SammoAPI.GlobalGetConst();
      
      if (!result?.result || !result.data) {
        throw new Error('게임 상수를 가져오지 못했습니다.');
      }

      const data = result.data;

      set({
        isLoading: false,
        isLoaded: true,
        error: null,
        gameConst: data.gameConst || null,
        gameUnitConst: data.gameUnitConst || null,
        cityConst: data.cityConst || null,
        cityConstMap: data.cityConstMap || null,
        iActionInfo: data.iActionInfo || null,
        iActionKeyMap: data.iActionKeyMap || null,
        version: data.version || null,
      });

      console.log('[SammoStore] 게임 상수 로드 완료:', data.version);
    } catch (error: any) {
      console.error('[SammoStore] 게임 상수 로드 실패:', error);
      set({
        isLoading: false,
        isLoaded: false,
        error: error.message || '게임 상수 로드 실패',
      });
    }
  },

  // 리셋
  reset: () => {
    set({
      isLoading: false,
      isLoaded: false,
      error: null,
      gameConst: null,
      gameUnitConst: null,
      cityConst: null,
      cityConstMap: null,
      iActionInfo: null,
      iActionKeyMap: null,
      version: null,
    });
  },

  // 병종 정보 조회
  getUnitByType: (crewTypeId) => {
    const { gameUnitConst } = get();
    if (!gameUnitConst) return null;
    return gameUnitConst[crewTypeId] || null;
  },

  // 도시 정보 조회
  getCityById: (cityId) => {
    const { cityConst } = get();
    if (!cityConst) return null;
    return cityConst[cityId] || null;
  },

  // 커맨드 정보 조회
  getActionInfo: (actionKey) => {
    const { iActionInfo, iActionKeyMap } = get();
    if (!iActionInfo || !iActionKeyMap) return null;
    
    const category = iActionKeyMap[actionKey];
    if (!category) return null;
    
    return iActionInfo[category]?.[actionKey] || null;
  },

  // 지역명 조회
  getRegionName: (regionId) => {
    const { cityConstMap } = get();
    if (!cityConstMap?.region) return String(regionId);
    const value = cityConstMap.region[regionId];
    return typeof value === 'string' ? value : String(value);
  },

  // 도시 레벨명 조회
  getCityLevelName: (level) => {
    const { cityConstMap } = get();
    if (!cityConstMap?.level) return String(level);
    const value = cityConstMap.level[level];
    return typeof value === 'string' ? value : String(value);
  },
}));

// 전역 디버그 접근
if (typeof window !== 'undefined') {
  const globalWindow = window as Window & { __OPEN_SAM_STORES__?: Record<string, any> };
  globalWindow.__OPEN_SAM_STORES__ = globalWindow.__OPEN_SAM_STORES__ ?? {};
  globalWindow.__OPEN_SAM_STORES__.sammo = useSammoStore;
}

/**
 * 게임 상수 로드 (비동기 헬퍼)
 * Vue getGameConstStore() 대응
 */
export async function getSammoGameConst(): Promise<SammoStoreState> {
  const store = useSammoStore.getState();
  
  if (!store.isLoaded) {
    await store.loadGameConst();
  }
  
  return useSammoStore.getState();
}

