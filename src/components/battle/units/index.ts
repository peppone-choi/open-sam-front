// 모듈러 유닛 시스템 (기하학 기반)
export { 
  buildUnit, 
  getUnitConfigFromCrewType,
  UNIT_PRESETS,
  NATION_PALETTES,
} from './UnitBuilder';

export type { UnitConfig } from './UnitBuilder';

export { default as UnitPreview } from './UnitPreview';

// 복셀 유닛 시스템
export {
  buildVoxelUnit,
  VOXEL_UNIT_PRESETS,
  VOXEL_NATION_PALETTES,
} from './VoxelUnitBuilder';

export type { VoxelUnitConfig } from './VoxelUnitBuilder';

export { default as VoxelUnitPreview } from './VoxelUnitPreview';

// 디테일 픽셀 유닛 시스템 (Toon Shader + Pixelation)
export {
  buildDetailedUnit,
  DETAILED_UNIT_PRESETS,
} from './DetailedUnitBuilder';

export type { DetailedUnitConfig } from './DetailedUnitBuilder';

export { default as PixelUnitPreview } from './PixelUnitPreview';

// 리얼리즘 유닛 시스템 (Procedural Textures)
export {
  buildRealismUnit,
  buildUnitById,
} from './RealismUnitBuilder';

export type { UnitDefinition } from './db/UnitDefinitions';
export { UNIT_DATABASE } from './db/UnitDefinitions';

export { default as RealismUnitPreview } from './RealismUnitPreview';


