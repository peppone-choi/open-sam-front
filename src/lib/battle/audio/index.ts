/**
 * 복셀 전투 오디오 시스템
 * 
 * @module audio
 * 
 * 기능:
 * - SoundManager: 메인 사운드 매니저
 * - MusicPlayer: 배경 음악 시스템
 * - SoundEffects: 전투 효과음
 * - SpatialAudio: 3D 공간 오디오
 * - SoundMixer: 볼륨 믹서
 * - BattleEventSoundBridge: 전투 이벤트 연동
 * - UISoundHook: UI 사운드 React Hook
 * 
 * @example
 * ```typescript
 * import { 
 *   initSoundManager, 
 *   getSoundManager,
 *   useUISound 
 * } from '@/lib/battle/audio';
 * 
 * // 초기화
 * const soundManager = await initSoundManager({
 *   masterVolume: 0.8,
 *   musicVolume: 0.6,
 *   sfxVolume: 0.9,
 * });
 * 
 * // 음악 재생
 * soundManager.playMusic('battle_intense');
 * 
 * // SFX 재생
 * soundManager.playSFX('sword_clash', { x: 10, y: 0, z: 5 });
 * 
 * // React에서 UI 사운드
 * const { playClick, playHover } = useUISound();
 * ```
 */

// ========================================
// SoundManager (메인)
// ========================================

export {
  SoundManager,
  initSoundManager,
  getSoundManager,
  disposeSoundManager,
  type SoundManagerConfig,
  type SoundManagerState,
  type SoundMetrics,
  type BattlePhase,
} from './SoundManager';

// ========================================
// MusicPlayer (배경 음악)
// ========================================

export {
  MusicPlayer,
  DEFAULT_MUSIC_TRACKS,
  type MusicTrack,
  type MusicIntensity,
  type MusicPlayerState,
} from './MusicPlayer';

// ========================================
// SoundEffects (효과음)
// ========================================

export {
  SoundEffects,
  SFX_DEFAULTS,
  type SFXType,
  type SFXConfig,
} from './SoundEffects';

// ========================================
// SpatialAudio (3D 공간 오디오)
// ========================================

export {
  SpatialAudio,
  DEFAULT_SPATIAL_CONFIG,
  type Vector3,
  type SpatialConfig,
} from './SpatialAudio';

// ========================================
// SoundMixer (볼륨 믹서)
// ========================================

export {
  SoundMixer,
  type SoundCategory,
  type MixerSettings,
  type DuckingConfig,
} from './SoundMixer';

// ========================================
// BattleEventSoundBridge (전투 이벤트 연동)
// ========================================

export {
  BattleEventSoundBridge,
  connectBattleEngineToSound,
  type SoundTrigger,
  type UnitCategory,
  type WeaponType,
} from './BattleEventSoundBridge';

// ========================================
// UISoundHook (React Hook)
// ========================================

export {
  useUISound,
  useButtonSoundProps,
  useInteractiveSoundProps,
  playGlobalUISound,
  playGlobalClick,
  playGlobalNotification,
  playGlobalSuccess,
  playGlobalError,
  type UISoundType,
  type UISoundOptions,
  type UISoundHook,
} from './UISoundHook';

// ========================================
// 기본 export
// ========================================

export { SoundManager as default } from './SoundManager';





