/**
 * SoundEffects - 전투 효과음 시스템
 * 
 * 기능:
 * - 절차적 사운드 생성 (Web Audio API)
 * - 무기/유닛/UI 효과음
 * - 피치 변동 및 다양성
 * - 쿨다운 관리
 * - 사운드 풀링
 */

// ========================================
// 타입 정의
// ========================================

/** SFX 타입 */
export type SFXType =
  // 무기 소리
  | 'sword_clash'
  | 'sword_swing'
  | 'spear_thrust'
  | 'arrow_shot'
  | 'arrow_hit'
  | 'crossbow_fire'
  | 'axe_hit'
  
  // 방어 소리
  | 'shield_block'
  | 'armor_hit'
  | 'hit_flesh'
  
  // 유닛 소리
  | 'footstep'
  | 'march'
  | 'charge_horn'
  | 'retreat_horn'
  | 'battle_cry'
  | 'death_cry'
  
  // 말 소리
  | 'horse_gallop'
  | 'horse_neigh'
  | 'horse_whinny'
  
  // 환경 소리
  | 'wind'
  | 'rain'
  | 'fire_crackle'
  
  // 특수 능력
  | 'special_ability'
  | 'heal'
  | 'buff'
  | 'debuff'
  
  // UI 소리
  | 'ui_click'
  | 'ui_hover'
  | 'ui_notification'
  | 'ui_success'
  | 'ui_error';

/** SFX 설정 */
export interface SFXConfig {
  volume: number;
  pitch: number;
  pitchVariance: number;
  loop: boolean;
  cooldown: number;
  priority: number;
  maxInstances: number;
}

/** 활성 사운드 인스턴스 */
interface SoundInstance {
  id: string;
  type: SFXType;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  startTime: number;
  duration: number;
  priority: number;
}

// ========================================
// 기본 설정
// ========================================

