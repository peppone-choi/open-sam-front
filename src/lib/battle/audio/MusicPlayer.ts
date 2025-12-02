/**
 * MusicPlayer - 배경 음악 시스템
 * 
 * 기능:
 * - 트랙 로드 및 캐싱
 * - 재생/일시정지/정지
 * - 크로스페이드 전환
 * - 루프 처리
 * - 상황별 음악 매핑
 */

// ========================================
// 타입 정의
// ========================================

/** 음악 트랙 정보 */
export interface MusicTrack {
  id: string;
  name: string;
  url?: string;
  duration: number;
  intensity: MusicIntensity;
  loop: boolean;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

/** 음악 강도 (상황별) */
export type MusicIntensity = 
  | 'calm'        // 평화로운
  | 'preparation' // 준비
  | 'tension'     // 긴장
  | 'battle'      // 전투
  | 'intense'     // 격렬한 전투
  | 'victory'     // 승리
  | 'defeat';     // 패배

/** 음악 플레이어 상태 */
export interface MusicPlayerState {
  currentTrack: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  volume: number;
  progress: number;
  duration: number;
}

/** 페이드 설정 */
interface FadeConfig {
  startVolume: number;
  endVolume: number;
  duration: number;
  startTime: number;
}

// ========================================
// 기본 음악 트랙 정의
// ========================================

export const DEFAULT_MUSIC_TRACKS: Record<string, Omit<MusicTrack, 'url'>> = {
  preparation: {
    id: 'preparation',
    name: '전투 준비',
    duration: 120,
    intensity: 'preparation',
    loop: true,
    fadeInDuration: 2,
    fadeOutDuration: 1,
  },
  tension: {
    id: 'tension',
    name: '긴장감',
    duration: 90,
    intensity: 'tension',
    loop: true,
    fadeInDuration: 1.5,
    fadeOutDuration: 1,
  },
  battle_calm: {
    id: 'battle_calm',
    name: '전투 시작',
    duration: 180,
    intensity: 'battle',
    loop: true,
    fadeInDuration: 1,
    fadeOutDuration: 1,
  },
  battle_intense: {
    id: 'battle_intense',
    name: '격렬한 전투',
    duration: 150,
    intensity: 'intense',
    loop: true,
    fadeInDuration: 0.5,
    fadeOutDuration: 1,
  },
  victory: {
    id: 'victory',
    name: '승리',
    duration: 60,
    intensity: 'victory',
    loop: false,
    fadeInDuration: 0.5,
    fadeOutDuration: 2,
  },
  defeat: {
    id: 'defeat',
    name: '패배',
    duration: 45,
    intensity: 'defeat',
    loop: false,
    fadeInDuration: 0.5,
    fadeOutDuration: 2,
  },
};

// ========================================
// MusicPlayer 클래스
// ========================================

export class MusicPlayer {
  private audioContext: AudioContext;
  private outputNode: GainNode;
  
  // 버퍼 캐시
  private buffers: Map<string, AudioBuffer> = new Map();
  
  // 현재 재생 정보
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGainNode: GainNode | null = null;
  private currentTrackId: string | null = null;
  
  // 크로스페이드 관련
  private nextSource: AudioBufferSourceNode | null = null;
  private nextGainNode: GainNode | null = null;
  private crossfadeInProgress = false;
  
  // 상태
  private isPlaying = false;
  private isPaused = false;
  private pausedAt = 0;
  private startedAt = 0;
  
  // 절차적 음악 생성 옵션
  private useProceduralMusic = true;

