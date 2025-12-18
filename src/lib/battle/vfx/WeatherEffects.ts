// @ts-nocheck
/**
 * WeatherEffects - 날씨 이펙트 시스템
 * 
 * 지원 타입:
 * - clear: 맑음 (이펙트 없음)
 * - rain: 비 (빗방울 파티클, 물웅덩이)
 * - snow: 눈 (눈송이 파티클, 안개)
 * - fog: 안개 (볼류메트릭 안개, 시야 제한)
 * - sandstorm: 모래폭풍 (모래 파티클, 색상 필터)
 */

import * as THREE from 'three';
import { VFXParticleSystem } from './ParticleSystem';

// ========================================
// 타입 정의
// ========================================

export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'sandstorm';

/** 날씨 설정 */
interface WeatherConfig {
  particleType: string;
  particleCount: number;
  emitRate: number;
  spawnArea: THREE.Vector3;
  spawnHeight: number;
  fogDensity: number;
  fogColor: number;
  ambientMultiplier: number;
  windStrength: number;
  windDirection: THREE.Vector3;
}

/** 날씨 상태 */
interface WeatherState {
  type: WeatherType;
  intensity: number;
  emitterId?: string;
  fogMesh?: THREE.Mesh;
  transitionProgress: number;
  targetIntensity: number;
  transitionDuration: number;
}

// ========================================
// 날씨 설정
// ========================================

const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  clear: {
    particleType: '',
    particleCount: 0,
    emitRate: 0,
    spawnArea: new THREE.Vector3(100, 0, 100),
    spawnHeight: 30,
    fogDensity: 0,
    fogColor: 0xFFFFFF,
    ambientMultiplier: 1,
    windStrength: 0,
    windDirection: new THREE.Vector3(1, 0, 0),
  },
  rain: {
    particleType: 'rain',
    particleCount: 100,
    emitRate: 500,
    spawnArea: new THREE.Vector3(80, 0, 80),
    spawnHeight: 25,
    fogDensity: 0.015,
    fogColor: 0x8899AA,
    ambientMultiplier: 0.7,
    windStrength: 3,
    windDirection: new THREE.Vector3(0.5, 0, 0.3),
  },
  snow: {
    particleType: 'snow',
    particleCount: 80,
    emitRate: 200,
    spawnArea: new THREE.Vector3(80, 0, 80),
    spawnHeight: 20,
    fogDensity: 0.02,
    fogColor: 0xDDDDEE,
    ambientMultiplier: 0.85,
    windStrength: 1.5,
    windDirection: new THREE.Vector3(0.3, 0, 0.2),
  },
  fog: {
    particleType: '',
    particleCount: 0,
    emitRate: 0,
    spawnArea: new THREE.Vector3(100, 0, 100),
    spawnHeight: 0,
    fogDensity: 0.05,
    fogColor: 0xAAAAAA,
    ambientMultiplier: 0.6,
    windStrength: 0.5,
    windDirection: new THREE.Vector3(0.1, 0, 0.1),
  },
  sandstorm: {
    particleType: 'sand',
    particleCount: 150,
    emitRate: 400,
    spawnArea: new THREE.Vector3(80, 20, 80),
    spawnHeight: 15,
    fogDensity: 0.04,
    fogColor: 0xC2B280,
    ambientMultiplier: 0.5,
    windStrength: 8,
    windDirection: new THREE.Vector3(1, 0, 0.2),
  },
};

// ========================================
// WeatherEffects 클래스
// ========================================

export class WeatherEffects {
  private scene: THREE.Scene;
  private particleSystem: VFXParticleSystem;
  
  // 현재 날씨 상태
  private currentState: WeatherState = {
    type: 'clear',
    intensity: 0,
    transitionProgress: 1,
    targetIntensity: 0,
    transitionDuration: 0,
  };
  
  // 안개 메시
  private fogVolumes: THREE.Mesh[] = [];
  private fogGeometry: THREE.PlaneGeometry;
  private fogMaterial: THREE.MeshBasicMaterial;
  
  // 환경 설정 백업
  private originalFog?: THREE.Fog | THREE.FogExp2 | null;
  private originalAmbient?: THREE.AmbientLight;
  
  // 품질 설정
  private qualityMultiplier = 1;
  
  // 스폰 영역
  private spawnCenter = new THREE.Vector3();
  
