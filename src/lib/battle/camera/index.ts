/**
 * 복셀 전투 카메라 시스템
 *
 * 사용법:
 * ```typescript
 * import { CameraController, CameraPresets } from '@/lib/battle/camera';
 *
 * // 카메라 컨트롤러 생성
 * const cameraController = new CameraController(threeCamera, domElement, {
 *   bounds: { minX: -150, maxX: 150, minZ: -150, maxZ: 150 },
 * });
 *
 * // 유닛 추적
 * cameraController.followUnit({
 *   type: 'unit',
 *   id: 'soldier_1',
 *   position: { x: 10, y: 0, z: 20 },
 *   offset: { x: 0, y: 30, z: 40 },
 *   lookAhead: true,
 * });
 *
 * // 프리셋 뷰
 * cameraController.goToPreset('preset_1');
 *
 * // 시네마틱
 * cameraController.playCinematic('battle_start');
 *
 * // 업데이트 루프
 * function animate() {
 *   cameraController.update(deltaTime);
 *   requestAnimationFrame(animate);
 * }
 * ```
 */

// 메인 컨트롤러
export {
  CameraController,
  DEFAULT_CAMERA_CONFIG,
  type CameraConfig,
  type FollowTarget,
  type CameraModeType,
  type Vector3Like,
} from './CameraController';

// 입력 처리
export {
  CameraInput,
  type InputState,
  type InputCallbacks,
} from './CameraInput';

// 카메라 모드
export {
  FreeCameraMode,
  FollowCameraMode,
  OverviewCameraMode,
  CinematicCameraMode,
  type CameraMode,
  type CameraKeyframe,
  type CinematicSequence,
  type EasingType,
  type FollowModeConfig,
  type OverviewModeConfig,
} from './CameraModes';

// 프리셋
export {
  CameraPresets,
  createDefaultBounds,
  calculateOptimalPreset,
  type CameraPreset,
  type PresetBounds,
} from './CameraPresets';