export const SFX_DEFAULTS: Record<SFXType, SFXConfig> = {
  // 무기 소리
  sword_clash: { volume: 0.7, pitch: 1, pitchVariance: 0.15, loop: false, cooldown: 50, priority: 5, maxInstances: 8 },
  sword_swing: { volume: 0.5, pitch: 1.1, pitchVariance: 0.1, loop: false, cooldown: 30, priority: 4, maxInstances: 10 },
  spear_thrust: { volume: 0.6, pitch: 0.9, pitchVariance: 0.1, loop: false, cooldown: 50, priority: 5, maxInstances: 6 },
  arrow_shot: { volume: 0.5, pitch: 1.1, pitchVariance: 0.1, loop: false, cooldown: 20, priority: 4, maxInstances: 15 },
  arrow_hit: { volume: 0.4, pitch: 1, pitchVariance: 0.15, loop: false, cooldown: 30, priority: 3, maxInstances: 12 },
  crossbow_fire: { volume: 0.6, pitch: 0.8, pitchVariance: 0.1, loop: false, cooldown: 100, priority: 5, maxInstances: 6 },
  axe_hit: { volume: 0.7, pitch: 0.85, pitchVariance: 0.1, loop: false, cooldown: 80, priority: 5, maxInstances: 5 },
  
  // 방어 소리
  shield_block: { volume: 0.65, pitch: 0.9, pitchVariance: 0.1, loop: false, cooldown: 60, priority: 5, maxInstances: 6 },
  armor_hit: { volume: 0.6, pitch: 0.8, pitchVariance: 0.1, loop: false, cooldown: 40, priority: 5, maxInstances: 8 },
  hit_flesh: { volume: 0.55, pitch: 1, pitchVariance: 0.15, loop: false, cooldown: 30, priority: 4, maxInstances: 10 },
  
  // 유닛 소리
  footstep: { volume: 0.2, pitch: 1, pitchVariance: 0.2, loop: false, cooldown: 100, priority: 1, maxInstances: 4 },
  march: { volume: 0.4, pitch: 1, pitchVariance: 0.1, loop: true, cooldown: 0, priority: 2, maxInstances: 2 },
  charge_horn: { volume: 0.9, pitch: 1, pitchVariance: 0, loop: false, cooldown: 2000, priority: 10, maxInstances: 1 },
  retreat_horn: { volume: 0.85, pitch: 0.8, pitchVariance: 0, loop: false, cooldown: 2000, priority: 10, maxInstances: 1 },
  battle_cry: { volume: 0.8, pitch: 1, pitchVariance: 0.2, loop: false, cooldown: 500, priority: 7, maxInstances: 3 },
  death_cry: { volume: 0.6, pitch: 1, pitchVariance: 0.3, loop: false, cooldown: 80, priority: 3, maxInstances: 8 },
  
  // 말 소리
  horse_gallop: { volume: 0.5, pitch: 1, pitchVariance: 0.05, loop: true, cooldown: 0, priority: 2, maxInstances: 4 },
  horse_neigh: { volume: 0.6, pitch: 1, pitchVariance: 0.15, loop: false, cooldown: 1000, priority: 4, maxInstances: 2 },
  horse_whinny: { volume: 0.5, pitch: 1.1, pitchVariance: 0.1, loop: false, cooldown: 800, priority: 3, maxInstances: 2 },
  
  // 환경 소리
  wind: { volume: 0.3, pitch: 1, pitchVariance: 0.1, loop: true, cooldown: 0, priority: 1, maxInstances: 1 },
  rain: { volume: 0.4, pitch: 1, pitchVariance: 0, loop: true, cooldown: 0, priority: 1, maxInstances: 1 },
  fire_crackle: { volume: 0.35, pitch: 1, pitchVariance: 0.15, loop: true, cooldown: 0, priority: 2, maxInstances: 3 },
  
  // 특수 능력
  special_ability: { volume: 0.8, pitch: 1, pitchVariance: 0.1, loop: false, cooldown: 200, priority: 8, maxInstances: 2 },
  heal: { volume: 0.6, pitch: 1.2, pitchVariance: 0.1, loop: false, cooldown: 300, priority: 6, maxInstances: 2 },
  buff: { volume: 0.5, pitch: 1.1, pitchVariance: 0.1, loop: false, cooldown: 200, priority: 5, maxInstances: 3 },
  debuff: { volume: 0.5, pitch: 0.9, pitchVariance: 0.1, loop: false, cooldown: 200, priority: 5, maxInstances: 3 },
  
  // UI 소리
  ui_click: { volume: 0.4, pitch: 1, pitchVariance: 0.05, loop: false, cooldown: 50, priority: 6, maxInstances: 3 },
  ui_hover: { volume: 0.2, pitch: 1.2, pitchVariance: 0.05, loop: false, cooldown: 30, priority: 4, maxInstances: 2 },
  ui_notification: { volume: 0.6, pitch: 1, pitchVariance: 0, loop: false, cooldown: 500, priority: 8, maxInstances: 1 },
  ui_success: { volume: 0.5, pitch: 1.2, pitchVariance: 0, loop: false, cooldown: 200, priority: 7, maxInstances: 1 },
  ui_error: { volume: 0.5, pitch: 0.8, pitchVariance: 0, loop: false, cooldown: 200, priority: 7, maxInstances: 1 },
};

// ========================================
// SoundEffects 클래스
// ========================================

export class SoundEffects {
  private audioContext: AudioContext;
  private outputNode: GainNode;
  
  // 버퍼 캐시
  private buffers: Map<string, AudioBuffer> = new Map();
  
  // 활성 인스턴스
  private activeInstances: SoundInstance[] = [];
  private instanceIdCounter = 0;
  
  // 쿨다운 추적
  private cooldowns: Map<string, number> = new Map();
  
  // 설정
  private readonly MAX_TOTAL_INSTANCES = 64;

  constructor(audioContext: AudioContext, outputNode: GainNode) {
    this.audioContext = audioContext;
    this.outputNode = outputNode;
  }

  // ========================================
  // 초기화 및 캐싱
  // ========================================

  /**
   * 외부 버퍼 캐싱
   */
  cacheBuffer(id: string, buffer: AudioBuffer): void {
    this.buffers.set(id, buffer);
  }

