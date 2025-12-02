/**
 * AnimationMixer.ts
 * 애니메이션 믹싱 및 블렌딩 시스템
 * 
 * 역할:
 * - 여러 애니메이션 레이어 관리
 * - 상태 전환 블렌딩
 * - 파츠별 독립 애니메이션 믹싱
 * - 애니메이션 인터럽트 처리
 */

import type { VoxelAnimationSequence, VoxelAnimationState } from '@/components/battle/units/db/VoxelUnitDefinitions';
import type { PartsTransformMap, PartTransform } from './AnimationController';
import { interpolateTransforms } from './AnimationController';
import { ANIMATION_CLIPS, type AnimationClipName } from './AnimationClips';
import { WEAPON_ANIMATION_DATABASE } from './WeaponAnimations';

// ===== 타입 정의 =====

/** 애니메이션 레이어 */
export interface AnimationLayer {
  id: string;
  name: string;
  weight: number;           // 0~1, 레이어 가중치
  mask?: string[];          // 이 레이어가 영향을 주는 파츠 목록
  blendMode: BlendMode;     // 블렌딩 모드
  currentClip?: AnimationClipInstance;
  transitionClip?: AnimationClipInstance;
}

/** 블렌딩 모드 */
export type BlendMode = 
  | 'override'    // 기존 값 덮어쓰기
  | 'additive'    // 기존 값에 더하기
  | 'multiply';   // 기존 값에 곱하기

/** 애니메이션 클립 인스턴스 */
export interface AnimationClipInstance {
  sequence: VoxelAnimationSequence;
  progress: number;         // 0~1
  speed: number;            // 재생 속도 배율
  weight: number;           // 0~1, 클립 가중치
  isPlaying: boolean;
  fadeIn: number;           // 페이드인 시간 (ms)
  fadeOut: number;          // 페이드아웃 시간 (ms)
  currentFade: number;      // 현재 페이드 진행률 (0~1)
  fadeDirection: 'in' | 'out' | 'none';
}

/** 전환 설정 */
export interface TransitionConfig {
  duration: number;         // 전환 시간 (ms)
  curve: EasingCurve;       // 이징 곡선
  interruptable: boolean;   // 인터럽트 가능 여부
}

/** 이징 곡선 */
export type EasingCurve = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'spring';

/** 믹서 설정 */
export interface AnimationMixerConfig {
  defaultTransitionDuration: number;
  defaultEasing: EasingCurve;
  maxLayers: number;
}

/** 애니메이션 믹서 인터페이스 */
export interface IAnimationMixer {
  // 레이어 관리
  addLayer(config: Partial<AnimationLayer>): AnimationLayer;
  removeLayer(layerId: string): void;
  getLayer(layerId: string): AnimationLayer | undefined;
  setLayerWeight(layerId: string, weight: number): void;
  
  // 클립 재생
  play(layerId: string, clip: AnimationClipName | VoxelAnimationSequence, options?: PlayClipOptions): void;
  stop(layerId: string): void;
  fadeOut(layerId: string, duration?: number): void;
  
  // 전환
  crossFade(layerId: string, toClip: AnimationClipName | VoxelAnimationSequence, config?: Partial<TransitionConfig>): void;
  
  // 업데이트
  update(deltaTime: number): void;
  
  // 결과
  getBlendedTransforms(): PartsTransformMap;
  getColorOverlay(): string | undefined;
  getScale(): number;
  
  // 상태
  isTransitioning(layerId: string): boolean;
  getCurrentClipName(layerId: string): string | undefined;
  
  // 정리
  dispose(): void;
}

/** 클립 재생 옵션 */
export interface PlayClipOptions {
  speed?: number;
  startProgress?: number;
  fadeIn?: number;
  weight?: number;
  loop?: boolean;
}

// ===== 이징 함수들 =====

const EASING_FUNCTIONS: Record<EasingCurve, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  spring: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// ===== 유틸리티 함수 =====

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getClipSequence(clip: AnimationClipName | VoxelAnimationSequence): VoxelAnimationSequence {
  if (typeof clip === 'string') {
    return ANIMATION_CLIPS[clip] ?? ANIMATION_CLIPS.idle;
  }
  return clip;
}

