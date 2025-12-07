/**
 * Gin7 SoundEffects - 우주 전투 효과음 시스템
 * 
 * 기능:
 * - 빔/미사일/폭발/쉴드/와프 사운드
 * - 절차적 사운드 생성
 * - 사운드 풀 관리
 * - 동시 재생 제한
 */

// ========================================
// 타입 정의
// ========================================

/** 효과음 타입 */
export type Gin7SFXType = 
  // 무기 발사
  | 'beam_fire'        // 빔 발사
  | 'beam_charge'      // 빔 충전
  | 'missile_launch'   // 미사일 발사
  | 'missile_lock'     // 미사일 락온
  | 'railgun_fire'     // 레일건 발사
  | 'fighter_launch'   // 전투기 발진
  // 충격/폭발
  | 'explosion_small'  // 소형 폭발
  | 'explosion_medium' // 중형 폭발
  | 'explosion_large'  // 대형 폭발 (함선 파괴)
  | 'explosion_capital' // 대형함 폭발
  // 방어
  | 'shield_hit'       // 쉴드 피격
  | 'shield_break'     // 쉴드 붕괴
  | 'armor_hit'        // 장갑 피격
  | 'hull_breach'      // 선체 관통
  // 이동
  | 'warp_in'          // 와프 진입
  | 'warp_out'         // 와프 이탈
  | 'engine_boost'     // 엔진 부스트
  | 'thruster'         // 스러스터
  // UI
  | 'ui_click'         // UI 클릭
  | 'ui_hover'         // UI 호버
  | 'ui_notification'  // 알림
  | 'ui_alert'         // 경고
  | 'ui_confirm'       // 확인
  | 'ui_cancel'        // 취소
  // 전투 이벤트
  | 'battle_start'     // 전투 시작
  | 'battle_victory'   // 전투 승리
  | 'battle_defeat'    // 전투 패배
  | 'unit_select'      // 유닛 선택
  | 'unit_order'       // 명령 하달
  | 'comm_static';     // 통신 잡음

/** 효과음 설정 */
export interface Gin7SFXConfig {
  volume: number;
  pitch: number;
  pitchVariance: number;
  maxInstances: number;
  cooldown: number;
}

// ========================================
// 기본 SFX 설정
// ========================================

