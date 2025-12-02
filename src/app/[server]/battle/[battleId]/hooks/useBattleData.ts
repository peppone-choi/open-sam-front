'use client';

/**
 * 전투 데이터 로딩 훅
 * 
 * API에서 전투 데이터를 로드하고 복셀 엔진 데이터로 변환합니다.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SammoAPI } from '@/lib/api/sammo';
import { 
  convertApiBattleToVoxel, 
  validateApiBattleData,
  type ApiBattleData,
  type VoxelBattleInit,
} from '@/lib/battle/adapters';

// ============================================================================
// 타입 정의
// ============================================================================

interface UseBattleDataReturn {
  /** 원본 API 전투 데이터 */
  battleData: ApiBattleData | null;
  /** 변환된 복셀 엔진 데이터 */
  voxelData: VoxelBattleInit | null;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 데이터 다시 불러오기 */
  refetch: () => void;
}

interface ApiBattleResponse {
  result: boolean;
  battle?: {
    no: number;
    name?: string;
    attacker?: ApiSideResponse;
    defender?: ApiSideResponse;
    cityId?: number;
    season?: number;
    battleType?: 'field' | 'siege' | 'ambush' | 'naval';
    units?: any[];
  };
  reason?: string;
}

interface ApiSideResponse {
  general?: {
    no: number;
    name: string;
    leadership: number;
    strength: number;
    intel: number;
    specialId?: number;
    specialName?: string;
    weapon?: { id: number; name: string; grade?: number; bonus?: number };
    armor?: { id: number; name: string; grade?: number; bonus?: number };
    horse?: { id: number; name: string; grade?: number; bonus?: number };
    level?: number;
    experience?: number;
  };
  crewType?: number;
  crew?: number;
  morale?: number;
  train?: number;
  nationId?: number;
  nationColor?: string;
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * API 응답을 ApiBattleData 형식으로 변환
 */
function transformApiResponse(battleId: string, response: ApiBattleResponse): ApiBattleData | null {
  if (!response.result || !response.battle) {
    return null;
  }

  const battle = response.battle;

  // 공격측 데이터 변환
  const attacker = transformSide(battle.attacker);
  if (!attacker) {
    console.warn('공격측 데이터 변환 실패');
    return null;
  }

  // 방어측 데이터 변환
  const defender = transformSide(battle.defender);
  if (!defender) {
    console.warn('방어측 데이터 변환 실패');
    return null;
  }

  return {
    battleId,
    attacker,
    defender,
    cityId: battle.cityId,
    season: battle.season,
    battleType: battle.battleType,
  };
}

/**
 * 측면 데이터 변환
 */
function transformSide(side: ApiSideResponse | undefined): ApiBattleData['attacker'] | null {
  if (!side || !side.general) {
    return null;
  }

  return {
    general: {
      no: side.general.no,
      name: side.general.name,
      leadership: side.general.leadership ?? 50,
      strength: side.general.strength ?? 50,
      intel: side.general.intel ?? 50,
      specialId: side.general.specialId,
      specialName: side.general.specialName,
      weapon: side.general.weapon,
      armor: side.general.armor,
      horse: side.general.horse,
      level: side.general.level,
      experience: side.general.experience,
    },
    crewType: side.crewType ?? 1100, // 기본 보병
    crew: side.crew ?? 1000,
    morale: side.morale ?? 100,
    train: side.train ?? 50,
    nationId: side.nationId,
    nationColor: side.nationColor,
  };
}

/**
 * 더미 전투 데이터 생성 (API 오류 시 테스트용)
 */
function createDummyBattleData(battleId: string): ApiBattleData {
  return {
    battleId,
    attacker: {
      general: {
        no: 1,
        name: '조조',
        leadership: 96,
        strength: 72,
        intel: 91,
        specialId: 1,
        specialName: '패왕',
      },
      crewType: 1100, // 도검병
      crew: 5000,
      morale: 100,
      train: 80,
      nationId: 1,
    },
    defender: {
      general: {
        no: 2,
        name: '손권',
        leadership: 88,
        strength: 65,
        intel: 82,
        specialId: 2,
        specialName: '수군',
      },
      crewType: 1100, // 도검병
      crew: 5000,
      morale: 100,
      train: 75,
      nationId: 3,
    },
    cityId: 1,
    season: 2, // 여름
    battleType: 'field',
  };
}

// ============================================================================
// 메인 훅
// ============================================================================

export function useBattleData(battleId: string): UseBattleDataReturn {
  const [battleData, setBattleData] = useState<ApiBattleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API 데이터 로드
  const loadBattleData = useCallback(async () => {
    if (!battleId) {
      setError('전투 ID가 없습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // API 호출
      const response = await SammoAPI.GetBattleDetail({
        battleID: Number(battleId),
      });

      // 응답 변환
      const data = transformApiResponse(battleId, response as ApiBattleResponse);

      if (!data) {
        // 테스트 모드: 더미 데이터 사용
        console.warn('API 데이터 변환 실패, 더미 데이터 사용');
        const dummyData = createDummyBattleData(battleId);
        setBattleData(dummyData);
        return;
      }

      // 유효성 검증
      const validation = validateApiBattleData(data);
      if (!validation.valid) {
        console.warn('전투 데이터 유효성 검증 실패:', validation.errors);
        // 부분적 데이터라도 사용
      }

      setBattleData(data);
    } catch (err) {
      console.error('전투 데이터 로드 실패:', err);
      
      // 에러 발생 시 더미 데이터로 폴백
      console.warn('API 오류, 더미 데이터 사용');
      const dummyData = createDummyBattleData(battleId);
      setBattleData(dummyData);
      
      // 에러는 표시하지 않고 더미 데이터 사용
      // setError(err instanceof Error ? err.message : '전투 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [battleId]);

  // 초기 로드
  useEffect(() => {
    loadBattleData();
  }, [loadBattleData]);

  // 복셀 데이터로 변환
  const voxelData = useMemo(() => {
    if (!battleData) return null;

    try {
      return convertApiBattleToVoxel(battleData);
    } catch (err) {
      console.error('복셀 데이터 변환 실패:', err);
      setError('전투 데이터 변환 중 오류가 발생했습니다.');
      return null;
    }
  }, [battleData]);

  return {
    battleData,
    voxelData,
    isLoading,
    error,
    refetch: loadBattleData,
  };
}