function createClipInstance(
  sequence: VoxelAnimationSequence,
  options: PlayClipOptions = {}
): AnimationClipInstance {
  return {
    sequence,
    progress: options.startProgress ?? 0,
    speed: options.speed ?? 1,
    weight: options.weight ?? 1,
    isPlaying: true,
    fadeIn: options.fadeIn ?? 0,
    fadeOut: 0,
    currentFade: options.fadeIn ? 0 : 1,
    fadeDirection: options.fadeIn ? 'in' : 'none',
  };
}

/** 키프레임에서 변환 계산 */
function calculateTransformsAtProgress(
  sequence: VoxelAnimationSequence,
  progress: number
): PartsTransformMap {
  const keyframes = sequence.keyframes;
  
  if (keyframes.length === 0) return {};
  if (keyframes.length === 1) return keyframes[0].transforms as PartsTransformMap;
  
  // 현재 진행률에 해당하는 키프레임 쌍 찾기
  let prevFrame = keyframes[0];
  let nextFrame = keyframes[keyframes.length - 1];
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
      prevFrame = keyframes[i];
      nextFrame = keyframes[i + 1];
      break;
    }
  }
  
  // 로컬 진행률 계산
  const timeDiff = nextFrame.time - prevFrame.time;
  const localT = timeDiff > 0 ? (progress - prevFrame.time) / timeDiff : 0;
  
  return interpolateTransforms(
    prevFrame.transforms as PartsTransformMap,
    nextFrame.transforms as PartsTransformMap,
    localT
  );
}

/** 두 변환 값 더하기 (additive) */
function addPartTransform(a: PartTransform, b: PartTransform): PartTransform {
  return {
    rotX: (a.rotX ?? 0) + (b.rotX ?? 0),
    rotY: (a.rotY ?? 0) + (b.rotY ?? 0),
    rotZ: (a.rotZ ?? 0) + (b.rotZ ?? 0),
    posX: (a.posX ?? 0) + (b.posX ?? 0),
    posY: (a.posY ?? 0) + (b.posY ?? 0),
    posZ: (a.posZ ?? 0) + (b.posZ ?? 0),
  };
}

/** 변환 값 스케일링 */
function scalePartTransform(transform: PartTransform, scale: number): PartTransform {
  return {
    rotX: (transform.rotX ?? 0) * scale,
    rotY: (transform.rotY ?? 0) * scale,
    rotZ: (transform.rotZ ?? 0) * scale,
    posX: (transform.posX ?? 0) * scale,
    posY: (transform.posY ?? 0) * scale,
    posZ: (transform.posZ ?? 0) * scale,
  };
}

// ===== 메인 애니메이션 믹서 클래스 =====

export class AnimationMixer implements IAnimationMixer {
  private config: AnimationMixerConfig;
  private layers: Map<string, AnimationLayer> = new Map();
  private layerOrder: string[] = [];
  private lastUpdateTime: number = 0;
  
  // 결과 캐시
  private cachedTransforms: PartsTransformMap = {};
  private cachedColorOverlay: string | undefined;
  private cachedScale: number = 1;
  private isDirty: boolean = true;
  
  constructor(config: Partial<AnimationMixerConfig> = {}) {
    this.config = {
      defaultTransitionDuration: config.defaultTransitionDuration ?? 200,
      defaultEasing: config.defaultEasing ?? 'easeInOut',
      maxLayers: config.maxLayers ?? 4,
    };
    
    // 기본 베이스 레이어 생성
    this.addLayer({
      id: 'base',
      name: 'Base Layer',
      weight: 1,
      blendMode: 'override',
    });
    
    this.lastUpdateTime = performance.now();
  }
  
  // ===== 레이어 관리 =====
  
