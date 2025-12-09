/**
 * Gin7 Audio System
 * 
 * 은하영웅전설 스타일 사운드 시스템
 * 
 * @module lib/gin7/audio
 * 
 * @example
 * ```typescript
 * import { 
 *   initGin7Audio, 
 *   getGin7Audio,
 *   useGin7UISound 
 * } from '@/lib/gin7/audio';
 * 
 * // 초기화 (사용자 상호작용 후)
 * const audio = await initGin7Audio({
 *   masterVolume: 0.8,
 *   musicVolume: 0.6,
 *   sfxVolume: 0.9,
 * });
 * 
 * // 음악 재생
 * audio.playMusic('strategic');
 * 
 * // 효과음 재생
 * audio.playSFX('beam_fire', { x: 100, y: 0, z: 50 });
 * 
 * // 페이즈 전환 (자동 음악 변경)
 * audio.setPhase('tactical_battle');
 * 
 * // React에서 UI 사운드
 * const { playClick, playHover } = useGin7UISound();
 * ```
 */

// ========================================
// AudioManager (메인)
// ========================================

export {
  Gin7AudioManager,
  initGin7Audio,
  getGin7Audio,
  disposeGin7Audio,
  type Gin7AudioConfig,
  type Gin7AudioState,
  type Gin7AudioMetrics,
  type Gin7BattlePhase,
  type AudioCategory,
  type Position3D,
} from './Gin7AudioManager';

// ========================================
// MusicPlayer (배경 음악)
// ========================================

export {
  Gin7MusicPlayer,
  GIN7_MUSIC_TRACKS,
  type Gin7MusicTrack,
  type MusicCategory,
  type Gin7MusicPlayerState,
} from './Gin7MusicPlayer';

// ========================================
// SoundEffects (효과음)
// ========================================

export {
  Gin7SoundEffects,
  GIN7_SFX_DEFAULTS,
  type Gin7SFXType,
  type Gin7SFXConfig,
} from './Gin7SoundEffects';

// ========================================
// 기본 export
// ========================================

export { Gin7AudioManager as default } from './Gin7AudioManager';













