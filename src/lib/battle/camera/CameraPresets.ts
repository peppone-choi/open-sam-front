/**
 * CameraPresets.ts
 * 복셀 전투 카메라 시스템 - 프리셋 뷰
 *
 * 프리셋:
 * - initial: 초기 전장 뷰
 * - attacker: 공격자 시점
 * - defender: 방어자 시점
 * - bird_eye: 조감도
 * - cinematic_*: 시네마틱 뷰
 * - 숫자 키 1-9 바인딩
 */

import type { Vector3Like } from './CameraController';

// ========================================
// 타입 정의
// ========================================

export interface CameraPreset {
  /** 프리셋 ID */
  id: string;

  /** 표시 이름 */
  name: string;

  /** 카메라 위치 */
  position: Vector3Like;

  /** 카메라 타겟 */
  target: Vector3Like;

  /** 줌 거리 (선택) */
  zoom?: number;

  /** 설명 */
  description?: string;

  /** 단축키 (숫자 1-9) */
  shortcutKey?: number;
}

export interface PresetBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

// ========================================
// 기본 프리셋 정의
// ========================================

function createDefaultPresets(bounds: PresetBounds): Map<string, CameraPreset> {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;

  const presets: CameraPreset[] = [
    // 1번: 초기 전장 뷰 (기본)
    {
      id: 'preset_1',
      name: '전장 전체',
      position: { x: centerX, y: 100, z: centerZ + 120 },
      target: { x: centerX, y: 0, z: centerZ },
      zoom: 120,
      description: '전장 전체를 볼 수 있는 기본 뷰',
      shortcutKey: 1,
    },

    // 2번: 공격자 시점 (아래쪽에서 위를 봄)
    {
      id: 'preset_2',
      name: '공격자 시점',
      position: { x: centerX, y: 40, z: bounds.minZ - 30 },
      target: { x: centerX, y: 0, z: centerZ },
      zoom: 80,
      description: '공격자 진영에서 바라본 시점',
      shortcutKey: 2,
    },

    // 3번: 방어자 시점 (위쪽에서 아래를 봄)
    {
      id: 'preset_3',
      name: '방어자 시점',
      position: { x: centerX, y: 40, z: bounds.maxZ + 30 },
      target: { x: centerX, y: 0, z: centerZ },
      zoom: 80,
      description: '방어자 진영에서 바라본 시점',
      shortcutKey: 3,
    },

    // 4번: 조감도 (직상방)
    {
      id: 'preset_4',
      name: '조감도',
      position: { x: centerX, y: 200, z: centerZ + 10 },
      target: { x: centerX, y: 0, z: centerZ },
      zoom: 200,
      description: '위에서 내려다보는 조감도',
      shortcutKey: 4,
    },

    // 5번: 좌측 시점
    {
      id: 'preset_5',
      name: '좌측 시점',
      position: { x: bounds.minX - 50, y: 50, z: centerZ },
      target: { x: centerX, y: 0, z: centerZ },
      zoom: 100,
      description: '전장 왼쪽에서 바라본 시점',
      shortcutKey: 5,
    },

    // 6번: 우측 시점
    {
      id: 'preset_6',
      name: '우측 시점',
      position: { x: bounds.maxX + 50, y: 50, z: centerZ },
      target: { x: centerX, y: 0, z: centerZ },
      zoom: 100,
      description: '전장 오른쪽에서 바라본 시점',
      shortcutKey: 6,
    },

    // 7번: 클로즈업 뷰
    {
      id: 'preset_7',
      name: '클로즈업',
      position: { x: centerX, y: 20, z: centerZ + 30 },
      target: { x: centerX, y: 5, z: centerZ },
      zoom: 30,
      description: '전장 중앙 클로즈업',
      shortcutKey: 7,
    },

    // 8번: 코너 시점 (좌하단)
    {
      id: 'preset_8',
      name: '코너 뷰',
      position: { x: bounds.minX - 30, y: 60, z: bounds.minZ - 30 },
      target: { x: centerX, y: 0, z: centerZ },
      zoom: 120,
      description: '코너에서 대각선으로 바라본 시점',
      shortcutKey: 8,
    },

    // 9번: 시네마틱 뷰 (낮은 앵글)
    {
      id: 'preset_9',
      name: '드라마틱 뷰',
      position: { x: centerX + 50, y: 15, z: centerZ + 80 },
      target: { x: centerX, y: 8, z: centerZ },
      zoom: 80,
      description: '낮은 앵글의 드라마틱한 시점',
      shortcutKey: 9,
    },

    // 추가 프리셋 (단축키 없음)
    {
      id: 'initial',
      name: '초기 위치',
      position: { x: 0, y: 100, z: 120 },
      target: { x: 0, y: 0, z: 0 },
      zoom: 120,
      description: '게임 시작 시 기본 카메라 위치',
    },

    {
      id: 'attacker_camp',
      name: '공격자 진영',
      position: { x: centerX, y: 30, z: bounds.minZ + depth * 0.2 },
      target: { x: centerX, y: 0, z: bounds.minZ + depth * 0.15 },
      zoom: 50,
      description: '공격자 진영 클로즈업',
    },

    {
      id: 'defender_camp',
      name: '방어자 진영',
      position: { x: centerX, y: 30, z: bounds.maxZ - depth * 0.2 },
      target: { x: centerX, y: 0, z: bounds.maxZ - depth * 0.15 },
      zoom: 50,
      description: '방어자 진영 클로즈업',
    },

    {
      id: 'battle_line',
      name: '전선',
      position: { x: centerX, y: 25, z: centerZ + 40 },
      target: { x: centerX, y: 3, z: centerZ },
      zoom: 40,
      description: '전투가 벌어지는 전선 뷰',
    },

    {
      id: 'cinematic_sweep',
      name: '시네마틱 스윕',
      position: { x: bounds.minX, y: 80, z: centerZ },
      target: { x: centerX, y: 0, z: centerZ },
      zoom: 100,
      description: '시네마틱 스윕 시작점',
    },
  ];

  const presetMap = new Map<string, CameraPreset>();
  presets.forEach(preset => {
    presetMap.set(preset.id, preset);
  });

  return presetMap;
}

