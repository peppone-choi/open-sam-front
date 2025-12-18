// @ts-nocheck
'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  VoxelFleet,
  VoxelFleetUnit,
  FACTION_COLORS,
  SHIPS_PER_UNIT,
  generateShipPositions,
  FormationType,
} from '@/lib/voxel/VoxelFleetData';

interface LaserBeam {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: number;
  progress: number; // 0-1
  duration: number;
}

interface Explosion {
  id: string;
  position: THREE.Vector3;
  progress: number;
  maxRadius: number;
  color: number;
}

interface VoxelFleetBattleProps {
  width?: number;
  height?: number;
  fleets: VoxelFleet[];
  onFleetSelect?: (fleetId: string) => void;
  onTargetSelect?: (attackerId: string, targetId: string) => void;
}

const MAX_SHIPS = 50000; // 최대 렌더링 함선 수 (성능 제한)
const VOXEL_BASE_SIZE = 0.15;

export default function VoxelFleetBattle({
  width = 1200,
  height = 800,
  fleets,
  onFleetSelect,
  onTargetSelect,
}: VoxelFleetBattleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // 함선 인스턴스 메시
  const empireShipsRef = useRef<THREE.InstancedMesh | null>(null);
  const allianceShipsRef = useRef<THREE.InstancedMesh | null>(null);
  const flagshipsRef = useRef<THREE.InstancedMesh | null>(null);

  // 이펙트
  const lasersRef = useRef<LaserBeam[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const laserMeshesRef = useRef<THREE.Line[]>([]);
  const explosionMeshesRef = useRef<THREE.Mesh[]>([]);

  const [selectedFleetId, setSelectedFleetId] = useState<string | null>(null);
  const [stats, setStats] = useState({ ships: 0, fps: 0 });

  // Three.js 초기화
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.FogExp2(0x000011, 0.002);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 100, 200);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 500;
    controls.minDistance = 20;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(100, 100, 50);
    scene.add(sunLight);

    // 별 배경
    createStarfield(scene);

    // 그리드 (전략 맵 참조용)
    const gridHelper = new THREE.GridHelper(400, 40, 0x1a1a3a, 0x0a0a2a);
    gridHelper.position.y = -50;
    scene.add(gridHelper);

    // 함선용 InstancedMesh 생성
    const boxGeometry = new THREE.BoxGeometry(VOXEL_BASE_SIZE, VOXEL_BASE_SIZE, VOXEL_BASE_SIZE);
    
    const empireMaterial = new THREE.MeshStandardMaterial({
      color: FACTION_COLORS.empire.primary,
      emissive: FACTION_COLORS.empire.primary,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    });
    
    const allianceMaterial = new THREE.MeshStandardMaterial({
      color: FACTION_COLORS.alliance.primary,
      emissive: FACTION_COLORS.alliance.primary,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    });

    const flagshipMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
      metalness: 1.0,
      roughness: 0.1,
    });

    empireShipsRef.current = new THREE.InstancedMesh(boxGeometry, empireMaterial, MAX_SHIPS / 2);
    allianceShipsRef.current = new THREE.InstancedMesh(boxGeometry, allianceMaterial, MAX_SHIPS / 2);
    flagshipsRef.current = new THREE.InstancedMesh(boxGeometry, flagshipMaterial, 100);

    empireShipsRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    allianceShipsRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    flagshipsRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    scene.add(empireShipsRef.current);
    scene.add(allianceShipsRef.current);
    scene.add(flagshipsRef.current);

    // 애니메이션 루프
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = lastTime;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // FPS 계산
      frameCount++;
      if (now - lastFpsUpdate > 1000) {
        setStats(prev => ({ ...prev, fps: frameCount }));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      controls.update();
      updateLasers(delta);
      updateExplosions(delta);
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, [width, height]);

  // 함대 데이터 업데이트 시 함선 위치 갱신
  useEffect(() => {
    updateShipInstances();
  }, [fleets]);

  const createStarfield = (scene: THREE.Scene) => {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2000;
      positions[i + 1] = (Math.random() - 0.5) * 2000;
      positions[i + 2] = (Math.random() - 0.5) * 2000;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  };

  const updateShipInstances = useCallback(() => {
    if (!empireShipsRef.current || !allianceShipsRef.current || !flagshipsRef.current) return;

    const empireMatrix = new THREE.Matrix4();
    const allianceMatrix = new THREE.Matrix4();
    const flagshipMatrix = new THREE.Matrix4();
    const scale = new THREE.Vector3();

    let empireIndex = 0;
    let allianceIndex = 0;
    let flagshipIndex = 0;
    let totalShips = 0;

    for (const fleet of fleets) {
      for (const unit of fleet.units) {
        const shipPositions = generateShipPositions(
          unit,
          fleet.formation,
          fleet.position,
          fleet.heading,
          1.0
        );

        for (const pos of shipPositions) {
          totalShips++;
          
          // 기함 여부 확인
          const isFlagship = unit.shipType === 'flagship';
          
          if (isFlagship && flagshipIndex < 100) {
            scale.set(pos.size * 3, pos.size * 3, pos.size * 3);
            flagshipMatrix.makeScale(scale.x, scale.y, scale.z);
            flagshipMatrix.setPosition(pos.x, pos.y, pos.z);
            flagshipsRef.current!.setMatrixAt(flagshipIndex++, flagshipMatrix);
          } else if (fleet.faction === 'empire' && empireIndex < MAX_SHIPS / 2) {
            scale.set(pos.size, pos.size, pos.size);
            empireMatrix.makeScale(scale.x, scale.y, scale.z);
            empireMatrix.setPosition(pos.x, pos.y, pos.z);
            empireShipsRef.current!.setMatrixAt(empireIndex++, empireMatrix);
          } else if (fleet.faction === 'alliance' && allianceIndex < MAX_SHIPS / 2) {
            scale.set(pos.size, pos.size, pos.size);
            allianceMatrix.makeScale(scale.x, scale.y, scale.z);
            allianceMatrix.setPosition(pos.x, pos.y, pos.z);
            allianceShipsRef.current!.setMatrixAt(allianceIndex++, allianceMatrix);
          }
        }
      }
    }

    // 나머지 인스턴스 숨기기 (스케일 0)
    const hideMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = empireIndex; i < MAX_SHIPS / 2; i++) {
      empireShipsRef.current.setMatrixAt(i, hideMatrix);
    }
    for (let i = allianceIndex; i < MAX_SHIPS / 2; i++) {
      allianceShipsRef.current.setMatrixAt(i, hideMatrix);
    }
    for (let i = flagshipIndex; i < 100; i++) {
      flagshipsRef.current.setMatrixAt(i, hideMatrix);
    }

    empireShipsRef.current.instanceMatrix.needsUpdate = true;
    allianceShipsRef.current.instanceMatrix.needsUpdate = true;
    flagshipsRef.current.instanceMatrix.needsUpdate = true;

    setStats(prev => ({ ...prev, ships: totalShips }));
  }, [fleets]);

  // 레이저 발사
  const fireLaser = useCallback((
    startFleetId: string,
    targetFleetId: string
  ) => {
    const startFleet = fleets.find(f => f.fleetId === startFleetId);
    const targetFleet = fleets.find(f => f.fleetId === targetFleetId);
    
    if (!startFleet || !targetFleet || !sceneRef.current) return;

    const start = new THREE.Vector3(
      startFleet.position.x,
      startFleet.position.y,
      startFleet.position.z
    );
    const end = new THREE.Vector3(
      targetFleet.position.x,
      targetFleet.position.y,
      targetFleet.position.z
    );

    const laserColor = FACTION_COLORS[startFleet.faction].laser;
    
    const laser: LaserBeam = {
      id: `laser-${Date.now()}-${Math.random()}`,
      start,
      end,
      color: laserColor,
      progress: 0,
      duration: 0.5,
    };

    lasersRef.current.push(laser);

    // 레이저 메시 생성
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
      color: laserColor,
      transparent: true,
      opacity: 1,
    });
    const line = new THREE.Line(geometry, material);
    (line as any).laserId = laser.id;
    sceneRef.current.add(line);
    laserMeshesRef.current.push(line);
  }, [fleets]);

  // 폭발 생성
  const createExplosion = useCallback((position: { x: number; y: number; z: number }, color: number = 0xff6600) => {
    if (!sceneRef.current) return;

    const explosion: Explosion = {
      id: `explosion-${Date.now()}-${Math.random()}`,
      position: new THREE.Vector3(position.x, position.y, position.z),
      progress: 0,
      maxRadius: 3,
      color,
    };

    explosionsRef.current.push(explosion);

    // 폭발 메시 생성
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(explosion.position);
    (mesh as any).explosionId = explosion.id;
    sceneRef.current.add(mesh);
    explosionMeshesRef.current.push(mesh);
  }, []);

  const updateLasers = (delta: number) => {
    if (!sceneRef.current) return;

    const toRemove: string[] = [];

    for (const laser of lasersRef.current) {
      laser.progress += delta / laser.duration;
      
      if (laser.progress >= 1) {
        toRemove.push(laser.id);
      }
    }

    // 완료된 레이저 제거
    for (const id of toRemove) {
      lasersRef.current = lasersRef.current.filter(l => l.id !== id);
      const mesh = laserMeshesRef.current.find(m => (m as any).laserId === id);
      if (mesh) {
        sceneRef.current.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        laserMeshesRef.current = laserMeshesRef.current.filter(m => m !== mesh);
      }
    }

    // 레이저 페이드아웃
    for (const mesh of laserMeshesRef.current) {
      const laser = lasersRef.current.find(l => l.id === (mesh as any).laserId);
      if (laser) {
        (mesh.material as THREE.LineBasicMaterial).opacity = 1 - laser.progress;
      }
    }
  };

  const updateExplosions = (delta: number) => {
    if (!sceneRef.current) return;

    const toRemove: string[] = [];

    for (const explosion of explosionsRef.current) {
      explosion.progress += delta * 2; // 빠른 폭발
      
      if (explosion.progress >= 1) {
        toRemove.push(explosion.id);
      }
    }

    // 완료된 폭발 제거
    for (const id of toRemove) {
      explosionsRef.current = explosionsRef.current.filter(e => e.id !== id);
      const mesh = explosionMeshesRef.current.find(m => (m as any).explosionId === id);
      if (mesh) {
        sceneRef.current.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        explosionMeshesRef.current = explosionMeshesRef.current.filter(m => m !== mesh);
      }
    }

    // 폭발 확장 및 페이드아웃
    for (const mesh of explosionMeshesRef.current) {
      const explosion = explosionsRef.current.find(e => e.id === (mesh as any).explosionId);
      if (explosion) {
        const scale = explosion.progress * explosion.maxRadius;
        mesh.scale.set(scale, scale, scale);
        (mesh.material as THREE.MeshBasicMaterial).opacity = 1 - explosion.progress;
      }
    }
  };

  // 데모용: 레이저 발사 테스트
  const handleTestFire = () => {
    if (fleets.length >= 2) {
      fireLaser(fleets[0].fleetId, fleets[1].fleetId);
      setTimeout(() => {
        createExplosion(fleets[1].position);
      }, 500);
    }
  };

  return (
    <div className="relative">
      <div ref={containerRef} style={{ width, height }} />
      
      {/* UI 오버레이 */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg font-mono text-sm">
        <div className="text-lg font-bold mb-2">은하영웅전설 - 복셀 함대전</div>
        <div>함선: {stats.ships.toLocaleString()} 척</div>
        <div>FPS: {stats.fps}</div>
        <div className="mt-2 text-xs text-gray-400">
          마우스 드래그: 회전 | 스크롤: 줌
        </div>
      </div>

      {/* 함대 정보 */}
      <div className="absolute top-4 right-4 bg-black/70 text-white p-4 rounded-lg max-w-xs">
        {fleets.map(fleet => (
          <div 
            key={fleet.fleetId}
            className={`mb-2 p-2 rounded cursor-pointer hover:bg-white/10 ${
              selectedFleetId === fleet.fleetId ? 'bg-white/20' : ''
            }`}
            onClick={() => {
              setSelectedFleetId(fleet.fleetId);
              onFleetSelect?.(fleet.fleetId);
            }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: `#${FACTION_COLORS[fleet.faction].primary.toString(16).padStart(6, '0')}`
                }}
              />
              <span className="font-bold">{fleet.name}</span>
            </div>
            <div className="text-xs text-gray-400 ml-5">
              {fleet.commanderName && <span>{fleet.commanderName} | </span>}
              {fleet.totalShips.toLocaleString()}척 | {fleet.formation}
            </div>
          </div>
        ))}
      </div>

      {/* 테스트 버튼 */}
      {fleets.length >= 2 && (
        <button
          onClick={handleTestFire}
          className="absolute bottom-4 left-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          레이저 발사 테스트
        </button>
      )}
    </div>
  );
}











