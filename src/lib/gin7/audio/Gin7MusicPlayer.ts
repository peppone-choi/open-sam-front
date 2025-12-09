/**
 * Gin7 MusicPlayer - 은하영웅전설 스타일 배경 음악 시스템
 * 
 * 기능:
 * - 전략/전술/이벤트별 BGM 관리
 * - 크로스페이드 전환
 * - 절차적 음악 생성 (Web Audio API)
 * - 오케스트라/클래식 스타일
 */

// ========================================
// 타입 정의
// ========================================

/** 음악 트랙 정보 */
export interface Gin7MusicTrack {
  id: string;
  name: string;
  url?: string;
  duration: number;
  category: MusicCategory;
  loop: boolean;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

/** 음악 카테고리 */
export type MusicCategory = 
  | 'strategic'      // 전략 화면
  | 'tactical_calm'  // 전술 - 평화
  | 'tactical_tension' // 전술 - 긴장
  | 'tactical_battle' // 전술 - 전투
  | 'victory'        // 승리
  | 'defeat'         // 패배
  | 'event'          // 이벤트/대화
  | 'menu';          // 메뉴

/** 음악 플레이어 상태 */
export interface Gin7MusicPlayerState {
  currentTrack: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  volume: number;
  progress: number;
  duration: number;
}

// ========================================
// 기본 음악 트랙 정의
// ========================================

export const GIN7_MUSIC_TRACKS: Record<string, Omit<Gin7MusicTrack, 'url'>> = {
  strategic: {
    id: 'strategic',
    name: '은하의 고요 (전략 화면)',
    duration: 120,
    category: 'strategic',
    loop: true,
    fadeInDuration: 2,
    fadeOutDuration: 1.5,
  },
  tactical_calm: {
    id: 'tactical_calm',
    name: '함대의 항해',
    duration: 90,
    category: 'tactical_calm',
    loop: true,
    fadeInDuration: 1.5,
    fadeOutDuration: 1,
  },
  tactical_tension: {
    id: 'tactical_tension',
    name: '전운이 감돈다',
    duration: 60,
    category: 'tactical_tension',
    loop: true,
    fadeInDuration: 1,
    fadeOutDuration: 0.5,
  },
  tactical_battle: {
    id: 'tactical_battle',
    name: '결전의 서막',
    duration: 120,
    category: 'tactical_battle',
    loop: true,
    fadeInDuration: 0.5,
    fadeOutDuration: 1,
  },
  victory: {
    id: 'victory',
    name: '승리의 팡파레',
    duration: 45,
    category: 'victory',
    loop: false,
    fadeInDuration: 0.3,
    fadeOutDuration: 2,
  },
  defeat: {
    id: 'defeat',
    name: '패배의 비가',
    duration: 60,
    category: 'defeat',
    loop: false,
    fadeInDuration: 0.5,
    fadeOutDuration: 3,
  },
  event: {
    id: 'event',
    name: '운명의 대화',
    duration: 90,
    category: 'event',
    loop: true,
    fadeInDuration: 1,
    fadeOutDuration: 1,
  },
  menu: {
    id: 'menu',
    name: '은하영웅전설 메인 테마',
    duration: 180,
    category: 'menu',
    loop: true,
    fadeInDuration: 2,
    fadeOutDuration: 2,
  },
};

// ========================================
// Gin7MusicPlayer 클래스
// ========================================

export class Gin7MusicPlayer {
  private audioContext: AudioContext;
  private outputNode: GainNode;
  
  // 버퍼 캐시
  private buffers: Map<string, AudioBuffer> = new Map();
  
  // 현재 재생 정보
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGainNode: GainNode | null = null;
  private currentTrackId: string | null = null;
  
  // 크로스페이드 관련
  private crossfadeInProgress = false;
  
  // 상태
  private isPlaying = false;
  private isPaused = false;
  private pausedAt = 0;
  private startedAt = 0;
  
  // 절차적 음악 생성 활성화
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
  async loadTrack(track: Gin7MusicTrack): Promise<void> {
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

    // 각 트랙별 절차적 생성 (은하영웅전설 스타일)
    this.buffers.set('strategic', this.generateStrategicMusic());
    this.buffers.set('tactical_calm', this.generateTacticalCalmMusic());
    this.buffers.set('tactical_tension', this.generateTacticalTensionMusic());
    this.buffers.set('tactical_battle', this.generateTacticalBattleMusic());
    this.buffers.set('victory', this.generateVictoryMusic());
    this.buffers.set('defeat', this.generateDefeatMusic());
    this.buffers.set('event', this.generateEventMusic());
    this.buffers.set('menu', this.generateMenuMusic());
  }