// ========================================
// CameraPresets 클래스
// ========================================

export class CameraPresets {
  private presets: Map<string, CameraPreset>;
  private bounds: PresetBounds;
  private shortcutMap: Map<number, string> = new Map();

  constructor(bounds: PresetBounds) {
    this.bounds = bounds;
    this.presets = createDefaultPresets(bounds);
    this.buildShortcutMap();
  }

  // ========================================
  // 공개 API
  // ========================================

  /**
   * 프리셋 가져오기
   */
  getPreset(id: string): CameraPreset | undefined {
    return this.presets.get(id);
  }

  /**
   * 단축키로 프리셋 가져오기
   */
  getPresetByShortcut(key: number): CameraPreset | undefined {
    const presetId = this.shortcutMap.get(key);
    if (presetId) {
      return this.presets.get(presetId);
    }
    return undefined;
  }

  /**
   * 모든 프리셋 목록 가져오기
   */
  getAllPresets(): CameraPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * 단축키가 있는 프리셋만 가져오기
   */
  getShortcutPresets(): CameraPreset[] {
    return this.getAllPresets().filter(p => p.shortcutKey !== undefined);
  }

  /**
   * 커스텀 프리셋 추가
   */
  addPreset(preset: CameraPreset): void {
    this.presets.set(preset.id, preset);

    if (preset.shortcutKey !== undefined) {
      this.shortcutMap.set(preset.shortcutKey, preset.id);
    }
  }

  /**
   * 프리셋 제거
   */
  removePreset(id: string): boolean {
    const preset = this.presets.get(id);
    if (preset) {
      if (preset.shortcutKey !== undefined) {
        this.shortcutMap.delete(preset.shortcutKey);
      }
      return this.presets.delete(id);
    }
    return false;
  }

  /**
   * 경계 업데이트 (전장 크기 변경 시)
   */
  updateBounds(bounds: PresetBounds): void {
    this.bounds = bounds;

    // 기본 프리셋 재생성
    const customPresets: CameraPreset[] = [];

    // 커스텀 프리셋 백업 (기본 프리셋 ID가 아닌 것들)
    const defaultIds = new Set([
      'preset_1', 'preset_2', 'preset_3', 'preset_4', 'preset_5',
      'preset_6', 'preset_7', 'preset_8', 'preset_9',
      'initial', 'attacker_camp', 'defender_camp', 'battle_line', 'cinematic_sweep',
    ]);

    this.presets.forEach((preset, id) => {
      if (!defaultIds.has(id)) {
        customPresets.push(preset);
      }
    });

    // 기본 프리셋 재생성
    this.presets = createDefaultPresets(bounds);

    // 커스텀 프리셋 복원
    customPresets.forEach(preset => {
      this.presets.set(preset.id, preset);
    });

    this.buildShortcutMap();
  }