export const GIN7_SFX_DEFAULTS: Record<Gin7SFXType, Gin7SFXConfig> = {
  // 무기 발사
  beam_fire: { volume: 0.7, pitch: 1, pitchVariance: 0.05, maxInstances: 5, cooldown: 100 },
  beam_charge: { volume: 0.5, pitch: 1, pitchVariance: 0, maxInstances: 2, cooldown: 500 },
  missile_launch: { volume: 0.6, pitch: 1, pitchVariance: 0.1, maxInstances: 8, cooldown: 50 },
  missile_lock: { volume: 0.4, pitch: 1, pitchVariance: 0, maxInstances: 1, cooldown: 1000 },
  railgun_fire: { volume: 0.8, pitch: 1, pitchVariance: 0.05, maxInstances: 3, cooldown: 200 },
  fighter_launch: { volume: 0.5, pitch: 1, pitchVariance: 0.1, maxInstances: 4, cooldown: 100 },
  // 충격/폭발
  explosion_small: { volume: 0.5, pitch: 1, pitchVariance: 0.2, maxInstances: 10, cooldown: 30 },
  explosion_medium: { volume: 0.7, pitch: 1, pitchVariance: 0.15, maxInstances: 6, cooldown: 50 },
  explosion_large: { volume: 0.9, pitch: 1, pitchVariance: 0.1, maxInstances: 3, cooldown: 100 },
  explosion_capital: { volume: 1.0, pitch: 0.8, pitchVariance: 0.05, maxInstances: 1, cooldown: 500 },
  // 방어
  shield_hit: { volume: 0.4, pitch: 1.2, pitchVariance: 0.1, maxInstances: 8, cooldown: 30 },
  shield_break: { volume: 0.8, pitch: 0.8, pitchVariance: 0, maxInstances: 2, cooldown: 200 },
  armor_hit: { volume: 0.5, pitch: 1, pitchVariance: 0.15, maxInstances: 6, cooldown: 40 },
  hull_breach: { volume: 0.7, pitch: 0.9, pitchVariance: 0.1, maxInstances: 3, cooldown: 100 },
  // 이동
  warp_in: { volume: 0.8, pitch: 1, pitchVariance: 0, maxInstances: 2, cooldown: 500 },
  warp_out: { volume: 0.8, pitch: 1, pitchVariance: 0, maxInstances: 2, cooldown: 500 },
  engine_boost: { volume: 0.5, pitch: 1, pitchVariance: 0.1, maxInstances: 4, cooldown: 200 },
  thruster: { volume: 0.3, pitch: 1, pitchVariance: 0.2, maxInstances: 8, cooldown: 50 },
  // UI
  ui_click: { volume: 0.3, pitch: 1, pitchVariance: 0, maxInstances: 2, cooldown: 50 },
  ui_hover: { volume: 0.15, pitch: 1.2, pitchVariance: 0, maxInstances: 1, cooldown: 30 },
  ui_notification: { volume: 0.5, pitch: 1, pitchVariance: 0, maxInstances: 1, cooldown: 500 },
  ui_alert: { volume: 0.7, pitch: 1, pitchVariance: 0, maxInstances: 1, cooldown: 1000 },
  ui_confirm: { volume: 0.4, pitch: 1.1, pitchVariance: 0, maxInstances: 1, cooldown: 100 },
  ui_cancel: { volume: 0.3, pitch: 0.9, pitchVariance: 0, maxInstances: 1, cooldown: 100 },
  // 전투 이벤트
  battle_start: { volume: 0.8, pitch: 1, pitchVariance: 0, maxInstances: 1, cooldown: 2000 },
  battle_victory: { volume: 0.9, pitch: 1, pitchVariance: 0, maxInstances: 1, cooldown: 2000 },
  battle_defeat: { volume: 0.8, pitch: 1, pitchVariance: 0, maxInstances: 1, cooldown: 2000 },
  unit_select: { volume: 0.3, pitch: 1, pitchVariance: 0.05, maxInstances: 2, cooldown: 50 },
  unit_order: { volume: 0.4, pitch: 1, pitchVariance: 0.05, maxInstances: 2, cooldown: 100 },
  comm_static: { volume: 0.2, pitch: 1, pitchVariance: 0.1, maxInstances: 1, cooldown: 100 },
};

/** 활성 사운드 인스턴스 */
interface ActiveSound {
  id: string;
  type: Gin7SFXType;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  startTime: number;
}

// ========================================
// Gin7SoundEffects 클래스
// ========================================

export class Gin7SoundEffects {
  private audioContext: AudioContext;
  private outputNode: GainNode;
  
  // 버퍼 캐시
  private buffers: Map<string, AudioBuffer> = new Map();
  
  // 활성 사운드
  private activeSounds: Map<string, ActiveSound> = new Map();
  private soundIdCounter = 0;
  
  // 쿨다운 추적
  private lastPlayTime: Map<Gin7SFXType, number> = new Map();
  
  // 타입별 활성 인스턴스 수
  private activeCountByType: Map<Gin7SFXType, number> = new Map();

  constructor(audioContext: AudioContext, outputNode: GainNode) {
    this.audioContext = audioContext;
    this.outputNode = outputNode;
  }

  // ========================================
  // 초기화
  // ========================================