  constructor(scene: THREE.Scene, particleSystem: VFXParticleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    
    // 안개 지오메트리/머티리얼
    this.fogGeometry = new THREE.PlaneGeometry(200, 200);
    this.fogMaterial = new THREE.MeshBasicMaterial({
      color: 0xAAAAAA,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    
    this.initFogVolumes();
    
    // 원래 안개 설정 백업
    this.originalFog = this.scene.fog;
    this.findAmbientLight();
  }
  
  private initFogVolumes(): void {
    // 여러 층의 안개 평면 생성
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(this.fogGeometry, this.fogMaterial.clone());
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = i * 3 + 1;
      mesh.visible = false;
      this.scene.add(mesh);
      this.fogVolumes.push(mesh);
    }
  }
  
  private findAmbientLight(): void {
    this.scene.traverse((obj) => {
      if ((obj as THREE.AmbientLight).isAmbientLight) {
        this.originalAmbient = obj as THREE.AmbientLight;
      }
    });
  }
  
  // ========================================
  // 날씨 설정
  // ========================================
  
  /**
   * 날씨 즉시 설정
   */
  setWeather(type: WeatherType, intensity: number = 1): void {
    const config = WEATHER_CONFIGS[type];
    const clampedIntensity = Math.max(0, Math.min(1, intensity));
    
    // 기존 이미터 제거
    if (this.currentState.emitterId) {
      this.particleSystem.removeEmitter(this.currentState.emitterId);
      this.currentState.emitterId = undefined;
    }
    
    // 새 이미터 생성
    if (type !== 'clear' && type !== 'fog' && config.particleType) {
      const emitterId = this.particleSystem.createEmitter({
        type: config.particleType as any,
        position: this.spawnCenter.clone(),
        positionVariance: config.spawnArea.clone(),
        direction: new THREE.Vector3(0, -1, 0).add(
          config.windDirection.clone().multiplyScalar(config.windStrength * clampedIntensity)
        ),
        spread: 0.3,
        speed: config.particleType === 'rain' ? 25 : 3,
        size: config.particleType === 'rain' ? 0.03 : 0.06,
        life: config.particleType === 'rain' ? 1 : 4,
        color: config.particleType === 'sand' ? 0xC2B280 : 0xFFFFFF,
        count: Math.floor(config.particleCount * clampedIntensity * this.qualityMultiplier),
        continuous: true,
        emitRate: Math.floor(config.emitRate * clampedIntensity * this.qualityMultiplier),
      });
      
      this.currentState.emitterId = emitterId;
    }
    
    // 안개 설정
    this.updateFog(config, clampedIntensity);
    
    // 안개 볼륨 업데이트
    this.updateFogVolumes(config, clampedIntensity);
    
    // 환경광 조정
    this.updateAmbientLight(config, clampedIntensity);
    
    // 상태 업데이트
    this.currentState.type = type;
    this.currentState.intensity = clampedIntensity;
    this.currentState.transitionProgress = 1;
  }
  
  /**
   * 날씨 전환 (부드러운 전환)
   */
  transition(type: WeatherType, intensity: number, duration: number = 2000): void {
    this.currentState.targetIntensity = Math.max(0, Math.min(1, intensity));
    this.currentState.transitionDuration = duration / 1000;
    this.currentState.transitionProgress = 0;
    
    // 목표 날씨 타입이 다르면 중간에 clear 거쳐서 전환
    if (type !== this.currentState.type) {
      // 먼저 페이드 아웃
      setTimeout(() => {
        this.setWeather(type, intensity);
      }, duration / 2);
    }
  }
  
  /**
   * 날씨 제거
   */
  clear(): void {
    this.setWeather('clear', 0);
    
    // 원래 설정 복원
    this.scene.fog = this.originalFog || null;
  }
  
  // ========================================
  // 환경 업데이트
  // ========================================
  
  private updateFog(config: WeatherConfig, intensity: number): void {
    if (config.fogDensity > 0 && intensity > 0) {
      const density = config.fogDensity * intensity;
      this.scene.fog = new THREE.FogExp2(config.fogColor, density);
    } else {
      this.scene.fog = this.originalFog || null;
    }
  }
  
  private updateFogVolumes(config: WeatherConfig, intensity: number): void {
    const showFog = (config.type === 'fog' || config.type === 'sandstorm') && intensity > 0;
    
    for (let i = 0; i < this.fogVolumes.length; i++) {
      const mesh = this.fogVolumes[i];
      mesh.visible = showFog;
      
      if (showFog) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.color.setHex(config.fogColor);
        mat.opacity = 0.15 * intensity * (1 - i * 0.15);
        
        mesh.position.x = this.spawnCenter.x;
        mesh.position.z = this.spawnCenter.z;
      }
    }
  }
  
  private updateAmbientLight(config: WeatherConfig, intensity: number): void {
    if (!this.originalAmbient) return;
    
    const multiplier = THREE.MathUtils.lerp(1, config.ambientMultiplier, intensity);
    this.originalAmbient.intensity = multiplier;
  }
  
  // ========================================
  // 업데이트
  // ========================================
  
