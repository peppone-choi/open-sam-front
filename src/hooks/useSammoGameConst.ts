/**
 * Sammo 게임 상수 로드 훅
 * Vue getGameConstStore() 대응
 */

'use client';

import { useEffect } from 'react';
import { useSammoStore, GameConstType, GameUnitType, GameCityDefault, GameIActionInfo } from '@/stores/sammoStore';

interface UseSammoGameConstReturn {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  
  // 게임 상수 데이터
  gameConst: GameConstType | null;
  gameUnitConst: Record<string | number, GameUnitType> | null;
  cityConst: Record<number, GameCityDefault> | null;
  cityConstMap: {
    region: Record<number | string, string | number>;
    level: Record<number | string, string | number>;
  } | null;
  iActionInfo: Record<string, Record<string, GameIActionInfo>> | null;
  iActionKeyMap: Record<string, string> | null;
  version: string | null;
  
  // 헬퍼 함수
  getUnitByType: (crewTypeId: string | number) => GameUnitType | null;
  getCityById: (cityId: number) => GameCityDefault | null;
  getActionInfo: (actionKey: string) => GameIActionInfo | null;
  getRegionName: (regionId: number | string) => string;
  getCityLevelName: (level: number | string) => string;
  
  // 액션
  reload: () => Promise<void>;
}

/**
 * Sammo 게임 상수를 로드하고 접근하는 훅
 * 컴포넌트 마운트 시 자동으로 게임 상수 로드
 */
export function useSammoGameConst(): UseSammoGameConstReturn {
  const {
    isLoading,
    isLoaded,
    error,
    gameConst,
    gameUnitConst,
    cityConst,
    cityConstMap,
    iActionInfo,
    iActionKeyMap,
    version,
    loadGameConst,
    getUnitByType,
    getCityById,
    getActionInfo,
    getRegionName,
    getCityLevelName,
  } = useSammoStore();

  // 컴포넌트 마운트 시 자동 로드
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadGameConst();
    }
  }, [isLoaded, isLoading, loadGameConst]);

  return {
    isLoading,
    isLoaded,
    error,
    gameConst,
    gameUnitConst,
    cityConst,
    cityConstMap,
    iActionInfo,
    iActionKeyMap,
    version,
    getUnitByType,
    getCityById,
    getActionInfo,
    getRegionName,
    getCityLevelName,
    reload: loadGameConst,
  };
}

/**
 * 특정 병종 정보만 가져오는 훅
 */
export function useSammoUnit(crewTypeId: string | number): GameUnitType | null {
  const { isLoaded, getUnitByType, loadGameConst, isLoading } = useSammoStore();
  
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadGameConst();
    }
  }, [isLoaded, isLoading, loadGameConst]);
  
  if (!isLoaded) return null;
  return getUnitByType(crewTypeId);
}

/**
 * 특정 도시 정보만 가져오는 훅
 */
export function useSammoCity(cityId: number): GameCityDefault | null {
  const { isLoaded, getCityById, loadGameConst, isLoading } = useSammoStore();
  
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadGameConst();
    }
  }, [isLoaded, isLoading, loadGameConst]);
  
  if (!isLoaded) return null;
  return getCityById(cityId);
}

/**
 * 특정 커맨드 정보만 가져오는 훅
 */
export function useSammoAction(actionKey: string): GameIActionInfo | null {
  const { isLoaded, getActionInfo, loadGameConst, isLoading } = useSammoStore();
  
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadGameConst();
    }
  }, [isLoaded, isLoading, loadGameConst]);
  
  if (!isLoaded) return null;
  return getActionInfo(actionKey);
}