  /**
   * 절차적 사운드 생성
   */
  async generateProceduralSounds(): Promise<void> {
    // 무기 소리
    this.buffers.set('sword_clash', this.generateSwordClash());
    this.buffers.set('sword_swing', this.generateSwordSwing());
    this.buffers.set('spear_thrust', this.generateSpearThrust());
    this.buffers.set('arrow_shot', this.generateArrowShot());
    this.buffers.set('arrow_hit', this.generateArrowHit());
    this.buffers.set('crossbow_fire', this.generateCrossbowFire());
    this.buffers.set('axe_hit', this.generateAxeHit());
    
    // 방어 소리
    this.buffers.set('shield_block', this.generateShieldBlock());
    this.buffers.set('armor_hit', this.generateArmorHit());
    this.buffers.set('hit_flesh', this.generateHitFlesh());
    
    // 유닛 소리
    this.buffers.set('footstep', this.generateFootstep());
    this.buffers.set('march', this.generateMarch());
    this.buffers.set('charge_horn', this.generateChargeHorn());
    this.buffers.set('retreat_horn', this.generateRetreatHorn());
    this.buffers.set('battle_cry', this.generateBattleCry());
    this.buffers.set('death_cry', this.generateDeathCry());
    
    // 말 소리
    this.buffers.set('horse_gallop', this.generateHorseGallop());
    this.buffers.set('horse_neigh', this.generateHorseNeigh());
    this.buffers.set('horse_whinny', this.generateHorseWhinny());
    
    // 환경 소리
    this.buffers.set('wind', this.generateWind());
    this.buffers.set('rain', this.generateRain());
    this.buffers.set('fire_crackle', this.generateFireCrackle());
    
    // 특수 능력
    this.buffers.set('special_ability', this.generateSpecialAbility());
    this.buffers.set('heal', this.generateHeal());
    this.buffers.set('buff', this.generateBuff());
    this.buffers.set('debuff', this.generateDebuff());
    
    // UI 소리
    this.buffers.set('ui_click', this.generateUIClick());
    this.buffers.set('ui_hover', this.generateUIHover());
    this.buffers.set('ui_notification', this.generateUINotification());
    this.buffers.set('ui_success', this.generateUISuccess());
    this.buffers.set('ui_error', this.generateUIError());

    console.log(`🔊 Generated ${this.buffers.size} procedural sounds`);
  }

  // ========================================
  // 절차적 사운드 생성 - 무기
  // ========================================

  private generateSwordClash(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noise = Math.random() * 2 - 1;
      const envelope = Math.exp(-t * 15);
      const metalRing = Math.sin(2 * Math.PI * 2500 * t) * 0.3;
      const metalRing2 = Math.sin(2 * Math.PI * 3200 * t) * 0.2;
      const impact = t < 0.02 ? Math.sin(2 * Math.PI * 800 * t) * (0.02 - t) * 50 : 0;
      data[i] = (noise * 0.5 + metalRing + metalRing2 + impact) * envelope * 0.8;
    }

