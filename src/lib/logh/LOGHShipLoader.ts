/**
 * LOGH 함선 로더 통합 모듈
 * 
 * Stellaris OBJ 모델과 기존 에셋을 통합하여 Three.js에서 사용
 */

import * as THREE from 'three';
import { loadObjModel, loadObjWithTextures, loadDDSTexture, clearAllCache } from './LOGHObjLoader';
import {
  StellarisShipAsset,
  StellarisShipFaction,
  StellarisShipClass,
  getStellarisShipById,
  getStellarisShipsByFaction,
  getStellarisShipsByClass,
  getStellarisFlagships,
  getStellarisShipByCommander,
  STELLARIS_FACTION_COLORS,
  ALL_STELLARIS_ASSETS,
} from './LOGHStellarisAssets';

// 로딩 상태 추적
const loadingPromises = new Map<string, Promise<THREE.Group>>();

/**
 * 함선 모델 로드 옵션
 */
export interface ShipLoadOptions {
  /** 텍스처 사용 여부 (기본: true) */
  useTextures?: boolean;
  /** 커스텀 색상 (텍스처 미사용 시) */
  color?: number;
  /** 스케일 오버라이드 */
  scale?: number;
  /** 팀 컬러 적용 */
  teamColor?: number;
  /** LOD 레벨 (0: 최고, 1: 중간, 2: 낮음) */
  lodLevel?: 0 | 1 | 2;
}

/**
 * 함선 ID로 모델 로드
 */
export async function loadShipById(
  shipId: string,
  options?: ShipLoadOptions
): Promise<THREE.Group | null> {
  const asset = getStellarisShipById(shipId);
  if (!asset) {
    console.warn(`Ship not found: ${shipId}`);
    return null;
  }
  return loadShipFromAsset(asset, options);
}

/**
 * 에셋 정의로 모델 로드
 */
export async function loadShipFromAsset(
  asset: StellarisShipAsset,
  options?: ShipLoadOptions
): Promise<THREE.Group> {
  const {
    useTextures = true,
    color,
    scale,
    teamColor,
  } = options || {};

  // 중복 로딩 방지
  const cacheKey = `${asset.objFile}_${useTextures}_${color}_${teamColor}`;
  const existing = loadingPromises.get(cacheKey);
  if (existing) {
    const model = await existing;
    return model.clone();
  }

  const loadPromise = (async () => {
    let model: THREE.Group;

    if (useTextures && asset.textures.diffuse) {
      model = await loadObjWithTextures(asset.objFile, {
        diffuse: asset.textures.diffuse,
        normal: asset.textures.normal,
        specular: asset.textures.specular,
      });
    } else {
      model = await loadObjModel(asset.objFile);
      
      // 단색 재질 적용
      const materialColor = color ?? getFactionColor(asset.faction);
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: materialColor,
            metalness: 0.7,
            roughness: 0.3,
          });
        }
      });
    }

    // 스케일 적용
    const finalScale = scale ?? asset.scale ?? 1;
    model.scale.multiplyScalar(finalScale);

    // 팀 컬러 이미시브 추가
    if (teamColor !== undefined) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.emissive) {
            mat.emissive.setHex(teamColor);
            mat.emissiveIntensity = 0.15;
          }
        }
      });
    }

    // 사용자 데이터에 에셋 정보 저장
    model.userData = {
      assetId: asset.id,
      assetName: asset.name,
      faction: asset.faction,
      shipClass: asset.shipClass,
      commander: asset.commander,
    };

    return model;
  })();

  loadingPromises.set(cacheKey, loadPromise);
  
  try {
    return await loadPromise;
  } finally {
    loadingPromises.delete(cacheKey);
  }
}

/**
 * 진영 기본 색상 반환
 */
function getFactionColor(faction: StellarisShipFaction): number {
  return STELLARIS_FACTION_COLORS[faction].primary;
}

/**
 * 진영별 함선 배치 로드
 */