  // ========================================
  // 절차적 음악 생성 (은하영웅전설 스타일)
  // ========================================

  /**
   * 전략 화면 음악 - 우주의 고요함, 클래식 오케스트라
   */
  private generateStrategicMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 16;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    // 마이너 스케일 (장엄한 느낌)
    const scale = [130.81, 146.83, 155.56, 174.61, 196.00, 207.65, 233.08, 261.63]; // C3 minor

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 스트링 패드 (현악기)
      const noteIdx = Math.floor((t * 0.25) % scale.length);
      const baseFreq = scale[noteIdx];
      
      // 비브라토
      const vibrato = Math.sin(2 * Math.PI * 5 * t) * 2;
      const freq = baseFreq + vibrato;
      
      // 스트링 사운드 (여러 배음)
      let strings = 0;
      strings += Math.sin(2 * Math.PI * freq * t) * 0.15;
      strings += Math.sin(2 * Math.PI * freq * 2 * t) * 0.08;
      strings += Math.sin(2 * Math.PI * freq * 3 * t) * 0.04;
      strings += Math.sin(2 * Math.PI * freq * 4 * t) * 0.02;
      
      // 부드러운 엔벨로프 (4초 주기)
      const envelope = Math.sin(Math.PI * (t % 4) / 4);
      
      // 저음 드론 (우주적 분위기)
      const drone = Math.sin(2 * Math.PI * 65.41 * t) * 0.1; // C2
      
      // 하프 아르페지오 (간헐적)
      let harp = 0;
      if ((t * 2) % 4 < 0.5) {
        const harpFreq = scale[Math.floor((t * 4) % scale.length)] * 2;
        harp = Math.sin(2 * Math.PI * harpFreq * t) * 
          Math.exp(-((t * 2) % 4) * 8) * 0.1;
      }
      
      const sample = (strings * envelope + drone + harp) * 0.7;
      
      // 스테레오 확장
      const stereoPhase = Math.sin(2 * Math.PI * 0.05 * t);
      dataL[i] = sample * (0.9 + stereoPhase * 0.1);
      dataR[i] = sample * (0.9 - stereoPhase * 0.1);
    }