    return buffer;
  }

  private generateSwordSwing(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const whoosh = Math.random() * 2 - 1;
      const envelope = Math.sin(Math.PI * t / duration) * Math.exp(-t * 3);
      data[i] = whoosh * envelope * 0.4;
    }

    return buffer;
  }

  private generateSpearThrust(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.25;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const whoosh = (Math.random() * 2 - 1) * Math.exp(-t * 8);
      const thrust = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 20) * 0.5;
      data[i] = (whoosh * 0.3 + thrust) * 0.7;
    }

    return buffer;
  }

  private generateArrowShot(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const stringSnap = t < 0.05 ? Math.sin(2 * Math.PI * 150 * t) * (0.05 - t) * 20 : 0;
      const whoosh = Math.random() * 2 - 1;
      const whooshEnv = Math.sin(Math.PI * t / duration) * Math.exp(-t * 5);
      data[i] = (stringSnap + whoosh * whooshEnv * 0.3) * 0.7;
    }

    return buffer;
  }

  private generateArrowHit(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const thud = Math.sin(2 * Math.PI * 120 * t) * Math.exp(-t * 25);
      const crack = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.3;
      data[i] = (thud + crack) * 0.6;
    }

    return buffer;
  }

  private generateCrossbowFire(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.25;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const mechanism = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 30) * 0.5;
      const release = t < 0.03 ? (Math.random() * 2 - 1) * (0.03 - t) * 30 : 0;
      const whoosh = (Math.random() * 2 - 1) * Math.exp(-t * 10) * 0.2;
      data[i] = (mechanism + release + whoosh) * 0.7;
    }

    return buffer;
  }

  private generateAxeHit(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const impact = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 12);
      const wood = Math.sin(2 * Math.PI * 250 * t) * Math.exp(-t * 8) * 0.4;
      const crack = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.3;
      data[i] = (impact + wood + crack) * 0.7;
    }

    return buffer;
  }

  // ========================================
  // 절차적 사운드 생성 - 방어
  // ========================================

  private generateShieldBlock(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.25;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const thud = Math.sin(2 * Math.PI * 100 * t) * Math.exp(-t * 20);
      const wood = Math.sin(2 * Math.PI * 300 * t) * Math.exp(-t * 10) * 0.5;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.3;
      data[i] = (thud + wood + noise) * 0.7;
    }

    return buffer;
  }

  private generateArmorHit(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.25;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const metal = Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 12);
      const ring = Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 8) * 0.4;
      const impact = t < 0.01 ? (0.01 - t) * 100 : 0;
      data[i] = (metal + ring + impact) * 0.5;
    }

    return buffer;
  }

  private generateHitFlesh(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const impact = Math.sin(2 * Math.PI * 70 * t) * Math.exp(-t * 15);
      const squelch = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.4;
      data[i] = (impact + squelch) * 0.6;
    }

    return buffer;
  }

  // ========================================
  // 절차적 사운드 생성 - 유닛
  // ========================================

  private generateFootstep(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const thud = Math.sin(2 * Math.PI * 50 * t) * Math.exp(-t * 20);
      const dirt = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.3;
      data[i] = (thud + dirt) * 0.5;
    }

    return buffer;
  }

  private generateMarch(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 2.0;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const stepTimes = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const stepTime of stepTimes) {
        const dt = Math.abs(t - stepTime);
        if (dt < 0.1) {
          const thud = Math.sin(2 * Math.PI * 60 * dt) * Math.exp(-dt * 25);
          const dirt = (Math.random() * 2 - 1) * Math.exp(-dt * 40) * 0.2;
          sample += (thud + dirt) * 0.3;
        }
      }

      data[i] = sample;
    }

    return buffer;
  }

  private generateChargeHorn(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 2.0;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const baseFreq = 220;
      const fundamental = Math.sin(2 * Math.PI * baseFreq * t);
      const harmonic2 = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.5;
      const harmonic3 = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.3;
      const harmonic4 = Math.sin(2 * Math.PI * baseFreq * 4 * t) * 0.2;
      const attack = Math.min(1, t / 0.3);
      const release = t > 1.7 ? 1 - (t - 1.7) / 0.3 : 1;
      const envelope = attack * release;
      const vibrato = 1 + Math.sin(2 * Math.PI * 5 * t) * 0.02;
      data[i] = (fundamental + harmonic2 + harmonic3 + harmonic4) * envelope * vibrato * 0.5;
    }

    return buffer;
  }

  private generateRetreatHorn(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.5;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const baseFreq = 180;
      const fundamental = Math.sin(2 * Math.PI * baseFreq * t);
      const harmonic2 = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.4;
      const attack = Math.min(1, t / 0.2);
      const release = t > 1.2 ? 1 - (t - 1.2) / 0.3 : 1;
      const envelope = attack * release;
      data[i] = (fundamental + harmonic2) * envelope * 0.5;
    }

    return buffer;
  }

  private generateBattleCry(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.5;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const voice1 = Math.sin(2 * Math.PI * 180 * t);
      const voice2 = Math.sin(2 * Math.PI * 200 * t) * 0.7;
      const voice3 = Math.sin(2 * Math.PI * 160 * t) * 0.5;
      const breath = (Math.random() * 2 - 1) * 0.15;
      const attack = Math.min(1, t / 0.2);
      const sustain = t > 1.2 ? 1 - (t - 1.2) / 0.3 : 1;
      const envelope = attack * sustain;
      data[i] = (voice1 + voice2 + voice3 + breath) * envelope * 0.4;
    }

    return buffer;
  }

  private generateDeathCry(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = 400 - t * 300;
      const cry = Math.sin(2 * Math.PI * freq * t);
      const breath = (Math.random() * 2 - 1) * 0.2;
      const envelope = Math.exp(-t * 3) * Math.min(1, t * 20);
      data[i] = (cry + breath) * envelope * 0.6;
    }

    return buffer;
  }

  // ========================================
  // 절차적 사운드 생성 - 말
  // ========================================

  private generateHorseGallop(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.0;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const hoofTimes = [0, 0.15, 0.5, 0.65];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const hoofTime of hoofTimes) {
        const dt = Math.abs(t - hoofTime);
        if (dt < 0.1) {
          const impact = Math.sin(2 * Math.PI * 80 * dt) * Math.exp(-dt * 30);
          const dirt = (Math.random() * 2 - 1) * Math.exp(-dt * 50) * 0.3;
          sample += (impact + dirt) * 0.5;
        }
      }

      data[i] = sample;
    }

    return buffer;
  }

  private generateHorseNeigh(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.2;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = 400 + Math.sin(2 * Math.PI * 3 * t) * 100;
      const neigh = Math.sin(2 * Math.PI * freq * t);
      const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
      const envelope = Math.exp(-t * 2) * Math.min(1, t * 10);
      data[i] = (neigh + harmonic) * envelope * 0.5;
    }

    return buffer;
  }

  private generateHorseWhinny(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = 500 + Math.sin(2 * Math.PI * 8 * t) * 150;
      const whinny = Math.sin(2 * Math.PI * freq * t);
      const envelope = Math.exp(-t * 3) * Math.min(1, t * 15);
      data[i] = whinny * envelope * 0.4;
    }

    return buffer;
  }

  // ========================================
  // 절차적 사운드 생성 - 환경
  // ========================================

  private generateWind(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 4.0;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noise = Math.random() * 2 - 1;
      const modulation = Math.sin(2 * Math.PI * 0.3 * t) * 0.3 + 0.7;
      data[i] = noise * modulation * 0.15;
    }

    return buffer;
  }

  private generateRain(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 3.0;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const noise = Math.random() * 2 - 1;
      const drop = Math.random() > 0.995 ? Math.exp(-Math.random() * 10) * 0.3 : 0;
      data[i] = noise * 0.1 + drop;
    }

    return buffer;
  }

  private generateFireCrackle(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 2.0;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noise = Math.random() * 2 - 1;
      const crackle = Math.random() > 0.99 ? (Math.random() * 2 - 1) * Math.exp(-Math.random() * 20) * 0.5 : 0;
      const base = Math.sin(2 * Math.PI * 50 * t) * 0.05;
      data[i] = noise * 0.05 + crackle + base;
    }

    return buffer;
  }

  // ========================================
  // 절차적 사운드 생성 - 특수 능력
  // ========================================

  private generateSpecialAbility(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const sweep = Math.sin(2 * Math.PI * (200 + t * 500) * t);
      const harmonic = Math.sin(2 * Math.PI * (400 + t * 1000) * t) * 0.3;
      const envelope = Math.sin(Math.PI * t / duration);
      data[i] = (sweep + harmonic) * envelope * 0.5;
    }

    return buffer;
  }

  private generateHeal(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const ascending = Math.sin(2 * Math.PI * (300 + t * 200) * t);
      const shimmer = Math.sin(2 * Math.PI * 800 * t) * Math.sin(2 * Math.PI * 10 * t) * 0.2;
      const envelope = Math.sin(Math.PI * t / duration);
      data[i] = (ascending + shimmer) * envelope * 0.4;
    }

    return buffer;
  }

  private generateBuff(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const tone = Math.sin(2 * Math.PI * 440 * t);
      const harmonic = Math.sin(2 * Math.PI * 880 * t) * 0.3;
      const envelope = Math.exp(-t * 4) * Math.min(1, t * 20);
      data[i] = (tone + harmonic) * envelope * 0.4;
    }

    return buffer;
  }

  private generateDebuff(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const tone = Math.sin(2 * Math.PI * (300 - t * 100) * t);
      const dissonance = Math.sin(2 * Math.PI * 315 * t) * 0.3;
      const envelope = Math.exp(-t * 3);
      data[i] = (tone + dissonance) * envelope * 0.4;
    }

    return buffer;
  }

  // ========================================
  // 절차적 사운드 생성 - UI
  // ========================================

  private generateUIClick(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.08;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const click = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 50);
      data[i] = click * 0.5;
    }

    return buffer;
  }

  private generateUIHover(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.05;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const hover = Math.sin(2 * Math.PI * 1500 * t) * Math.exp(-t * 80);
      data[i] = hover * 0.3;
    }

    return buffer;
  }

  private generateUINotification(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.4;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const note1 = t < 0.15 ? Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 10) : 0;
      const note2 = t >= 0.15 ? Math.sin(2 * Math.PI * 1100 * (t - 0.15)) * Math.exp(-(t - 0.15) * 10) : 0;
      data[i] = (note1 + note2) * 0.4;
    }

    return buffer;
  }

  private generateUISuccess(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const note1 = t < 0.1 ? Math.sin(2 * Math.PI * 523 * t) : 0;
      const note2 = t >= 0.1 ? Math.sin(2 * Math.PI * 659 * (t - 0.1)) : 0;
      const note3 = t >= 0.2 ? Math.sin(2 * Math.PI * 784 * (t - 0.2)) : 0;
      const envelope = Math.exp(-t * 8);
      data[i] = (note1 + note2 + note3) * envelope * 0.3;
    }

    return buffer;
  }

  private generateUIError(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const buzz = Math.sin(2 * Math.PI * 150 * t) + Math.sin(2 * Math.PI * 155 * t);
      const envelope = Math.exp(-t * 5);
      data[i] = buzz * envelope * 0.2;
    }

    return buffer;
  }

  // ========================================
  // 재생
  // ========================================

  /**
   * SFX 재생
   */
  play(type: SFXType, options?: { volume?: number; pitch?: number }): string | null {
    const buffer = this.buffers.get(type);
    if (!buffer) {
      console.warn(`SFX not found: ${type}`);
      return null;
    }

    const config = SFX_DEFAULTS[type];

    // 쿨다운 체크
    const now = Date.now();
    const lastPlayed = this.cooldowns.get(type) || 0;
    if (now - lastPlayed < config.cooldown) {
      return null;
    }
    this.cooldowns.set(type, now);

    // 동시 재생 제한 체크
    const typeInstances = this.activeInstances.filter(i => i.type === type);
    if (typeInstances.length >= config.maxInstances) {
      this.removeOldestInstance(type);
    }

    // 전체 인스턴스 제한
    if (this.activeInstances.length >= this.MAX_TOTAL_INSTANCES) {
      this.removeLowestPriorityInstance();
    }

    // 피치 계산
    const pitchVariance = config.pitchVariance;
    const pitch = (options?.pitch ?? config.pitch) + (Math.random() - 0.5) * pitchVariance * 2;

    // 소스 생성
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = pitch;
    source.loop = config.loop;

    // 게인 노드
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = options?.volume ?? config.volume;

    // 연결
    source.connect(gainNode);
    gainNode.connect(this.outputNode);

    // 인스턴스 등록
    const id = `sfx_${this.instanceIdCounter++}`;
    const instance: SoundInstance = {
      id,
      type,
      source,
      gainNode,
      startTime: this.audioContext.currentTime,
      duration: buffer.duration / pitch,
      priority: config.priority,
    };

    this.activeInstances.push(instance);

    // 재생 완료 콜백
    source.onended = () => {
      this.removeInstance(id);
    };

    // 재생 시작
    source.start();

    return id;
  }

  /**
   * SFX 정지
   */
  stop(id: string): void {
    const instance = this.activeInstances.find(i => i.id === id);
    if (instance) {
      try {
        instance.source.stop();
      } catch {
        // 이미 정지된 경우 무시
      }
      this.removeInstance(id);
    }
  }

  /**
   * 타입별 모든 SFX 정지
   */
  stopAllOfType(type: SFXType): void {
    const instances = this.activeInstances.filter(i => i.type === type);
    for (const instance of instances) {
      try {
        instance.source.stop();
      } catch {
        // 무시
      }
    }
    this.activeInstances = this.activeInstances.filter(i => i.type !== type);
  }

  /**
   * 모든 SFX 정지
   */
  stopAll(): void {
    for (const instance of this.activeInstances) {
      try {
        instance.source.stop();
      } catch {
        // 무시
      }
    }
    this.activeInstances = [];
  }

  // ========================================
  // 인스턴스 관리
  // ========================================

  private removeInstance(id: string): void {
    const index = this.activeInstances.findIndex(i => i.id === id);
    if (index >= 0) {
      this.activeInstances.splice(index, 1);
    }
  }

  private removeOldestInstance(type: SFXType): void {
    const instances = this.activeInstances.filter(i => i.type === type);
    if (instances.length > 0) {
      const oldest = instances.reduce((a, b) => a.startTime < b.startTime ? a : b);
      try {
        oldest.source.stop();
      } catch {
        // 무시
      }
      this.removeInstance(oldest.id);
    }
  }

  private removeLowestPriorityInstance(): void {
    let lowest: SoundInstance | null = null;
    
    for (const instance of this.activeInstances) {
      if (!lowest || instance.priority < lowest.priority) {
        lowest = instance;
      }
    }

    if (lowest) {
      try {
        lowest.source.stop();
      } catch {
        // 무시
      }
      this.removeInstance(lowest.id);
    }
  }

  // ========================================
  // 상태 조회
  // ========================================

  /**
   * 활성 사운드 수 반환
   */
  getActiveSoundCount(): number {
    return this.activeInstances.length;
  }

  /**
   * 버퍼 존재 여부 확인
   */
  hasBuffer(id: string): boolean {
    return this.buffers.has(id);
  }

  // ========================================
  // 정리
  // ========================================

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.stopAll();
    this.buffers.clear();
    this.cooldowns.clear();
  }
}

export default SoundEffects;