export async function loadFleet(
  faction: StellarisShipFaction,
  composition: {
    battleships?: number;
    cruisers?: number;
    destroyers?: number;
    corvettes?: number;
    carriers?: number;
    fighters?: number;
  },
  options?: ShipLoadOptions
): Promise<Map<StellarisShipClass, THREE.Group[]>> {
  const fleet = new Map<StellarisShipClass, THREE.Group[]>();
  const ships = getStellarisShipsByFaction(faction);

  const loadShipsOfClass = async (
    shipClass: StellarisShipClass,
    count: number
  ): Promise<THREE.Group[]> => {
    if (count <= 0) return [];
    
    const classShips = ships.filter(s => s.shipClass === shipClass);
    if (classShips.length === 0) return [];

    const models: THREE.Group[] = [];
    for (let i = 0; i < count; i++) {
      // 랜덤 또는 순환 선택
      const asset = classShips[i % classShips.length];
      const model = await loadShipFromAsset(asset, options);
      models.push(model);
    }
    return models;
  };

  // 병렬 로드
  const [battleships, cruisers, destroyers, corvettes, carriers, fighters] = await Promise.all([
    loadShipsOfClass('battleship', composition.battleships || 0),
    loadShipsOfClass('cruiser', composition.cruisers || 0),
    loadShipsOfClass('destroyer', composition.destroyers || 0),
    loadShipsOfClass('corvette', composition.corvettes || 0),
    loadShipsOfClass('carrier', composition.carriers || 0),
    loadShipsOfClass('fighter', composition.fighters || 0),
  ]);

  if (battleships.length) fleet.set('battleship', battleships);
  if (cruisers.length) fleet.set('cruiser', cruisers);
  if (destroyers.length) fleet.set('destroyer', destroyers);
  if (corvettes.length) fleet.set('corvette', corvettes);
  if (carriers.length) fleet.set('carrier', carriers);
  if (fighters.length) fleet.set('fighter', fighters);

  return fleet;
}

/**
 * 기함 로드 (지휘관 이름으로)
 */
export async function loadFlagshipByCommander(
  commander: string,
  options?: ShipLoadOptions
): Promise<THREE.Group | null> {
  const asset = getStellarisShipByCommander(commander);
  if (!asset) {
    console.warn(`Flagship not found for commander: ${commander}`);
    return null;
  }
  return loadShipFromAsset(asset, options);
}

/**
 * 모든 기함 프리로드
 */
export async function preloadFlagships(options?: ShipLoadOptions): Promise<void> {
  const flagships = getStellarisFlagships();
  await Promise.all(
    flagships.map(asset => loadShipFromAsset(asset, options))
  );
  console.log(`Preloaded ${flagships.length} flagships`);
}

/**
 * 진영 전체 프리로드
 */
export async function preloadFaction(
  faction: StellarisShipFaction,
  options?: ShipLoadOptions
): Promise<void> {
  const ships = getStellarisShipsByFaction(faction);
  await Promise.all(
    ships.map(asset => loadShipFromAsset(asset, options))
  );
  console.log(`Preloaded ${ships.length} ${faction} ships`);
}

/**
 * 함선 클래스별 크기 참조값
 */
export const SHIP_SIZE_REFERENCE = {
  fighter: 0.1,
  corvette: 0.3,
  destroyer: 0.5,
  cruiser: 0.8,
  battleship: 1.0,
  carrier: 1.2,
  titan: 2.0,
  juggernaut: 3.0,
  colossus: 4.0,
  flagship: 1.5,
  station: 2.5,
  transport: 0.6,
  science: 0.5,
  construction: 0.7,
  colony: 0.8,
};

/**
 * 함선 클래스별 기본 스케일 반환
 */
export function getShipClassScale(shipClass: StellarisShipClass): number {
  return SHIP_SIZE_REFERENCE[shipClass] || 1.0;
}

/**
 * 캐시 및 리소스 정리
 */
export function cleanup(): void {
  loadingPromises.clear();
  clearAllCache();
}

// Re-export
export type { StellarisShipAsset, StellarisShipFaction, StellarisShipClass };
export {
  getStellarisShipById,
  getStellarisShipsByFaction,
  getStellarisShipsByClass,
  getStellarisFlagships,
  getStellarisShipByCommander,
  STELLARIS_FACTION_COLORS,
  ALL_STELLARIS_ASSETS,
};