  /**
   * 모든 절차적 사운드 생성
   */
  async generateProceduralSounds(): Promise<void> {
    console.log('🔊 [Gin7SFX] Generating procedural sounds...');
    
    // 무기 사운드
    this.buffers.set('beam_fire', this.generateBeamFire());
    this.buffers.set('beam_charge', this.generateBeamCharge());
    this.buffers.set('missile_launch', this.generateMissileLaunch());
    this.buffers.set('missile_lock', this.generateMissileLock());
    this.buffers.set('railgun_fire', this.generateRailgunFire());
    this.buffers.set('fighter_launch', this.generateFighterLaunch());
    
    // 폭발 사운드
    this.buffers.set('explosion_small', this.generateExplosion('small'));
    this.buffers.set('explosion_medium', this.generateExplosion('medium'));
    this.buffers.set('explosion_large', this.generateExplosion('large'));
    this.buffers.set('explosion_capital', this.generateExplosion('capital'));
    
    // 방어 사운드
    this.buffers.set('shield_hit', this.generateShieldHit());
    this.buffers.set('shield_break', this.generateShieldBreak());
    this.buffers.set('armor_hit', this.generateArmorHit());
    this.buffers.set('hull_breach', this.generateHullBreach());
    
    // 이동 사운드
    this.buffers.set('warp_in', this.generateWarp('in'));
    this.buffers.set('warp_out', this.generateWarp('out'));
    this.buffers.set('engine_boost', this.generateEngineBoost());
    this.buffers.set('thruster', this.generateThruster());
    
    // UI 사운드
    this.buffers.set('ui_click', this.generateUIClick());
    this.buffers.set('ui_hover', this.generateUIHover());
    this.buffers.set('ui_notification', this.generateUINotification());
    this.buffers.set('ui_alert', this.generateUIAlert());
    this.buffers.set('ui_confirm', this.generateUIConfirm());
    this.buffers.set('ui_cancel', this.generateUICancel());
    
    // 전투 이벤트
    this.buffers.set('battle_start', this.generateBattleStart());
    this.buffers.set('battle_victory', this.generateBattleVictory());
    this.buffers.set('battle_defeat', this.generateBattleDefeat());
    this.buffers.set('unit_select', this.generateUnitSelect());
    this.buffers.set('unit_order', this.generateUnitOrder());
    this.buffers.set('comm_static', this.generateCommStatic());
    
    console.log('🔊 [Gin7SFX] All sounds generated');
  }

  /**
   * 외부 버퍼 캐싱
   */
  cacheBuffer(id: string, buffer: AudioBuffer): void {
    this.buffers.set(id, buffer);
  }

  // ========================================
  // 절차적 사운드 생성 - 무기
  // ========================================

  /**
   * 빔 발사 사운드 - SF 레이저 느낌
   */
  private generateBeamFire(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.4;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 고주파 빔 (피칭 다운)
      const freqStart = 3000;
      const freqEnd = 800;
      const freq = freqStart + (freqEnd - freqStart) * (t / duration);
      
      const beam = Math.sin(2 * Math.PI * freq * t);
      
      // 배음 추가
      const harmonic1 = Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.3;
      const harmonic2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.15;
      
      // 엔벨로프
      const attack = Math.min(1, t * 50);
      const decay = Math.exp(-t * 8);
      const envelope = attack * decay;
      
      // 약간의 노이즈 (빔 느낌)
      const noise = (Math.random() * 2 - 1) * 0.05;
      
      const sample = (beam + harmonic1 + harmonic2 + noise) * envelope * 0.5;
      
      dataL[i] = sample * 0.9;
      dataR[i] = sample * 1.0;
    }