  constructor(audioContext: AudioContext, outputNode: GainNode) {
    this.audioContext = audioContext;
    this.outputNode = outputNode;
    
    // 기본 절차적 음악 생성
    this.generateDefaultTracks();
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
   * 트랙 로드 (URL에서)
   */
  async loadTrack(track: MusicTrack): Promise<void> {
    if (!track.url || this.buffers.has(track.id)) return;

    try {
      const response = await fetch(track.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers.set(track.id, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load music track: ${track.id}`, error);
    }
  }

  /**
   * 기본 절차적 음악 생성
   */
  private generateDefaultTracks(): void {
    if (!this.useProceduralMusic) return;

    // 각 트랙별 절차적 생성
    this.buffers.set('preparation', this.generatePreparationMusic());
    this.buffers.set('tension', this.generateTensionMusic());
    this.buffers.set('battle_calm', this.generateBattleMusic(false));
    this.buffers.set('battle_intense', this.generateBattleMusic(true));
    this.buffers.set('victory', this.generateVictoryMusic());
    this.buffers.set('defeat', this.generateDefeatMusic());
  }

  // ========================================
  // 절차적 음악 생성
  // ========================================

  /**
   * 준비 음악 생성 (평화로운 선율)
   */
  private generatePreparationMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 10; // 10초 루프
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    // 동양풍 펜타토닉 스케일 (궁상각치우)
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00]; // C D E G A
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 부드러운 패드
      const noteIndex = Math.floor((t * 0.5) % scale.length);
      const freq = scale[noteIndex] * 0.5;
      
      const pad = Math.sin(2 * Math.PI * freq * t) * 0.15;
      const pad2 = Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.08;
      
      // 부드러운 엔벨로프
      const envelope = Math.sin(Math.PI * (t % 2) / 2) * 0.5 + 0.5;
      
      // 스테레오 분리
      const stereoPhase = Math.sin(2 * Math.PI * 0.1 * t);
      
      dataL[i] = (pad + pad2) * envelope * (0.5 + stereoPhase * 0.2);
      dataR[i] = (pad + pad2) * envelope * (0.5 - stereoPhase * 0.2);
    }

    return buffer;
  }

  /**
   * 긴장감 음악 생성
   */
  private generateTensionMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 8;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 낮은 드론
      const drone = Math.sin(2 * Math.PI * 55 * t) * 0.2;
      
      // 불안한 트레몰로
      const tremolo = Math.sin(2 * Math.PI * 6 * t);
      const tension = Math.sin(2 * Math.PI * 110 * t) * 0.1 * (0.5 + tremolo * 0.3);
      
      // 심장 박동 같은 저음
      const heartbeat = Math.sin(2 * Math.PI * t * 1.2) > 0.8 
        ? Math.sin(2 * Math.PI * 40 * t) * 0.15 * Math.exp(-(t % (1/1.2)) * 8)
        : 0;
      
      const sample = drone + tension + heartbeat;
      dataL[i] = sample * 0.9;
      dataR[i] = sample * 1.0;
    }

    return buffer;
  }

  /**
   * 전투 음악 생성
   */
  private generateBattleMusic(intense: boolean): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = intense ? 6 : 8;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    const bpm = intense ? 140 : 120;
    const beatDuration = 60 / bpm;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const beat = Math.floor(t / beatDuration);
      const beatPhase = (t % beatDuration) / beatDuration;

      // 강렬한 드럼
      let drum = 0;
      if (beat % 4 === 0 || beat % 4 === 2) {
        // 킥
        drum += Math.sin(2 * Math.PI * 60 * beatPhase) * Math.exp(-beatPhase * 15) * 0.3;
      }
      if (beat % 4 === 1 || beat % 4 === 3) {
        // 스네어 (노이즈)
        drum += (Math.random() * 2 - 1) * Math.exp(-beatPhase * 20) * 0.2;
      }
      // 하이햇
      if (intense) {
        drum += (Math.random() * 2 - 1) * Math.exp(-beatPhase * 40) * 0.05;
      }

      // 베이스 라인
      const bassFreq = 55 * (beat % 8 < 4 ? 1 : 1.33);
      const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.2;

      // 전투 멜로디 (마이너 스케일)
      const minorScale = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00];
      const melodyNote = minorScale[beat % 8];
      const melody = Math.sin(2 * Math.PI * melodyNote * t) * 
        Math.exp(-beatPhase * 5) * (intense ? 0.12 : 0.08);

      // 긴장감 있는 화음
      const chord = intense 
        ? Math.sin(2 * Math.PI * 110 * t) * 0.05 + Math.sin(2 * Math.PI * 165 * t) * 0.04
        : 0;

      const sample = drum + bass + melody + chord;
      
      // 스테레오 확장
      dataL[i] = sample * 0.95 + (Math.random() * 2 - 1) * 0.01;
      dataR[i] = sample * 1.0 + (Math.random() * 2 - 1) * 0.01;
    }

    return buffer;
  }

  /**
   * 승리 음악 생성 (장엄한 팡파레)
   */
  private generateVictoryMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 8;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    // 승리 팡파레 음계 (메이저 아르페지오)
    const fanfare = [
      { freq: 261.63, start: 0, dur: 0.3 },
      { freq: 329.63, start: 0.3, dur: 0.3 },
      { freq: 392.00, start: 0.6, dur: 0.3 },
      { freq: 523.25, start: 0.9, dur: 0.8 },
      { freq: 392.00, start: 2.0, dur: 0.2 },
      { freq: 440.00, start: 2.2, dur: 0.2 },
      { freq: 523.25, start: 2.4, dur: 1.5 },
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // 팡파레 재생
      for (const note of fanfare) {
        if (t >= note.start && t < note.start + note.dur) {
          const noteT = t - note.start;
          const envelope = Math.min(1, noteT * 10) * Math.exp(-noteT * 2);
          
          // 브라스 톤 (배음)
          sample += Math.sin(2 * Math.PI * note.freq * t) * envelope * 0.3;
          sample += Math.sin(2 * Math.PI * note.freq * 2 * t) * envelope * 0.15;
          sample += Math.sin(2 * Math.PI * note.freq * 3 * t) * envelope * 0.08;
        }
      }

      // 승리 후 지속음
      if (t > 4) {
        const sustainT = t - 4;
        const sustainEnv = Math.exp(-sustainT * 0.5);
        sample += Math.sin(2 * Math.PI * 523.25 * t) * sustainEnv * 0.15;
        sample += Math.sin(2 * Math.PI * 659.26 * t) * sustainEnv * 0.1;
        sample += Math.sin(2 * Math.PI * 783.99 * t) * sustainEnv * 0.08;
      }

      dataL[i] = sample * 0.9;
      dataR[i] = sample * 1.0;
    }

    return buffer;
  }

  /**
   * 패배 음악 생성 (슬프고 어두운)
   */
  private generateDefeatMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 8;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 슬픈 마이너 화음
      const env = Math.exp(-t * 0.3);
      
      // 떨어지는 멜로디
      const dropFreq = 220 * Math.pow(0.95, t);
      const melody = Math.sin(2 * Math.PI * dropFreq * t) * env * 0.2;
      
      // 어두운 패드
      const pad = Math.sin(2 * Math.PI * 82.41 * t) * env * 0.15; // E2
      const pad2 = Math.sin(2 * Math.PI * 98.00 * t) * env * 0.1; // G2
      
      // 장송곡 느낌의 천천한 펄스
      const pulse = Math.sin(2 * Math.PI * 0.5 * t) * 0.3 + 0.7;
      
      const sample = (melody + pad + pad2) * pulse;
      
      dataL[i] = sample;
      dataR[i] = sample * 0.95;
    }

    return buffer;
  }

  // ========================================
  // 재생 제어
  // ========================================

  /**
   * 음악 재생
   */
  play(trackId: string, fadeIn = 1): void {
    const buffer = this.buffers.get(trackId);
    if (!buffer) {
      console.warn(`Music track not found: ${trackId}`);
      return;
    }

    // 이미 같은 트랙 재생 중이면 무시
    if (this.currentTrackId === trackId && this.isPlaying) return;

    // 기존 트랙 정지
    this.stopCurrentTrack(0.1);

    // 새 소스 생성
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = DEFAULT_MUSIC_TRACKS[trackId]?.loop ?? true;

    // 게인 노드 생성
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;

    // 연결
    source.connect(gainNode);
    gainNode.connect(this.outputNode);

    // 페이드 인
    const currentTime = this.audioContext.currentTime;
    gainNode.gain.linearRampToValueAtTime(1, currentTime + fadeIn);

    // 재생 시작
    source.start(0);

    // 상태 업데이트
    this.currentSource = source;
    this.currentGainNode = gainNode;
    this.currentTrackId = trackId;
    this.isPlaying = true;
    this.isPaused = false;
    this.startedAt = currentTime;

    // 재생 완료 콜백
    source.onended = () => {
      if (this.currentSource === source) {
        this.isPlaying = false;
        this.currentSource = null;
        this.currentGainNode = null;
      }
    };
  }

  /**
   * 음악 정지
   */
  stop(fadeOut = 1): void {
    this.stopCurrentTrack(fadeOut);
    this.currentTrackId = null;
    this.isPlaying = false;
    this.isPaused = false;
  }

  /**
   * 현재 트랙 정지
   */
  private stopCurrentTrack(fadeOut: number): void {
    if (!this.currentSource || !this.currentGainNode) return;

    const gainNode = this.currentGainNode;
    const source = this.currentSource;
    const currentTime = this.audioContext.currentTime;

    // 페이드 아웃
    gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeOut);

    // 페이드 후 정지
    setTimeout(() => {
      try {
        source.stop();
        source.disconnect();
        gainNode.disconnect();
      } catch {
        // 이미 정지된 경우 무시
      }
    }, fadeOut * 1000);

    this.currentSource = null;
    this.currentGainNode = null;
  }

  /**
   * 일시정지
   */
  pause(): void {
    if (!this.isPlaying || this.isPaused || !this.currentSource) return;

    this.pausedAt = this.audioContext.currentTime - this.startedAt;
    this.currentSource.stop();
    this.isPaused = true;
    this.isPlaying = false;
  }

  /**
   * 재개
   */
  resume(): void {
    if (!this.isPaused || !this.currentTrackId) return;

    const buffer = this.buffers.get(this.currentTrackId);
    if (!buffer) return;

    // 새 소스로 이어서 재생
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = DEFAULT_MUSIC_TRACKS[this.currentTrackId]?.loop ?? true;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1;

    source.connect(gainNode);
    gainNode.connect(this.outputNode);

    source.start(0, this.pausedAt % buffer.duration);

    this.currentSource = source;
    this.currentGainNode = gainNode;
    this.isPlaying = true;
    this.isPaused = false;
    this.startedAt = this.audioContext.currentTime - this.pausedAt;
  }

  // ========================================
  // 크로스페이드
  // ========================================

  /**
   * 크로스페이드 전환
   */
  crossfadeTo(trackId: string, duration = 2): void {
    const buffer = this.buffers.get(trackId);
    if (!buffer) {
      console.warn(`Music track not found: ${trackId}`);
      return;
    }

    // 같은 트랙이면 무시
    if (this.currentTrackId === trackId && this.isPlaying) return;

    // 진행 중인 크로스페이드가 있으면 강제 완료
    if (this.crossfadeInProgress) {
      this.completeCrossfade();
    }

    this.crossfadeInProgress = true;
    const currentTime = this.audioContext.currentTime;

    // 새 소스 생성
    const newSource = this.audioContext.createBufferSource();
    newSource.buffer = buffer;
    newSource.loop = DEFAULT_MUSIC_TRACKS[trackId]?.loop ?? true;

    const newGain = this.audioContext.createGain();
    newGain.gain.value = 0;

    newSource.connect(newGain);
    newGain.connect(this.outputNode);

    // 기존 트랙 페이드 아웃
    if (this.currentGainNode) {
      this.currentGainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
    }

    // 새 트랙 페이드 인
    newGain.gain.linearRampToValueAtTime(1, currentTime + duration);

    // 새 트랙 시작
    newSource.start(0);

    // 기존 트랙 저장
    const oldSource = this.currentSource;
    const oldGain = this.currentGainNode;

    // 새 트랙으로 교체
    this.currentSource = newSource;
    this.currentGainNode = newGain;
    this.currentTrackId = trackId;
    this.isPlaying = true;
    this.startedAt = currentTime;

    // 크로스페이드 완료 후 정리
    setTimeout(() => {
      if (oldSource) {
        try {
          oldSource.stop();
          oldSource.disconnect();
        } catch {
          // 이미 정지된 경우 무시
        }
      }
      if (oldGain) {
        oldGain.disconnect();
      }
      this.crossfadeInProgress = false;
    }, duration * 1000);
  }

  /**
   * 크로스페이드 강제 완료
   */
  private completeCrossfade(): void {
    if (this.nextSource) {
      try {
        this.nextSource.stop();
        this.nextSource.disconnect();
      } catch {
        // 무시
      }
    }
    if (this.nextGainNode) {
      this.nextGainNode.disconnect();
    }
    this.nextSource = null;
    this.nextGainNode = null;
    this.crossfadeInProgress = false;
  }

  // ========================================
  // 상태 조회
  // ========================================

  /**
   * 현재 상태 반환
   */
  getState(): MusicPlayerState {
    let progress = 0;
    let duration = 0;

    if (this.currentTrackId && this.currentSource?.buffer) {
      duration = this.currentSource.buffer.duration;
      if (this.isPlaying) {
        progress = (this.audioContext.currentTime - this.startedAt) % duration;
      } else if (this.isPaused) {
        progress = this.pausedAt;
      }
    }

    return {
      currentTrack: this.currentTrackId,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      volume: this.currentGainNode?.gain.value ?? 0,
      progress,
      duration,
    };
  }

  /**
   * 현재 트랙 ID 반환
   */
  getCurrentTrack(): string | null {
    return this.currentTrackId;
  }

  // ========================================
  // 정리
  // ========================================

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.stop(0.1);
    this.completeCrossfade();
    this.buffers.clear();
  }
}

export default MusicPlayer;





