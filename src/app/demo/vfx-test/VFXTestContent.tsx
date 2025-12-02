'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  VFXManager, 
  initVFXManager,
  type VFXConfig,
  type VFXMetrics 
} from '@/lib/battle/vfx';
import TopBackBar from '@/components/common/TopBackBar';

/**
 * VFX 시스템 테스트 컴포넌트
 * - 투사체, 마법, 날씨, 화염 이펙트 테스트
 * - 성능 메트릭 모니터링
 */
export default function VFXTestContent() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const vfxManagerRef = useRef<VFXManager | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const [metrics, setMetrics] = useState<VFXMetrics>({
    activeProjectiles: 0,
    activeParticles: 0,
    activeEffects: 0,
    updateTime: 0,
    renderTime: 0,
    memoryUsage: 0,
  });
  const [fps, setFps] = useState(0);
  const [quality, setQuality] = useState<VFXConfig['quality']>('high');
  const [weatherType, setWeatherType] = useState<string>('clear');

  // 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    camera.position.set(20, 15, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d3436,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x333333);
    scene.add(gridHelper);
    
    // Target markers
    const markerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    for (let i = 0; i < 5; i++) {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
      marker.position.set(
        (Math.random() - 0.5) * 20,
        0.25,
        (Math.random() - 0.5) * 20
      );
      marker.name = `target_${i}`;
      scene.add(marker);
    }
    
    // VFX Manager 초기화
    const vfxManager = initVFXManager(scene, camera, { quality });
    vfxManagerRef.current = vfxManager;
    
    // Animation loop
    let frameCount = 0;
    let fpsTime = 0;
    
    const animate = (time: number) => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const deltaTime = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      
      // FPS 계산
      frameCount++;
      fpsTime += deltaTime;
      if (fpsTime >= 1) {
        setFps(Math.round(frameCount / fpsTime));
        frameCount = 0;
        fpsTime = 0;
      }
      
      // VFX 업데이트
      if (vfxManagerRef.current) {
        vfxManagerRef.current.update(deltaTime);
        
        // 메트릭 업데이트 (매 30프레임마다)
        if (frameCount % 30 === 0) {
          setMetrics(vfxManagerRef.current.getMetrics());
        }
      }
      
      renderer.render(scene, camera);
    };
    
    lastTimeRef.current = performance.now();
    animate(lastTimeRef.current);
    
    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      
      if (vfxManagerRef.current) {
        vfxManagerRef.current.dispose();
      }
      
      renderer.dispose();
      scene.clear();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 품질 변경
  useEffect(() => {
    if (vfxManagerRef.current) {
      vfxManagerRef.current.setQuality(quality);
    }
  }, [quality]);

  // 테스트 함수들
  const spawnArrowVolley = useCallback(() => {
    if (!vfxManagerRef.current) return;
    
    const positions = [];
    for (let i = 0; i < 20; i++) {
      positions.push({
        from: new THREE.Vector3(-15 + Math.random() * 5, 2, -15),
        to: new THREE.Vector3(Math.random() * 10 - 5, 0, Math.random() * 10 - 5),
      });
    }
    
    vfxManagerRef.current.spawnProjectileVolley('arrow', positions, {
      stagger: 50,
      onHit: (pos) => {
        vfxManagerRef.current?.spawnImpact('spark', pos);
      },
    });
  }, []);

  const spawnFireArrows = useCallback(() => {
    if (!vfxManagerRef.current) return;
    
    const positions = [];
    for (let i = 0; i < 15; i++) {
      positions.push({
        from: new THREE.Vector3(15 - Math.random() * 5, 2, -15),
        to: new THREE.Vector3(Math.random() * 10 - 5, 0, Math.random() * 10 - 5),
      });
    }
    
    vfxManagerRef.current.spawnProjectileVolley('fire_arrow', positions, {
      stagger: 80,
    });
  }, []);

  const spawnFireball = useCallback(() => {
    if (!vfxManagerRef.current) return;
    
    const from = new THREE.Vector3(-10, 2, -10);
    const to = new THREE.Vector3(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
    
    vfxManagerRef.current.spawnFireball(from, to, {
      scale: 1.5,
      onHit: (pos) => {
        vfxManagerRef.current?.spawnExplosion(pos, 2, {
          shockwave: true,
          fire: true,
        });
      },
    });
  }, []);

  const spawnLightning = useCallback(() => {
    if (!vfxManagerRef.current) return;
    
    const from = new THREE.Vector3(0, 20, 0);
    const to = new THREE.Vector3(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
    
    vfxManagerRef.current.spawnLightning(from, to, { branches: 3 });
  }, []);

  const spawnHealWave = useCallback(() => {
    if (!vfxManagerRef.current) return;
    
    const center = new THREE.Vector3(0, 0, 0);
    vfxManagerRef.current.spawnHealWave(center, 5);
  }, []);

  const spawnCurseAura = useCallback(() => {
    if (!vfxManagerRef.current) return;
    
    const target = new THREE.Vector3(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
    vfxManagerRef.current.spawnCurseAura(target, { duration: 3, radius: 2 });
  }, []);

  const spawnShield = useCallback(() => {
    if (!vfxManagerRef.current) return;
    
    const target = new THREE.Vector3(0, 1, 0);
    vfxManagerRef.current.spawnShield(target, 2, { duration: 5 });
  }, []);

  const spawnFire = useCallback(() => {
    if (!vfxManagerRef.current) return;
    
    const position = new THREE.Vector3(
      Math.random() * 10 - 5,
      0,
      Math.random() * 10 - 5
    );
    vfxManagerRef.current.spawnFire(position, {
      scale: 1.5,
      duration: 5,
      withSmoke: true,
    });
  }, []);

  const spawnExplosion = useCallback(() => {
    if (!vfxManagerRef.current) return;
    
    const position = new THREE.Vector3(
      Math.random() * 10 - 5,
      0,
      Math.random() * 10 - 5
    );
    vfxManagerRef.current.spawnExplosion(position, 2.5, {
      intensity: 1.5,
      shockwave: true,
      debris: true,
    });
  }, []);

  const changeWeather = useCallback((type: string) => {
    if (!vfxManagerRef.current) return;
    
    setWeatherType(type);
    if (type === 'clear') {
      vfxManagerRef.current.clearWeather();
    } else {
      vfxManagerRef.current.transitionWeather(type as any, 0.8, 2000);
    }
  }, []);

  const stressTest = useCallback(() => {
    if (!vfxManagerRef.current) return;
    
    // 100개 투사체 동시 발사
    const positions = [];
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 2;
      const radius = 15;
      positions.push({
        from: new THREE.Vector3(
          Math.cos(angle) * radius,
          3,
          Math.sin(angle) * radius
        ),
        to: new THREE.Vector3(
          Math.random() * 4 - 2,
          0,
          Math.random() * 4 - 2
        ),
      });
    }
    
    vfxManagerRef.current.spawnProjectileVolley('arrow', positions, {
      stagger: 20,
    });
  }, []);

  const clearAll = useCallback(() => {
    if (vfxManagerRef.current) {
      vfxManagerRef.current.clear();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <TopBackBar title="VFX 시스템 테스트" />
      
      <div className="p-4 flex flex-col lg:flex-row gap-4">
        {/* 3D 뷰어 */}
        <div 
          ref={containerRef}
          className="flex-1 h-[500px] lg:h-[700px] rounded-lg border border-white/10 overflow-hidden"
        />
        
        {/* 컨트롤 패널 */}
        <div className="w-full lg:w-80 space-y-4">
          {/* 메트릭 */}
          <div className="bg-gray-900/50 border border-white/5 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-white/5 pb-2">
              📊 성능 메트릭
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">FPS</span>
                <span className={fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
                  {fps}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">투사체</span>
                <span className="text-blue-400">{metrics.activeProjectiles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">파티클</span>
                <span className="text-purple-400">{metrics.activeParticles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">이펙트</span>
                <span className="text-orange-400">{metrics.activeEffects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">업데이트 시간</span>
                <span className="text-gray-300">{metrics.updateTime.toFixed(2)}ms</span>
              </div>
            </div>
          </div>

          {/* 품질 설정 */}
          <div className="bg-gray-900/50 border border-white/5 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-white/5 pb-2">
              ⚙️ 품질 설정
            </h3>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'ultra'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                    quality === q
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {q.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 투사체 */}
          <div className="bg-gray-900/50 border border-white/5 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-white/5 pb-2">
              🏹 투사체
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={spawnArrowVolley}
                className="py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded transition-colors"
              >
                화살 볼리
              </button>
              <button
                onClick={spawnFireArrows}
                className="py-2 bg-orange-900/50 hover:bg-orange-800/50 text-sm rounded transition-colors"
              >
                불화살
              </button>
            </div>
          </div>

          {/* 마법 이펙트 */}
          <div className="bg-gray-900/50 border border-white/5 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-white/5 pb-2">
              ✨ 마법 이펙트
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={spawnFireball}
                className="py-2 bg-red-900/50 hover:bg-red-800/50 text-sm rounded transition-colors"
              >
                화염구
              </button>
              <button
                onClick={spawnLightning}
                className="py-2 bg-cyan-900/50 hover:bg-cyan-800/50 text-sm rounded transition-colors"
              >
                번개
              </button>
              <button
                onClick={spawnHealWave}
                className="py-2 bg-green-900/50 hover:bg-green-800/50 text-sm rounded transition-colors"
              >
                치유 파동
              </button>
              <button
                onClick={spawnCurseAura}
                className="py-2 bg-purple-900/50 hover:bg-purple-800/50 text-sm rounded transition-colors"
              >
                저주 오라
              </button>
              <button
                onClick={spawnShield}
                className="py-2 bg-blue-900/50 hover:bg-blue-800/50 text-sm rounded transition-colors col-span-2"
              >
                보호막
              </button>
            </div>
          </div>

          {/* 화염/폭발 */}
          <div className="bg-gray-900/50 border border-white/5 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-white/5 pb-2">
              🔥 화염/폭발
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={spawnFire}
                className="py-2 bg-orange-900/50 hover:bg-orange-800/50 text-sm rounded transition-colors"
              >
                화염
              </button>
              <button
                onClick={spawnExplosion}
                className="py-2 bg-red-900/50 hover:bg-red-800/50 text-sm rounded transition-colors"
              >
                폭발
              </button>
            </div>
          </div>

          {/* 날씨 */}
          <div className="bg-gray-900/50 border border-white/5 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-white/5 pb-2">
              🌦️ 날씨 ({weatherType})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {['clear', 'rain', 'snow', 'fog', 'sandstorm'].map((w) => (
                <button
                  key={w}
                  onClick={() => changeWeather(w)}
                  className={`py-2 text-xs rounded transition-colors ${
                    weatherType === w
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {w === 'clear' ? '맑음' : 
                   w === 'rain' ? '비' :
                   w === 'snow' ? '눈' :
                   w === 'fog' ? '안개' : '모래폭풍'}
                </button>
              ))}
            </div>
          </div>

          {/* 테스트/초기화 */}
          <div className="bg-gray-900/50 border border-white/5 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-white/5 pb-2">
              🧪 테스트
            </h3>
            <div className="space-y-2">
              <button
                onClick={stressTest}
                className="w-full py-2 bg-yellow-900/50 hover:bg-yellow-800/50 text-sm rounded transition-colors"
              >
                🚀 스트레스 테스트 (100 투사체)
              </button>
              <button
                onClick={clearAll}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded transition-colors"
              >
                🗑️ 모두 지우기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