    return buffer;
  }

  /**
   * 전술 평화 음악 - 함대 항해, 장엄하고 평화로운
   */
  private generateTacticalCalmMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 12;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    // 메이저 스케일 (밝고 장엄한)
    const scale = [174.61, 196.00, 220.00, 233.08, 261.63, 293.66, 329.63, 349.23];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 브라스 코드
      const chordPhase = Math.floor(t / 3) % 4;
      let baseFreq: number;
      switch (chordPhase) {
        case 0: baseFreq = 174.61; break; // F3
        case 1: baseFreq = 196.00; break; // G3
        case 2: baseFreq = 164.81; break; // E3
        case 3: baseFreq = 146.83; break; // D3
        default: baseFreq = 174.61;
      }
      
      // 브라스 사운드
      let brass = 0;
      brass += Math.sin(2 * Math.PI * baseFreq * t) * 0.12;
      brass += Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * 0.08; // 퀸트
      brass += Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.06;
      brass += Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.03;
      
      // 스트링 레이어
      const stringFreq = baseFreq * 2;
      let strings = Math.sin(2 * Math.PI * stringFreq * t) * 0.08;
      strings += Math.sin(2 * Math.PI * stringFreq * 1.5 * t) * 0.04;
      
      // 엔벨로프
      const localT = t % 3;
      const envelope = localT < 0.5 
        ? localT * 2 
        : Math.exp(-(localT - 0.5) * 0.5);
      
      const sample = (brass + strings) * envelope * 0.8;
      
      dataL[i] = sample;
      dataR[i] = sample * 0.95;
    }

    return buffer;
  }

  /**
   * 전술 긴장 음악 - 전운이 감도는 느낌
   */
  private generateTacticalTensionMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 8;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // 오스티나토 패턴 (반복되는 긴장감)
      const bpm = 100;
      const beatDuration = 60 / bpm;
      const beat = Math.floor(t / beatDuration);
      const beatPhase = (t % beatDuration) / beatDuration;
      
      // 팀파니 롤
      let timpani = 0;
      if (beat % 4 === 0) {
        timpani = Math.sin(2 * Math.PI * 55 * t) * Math.exp(-beatPhase * 8) * 0.25;
      }
      
      // 트레몰로 스트링
      const tremoloRate = 8 + Math.sin(2 * Math.PI * 0.2 * t) * 2;
      const tremolo = Math.sin(2 * Math.PI * tremoloRate * t) * 0.5 + 0.5;
      const strings = Math.sin(2 * Math.PI * 110 * t) * tremolo * 0.15;
      
      // 낮은 브라스 (위협적)
      const brass = Math.sin(2 * Math.PI * 73.42 * t) * 0.1; // D2
      
      // 긴장감 있는 고음
      const tension = Math.sin(2 * Math.PI * 220 * t) * 
        Math.sin(Math.PI * (t % 2)) * 0.08;
      
      // 심장 박동 같은 베이스
      const heartPhase = (t * 1.2) % 1;
      const heartbeat = heartPhase < 0.1 
        ? Math.sin(2 * Math.PI * 40 * t) * Math.exp(-heartPhase * 30) * 0.2
        : 0;
      
      const sample = timpani + strings + brass + tension + heartbeat;
      
      // 스테레오 공간감
      dataL[i] = sample * 0.95;
      dataR[i] = sample * 1.0;
    }

    return buffer;
  }

  /**
   * 전술 전투 음악 - 격렬한 오케스트라 전투
   */
  private generateTacticalBattleMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 10;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    const bpm = 140;
    const beatDuration = 60 / bpm;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const beat = Math.floor(t / beatDuration);
      const beatPhase = (t % beatDuration) / beatDuration;

      // 강렬한 드럼 (팀파니 + 베이스 드럼)
      let drums = 0;
      // 킥
      if (beat % 4 === 0 || beat % 4 === 2) {
        drums += Math.sin(2 * Math.PI * 50 * beatPhase) * Math.exp(-beatPhase * 12) * 0.3;
      }
      // 스네어/팀파니
      if (beat % 4 === 1 || beat % 4 === 3) {
        drums += (Math.random() * 2 - 1) * Math.exp(-beatPhase * 15) * 0.15;
        drums += Math.sin(2 * Math.PI * 110 * beatPhase) * Math.exp(-beatPhase * 10) * 0.1;
      }
      // 심벌
      if (beat % 8 === 7) {
        drums += (Math.random() * 2 - 1) * Math.exp(-beatPhase * 5) * 0.08;
      }

      // 브라스 팡파레
      const brassPattern = [220, 261.63, 293.66, 329.63, 349.23, 329.63, 293.66, 261.63];
      const brassFreq = brassPattern[beat % 8];
      let brass = Math.sin(2 * Math.PI * brassFreq * t) * 0.12;
      brass += Math.sin(2 * Math.PI * brassFreq * 2 * t) * 0.06;
      brass += Math.sin(2 * Math.PI * brassFreq * 3 * t) * 0.03;
      
      // 스타카토 스트링
      const stringEnv = Math.exp(-beatPhase * 8);
      const strings = Math.sin(2 * Math.PI * brassFreq * 2 * t) * stringEnv * 0.1;

      // 베이스 라인
      const bassFreq = 55 * (beat % 8 < 4 ? 1 : 1.33);
      const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.15;

      const sample = drums + brass + strings + bass;
      
      dataL[i] = sample * 0.9;
      dataR[i] = sample * 1.0;
    }

    return buffer;
  }

  /**
   * 승리 음악 - 장엄한 팡파레
   */
  private generateVictoryMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 12;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    // 승리 팡파레 멜로디
    const fanfare = [
      { freq: 261.63, start: 0, dur: 0.3 },     // C4
      { freq: 329.63, start: 0.3, dur: 0.3 },   // E4
      { freq: 392.00, start: 0.6, dur: 0.3 },   // G4
      { freq: 523.25, start: 0.9, dur: 1.0 },   // C5 (길게)
      { freq: 493.88, start: 2.2, dur: 0.2 },   // B4
      { freq: 523.25, start: 2.4, dur: 0.2 },   // C5
      { freq: 587.33, start: 2.6, dur: 0.4 },   // D5
      { freq: 659.26, start: 3.0, dur: 1.5 },   // E5 (장음)
      { freq: 523.25, start: 5.0, dur: 0.3 },   // C5
      { freq: 587.33, start: 5.3, dur: 0.3 },   // D5
      { freq: 659.26, start: 5.6, dur: 0.3 },   // E5
      { freq: 783.99, start: 5.9, dur: 2.0 },   // G5 (피날레)
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // 팡파레 멜로디
      for (const note of fanfare) {
        if (t >= note.start && t < note.start + note.dur) {
          const noteT = t - note.start;
          const attack = Math.min(1, noteT * 20);
          const decay = Math.exp(-noteT * 1.5);
          const envelope = attack * decay;
          
          // 브라스 톤
          sample += Math.sin(2 * Math.PI * note.freq * t) * envelope * 0.25;
          sample += Math.sin(2 * Math.PI * note.freq * 2 * t) * envelope * 0.12;
          sample += Math.sin(2 * Math.PI * note.freq * 3 * t) * envelope * 0.06;
          sample += Math.sin(2 * Math.PI * note.freq * 4 * t) * envelope * 0.03;
        }
      }

      // 승리 후 지속음 (화성)
      if (t > 8) {
        const sustainT = t - 8;
        const sustainEnv = Math.exp(-sustainT * 0.3);
        // 메이저 코드 (C-E-G)
        sample += Math.sin(2 * Math.PI * 261.63 * t) * sustainEnv * 0.1;
        sample += Math.sin(2 * Math.PI * 329.63 * t) * sustainEnv * 0.08;
        sample += Math.sin(2 * Math.PI * 392.00 * t) * sustainEnv * 0.08;
        sample += Math.sin(2 * Math.PI * 523.25 * t) * sustainEnv * 0.06;
      }

      // 스네어 드럼 롤 (시작 부분)
      if (t < 4 && t % 0.1 < 0.05) {
        sample += (Math.random() * 2 - 1) * Math.exp(-(t % 0.1) * 50) * 0.05;
      }

      dataL[i] = sample * 0.85;
      dataR[i] = sample * 0.95;
    }

    return buffer;
  }

  /**
   * 패배 음악 - 슬프고 장엄한 레퀴엠
   */
  private generateDefeatMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 15;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    // 슬픈 마이너 멜로디
    const melody = [
      { freq: 220.00, start: 0, dur: 2 },     // A3
      { freq: 196.00, start: 2, dur: 2 },     // G3
      { freq: 174.61, start: 4, dur: 2 },     // F3
      { freq: 164.81, start: 6, dur: 3 },     // E3 (길게)
      { freq: 146.83, start: 9, dur: 2 },     // D3
      { freq: 130.81, start: 11, dur: 4 },    // C3 (피날레)
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // 멜로디
      for (const note of melody) {
        if (t >= note.start && t < note.start + note.dur) {
          const noteT = t - note.start;
          const attack = Math.min(1, noteT * 2);
          const decay = Math.exp(-noteT * 0.3);
          const envelope = attack * decay;
          
          // 현악기 톤 (비브라토)
          const vibrato = Math.sin(2 * Math.PI * 5 * t) * 2;
          const freq = note.freq + vibrato;
          
          sample += Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
          sample += Math.sin(2 * Math.PI * freq * 2 * t) * envelope * 0.1;
        }
      }

      // 저음 드론 (장송곡)
      const droneEnv = Math.min(1, t * 0.5) * Math.exp(-Math.max(0, t - 12) * 0.5);
      const drone = Math.sin(2 * Math.PI * 55 * t) * droneEnv * 0.12; // A1
      sample += drone;

      // 불협화음 (비극적)
      if (t > 6 && t < 12) {
        const dissonance = Math.sin(2 * Math.PI * 116.54 * t) * 0.05; // Bb2
        sample += dissonance * Math.sin(Math.PI * (t - 6) / 6);
      }

      dataL[i] = sample;
      dataR[i] = sample * 0.9;
    }

    return buffer;
  }

  /**
   * 이벤트 음악 - 대화/결정 장면
   */
  private generateEventMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 12;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    // 피아노 코드 진행
    const chords = [
      { notes: [261.63, 329.63, 392.00], start: 0, dur: 3 },    // C major
      { notes: [220.00, 261.63, 329.63], start: 3, dur: 3 },    // Am
      { notes: [174.61, 220.00, 261.63], start: 6, dur: 3 },    // F major
      { notes: [196.00, 246.94, 293.66], start: 9, dur: 3 },    // G major
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // 피아노 코드
      for (const chord of chords) {
        if (t >= chord.start && t < chord.start + chord.dur) {
          const noteT = t - chord.start;
          const envelope = Math.exp(-noteT * 1);
          
          for (const freq of chord.notes) {
            // 피아노 톤
            sample += Math.sin(2 * Math.PI * freq * t) * envelope * 0.08;
            sample += Math.sin(2 * Math.PI * freq * 2 * t) * envelope * 0.03;
          }
        }
      }

      // 부드러운 스트링 패드
      const stringFreq = 130.81 + Math.sin(2 * Math.PI * 0.1 * t) * 5;
      const strings = Math.sin(2 * Math.PI * stringFreq * t) * 0.08;
      sample += strings * Math.sin(Math.PI * t / 12);

      dataL[i] = sample;
      dataR[i] = sample;
    }

    return buffer;
  }

  /**
   * 메인 메뉴 음악 - 은하영웅전설 메인 테마 스타일
   */
  private generateMenuMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 20;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    // 메인 테마 멜로디 (장엄한)
    const theme = [
      { freq: 261.63, start: 0, dur: 1 },
      { freq: 293.66, start: 1, dur: 1 },
      { freq: 329.63, start: 2, dur: 1.5 },
      { freq: 293.66, start: 3.5, dur: 0.5 },
      { freq: 261.63, start: 4, dur: 2 },
      { freq: 220.00, start: 6, dur: 1 },
      { freq: 246.94, start: 7, dur: 1 },
      { freq: 261.63, start: 8, dur: 2 },
      { freq: 329.63, start: 10, dur: 1 },
      { freq: 392.00, start: 11, dur: 1 },
      { freq: 440.00, start: 12, dur: 1.5 },
      { freq: 392.00, start: 13.5, dur: 0.5 },
      { freq: 329.63, start: 14, dur: 2 },
      { freq: 293.66, start: 16, dur: 1 },
      { freq: 261.63, start: 17, dur: 3 },
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // 메인 멜로디
      for (const note of theme) {
        if (t >= note.start && t < note.start + note.dur) {
          const noteT = t - note.start;
          const attack = Math.min(1, noteT * 5);
          const sustain = noteT < note.dur - 0.3 ? 1 : Math.exp(-(noteT - (note.dur - 0.3)) * 5);
          const envelope = attack * sustain;
          
          // 오케스트라 톤
          sample += Math.sin(2 * Math.PI * note.freq * t) * envelope * 0.15;
          sample += Math.sin(2 * Math.PI * note.freq * 2 * t) * envelope * 0.08;
          sample += Math.sin(2 * Math.PI * note.freq * 0.5 * t) * envelope * 0.05;
        }
      }

      // 스트링 패드 (배경)
      const padFreq = 130.81; // C3
      const pad = Math.sin(2 * Math.PI * padFreq * t) * 0.08;
      const pad5th = Math.sin(2 * Math.PI * padFreq * 1.5 * t) * 0.05;
      sample += (pad + pad5th) * 0.7;

      // 저음 드론
      const drone = Math.sin(2 * Math.PI * 65.41 * t) * 0.06;
      sample += drone;

      dataL[i] = sample * 0.9;
      dataR[i] = sample * 1.0;
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
      console.warn(`[Gin7Music] Track not found: ${trackId}`);
      return;
    }

    // 이미 같은 트랙 재생 중이면 무시
    if (this.currentTrackId === trackId && this.isPlaying) return;

    // 기존 트랙 정지
    this.stopCurrentTrack(0.1);

    // 새 소스 생성
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = GIN7_MUSIC_TRACKS[trackId]?.loop ?? true;

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

    console.log(`🎵 [Gin7Music] Playing: ${trackId}`);
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
    source.loop = GIN7_MUSIC_TRACKS[this.currentTrackId]?.loop ?? true;

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
      console.warn(`[Gin7Music] Track not found: ${trackId}`);
      return;
    }

    // 같은 트랙이면 무시
    if (this.currentTrackId === trackId && this.isPlaying) return;

    this.crossfadeInProgress = true;
    const currentTime = this.audioContext.currentTime;

    // 새 소스 생성
    const newSource = this.audioContext.createBufferSource();
    newSource.buffer = buffer;
    newSource.loop = GIN7_MUSIC_TRACKS[trackId]?.loop ?? true;

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

    console.log(`🎵 [Gin7Music] Crossfade to: ${trackId}`);
  }

  // ========================================
  // 상태 조회
  // ========================================

  /**
   * 현재 상태 반환
   */
  getState(): Gin7MusicPlayerState {
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
    this.buffers.clear();
    console.log('🎵 [Gin7Music] Disposed');
  }
}

export default Gin7MusicPlayer;