  /**
   * 프레임 업데이트
   */
  update(deltaTime: number, cameraPosition: THREE.Vector3): void {
    // 스폰 영역을 카메라 주변으로 유지
    this.spawnCenter.copy(cameraPosition);
    this.spawnCenter.y = WEATHER_CONFIGS[this.currentState.type].spawnHeight;
    
    // 이미터 위치 업데이트
    if (this.currentState.emitterId) {
      this.particleSystem.updateEmitterPosition(
        this.currentState.emitterId,
        this.spawnCenter
      );
    }
    
    // 안개 볼륨 위치 업데이트
    for (const mesh of this.fogVolumes) {
      if (mesh.visible) {
        mesh.position.x = cameraPosition.x;
        mesh.position.z = cameraPosition.z;
      }
    }
    
    // 전환 애니메이션
    if (this.currentState.transitionProgress < 1) {
      this.currentState.transitionProgress += deltaTime / this.currentState.transitionDuration;
      this.currentState.transitionProgress = Math.min(1, this.currentState.transitionProgress);
      
      const t = this.easeInOutQuad(this.currentState.transitionProgress);
      const newIntensity = THREE.MathUtils.lerp(
        this.currentState.intensity,
        this.currentState.targetIntensity,
        t
      );
      
      // 강도만 업데이트 (타입 변경은 별도 처리)
      this.updateIntensity(newIntensity);
    }
    
    // 바람 효과로 안개 볼륨 흔들림
    const config = WEATHER_CONFIGS[this.currentState.type];
    if (config.windStrength > 0) {
      const time = performance.now() * 0.001;
      for (let i = 0; i < this.fogVolumes.length; i++) {
        const mesh = this.fogVolumes[i];
        if (mesh.visible) {
          mesh.position.x += Math.sin(time + i) * config.windStrength * 0.1;
          mesh.position.z += Math.cos(time * 0.7 + i) * config.windStrength * 0.05;
        }
      }
    }
  }
  
  private updateIntensity(intensity: number): void {
    const config = WEATHER_CONFIGS[this.currentState.type];
    
    // 안개 밀도 업데이트
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = config.fogDensity * intensity;
    }
    
    // 안개 볼륨 투명도 업데이트
    for (let i = 0; i < this.fogVolumes.length; i++) {
      const mesh = this.fogVolumes[i];
      if (mesh.visible) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.15 * intensity * (1 - i * 0.15);
      }
    }
    
    // 환경광 업데이트
    this.updateAmbientLight(config, intensity);
    
    this.currentState.intensity = intensity;
  }
  
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  
  // ========================================
  // 특수 효과
  // ========================================
  
  /**
   * 번개 섬광 (폭풍우 시)
   */
  triggerLightningFlash(): void {
    if (this.currentState.type !== 'rain') return;
    
    // 화면 플래시
    const flashPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    flashPlane.position.copy(this.spawnCenter);
    flashPlane.position.y = 50;
    flashPlane.rotation.x = -Math.PI / 2;
    this.scene.add(flashPlane);
    
    // 페이드 아웃
    const startTime = performance.now();
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const opacity = Math.max(0, 0.8 - elapsed * 4);
      
      (flashPlane.material as THREE.MeshBasicMaterial).opacity = opacity;
      
      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(flashPlane);
        flashPlane.geometry.dispose();
        (flashPlane.material as THREE.Material).dispose();
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  /**
   * 바람 돌풍
   */
  triggerGust(direction: THREE.Vector3, strength: number = 2): void {
    // 일시적으로 바람 세기 증가
    const originalWind = WEATHER_CONFIGS[this.currentState.type].windStrength;
    WEATHER_CONFIGS[this.currentState.type].windStrength = originalWind * strength;
    
    // 추가 파티클
    if (this.currentState.type === 'sandstorm' || this.currentState.type === 'snow') {
      this.particleSystem.emit(
        this.currentState.type === 'sandstorm' ? 'sand' : 'snow',
        this.spawnCenter,
        100,
        {
          direction,
          speed: 15,
        }
      );
    }
    
    // 원래 바람 세기로 복원
    setTimeout(() => {
      WEATHER_CONFIGS[this.currentState.type].windStrength = originalWind;
    }, 1000);
  }
  
  // ========================================
  // 유틸리티
  // ========================================
  
  /**
   * 현재 날씨 조회
   */
  getCurrentWeather(): { type: WeatherType; intensity: number } {
    return {
      type: this.currentState.type,
      intensity: this.currentState.intensity,
    };
  }
  
  /**
   * 품질 설정
   */
  setQuality(multiplier: number): void {
    this.qualityMultiplier = Math.max(0.25, Math.min(2, multiplier));
    
    // 현재 날씨 다시 적용
    if (this.currentState.type !== 'clear') {
      this.setWeather(this.currentState.type, this.currentState.intensity);
    }
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.clear();
    
    // 안개 볼륨 제거
    for (const mesh of this.fogVolumes) {
      this.scene.remove(mesh);
      (mesh.material as THREE.Material).dispose();
    }
    this.fogVolumes = [];
    
    // 공유 리소스 정리
    this.fogGeometry.dispose();
    this.fogMaterial.dispose();
    
    // 원래 설정 복원
    this.scene.fog = this.originalFog || null;
    if (this.originalAmbient) {
      this.originalAmbient.intensity = 1;
    }
    
    console.log('🧹 WeatherEffects disposed');
  }
}

export default WeatherEffects;





