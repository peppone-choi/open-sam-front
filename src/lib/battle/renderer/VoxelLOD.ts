import { Vector3 } from 'three';

export interface LODLevel {
  level: number;
  distance: number;       // 카메라 거리
  voxelScale: number;     // 복셀 크기 (1 = 원본)
  updateFrequency: number; // 업데이트 주기 (프레임)
  useInstancing: boolean; // 인스턴싱 사용 여부
  showDetails: boolean;   // 세부 장식 표시 여부 (깃발 등)
}

export const LOD_LEVELS: LODLevel[] = [
  { 
    level: 0, 
    distance: 0, 
    voxelScale: 1, 
    updateFrequency: 1, 
    useInstancing: true, // 이제 기본적으로 인스턴싱 사용
    showDetails: true 
  },    // 근거리: 풀 디테일 + 매 프레임 업데이트
  { 
    level: 1, 
    distance: 40, 
    voxelScale: 1, 
    updateFrequency: 2, 
    useInstancing: true,
    showDetails: true 
  },   // 중거리: 2프레임마다 업데이트
  { 
    level: 2, 
    distance: 80, 
    voxelScale: 1.5, 
    updateFrequency: 4, 
    useInstancing: true,
    showDetails: false 
  },  // 원거리: 4프레임마다 + 장식 제거
  { 
    level: 3, 
    distance: 150, 
    voxelScale: 2, 
    updateFrequency: 8, 
    useInstancing: true,
    showDetails: false 
  },  // 초원거리: 드문 업데이트
];

export class VoxelLOD {
  private cameraPosition: Vector3 = new Vector3();

  public updateCameraPosition(position: Vector3): void {
    this.cameraPosition.copy(position);
  }

  public getLODLevel(targetPosition: Vector3): LODLevel {
    const distance = this.cameraPosition.distanceTo(targetPosition);
    
    for (let i = LOD_LEVELS.length - 1; i >= 0; i--) {
      if (distance >= LOD_LEVELS[i].distance) {
        return LOD_LEVELS[i];
      }
    }
    
    return LOD_LEVELS[0];
  }

  public shouldUpdate(lod: LODLevel, frameCount: number): boolean {
    return frameCount % lod.updateFrequency === 0;
  }
}