  /**
   * 현재 카메라 상태를 프리셋으로 저장
   */
  saveCurrentAsPreset(
    id: string,
    name: string,
    position: Vector3Like,
    target: Vector3Like,
    shortcutKey?: number
  ): CameraPreset {
    const preset: CameraPreset = {
      id,
      name,
      position: { ...position },
      target: { ...target },
      shortcutKey,
      description: `사용자 정의 프리셋: ${name}`,
    };

    this.addPreset(preset);
    return preset;
  }

  /**
   * 프리셋을 JSON으로 내보내기
   */
  exportToJSON(): string {
    const presets = this.getAllPresets();
    return JSON.stringify(presets, null, 2);
  }

  /**
   * JSON에서 프리셋 불러오기
   */
  importFromJSON(json: string): number {
    try {
      const presets: CameraPreset[] = JSON.parse(json);
      let count = 0;

      presets.forEach(preset => {
        if (preset.id && preset.position && preset.target) {
          this.addPreset(preset);
          count++;
        }
      });

      return count;
    } catch (error) {
      console.error('프리셋 불러오기 실패:', error);
      return 0;
    }
  }

  // ========================================
  // 특수 프리셋 생성 헬퍼
  // ========================================

  /**
   * 유닛 위치 기반 프리셋 생성
   */
  createUnitFocusPreset(
    unitPosition: Vector3Like,
    name: string = '유닛 포커스'
  ): CameraPreset {
    return {
      id: `unit_focus_${Date.now()}`,
      name,
      position: {
        x: unitPosition.x,
        y: unitPosition.y + 25,
        z: unitPosition.z + 35,
      },
      target: { ...unitPosition },
      zoom: 35,
      description: `${name} 위치 포커스`,
    };
  }

  /**
   * 두 지점 사이를 보는 프리셋 생성
   */
  createBetweenPointsPreset(
    pointA: Vector3Like,
    pointB: Vector3Like,
    name: string = '양측 뷰'
  ): CameraPreset {
    const centerX = (pointA.x + pointB.x) / 2;
    const centerZ = (pointA.z + pointB.z) / 2;
    const distance = Math.sqrt(
      Math.pow(pointA.x - pointB.x, 2) +
      Math.pow(pointA.z - pointB.z, 2)
    );

    return {
      id: `between_${Date.now()}`,
      name,
      position: {
        x: centerX,
        y: distance * 0.5 + 20,
        z: centerZ + distance * 0.4,
      },
      target: { x: centerX, y: 0, z: centerZ },
      zoom: distance * 0.8,
      description: `${name} - 두 지점 사이`,
    };
  }

  /**
   * 전투 영역 기반 프리셋 생성
   */
  createBattleAreaPreset(
    area: { minX: number; maxX: number; minZ: number; maxZ: number },
    name: string = '전투 영역'
  ): CameraPreset {
    const centerX = (area.minX + area.maxX) / 2;
    const centerZ = (area.minZ + area.maxZ) / 2;
    const width = area.maxX - area.minX;
    const depth = area.maxZ - area.minZ;
    const size = Math.max(width, depth);

    return {
      id: `battle_area_${Date.now()}`,
      name,
      position: {
        x: centerX,
        y: size * 0.6 + 30,
        z: centerZ + size * 0.4,
      },
      target: { x: centerX, y: 0, z: centerZ },
      zoom: size * 0.8,
      description: `${name} 영역 뷰`,
    };
  }

  // ========================================
  // 내부 메서드
  // ========================================

  private buildShortcutMap(): void {
    this.shortcutMap.clear();
    this.presets.forEach((preset, id) => {
      if (preset.shortcutKey !== undefined) {
        this.shortcutMap.set(preset.shortcutKey, id);
      }
    });
  }
}

// ========================================
// 내보내기
// ========================================

export default CameraPresets;

// 유틸리티 함수
export function createDefaultBounds(): PresetBounds {
  return {
    minX: -150,
    maxX: 150,
    minZ: -150,
    maxZ: 150,
  };
}

export function calculateOptimalPreset(
  attackerPosition: Vector3Like,
  defenderPosition: Vector3Like
): CameraPreset {
  const centerX = (attackerPosition.x + defenderPosition.x) / 2;
  const centerZ = (attackerPosition.z + defenderPosition.z) / 2;
  const distance = Math.sqrt(
    Math.pow(attackerPosition.x - defenderPosition.x, 2) +
    Math.pow(attackerPosition.z - defenderPosition.z, 2)
  );

  return {
    id: 'optimal',
    name: '최적 뷰',
    position: {
      x: centerX,
      y: Math.max(50, distance * 0.4),
      z: centerZ + distance * 0.6,
    },
    target: { x: centerX, y: 0, z: centerZ },
    zoom: distance * 0.8,
    description: '양 진영이 모두 보이는 최적 뷰',
  };
}