    return buffer;
  }

  /**
   * 빔 충전 사운드
   */
  private generateBeamCharge(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.2;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      
      // 상승하는 주파수
      const freq = 200 + progress * 2000;
      
      // 충전 사운드
      const charge = Math.sin(2 * Math.PI * freq * t);
      
      // 펄싱 효과
      const pulse = Math.sin(2 * Math.PI * (5 + progress * 20) * t);
      
      // 증가하는 볼륨
      const envelope = progress * progress * 0.6;
      
      const sample = charge * (0.7 + pulse * 0.3) * envelope;
      
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * 미사일 발사 사운드
   */
  private generateMissileLaunch(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 로켓 분사음 (화이트 노이즈 + 저역 필터)
      const noise = Math.random() * 2 - 1;
      
      // 저역 톤 (엔진)
      const engine = Math.sin(2 * Math.PI * 80 * t) * 0.3;
      
      // 발사 순간 톤
      const launchTone = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 15);
      
      // 엔벨로프
      const attack = Math.min(1, t * 100);
      const sustain = t < 0.2 ? 1 : Math.exp(-(t - 0.2) * 5);
      const envelope = attack * sustain;
      
      const sample = (noise * 0.4 + engine + launchTone * 0.5) * envelope * 0.6;
      
      // 도플러 효과 (좌->우)
      const pan = Math.min(1, t * 4);
      dataL[i] = sample * (1 - pan * 0.5);
      dataR[i] = sample * (0.5 + pan * 0.5);
    }

    return buffer;
  }

  /**
   * 미사일 락온 사운드
   */
  private generateMissileLock(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.0;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 비프음 (점점 빨라짐)
      const beepFreq = 5 + t * 10; // 시작 5Hz -> 15Hz
      const beepPhase = (t * beepFreq) % 1;
      const beep = beepPhase < 0.5 ? 1 : 0;
      
      // 톤
      const tone = Math.sin(2 * Math.PI * 1000 * t);
      
      const sample = tone * beep * 0.4;
      
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * 레일건 발사 사운드
   */
  private generateRailgunFire(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 전기 방전음
      const electric = Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t * 30);
      
      // 충격파
      const impact = Math.sin(2 * Math.PI * 50 * t) * Math.exp(-t * 10);
      
      // 클릭 (자기장 방출)
      const click = (Math.random() * 2 - 1) * Math.exp(-t * 100);
      
      const envelope = Math.exp(-t * 15);
      const sample = (electric * 0.5 + impact * 0.8 + click * 0.3) * envelope;
      
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * 전투기 발진 사운드
   */
  private generateFighterLaunch(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 엔진 시동
      const engineFreq = 200 + t * 500;
      const engine = Math.sin(2 * Math.PI * engineFreq * t);
      
      // 제트 노이즈
      const noise = (Math.random() * 2 - 1) * 0.3;
      
      // 발진 가속
      const accel = Math.min(1, t * 3);
      const fadeOut = t > 0.4 ? Math.exp(-(t - 0.4) * 10) : 1;
      
      const sample = (engine * 0.4 + noise) * accel * fadeOut * 0.5;
      
      // 도플러 (좌->우)
      const pan = t * 2;
      dataL[i] = sample * Math.max(0, 1 - pan);
      dataR[i] = sample * Math.min(1, pan);
    }

    return buffer;
  }

  // ========================================
  // 절차적 사운드 생성 - 폭발
  // ========================================

  /**
   * 폭발 사운드 생성
   */
  private generateExplosion(size: 'small' | 'medium' | 'large' | 'capital'): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const durations: Record<typeof size, number> = {
      small: 0.3,
      medium: 0.5,
      large: 0.8,
      capital: 1.5,
    };
    const duration = durations[size];
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    const baseFreqs: Record<typeof size, number> = {
      small: 150,
      medium: 100,
      large: 60,
      capital: 30,
    };
    const baseFreq = baseFreqs[size];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 폭발 저음
      const boom = Math.sin(2 * Math.PI * baseFreq * t) * Math.exp(-t * 5);
      
      // 폭발 노이즈
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * (size === 'capital' ? 2 : 8));
      
      // 중간 톤
      const mid = Math.sin(2 * Math.PI * baseFreq * 3 * t) * Math.exp(-t * 10);
      
      // 잔향 (큰 폭발만)
      let reverb = 0;
      if (size === 'large' || size === 'capital') {
        reverb = Math.sin(2 * Math.PI * baseFreq * 0.5 * t) * 
          Math.exp(-t * (size === 'capital' ? 1 : 2)) * 0.3;
      }
      
      const volume = size === 'capital' ? 1.0 : size === 'large' ? 0.8 : size === 'medium' ? 0.6 : 0.4;
      const sample = (boom * 0.6 + noise * 0.5 + mid * 0.3 + reverb) * volume;
      
      // 스테레오 랜덤 분산
      const stereoOffset = (Math.random() - 0.5) * 0.1;
      dataL[i] = sample * (1 + stereoOffset);
      dataR[i] = sample * (1 - stereoOffset);
    }

    return buffer;
  }

  // ========================================
  // 절차적 사운드 생성 - 방어
  // ========================================

  /**
   * 쉴드 피격 사운드
   */
  private generateShieldHit(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 에너지 흡수음 (고주파)
      const freq = 2000 - t * 5000;
      const shield = Math.sin(2 * Math.PI * Math.max(500, freq) * t);
      
      // 전기 스파크
      const spark = (Math.random() * 2 - 1) * Math.exp(-t * 30);
      
      const envelope = Math.exp(-t * 20);
      const sample = (shield * 0.4 + spark * 0.3) * envelope;
      
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * 쉴드 붕괴 사운드
   */
  private generateShieldBreak(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 에너지 방출
      const discharge = Math.sin(2 * Math.PI * (3000 - t * 2500) * t);
      
      // 붕괴 노이즈
      const noise = (Math.random() * 2 - 1);
      
      // 저음 임팩트
      const impact = Math.sin(2 * Math.PI * 50 * t) * Math.exp(-t * 3);
      
      const envelope = Math.exp(-t * 4);
      const sample = (discharge * 0.3 + noise * 0.4 * envelope + impact * 0.5) * 0.7;
      
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * 장갑 피격 사운드
   */
  private generateArmorHit(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 금속 충격음
      const metal = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 30);
      const metal2 = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 40);
      
      // 클랭 (금속 울림)
      const clang = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 20);
      
      const sample = (metal + metal2 * 0.5 + clang * 0.3) * 0.5;
      
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * 선체 관통 사운드
   */
  private generateHullBreach(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 관통 충격
      const impact = Math.sin(2 * Math.PI * 100 * t) * Math.exp(-t * 10);
      
      // 금속 찢어지는 소리
      const tear = (Math.random() * 2 - 1) * Math.exp(-t * 5);
      
      // 공기 빠지는 소리 (히싱)
      const hiss = (Math.random() * 2 - 1) * 0.3 * Math.min(1, t * 5);
      
      const sample = (impact * 0.6 + tear * 0.4 + hiss * 0.3) * 0.7;
      
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  // ========================================
  // 절차적 사운드 생성 - 이동
  // ========================================

  /**
   * 와프 사운드
   */
  private generateWarp(direction: 'in' | 'out'): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.5;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      
      // 와프 주파수 스윕
      let freq: number;
      if (direction === 'in') {
        freq = 50 + (1 - progress) * (1 - progress) * 2000; // 높은 곳에서 낮은 곳으로
      } else {
        freq = 50 + progress * progress * 2000; // 낮은 곳에서 높은 곳으로
      }
      
      // 와프 톤
      const warp = Math.sin(2 * Math.PI * freq * t);
      
      // 공간 왜곡 노이즈
      const distortion = (Math.random() * 2 - 1) * 0.2;
      
      // 저음 베이스
      const bass = Math.sin(2 * Math.PI * 30 * t) * 0.5;
      
      // 엔벨로프
      let envelope: number;
      if (direction === 'in') {
        envelope = progress < 0.8 ? progress * 1.25 : Math.exp(-(progress - 0.8) * 10);
      } else {
        envelope = progress < 0.2 ? progress * 5 : Math.exp(-(progress - 0.2) * 3);
      }
      
      const sample = (warp * 0.4 + distortion * envelope + bass) * envelope * 0.6;
      
      // 스테레오 로테이션
      const stereoPhase = Math.sin(2 * Math.PI * 2 * t);
      dataL[i] = sample * (0.8 + stereoPhase * 0.2);
      dataR[i] = sample * (0.8 - stereoPhase * 0.2);
    }

    return buffer;
  }

  /**
   * 엔진 부스트 사운드
   */
  private generateEngineBoost(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 엔진 가속
      const engineFreq = 100 + t * 200;
      const engine = Math.sin(2 * Math.PI * engineFreq * t);
      
      // 제트 노이즈
      const noise = (Math.random() * 2 - 1) * 0.4;
      
      // 엔벨로프
      const attack = Math.min(1, t * 10);
      const sustain = t > 0.5 ? Math.exp(-(t - 0.5) * 5) : 1;
      
      const sample = (engine * 0.4 + noise) * attack * sustain * 0.5;
      
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * 스러스터 사운드
   */
  private generateThruster(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 가스 분사 노이즈
      const noise = (Math.random() * 2 - 1);
      
      // 저음 추진
      const thrust = Math.sin(2 * Math.PI * 80 * t) * 0.3;
      
      const envelope = Math.exp(-t * 5);
      const sample = (noise * 0.4 + thrust) * envelope * 0.4;
      
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  // ========================================
  // 절차적 사운드 생성 - UI
  // ========================================

  /**
   * UI 클릭 사운드
   */
  private generateUIClick(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.05;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const click = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 100);
      dataL[i] = click * 0.3;
      dataR[i] = click * 0.3;
    }

    return buffer;
  }

  /**
   * UI 호버 사운드
   */
  private generateUIHover(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.03;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const hover = Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t * 150);
      dataL[i] = hover * 0.15;
      dataR[i] = hover * 0.15;
    }

    return buffer;
  }

  /**
   * UI 알림 사운드
   */
  private generateUINotification(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // 두 음 (딩동)
      const tone1 = t < 0.15 ? Math.sin(2 * Math.PI * 880 * t) : 0;
      const tone2 = t >= 0.15 ? Math.sin(2 * Math.PI * 660 * t) : 0;
      const envelope = Math.exp(-t * 8);
      const sample = (tone1 + tone2) * envelope * 0.4;
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * UI 경고 사운드
   */
  private generateUIAlert(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // 경고음 (반복)
      const beep = Math.sin(2 * Math.PI * 10 * t) > 0 ? 1 : 0;
      const tone = Math.sin(2 * Math.PI * 800 * t);
      const sample = tone * beep * 0.5;
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * UI 확인 사운드
   */
  private generateUIConfirm(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const tone1 = t < 0.08 ? Math.sin(2 * Math.PI * 600 * t) : 0;
      const tone2 = t >= 0.08 ? Math.sin(2 * Math.PI * 900 * t) : 0;
      const envelope = Math.exp(-t * 15);
      const sample = (tone1 + tone2) * envelope * 0.35;
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * UI 취소 사운드
   */
  private generateUICancel(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.12;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const tone = Math.sin(2 * Math.PI * 400 * t);
      const envelope = Math.exp(-t * 20);
      const sample = tone * envelope * 0.3;
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  // ========================================
  // 절차적 사운드 생성 - 전투 이벤트
  // ========================================

  /**
   * 전투 시작 사운드
   */
  private generateBattleStart(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 2.0;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    // 브라스 팡파레
    const notes = [
      { freq: 261.63, start: 0, dur: 0.2 },
      { freq: 329.63, start: 0.2, dur: 0.2 },
      { freq: 392.00, start: 0.4, dur: 0.4 },
      { freq: 523.25, start: 0.8, dur: 1.0 },
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const note of notes) {
        if (t >= note.start && t < note.start + note.dur) {
          const noteT = t - note.start;
          const envelope = Math.min(1, noteT * 20) * Math.exp(-noteT * 2);
          sample += Math.sin(2 * Math.PI * note.freq * t) * envelope * 0.3;
          sample += Math.sin(2 * Math.PI * note.freq * 2 * t) * envelope * 0.15;
        }
      }

      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * 전투 승리 사운드
   */
  private generateBattleVictory(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 3.0;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    const fanfare = [
      { freq: 392.00, start: 0, dur: 0.3 },
      { freq: 440.00, start: 0.3, dur: 0.3 },
      { freq: 523.25, start: 0.6, dur: 0.3 },
      { freq: 659.26, start: 0.9, dur: 1.5 },
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const note of fanfare) {
        if (t >= note.start && t < note.start + note.dur) {
          const noteT = t - note.start;
          const envelope = Math.min(1, noteT * 15) * Math.exp(-noteT * 1.5);
          sample += Math.sin(2 * Math.PI * note.freq * t) * envelope * 0.35;
          sample += Math.sin(2 * Math.PI * note.freq * 2 * t) * envelope * 0.15;
          sample += Math.sin(2 * Math.PI * note.freq * 3 * t) * envelope * 0.08;
        }
      }

      // 지속 화음
      if (t > 2.4) {
        const sustainEnv = Math.exp(-(t - 2.4) * 2);
        sample += Math.sin(2 * Math.PI * 523.25 * t) * sustainEnv * 0.1;
        sample += Math.sin(2 * Math.PI * 659.26 * t) * sustainEnv * 0.08;
        sample += Math.sin(2 * Math.PI * 783.99 * t) * sustainEnv * 0.06;
      }

      dataL[i] = sample * 0.9;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * 전투 패배 사운드
   */
  private generateBattleDefeat(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 2.5;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 하강하는 톤
      const freq = 300 * Math.pow(0.7, t);
      const tone = Math.sin(2 * Math.PI * freq * t);
      
      // 마이너 드론
      const drone = Math.sin(2 * Math.PI * 110 * t) * 0.2;
      
      const envelope = Math.exp(-t * 0.8);
      const sample = (tone * 0.3 + drone) * envelope;
      
      dataL[i] = sample;
      dataR[i] = sample * 0.9;
    }

    return buffer;
  }

  /**
   * 유닛 선택 사운드
   */
  private generateUnitSelect(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const tone = Math.sin(2 * Math.PI * 700 * t) * Math.exp(-t * 30);
      dataL[i] = tone * 0.25;
      dataR[i] = tone * 0.25;
    }

    return buffer;
  }

  /**
   * 명령 하달 사운드
   */
  private generateUnitOrder(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const tone1 = Math.sin(2 * Math.PI * 500 * t);
      const tone2 = Math.sin(2 * Math.PI * 600 * t);
      const envelope = Math.exp(-t * 20);
      const sample = (tone1 * 0.5 + tone2 * 0.5) * envelope * 0.3;
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * 통신 잡음 사운드
   */
  private generateCommStatic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noise = (Math.random() * 2 - 1) * 0.3;
      const carrier = Math.sin(2 * Math.PI * 1500 * t) * 0.1;
      const envelope = 0.5 + Math.sin(2 * Math.PI * 30 * t) * 0.5;
      const sample = (noise + carrier) * envelope * 0.2;
      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  // ========================================
  // 재생 제어
  // ========================================

  /**
   * 효과음 재생
   */
  play(
    type: Gin7SFXType,
    options?: { volume?: number; pitch?: number }
  ): string | null {
    const buffer = this.buffers.get(type);
    if (!buffer) {
      console.warn(`[Gin7SFX] Sound not found: ${type}`);
      return null;
    }

    const config = GIN7_SFX_DEFAULTS[type];
    
    // 쿨다운 체크
    const lastTime = this.lastPlayTime.get(type) || 0;
    const now = Date.now();
    if (now - lastTime < config.cooldown) {
      return null;
    }
    
    // 동시 재생 제한 체크
    const activeCount = this.activeCountByType.get(type) || 0;
    if (activeCount >= config.maxInstances) {
      return null;
    }

    // 소스 생성
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    // 피치 조절
    const pitchVariance = (Math.random() * 2 - 1) * config.pitchVariance;
    source.playbackRate.value = (options?.pitch ?? config.pitch) + pitchVariance;

    // 게인 노드
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = (options?.volume ?? 1) * config.volume;

    // 연결
    source.connect(gainNode);
    gainNode.connect(this.outputNode);

    // 재생
    source.start(0);

    // 고유 ID 생성
    const id = `${type}_${++this.soundIdCounter}`;

    // 활성 사운드 추적
    this.activeSounds.set(id, {
      id,
      type,
      source,
      gainNode,
      startTime: this.audioContext.currentTime,
    });
    
    this.lastPlayTime.set(type, now);
    this.activeCountByType.set(type, activeCount + 1);

    // 완료 콜백
    source.onended = () => {
      this.activeSounds.delete(id);
      const count = this.activeCountByType.get(type) || 1;
      this.activeCountByType.set(type, Math.max(0, count - 1));
    };

    return id;
  }

  /**
   * 특정 사운드 정지
   */
  stop(id: string): void {
    const sound = this.activeSounds.get(id);
    if (!sound) return;

    try {
      sound.source.stop();
      sound.source.disconnect();
      sound.gainNode.disconnect();
    } catch {
      // 이미 정지된 경우 무시
    }

    this.activeSounds.delete(id);
    const count = this.activeCountByType.get(sound.type) || 1;
    this.activeCountByType.set(sound.type, Math.max(0, count - 1));
  }

  /**
   * 모든 사운드 정지
   */
  stopAll(): void {
    for (const [id] of this.activeSounds) {
      this.stop(id);
    }
  }

  // ========================================
  // 상태 조회
  // ========================================

  /**
   * 활성 사운드 수 반환
   */
  getActiveSoundCount(): number {
    return this.activeSounds.size;
  }

  /**
   * 버퍼 존재 확인
   */
  hasBuffer(type: Gin7SFXType): boolean {
    return this.buffers.has(type);
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
    this.lastPlayTime.clear();
    this.activeCountByType.clear();
    console.log('🔊 [Gin7SFX] Disposed');
  }
}

export default Gin7SoundEffects;