  addLayer(config: Partial<AnimationLayer>): AnimationLayer {
    if (this.layers.size >= this.config.maxLayers) {
      console.warn('[AnimationMixer] Max layers reached');
      const existingLayer = this.layers.get(config.id ?? 'base');
      if (existingLayer) return existingLayer;
    }
    
    const layer: AnimationLayer = {
      id: config.id ?? `layer_${Date.now()}`,
      name: config.name ?? 'Unnamed Layer',
      weight: config.weight ?? 1,
      mask: config.mask,
      blendMode: config.blendMode ?? 'override',
      currentClip: undefined,
      transitionClip: undefined,
    };
    
    this.layers.set(layer.id, layer);
    this.layerOrder.push(layer.id);
    this.isDirty = true;
    
    return layer;
  }
  
  removeLayer(layerId: string): void {
    if (layerId === 'base') {
      console.warn('[AnimationMixer] Cannot remove base layer');
      return;
    }
    
    this.layers.delete(layerId);
    this.layerOrder = this.layerOrder.filter(id => id !== layerId);
    this.isDirty = true;
  }
  
  getLayer(layerId: string): AnimationLayer | undefined {
    return this.layers.get(layerId);
  }
  
  setLayerWeight(layerId: string, weight: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.weight = clamp(weight, 0, 1);
      this.isDirty = true;
    }
  }
  
  // ===== 클립 재생 =====
  
  play(
    layerId: string, 
    clip: AnimationClipName | VoxelAnimationSequence, 
    options: PlayClipOptions = {}
  ): void {
    const layer = this.layers.get(layerId);
    if (!layer) {
      console.warn(`[AnimationMixer] Layer not found: ${layerId}`);
      return;
    }
    
    const sequence = getClipSequence(clip);
    layer.currentClip = createClipInstance(sequence, options);
    layer.transitionClip = undefined;
    this.isDirty = true;
  }
  
  stop(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (layer?.currentClip) {
      layer.currentClip.isPlaying = false;
    }
  }
  
  fadeOut(layerId: string, duration?: number): void {
    const layer = this.layers.get(layerId);
    if (!layer?.currentClip) return;
    
    layer.currentClip.fadeOut = duration ?? this.config.defaultTransitionDuration;
    layer.currentClip.fadeDirection = 'out';
    this.isDirty = true;
  }
  
  // ===== 전환 =====
  
  crossFade(
    layerId: string, 
    toClip: AnimationClipName | VoxelAnimationSequence, 
    config: Partial<TransitionConfig> = {}
  ): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;
    
    const duration = config.duration ?? this.config.defaultTransitionDuration;
    const sequence = getClipSequence(toClip);
    
    // 현재 클립을 전환 클립으로 이동
    if (layer.currentClip) {
      layer.transitionClip = layer.currentClip;
      layer.transitionClip.fadeDirection = 'out';
      layer.transitionClip.fadeOut = duration;
    }
    
    // 새 클립 생성
    layer.currentClip = createClipInstance(sequence, {
      fadeIn: duration,
    });
    
    this.isDirty = true;
  }
  
  // ===== 업데이트 =====
  
  update(deltaTime: number): void {
    const now = performance.now();
    
    for (const layer of this.layers.values()) {
      this.updateLayerClips(layer, deltaTime);
    }
    
    this.lastUpdateTime = now;
    this.isDirty = true;
  }
  
  private updateLayerClips(layer: AnimationLayer, deltaTime: number): void {
    // 현재 클립 업데이트
    if (layer.currentClip) {
      this.updateClipInstance(layer.currentClip, deltaTime);
      
      // 페이드 아웃 완료 체크
      if (layer.currentClip.fadeDirection === 'out' && layer.currentClip.currentFade <= 0) {
        layer.currentClip = undefined;
      }
    }
    
    // 전환 클립 업데이트
    if (layer.transitionClip) {
      this.updateClipInstance(layer.transitionClip, deltaTime);
      
      // 페이드 아웃 완료시 제거
      if (layer.transitionClip.fadeDirection === 'out' && layer.transitionClip.currentFade <= 0) {
        layer.transitionClip = undefined;
      }
    }
  }
  
  private updateClipInstance(clip: AnimationClipInstance, deltaTime: number): void {
    if (!clip.isPlaying) return;
    
    const sequence = clip.sequence;
    const duration = sequence.duration;
    
    // 진행률 업데이트
    const progressDelta = (deltaTime * clip.speed) / duration;
    clip.progress += progressDelta;
    
    // 루프 처리
    if (sequence.loop) {
      clip.progress = clip.progress % 1;
    } else if (clip.progress >= 1) {
      clip.progress = 1;
      clip.isPlaying = false;
    }
    
    // 페이드 업데이트
    if (clip.fadeDirection === 'in') {
      const fadeDelta = deltaTime / clip.fadeIn;
      clip.currentFade = clamp(clip.currentFade + fadeDelta, 0, 1);
      if (clip.currentFade >= 1) {
        clip.fadeDirection = 'none';
      }
    } else if (clip.fadeDirection === 'out') {
      const fadeDelta = deltaTime / clip.fadeOut;
      clip.currentFade = clamp(clip.currentFade - fadeDelta, 0, 1);
    }
  }
  
  // ===== 결과 =====
  
  getBlendedTransforms(): PartsTransformMap {
    if (!this.isDirty) {
      return this.cachedTransforms;
    }
    
    let result: PartsTransformMap = {};
    
    // 레이어 순서대로 블렌딩
    for (const layerId of this.layerOrder) {
      const layer = this.layers.get(layerId);
      if (!layer || layer.weight <= 0) continue;
      
      const layerTransforms = this.getLayerTransforms(layer);
      result = this.blendLayerTransforms(result, layerTransforms, layer);
    }
    
    this.cachedTransforms = result;
    this.updateCachedEffects();
    this.isDirty = false;
    
    return result;
  }
  
  private getLayerTransforms(layer: AnimationLayer): PartsTransformMap {
    let transforms: PartsTransformMap = {};
    
    // 전환 클립 변환
    if (layer.transitionClip && layer.transitionClip.currentFade > 0) {
      const transitionTransforms = calculateTransformsAtProgress(
        layer.transitionClip.sequence,
        layer.transitionClip.progress
      );
      const weight = layer.transitionClip.currentFade * layer.transitionClip.weight;
      transforms = this.applyWeight(transitionTransforms, weight);
    }
    
    // 현재 클립 변환
    if (layer.currentClip) {
      const currentTransforms = calculateTransformsAtProgress(
        layer.currentClip.sequence,
        layer.currentClip.progress
      );
      const weight = layer.currentClip.currentFade * layer.currentClip.weight;
      
      // 전환 중이면 블렌딩
      if (layer.transitionClip && layer.transitionClip.currentFade > 0) {
        transforms = interpolateTransforms(transforms, currentTransforms, weight);
      } else {
        transforms = this.applyWeight(currentTransforms, weight);
      }
    }
    
    return transforms;
  }
  
  private blendLayerTransforms(
    base: PartsTransformMap, 
    layer: PartsTransformMap, 
    layerConfig: AnimationLayer
  ): PartsTransformMap {
    const result: PartsTransformMap = { ...base };
    const allParts = new Set([...Object.keys(base), ...Object.keys(layer)]);
    
    for (const part of allParts) {
      // 마스크 체크
      if (layerConfig.mask && !layerConfig.mask.includes(part)) {
        continue;
      }
      
      const baseTransform = base[part] ?? {};
      const layerTransform = layer[part] ?? {};
      const weight = layerConfig.weight;
      
      switch (layerConfig.blendMode) {
        case 'override':
          result[part] = interpolateTransforms(
            { [part]: baseTransform }, 
            { [part]: layerTransform }, 
            weight
          )[part] ?? {};
          break;
          
        case 'additive':
          result[part] = addPartTransform(
            baseTransform, 
            scalePartTransform(layerTransform, weight)
          );
          break;
          
        case 'multiply':
          // 곱하기 모드 (주로 스케일에 사용)
          result[part] = {
            rotX: (baseTransform.rotX ?? 0) * (1 + (layerTransform.rotX ?? 0) * weight),
            rotY: (baseTransform.rotY ?? 0) * (1 + (layerTransform.rotY ?? 0) * weight),
            rotZ: (baseTransform.rotZ ?? 0) * (1 + (layerTransform.rotZ ?? 0) * weight),
            posX: (baseTransform.posX ?? 0) * (1 + (layerTransform.posX ?? 0) * weight),
            posY: (baseTransform.posY ?? 0) * (1 + (layerTransform.posY ?? 0) * weight),
            posZ: (baseTransform.posZ ?? 0) * (1 + (layerTransform.posZ ?? 0) * weight),
          };
          break;
      }
    }
    
    return result;
  }
  
  private applyWeight(transforms: PartsTransformMap, weight: number): PartsTransformMap {
    if (weight >= 1) return transforms;
    
    const result: PartsTransformMap = {};
    for (const [part, transform] of Object.entries(transforms)) {
      result[part] = scalePartTransform(transform, weight);
    }
    return result;
  }
  
  private updateCachedEffects(): void {
    // 색상 오버레이 (가장 최근 레이어의 값 사용)
    this.cachedColorOverlay = undefined;
    for (const layerId of [...this.layerOrder].reverse()) {
      const layer = this.layers.get(layerId);
      if (!layer?.currentClip || layer.weight <= 0) continue;
      
      const clip = layer.currentClip;
      const keyframes = clip.sequence.keyframes;
      
      for (let i = keyframes.length - 1; i >= 0; i--) {
        if (clip.progress >= keyframes[i].time && keyframes[i].colorOverlay) {
          this.cachedColorOverlay = keyframes[i].colorOverlay;
          break;
        }
      }
      
      if (this.cachedColorOverlay) break;
    }
    
    // 스케일 (베이스 레이어 기준)
    this.cachedScale = 1;
    const baseLayer = this.layers.get('base');
    if (baseLayer?.currentClip) {
      const clip = baseLayer.currentClip;
      const keyframes = clip.sequence.keyframes;
      
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (clip.progress >= keyframes[i].time && clip.progress <= keyframes[i + 1].time) {
          const prevScale = keyframes[i].scale ?? 1;
          const nextScale = keyframes[i + 1].scale ?? 1;
          const t = (clip.progress - keyframes[i].time) / (keyframes[i + 1].time - keyframes[i].time || 1);
          this.cachedScale = prevScale + (nextScale - prevScale) * t;
          break;
        }
      }
    }
  }
  
  getColorOverlay(): string | undefined {
    if (this.isDirty) {
      this.getBlendedTransforms(); // 캐시 업데이트
    }
    return this.cachedColorOverlay;
  }
  
  getScale(): number {
    if (this.isDirty) {
      this.getBlendedTransforms(); // 캐시 업데이트
    }
    return this.cachedScale;
  }
  
  // ===== 상태 =====
  
  isTransitioning(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;
    return layer.transitionClip !== undefined || 
           (layer.currentClip?.fadeDirection !== 'none');
  }
  
  getCurrentClipName(layerId: string): string | undefined {
    const layer = this.layers.get(layerId);
    return layer?.currentClip?.sequence.name;
  }
  
  // ===== 정리 =====
  
  dispose(): void {
    this.layers.clear();
    this.layerOrder = [];
    this.cachedTransforms = {};
    this.cachedColorOverlay = undefined;
    this.cachedScale = 1;
  }
}

// ===== 팩토리 함수 =====

/** 기본 설정으로 믹서 생성 */
export function createAnimationMixer(config?: Partial<AnimationMixerConfig>): AnimationMixer {
  return new AnimationMixer(config);
}

/** 파츠별 레이어가 있는 믹서 생성 */
export function createLayeredMixer(): AnimationMixer {
  const mixer = new AnimationMixer();
  
  // 상체 레이어 (공격 등)
  mixer.addLayer({
    id: 'upper',
    name: 'Upper Body',
    weight: 0,
    mask: ['head', 'torso', 'rightArm', 'leftArm', 'weapon', 'shield'],
    blendMode: 'additive',
  });
  
  // 하체 레이어 (이동 등)
  mixer.addLayer({
    id: 'lower',
    name: 'Lower Body',
    weight: 0,
    mask: ['rightLeg', 'leftLeg'],
    blendMode: 'additive',
  });
  
  return mixer;
}

export default AnimationMixer;





