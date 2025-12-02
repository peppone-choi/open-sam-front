'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  TotalWarEngine, 
  TWSquad, 
  TWSoldier, 
  TWFormation, 
  TWStance,
  TWUnitCategory,
  FORMATION_CONFIG,
  Vector2,
} from '@/lib/battle/TotalWarEngine';
// 복셀 유닛
import { buildVoxelUnitFromSpec } from './units/VoxelUnitBuilder';
import { VOXEL_UNIT_DATABASE } from './units/db/VoxelUnitDefinitions';
// 최적화된 인스턴스 렌더러
import { InstancedUnitRenderer, createSquadMarker } from '@/lib/battle/InstancedUnitRenderer';
// VFX 시스템
import { BattleVFX, initBattleVFX } from '@/lib/battle/effects';
import styles from './TotalWarBattleMap.module.css';

// 복셀 유닛 스케일 (100명당 1유닛이므로 적당히 크게)
// 복셀 빌더: voxelSize = 0.02 * scale이므로 scale=1이면 1복셀=0.02 월드단위
// 인간형(48복셀높이) = 약 0.96 월드단위
const VOXEL_UNIT_SCALE = 1.5;

// ★ 병력 표시 스케일 (1 유닛 = 25명)
const TROOPS_PER_SOLDIER = 25;

// 국가별 색상 (hex)
const NATION_COLORS: Record<string, { primary: string; secondary: string }> = {
  wei: { primary: '#2F4F4F', secondary: '#4682B4' },  // 위: 청록/파랑
  wu: { primary: '#8B0000', secondary: '#CD5C5C' },   // 오: 붉은색
  shu: { primary: '#228B22', secondary: '#FFD700' },  // 촉: 녹색/금색
};

// ★ 지원군용 폴백 메시 생성 (컴포넌트 외부)
const createReinforcementFallbackMesh = (squad: TWSquad, nationKey: string): THREE.Group => {
  const group = new THREE.Group();
  
  const teamColor = nationKey === 'wei' ? 0x2F4F4F : 0x8B0000;
  const isCavalry = ['cavalry', 'shock_cavalry', 'horse_archer', 'chariot'].includes(squad.category);
  
  const bodyGeometry = isCavalry 
    ? new THREE.BoxGeometry(1.2, 1.2, 0.8) 
    : new THREE.BoxGeometry(0.6, 1.5, 0.4);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = isCavalry ? 0.8 : 0.75;
  body.castShadow = true;
  group.add(body);
  
  const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.5 });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = isCavalry ? 1.5 : 1.65;
  head.castShadow = true;
  group.add(head);
  
  return group;
};

// ========================================
// 타입 정의
// ========================================

interface BattleConfig {
  attackerSquads: SquadConfig[];
  defenderSquads: SquadConfig[];
  mapSize: { width: number; height: number };
}

interface SquadConfig {
  name: string;
  unitTypeId: number;
  category: TWUnitCategory;
  soldierCount: number;
  position: Vector2;
  facing: number;
  formation?: TWFormation;
  leadership?: number;
  strength?: number;
  intelligence?: number;
}

interface SoldierMeshData {
  mesh: THREE.Group;
  soldierId: string;
  squadId: string;
}

// ========================================
// 적벽대전 지원군 설정 (최적화)
// ========================================
const REINFORCEMENTS_CONFIG: { attacker: SquadConfig[]; defender: SquadConfig[] } = {
  attacker: [
    // 조조 본대 증원
    { name: '조조 친위대', unitTypeId: 1102, category: 'sword_infantry', soldierCount: 25, position: { x: 0, z: -85 }, facing: Math.PI, formation: 'line', leadership: 90, strength: 85 },
    { name: '호표기 (허저)', unitTypeId: 1304, category: 'shock_cavalry', soldierCount: 15, position: { x: -50, z: -80 }, facing: Math.PI * 0.8, formation: 'wedge', leadership: 85, strength: 95 },
  ],
  defender: [
    // 유비군 증원
    { name: '관우 청룡대', unitTypeId: 1104, category: 'halberd_infantry', soldierCount: 25, position: { x: 70, z: 80 }, facing: -Math.PI * 0.7, formation: 'line', leadership: 95, strength: 98 },
    { name: '장비 연환마', unitTypeId: 1304, category: 'shock_cavalry', soldierCount: 12, position: { x: 50, z: 85 }, facing: -Math.PI * 0.6, formation: 'wedge', leadership: 88, strength: 96 },
  ],
};

// ========================================
// 컴포넌트
// ========================================

export default function TotalWarBattleMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<TotalWarEngine | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const soldierMeshesRef = useRef<Map<string, SoldierMeshData>>(new Map());
  const squadMarkersRef = useRef<Map<string, THREE.Group>>(new Map());
  const selectionBoxRef = useRef<THREE.Mesh | null>(null);
  const battleLinesRef = useRef<THREE.Line[]>([]);
  const animationFrameRef = useRef<number>(0);
  // 최적화된 인스턴스 렌더러
  const instancedRendererRef = useRef<InstancedUnitRenderer | null>(null);
  // VFX 시스템
  const vfxRef = useRef<BattleVFX | null>(null);
  const [useInstancedRendering, setUseInstancedRendering] = useState(true);
  const [renderMetrics, setRenderMetrics] = useState({ drawCalls: 0, instancesRendered: 0 });
  const [vfxEnabled, setVfxEnabled] = useState(true);
  
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const [battleState, setBattleState] = useState<'preparing' | 'running' | 'paused' | 'ended'>('preparing');
  const [battleTime, setBattleTime] = useState(0);
  const [attackerStats, setAttackerStats] = useState({ alive: 0, total: 0, kills: 0 });
  const [defenderStats, setDefenderStats] = useState({ alive: 0, total: 0, kills: 0 });
  // ★ 전황 점수
  const [battleScore, setBattleScore] = useState({ attackerScore: 50, defenderScore: 50, momentum: 0 });
  // ★ 지원군 시스템
  const [reinforcementsAvailable, setReinforcementsAvailable] = useState({ attacker: true, defender: true });
  const [selectedFormation, setSelectedFormation] = useState<TWFormation>('line');
  const [selectedStance, setSelectedStance] = useState<TWStance>('defensive');
  const [showBattleLines, setShowBattleLines] = useState(true);
  const [battleSpeed, setBattleSpeed] = useState(1);
  
  // useRef로 최신 상태 참조 (애니메이션 루프에서 사용)
  const battleStateRef = useRef(battleState);
  const battleSpeedRef = useRef(battleSpeed);
  
  // 상태 변경 시 ref도 업데이트
  useEffect(() => {
    battleStateRef.current = battleState;
  }, [battleState]);
  
  useEffect(() => {
    battleSpeedRef.current = battleSpeed;
  }, [battleSpeed]);
  
  // ========================================
  // 초기화
  // ========================================
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 이미 렌더러가 있으면 제거 (StrictMode 대응)
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.domElement.remove();
      rendererRef.current = null;
    }
    
    // 기존 메시 정리
    soldierMeshesRef.current.clear();
    squadMarkersRef.current.clear();
    
    // ========================================
    // 내부 함수 정의
    // ========================================
    
    // 지면 생성
    const createGroundFn = (scene: THREE.Scene) => {
      const groundGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4a7c3f,
        roughness: 0.8,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
      
      const gridHelper = new THREE.GridHelper(400, 40, 0x000000, 0x333333);
      gridHelper.position.y = 0.01;
      (gridHelper.material as THREE.Material).opacity = 0.2;
      (gridHelper.material as THREE.Material).transparent = true;
      scene.add(gridHelper);
    };
    
    // 초기 부대 생성 - ★ 적벽대전 데모 (동등 병종/스탯)
    const createInitialSquadsFn = (engine: TotalWarEngine) => {
      // ========================================
      // 조조군 (위나라) - 북쪽 (밀집 배치)
      // ★ facing = 0 (남쪽을 향해 손오연합을 바라봄)
      // ========================================
      const attackerConfigs: SquadConfig[] = [
        // 전열: 보병 4개 (간격 축소: 12 단위)
        { name: '장료 도검대', unitTypeId: 1102, category: 'sword_infantry', soldierCount: 35, position: { x: -18, z: -25 }, facing: 0, formation: 'line', leadership: 80, strength: 80 },
        { name: '서황 극병대', unitTypeId: 1104, category: 'halberd_infantry', soldierCount: 35, position: { x: -6, z: -25 }, facing: 0, formation: 'line', leadership: 80, strength: 80 },
        { name: '이전 창병대', unitTypeId: 1103, category: 'ji_infantry', soldierCount: 35, position: { x: 6, z: -25 }, facing: 0, formation: 'line', leadership: 80, strength: 80 },
        { name: '하후돈 방패대', unitTypeId: 1106, category: 'spear_guard', soldierCount: 35, position: { x: 18, z: -25 }, facing: 0, formation: 'shield_wall', leadership: 80, strength: 80 },
        
        // 후열: 원거리 2개 + 예비 1개 (밀집)
        { name: '위나라 궁병대', unitTypeId: 1201, category: 'archer', soldierCount: 25, position: { x: -12, z: -35 }, facing: 0, formation: 'loose', leadership: 70, strength: 70 },
        { name: '조인 예비대', unitTypeId: 1102, category: 'sword_infantry', soldierCount: 30, position: { x: 0, z: -35 }, facing: 0, formation: 'line', leadership: 80, strength: 80 },
        { name: '위나라 노병대', unitTypeId: 1202, category: 'crossbow', soldierCount: 25, position: { x: 12, z: -35 }, facing: 0, formation: 'loose', leadership: 70, strength: 70 },
        
        // 측면 기병 2개 (좀 더 가까이) - 약간 안쪽으로 향함
        { name: '하후연 기병대', unitTypeId: 1300, category: 'cavalry', soldierCount: 15, position: { x: -30, z: -28 }, facing: Math.PI * 0.2, formation: 'wedge', leadership: 80, strength: 80 },
        { name: '조창 돌격대', unitTypeId: 1304, category: 'shock_cavalry', soldierCount: 15, position: { x: 30, z: -28 }, facing: -Math.PI * 0.2, formation: 'wedge', leadership: 80, strength: 80 },
      ];
      
      // ========================================
      // 손오 연합군 - 남쪽 (밀집 배치)
      // ★ facing = Math.PI (북쪽을 향해 조조군을 바라봄)
      // ========================================
      const defenderConfigs: SquadConfig[] = [
        // 전열: 보병 4개 (간격 축소: 12 단위)
        { name: '감녕 도검대', unitTypeId: 1102, category: 'sword_infantry', soldierCount: 35, position: { x: -18, z: 25 }, facing: Math.PI, formation: 'line', leadership: 80, strength: 80 },
        { name: '능통 극병대', unitTypeId: 1104, category: 'halberd_infantry', soldierCount: 35, position: { x: -6, z: 25 }, facing: Math.PI, formation: 'line', leadership: 80, strength: 80 },
        { name: '정보 창병대', unitTypeId: 1103, category: 'ji_infantry', soldierCount: 35, position: { x: 6, z: 25 }, facing: Math.PI, formation: 'line', leadership: 80, strength: 80 },
        { name: '주태 방패대', unitTypeId: 1106, category: 'spear_guard', soldierCount: 35, position: { x: 18, z: 25 }, facing: Math.PI, formation: 'shield_wall', leadership: 80, strength: 80 },
        
        // 후열: 원거리 2개 + 예비 1개 (밀집)
        { name: '오나라 궁병대', unitTypeId: 1201, category: 'archer', soldierCount: 25, position: { x: -12, z: 35 }, facing: Math.PI, formation: 'loose', leadership: 70, strength: 70 },
        { name: '주유 예비대', unitTypeId: 1102, category: 'sword_infantry', soldierCount: 30, position: { x: 0, z: 35 }, facing: Math.PI, formation: 'line', leadership: 80, strength: 80 },
        { name: '오나라 노병대', unitTypeId: 1202, category: 'crossbow', soldierCount: 25, position: { x: 12, z: 35 }, facing: Math.PI, formation: 'loose', leadership: 70, strength: 70 },
        
        // 측면 기병 2개 (좀 더 가까이) - 약간 안쪽으로 향함
        { name: '여몽 기병대', unitTypeId: 1300, category: 'cavalry', soldierCount: 15, position: { x: -30, z: 28 }, facing: Math.PI * 0.8, formation: 'wedge', leadership: 80, strength: 80 },
        { name: '태사자 돌격대', unitTypeId: 1304, category: 'shock_cavalry', soldierCount: 15, position: { x: 30, z: 28 }, facing: Math.PI * 1.2, formation: 'wedge', leadership: 80, strength: 80 },
      ];
      
      attackerConfigs.forEach(config => {
        engine.createSquad({ ...config, teamId: 'attacker' });
      });
      
      defenderConfigs.forEach(config => {
        engine.createSquad({ ...config, teamId: 'defender' });
      });
    };
    
    // 병사 메시 생성 (복셀 유닛 사용) - 기존 방식 (useInstancedRendering=false일 때만 사용)
    const createSoldierMeshesFn = (engine: TotalWarEngine, scene: THREE.Scene) => {
      const soldiers = engine.getAllSoldiers();
      const squads = engine.getAllSquads();
      
      console.log('Creating voxel meshes for', soldiers.length, 'soldiers (legacy mode)');
      
      // 유닛 타입별 복셀 캐시 (성능 최적화)
      const voxelCache = new Map<string, THREE.Group>();
      
      soldiers.forEach(soldier => {
        const squad = squads.find(s => s.id === soldier.squadId);
        if (!squad) return;
        
        // 국가 색상 결정
        const nationKey = squad.teamId === 'attacker' ? 'wei' : 'wu';
        const colors = NATION_COLORS[nationKey];
        const cacheKey = `${squad.unitTypeId}-${nationKey}`;
        
        let voxelUnit: THREE.Group;
        
        // 캐시에서 복셀 유닛 찾기 또는 생성
        if (voxelCache.has(cacheKey)) {
          // 캐시된 유닛 복제
          voxelUnit = voxelCache.get(cacheKey)!.clone();
        } else {
          // 새 복셀 유닛 생성
          const unitSpec = VOXEL_UNIT_DATABASE[squad.unitTypeId];
          
          if (unitSpec) {
            try {
              voxelUnit = buildVoxelUnitFromSpec({
                unitId: squad.unitTypeId,
                primaryColor: colors.primary,
                secondaryColor: colors.secondary,
                scale: VOXEL_UNIT_SCALE,
              });
              // 캐시에 저장 (원본 보관)
              voxelCache.set(cacheKey, voxelUnit.clone());
              console.log(`Built voxel unit ${squad.unitTypeId} for ${nationKey}`);
            } catch (e) {
              console.warn(`Failed to build voxel for unit ${squad.unitTypeId}:`, e);
              voxelUnit = createFallbackMesh(squad, nationKey);
            }
          } else {
            // 유닛 스펙이 없으면 폴백 메시 사용
            console.warn(`Unit spec not found for ${squad.unitTypeId}, using fallback`);
            voxelUnit = createFallbackMesh(squad, nationKey);
          }
        }
        
        // 위치 설정
        voxelUnit.position.set(soldier.position.x, 0, soldier.position.z);
        voxelUnit.rotation.y = soldier.facing;
        
        scene.add(voxelUnit);
        
        soldierMeshesRef.current.set(soldier.id, {
          mesh: voxelUnit,
          soldierId: soldier.id,
          squadId: soldier.squadId,
        });
      });
      
      console.log('Created', soldierMeshesRef.current.size, 'voxel soldier meshes');
    };
    
    // 최적화된 인스턴스 렌더링 초기화
    const initInstancedRenderingFn = (engine: TotalWarEngine, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
      const soldiers = engine.getAllSoldiers();
      const squads = engine.getAllSquads();
      
      console.log('🚀 Initializing instanced rendering for', soldiers.length, 'soldiers');
      
      // InstancedUnitRenderer 생성
      const renderer = new InstancedUnitRenderer(scene, camera);
      renderer.initializeFromSquads(squads, soldiers);
      instancedRendererRef.current = renderer;
      
      const metrics = renderer.getMetrics();
      console.log('✅ Instanced rendering initialized:', {
        drawCalls: metrics.drawCalls,
        instances: metrics.instancesRendered,
      });
    };
    
    // 폴백 메시 생성 (복셀 유닛 생성 실패 시)
    const createFallbackMesh = (squad: TWSquad, nationKey: string): THREE.Group => {
      const group = new THREE.Group();
      
      const teamColor = nationKey === 'wei' ? 0x2F4F4F : 0x8B0000;
      const isCavalry = ['cavalry', 'shock_cavalry', 'horse_archer', 'chariot'].includes(squad.category);
      
      const bodyGeometry = isCavalry 
        ? new THREE.BoxGeometry(1.2, 1.2, 0.8) 
        : new THREE.BoxGeometry(0.6, 1.5, 0.4);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.7 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = isCavalry ? 0.8 : 0.75;
      body.castShadow = true;
      group.add(body);
      
      const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const headMaterial = new THREE.MeshStandardMaterial({ color: 0xDEB887 });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = isCavalry ? 1.6 : 1.6;
      head.castShadow = true;
      group.add(head);
      
      if (isCavalry) {
        const horseGeometry = new THREE.BoxGeometry(0.6, 0.5, 1.5);
        const horseMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
        const horse = new THREE.Mesh(horseGeometry, horseMaterial);
        horse.position.set(0, 0.4, 0);
        group.add(horse);
      }
      
      return group;
    };
    
    // 부대 마커 생성
    const createSquadMarkersFn = (engine: TotalWarEngine, scene: THREE.Scene) => {
      const squads = engine.getAllSquads();
      
      squads.forEach(squad => {
        const markerGroup = new THREE.Group();
        
        const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
        const flagPoleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
        flagPole.position.y = 2.5;
        markerGroup.add(flagPole);
        
        const flagGeometry = new THREE.PlaneGeometry(3, 2);
        const flagColor = squad.teamId === 'attacker' ? 0x2F4F4F : 0x8B0000;
        const flagMaterial = new THREE.MeshStandardMaterial({ color: flagColor, side: THREE.DoubleSide });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(1.5, 4, 0);
        markerGroup.add(flag);
        
        const arrowShape = new THREE.Shape();
        arrowShape.moveTo(0, 2);
        arrowShape.lineTo(-1, 0);
        arrowShape.lineTo(1, 0);
        arrowShape.closePath();
        
        const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: flagColor, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.rotation.x = -Math.PI / 2;
        arrow.position.y = 0.1;
        arrow.scale.set(2, 2, 2);
        markerGroup.add(arrow);
        
        markerGroup.position.set(squad.position.x, 0, squad.position.z);
        markerGroup.rotation.y = squad.facing;
        
        scene.add(markerGroup);
        squadMarkersRef.current.set(squad.id, markerGroup);
      });
    };
    
    // 통계 업데이트
    const updateStatsFn = (engine: TotalWarEngine) => {
      const squads = engine.getAllSquads();
      
      const attackerSquads = squads.filter(s => s.teamId === 'attacker');
      const defenderSquads = squads.filter(s => s.teamId === 'defender');
      
      setAttackerStats({
        alive: attackerSquads.reduce((acc, s) => acc + s.aliveSoldiers, 0),
        total: attackerSquads.reduce((acc, s) => acc + s.soldiers.length, 0),
        kills: attackerSquads.reduce((acc, s) => acc + s.kills, 0),
      });
      
      setDefenderStats({
        alive: defenderSquads.reduce((acc, s) => acc + s.aliveSoldiers, 0),
        total: defenderSquads.reduce((acc, s) => acc + s.soldiers.length, 0),
        kills: defenderSquads.reduce((acc, s) => acc + s.kills, 0),
      });
      
      // ★ 전황 점수 업데이트
      const score = engine.getBattleScore();
      setBattleScore({
        attackerScore: score.attackerScore,
        defenderScore: score.defenderScore,
        momentum: score.momentum,
      });
    };
    
    // ========================================
    // Three.js 초기화
    // ========================================
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 100, 500);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 80, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 20;
    controls.maxDistance = 200;
    controlsRef.current = controls;
    
    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    scene.add(directionalLight);
    
    // 지면
    createGroundFn(scene);
    
    // VFX 시스템 초기화
    const vfx = initBattleVFX(scene, camera, containerRef.current);
    vfxRef.current = vfx;
    
    // 전투 엔진 초기화
    const engine = new TotalWarEngine();
    engineRef.current = engine;
    
    // 초기 부대 생성
    createInitialSquadsFn(engine);
    
    // 병사 메시 생성 (인스턴스 렌더링 또는 기존 방식)
    if (useInstancedRendering) {
      initInstancedRenderingFn(engine, scene, camera);
    } else {
      createSoldierMeshesFn(engine, scene);
    }
    
    // 부대 마커 생성
    createSquadMarkersFn(engine, scene);
    
    // 초기 통계 업데이트
    updateStatsFn(engine);
    
    // 선택 박스
    const selectionGeometry = new THREE.RingGeometry(2, 2.5, 32);
    const selectionMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const selectionBox = new THREE.Mesh(selectionGeometry, selectionMaterial);
    selectionBox.rotation.x = -Math.PI / 2;
    selectionBox.visible = false;
    scene.add(selectionBox);
    selectionBoxRef.current = selectionBox;
    
    // 이벤트 리스너
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    const handleClick = (event: MouseEvent) => {
      handleMapClick(event);
    };
    
    const handleRightClick = (event: MouseEvent) => {
      event.preventDefault();
      handleMapRightClick(event);
    };
    
    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('contextmenu', handleRightClick);
    
    // 애니메이션 루프
    let lastTime = performance.now();
    
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) * battleSpeedRef.current;
      lastTime = currentTime;
      
      // 전투 업데이트 (ref를 통해 최신 상태 참조)
      if (battleStateRef.current === 'running' && engineRef.current) {
        // VFX 시스템 업데이트
        if (vfxRef.current) {
          const vfxDeltaTime = deltaTime / 1000; // ms -> s
          vfxRef.current.update(vfxDeltaTime);
          
          // 카메라 위치를 리스너 위치로 업데이트
          vfxRef.current.updateListenerPosition(camera.position);
        }
        
        engineRef.current.update(deltaTime);
        
        // 인스턴스 렌더링 모드에서 위치 업데이트
        if (instancedRendererRef.current) {
          const soldiers = engineRef.current.getAllSoldiers();
          const squads = engineRef.current.getAllSquads();
          instancedRendererRef.current.updateAllPositions(soldiers, squads);
          
          // 3초마다 메트릭 업데이트
          if (Math.floor(Date.now() / 3000) % 2 === 0) {
            const metrics = instancedRendererRef.current.getMetrics();
            setRenderMetrics({
              drawCalls: metrics.drawCalls,
              instancesRendered: metrics.instancesRendered,
            });
          }
        } else {
          updateSoldierPositionsFn();
        }
        
        // VFX 이벤트 처리 (전투 이벤트에서 VFX 트리거)
        if (vfxRef.current) {
          const state = engineRef.current.getState();
          processVFXEvents(state.events, vfxRef.current);
        }
        
        updateBattleLinesFn();
        updateStatsFn(engineRef.current);
        setBattleTime(prev => prev + deltaTime);
        
        // 승패 체크
        const state = engineRef.current.getState();
        if (state.winner) {
          setBattleState('ended');
          // 승리/패배 VFX
          if (vfxRef.current) {
            if (state.winner === 'attacker') {
              vfxRef.current.victory();
            } else {
              vfxRef.current.defeat();
            }
          }
        }
      }
      
      // 선택 박스 업데이트
      updateSelectionBoxFn();
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    // 병사 위치 업데이트 함수
    const updateSoldierPositionsFn = () => {
      if (!engineRef.current) return;
      
      const soldiers = engineRef.current.getAllSoldiers();
      const squads = engineRef.current.getAllSquads();
      
      // 디버그: 첫 번째 병사 위치 출력 (2초마다)
      if (soldiers.length > 0 && Math.floor(Date.now() / 2000) % 2 === 0) {
        const firstSoldier = soldiers[0];
        const firstSquad = squads[0];
        const firstMesh = soldierMeshesRef.current.get(firstSoldier.id);
        
        // 이동 중인 병사 찾기
        const movingSoldier = soldiers.find(s => s.state === 'moving' || s.state === 'charging');
        
        console.log('Battle Debug:', {
          soldier: {
            id: firstSoldier.id,
            state: firstSoldier.state,
            pos: `(${firstSoldier.position.x.toFixed(1)}, ${firstSoldier.position.z.toFixed(1)})`,
            target: firstSoldier.targetPosition ? `(${firstSoldier.targetPosition.x.toFixed(1)}, ${firstSoldier.targetPosition.z.toFixed(1)})` : 'none',
          },
          squad: {
            state: firstSquad?.state,
            pos: `(${firstSquad?.position.x.toFixed(1)}, ${firstSquad?.position.z.toFixed(1)})`,
            targetPos: firstSquad?.targetPosition ? `(${firstSquad.targetPosition.x.toFixed(1)}, ${firstSquad.targetPosition.z.toFixed(1)})` : 'none',
          },
          movingSoldiers: soldiers.filter(s => s.state === 'moving' || s.state === 'charging').length,
          fightingSoldiers: soldiers.filter(s => s.state === 'fighting').length,
          deadSoldiers: soldiers.filter(s => s.state === 'dead').length,
        });
      }
      
      let updatedCount = 0;
      const toRemove: string[] = [];
      
      soldiers.forEach(soldier => {
        const meshData = soldierMeshesRef.current.get(soldier.id);
        if (!meshData) {
          return;
        }
        
        const { mesh } = meshData;
        
        if (soldier.state === 'dead') {
          // 죽은 병사: 잠시 쓰러진 모습 보여준 후 제거
          if (!mesh.userData.deathTime) {
            mesh.userData.deathTime = Date.now();
            // 쓰러지는 애니메이션
            mesh.rotation.z = Math.PI / 2;
            mesh.position.y = 0.2;
          }
          
          const timeSinceDeath = Date.now() - mesh.userData.deathTime;
          
          // 1초 후 페이드 아웃 시작, 2초 후 완전 제거 (더 빠르게)
          if (timeSinceDeath > 1000) {
            const fadeProgress = Math.min(1, (timeSinceDeath - 1000) / 1000);
            mesh.traverse(obj => {
              if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
                obj.material.opacity = 1 - fadeProgress;
                obj.material.transparent = true;
              }
            });
            
            if (fadeProgress >= 1) {
              toRemove.push(soldier.id);
            }
          }
        } else {
          // 살아있는 병사: 메시 위치 직접 설정
          mesh.position.set(soldier.position.x, 0, soldier.position.z);
          mesh.rotation.y = soldier.facing;
          mesh.rotation.z = 0;
          mesh.position.y = 0;
          updatedCount++;
        }
      });
      
      // 죽은 병사 메시 제거
      toRemove.forEach(soldierId => {
        const meshData = soldierMeshesRef.current.get(soldierId);
        if (meshData && sceneRef.current) {
          sceneRef.current.remove(meshData.mesh);
          // 메모리 정리
          meshData.mesh.traverse(obj => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose();
              if (obj.material instanceof THREE.Material) {
                obj.material.dispose();
              }
            }
          });
          soldierMeshesRef.current.delete(soldierId);
        }
      });
      
      // 괴멸된 부대 마커 제거
      squads.forEach(squad => {
        if (squad.state === 'destroyed' || squad.aliveSoldiers === 0) {
          const marker = squadMarkersRef.current.get(squad.id);
          if (marker && sceneRef.current) {
            sceneRef.current.remove(marker);
            squadMarkersRef.current.delete(squad.id);
          }
        }
      });
      
      // 디버그: 업데이트된 메시 수
      if (updatedCount > 0 && Math.floor(Date.now() / 3000) % 2 === 0) {
        console.log(`Updated ${updatedCount} meshes, total soldiers: ${soldiers.length}, meshes in ref: ${soldierMeshesRef.current.size}`);
      }
      
      // 부대 마커 업데이트
      squads.forEach(squad => {
        const marker = squadMarkersRef.current.get(squad.id);
        if (marker) {
          marker.position.x = squad.position.x;
          marker.position.z = squad.position.z;
          marker.rotation.y = squad.facing;
          marker.updateMatrix();
          marker.updateMatrixWorld(true);
        }
      });
    };
    
    // VFX 이벤트 처리 함수
    const processedEventIds = new Set<string>();
    const processVFXEvents = (events: Array<{ time: number; type: string; data: Record<string, unknown> }>, vfx: BattleVFX) => {
      for (const event of events) {
        const eventId = `${event.time}-${event.type}-${JSON.stringify(event.data)}`;
        if (processedEventIds.has(eventId)) continue;
        processedEventIds.add(eventId);
        
        switch (event.type) {
          case 'kill': {
            // 사망 이펙트
            const targetId = event.data.targetId as string;
            const target = engineRef.current?.getSoldier(targetId);
            if (target) {
              const pos = new THREE.Vector3(target.position.x, 0.5, target.position.z);
              vfx.soldierDeath(pos);
            }
            break;
          }
          case 'charge': {
            // 돌격 이펙트
            const squadId = event.data.squadId as string;
            const squad = engineRef.current?.getSquad(squadId);
            if (squad) {
              const pos = new THREE.Vector3(squad.position.x, 1, squad.position.z);
              vfx.battleCry(pos);
            }
            break;
          }
          case 'rout': {
            // 패주 이펙트
            const squadId = event.data.squadId as string;
            const squad = engineRef.current?.getSquad(squadId);
            if (squad) {
              const pos = new THREE.Vector3(squad.position.x, 0, squad.position.z);
              vfx.particles.emitDust(pos, 2);
            }
            break;
          }
        }
        
        // 오래된 이벤트 ID 정리 (10초 이상)
        if (processedEventIds.size > 1000) {
          processedEventIds.clear();
        }
      }
    };
    
    // 전선 업데이트 함수
    const updateBattleLinesFn = () => {
      // 기존 전선 제거
      battleLinesRef.current.forEach(line => scene.remove(line));
      battleLinesRef.current = [];
      
      if (!showBattleLines || !engineRef.current) return;
      
      const squads = engineRef.current.getAllSquads();
      const attackerSquads = squads.filter(s => s.teamId === 'attacker' && s.aliveSoldiers > 0);
      const defenderSquads = squads.filter(s => s.teamId === 'defender' && s.aliveSoldiers > 0);
      
      // 교전 중인 부대 간 전선 표시
      attackerSquads.forEach(attacker => {
        defenderSquads.forEach(defender => {
          const dist = Math.sqrt(
            Math.pow(attacker.position.x - defender.position.x, 2) +
            Math.pow(attacker.position.z - defender.position.z, 2)
          );
          
          if (dist < 30) {
            const points = [
              new THREE.Vector3(attacker.position.x, 0.5, attacker.position.z),
              new THREE.Vector3(defender.position.x, 0.5, defender.position.z),
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
            battleLinesRef.current.push(line);
          }
        });
      });
    };
    
    // 선택 박스 업데이트 함수
    const updateSelectionBoxFn = () => {
      if (!selectionBoxRef.current || !engineRef.current) return;
      
      if (selectedSquadId) {
        const squad = engineRef.current.getAllSquads().find(s => s.id === selectedSquadId);
        if (squad) {
          selectionBoxRef.current.position.set(squad.position.x, 0.1, squad.position.z);
          selectionBoxRef.current.visible = true;
        } else {
          selectionBoxRef.current.visible = false;
        }
      } else {
        selectionBoxRef.current.visible = false;
      }
    };
    
    animate();
    
    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('contextmenu', handleRightClick);
      cancelAnimationFrame(animationFrameRef.current);
      
      // VFX 시스템 정리
      if (vfxRef.current) {
        vfxRef.current.dispose();
        vfxRef.current = null;
      }
      
      // 인스턴스 렌더러 정리
      if (instancedRendererRef.current) {
        instancedRendererRef.current.dispose();
        instancedRendererRef.current = null;
      }
      
      // 메시 정리 (기존 방식)
      soldierMeshesRef.current.forEach(data => {
        scene.remove(data.mesh);
        data.mesh.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      });
      
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [useInstancedRendering]);
  
  
  
  // ========================================
  // 클릭 핸들러
  // ========================================
  
  const handleMapClick = (event: MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !engineRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    
    // 부대 선택
    const squads = engineRef.current.getAllSquads();
    let clickedSquadId: string | null = null;
    
    for (const squad of squads) {
      const distance = Math.sqrt(
        Math.pow(squad.position.x - getWorldPosition(raycaster).x, 2) +
        Math.pow(squad.position.z - getWorldPosition(raycaster).z, 2)
      );
      
      if (distance < squad.width * squad.spacing) {
        clickedSquadId = squad.id;
        break;
      }
    }
    
    setSelectedSquadId(clickedSquadId);
  };
  
  const handleMapRightClick = (event: MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !engineRef.current || !selectedSquadId) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    
    const worldPos = getWorldPosition(raycaster);
    
    // 적 부대 클릭 시 공격 명령
    const squads = engineRef.current.getAllSquads();
    const selectedSquad = engineRef.current.getSquad(selectedSquadId);
    if (!selectedSquad) return;
    
    let targetEnemy: TWSquad | null = null;
    
    for (const squad of squads) {
      if (squad.teamId === selectedSquad.teamId) continue;
      
      const distance = Math.sqrt(
        Math.pow(squad.position.x - worldPos.x, 2) +
        Math.pow(squad.position.z - worldPos.z, 2)
      );
      
      if (distance < squad.width * squad.spacing) {
        targetEnemy = squad;
        break;
      }
    }
    
    if (targetEnemy) {
      // 공격 명령
      engineRef.current.issueCommand(selectedSquadId, { type: 'attack', targetId: targetEnemy.id });
    } else {
      // 이동 명령
      engineRef.current.issueCommand(selectedSquadId, { type: 'move', target: worldPos });
    }
  };
  
  const getWorldPosition = (raycaster: THREE.Raycaster): Vector2 => {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    return { x: intersection.x, z: intersection.z };
  };
  
  // ========================================
  // 컨트롤 핸들러
  // ========================================
  
  const handleStartBattle = async () => {
    if (engineRef.current) {
      // VFX 사운드 시스템 초기화 (사용자 상호작용 필요)
      if (vfxRef.current) {
        await vfxRef.current.initializeSound();
        vfxRef.current.battleStart();
      }
      
      engineRef.current.startBattle();
      setBattleState('running');
    }
  };
  
  const handlePauseBattle = () => {
    if (engineRef.current) {
      if (battleState === 'running') {
        engineRef.current.pauseBattle();
        setBattleState('paused');
      } else if (battleState === 'paused') {
        engineRef.current.resumeBattle();
        setBattleState('running');
      }
    }
  };
  
  const handleFormationChange = (formation: TWFormation) => {
    setSelectedFormation(formation);
    if (selectedSquadId && engineRef.current) {
      engineRef.current.setFormation(selectedSquadId, formation);
    }
  };
  
  const handleStanceChange = (stance: TWStance) => {
    setSelectedStance(stance);
    if (selectedSquadId && engineRef.current) {
      engineRef.current.setStance(selectedSquadId, stance);
    }
  };
  
  // ★ 지원군 도착 함수
  const handleReinforcements = (teamId: 'attacker' | 'defender') => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    const renderer = instancedRendererRef.current;
    
    if (!engine || !scene) return;
    
    const reinforcements = REINFORCEMENTS_CONFIG[teamId];
    if (reinforcements.length === 0) return;
    
    console.log(`🚀 ${teamId === 'attacker' ? '위나라' : '오나라'} 지원군 도착!`);
    
    // 지원군 부대 ID 기록용
    const existingSoldierIds = new Set(engine.getAllSoldiers().map(s => s.id));
    
    // 지원군 부대 생성
    reinforcements.forEach(config => {
      engine.createSquad({ ...config, teamId });
    });
    
    // ★ 인스턴스 렌더러 재초기화 (새 부대 포함)
    if (renderer && useInstancedRendering) {
      renderer.dispose();
      const newRenderer = new InstancedUnitRenderer(scene, cameraRef.current!);
      newRenderer.initializeFromSquads(engine.getAllSquads(), engine.getAllSoldiers());
      instancedRendererRef.current = newRenderer;
    } else if (!useInstancedRendering) {
      // ★ 일반 렌더링 모드: 새 병사들에 대해 메시 생성
      const allSoldiers = engine.getAllSoldiers();
      const allSquads = engine.getAllSquads();
      const voxelCache = new Map<string, THREE.Group>();
      
      // 새로 추가된 병사들만 메시 생성
      allSoldiers.forEach(soldier => {
        if (existingSoldierIds.has(soldier.id)) return; // 기존 병사는 스킵
        
        const squad = allSquads.find(s => s.id === soldier.squadId);
        if (!squad) return;
        
        const nationKey = squad.teamId === 'attacker' ? 'wei' : 'wu';
        const colors = NATION_COLORS[nationKey];
        const cacheKey = `${squad.unitTypeId}-${nationKey}`;
        
        let voxelUnit: THREE.Group;
        
        // 캐시에서 복셀 유닛 찾기 또는 생성
        if (voxelCache.has(cacheKey)) {
          voxelUnit = voxelCache.get(cacheKey)!.clone();
        } else {
          const unitSpec = VOXEL_UNIT_DATABASE[squad.unitTypeId];
          
          if (unitSpec) {
            try {
              voxelUnit = buildVoxelUnitFromSpec({
                unitId: squad.unitTypeId,
                primaryColor: colors.primary,
                secondaryColor: colors.secondary,
                scale: VOXEL_UNIT_SCALE,
              });
              voxelCache.set(cacheKey, voxelUnit.clone());
            } catch (e) {
              console.warn(`Failed to build voxel for reinforcement unit ${squad.unitTypeId}:`, e);
              // 폴백 메시 생성
              voxelUnit = createReinforcementFallbackMesh(squad, nationKey);
            }
          } else {
            voxelUnit = createReinforcementFallbackMesh(squad, nationKey);
          }
        }
        
        // 위치 설정
        voxelUnit.position.set(soldier.position.x, 0, soldier.position.z);
        voxelUnit.rotation.y = soldier.facing;
        
        scene.add(voxelUnit);
        
        soldierMeshesRef.current.set(soldier.id, {
          mesh: voxelUnit,
          soldierId: soldier.id,
          squadId: soldier.squadId,
        });
      });
      
      console.log(`Added ${allSoldiers.length - existingSoldierIds.size} reinforcement meshes`);
    }
    
    // 지원군 사용 완료
    setReinforcementsAvailable(prev => ({ ...prev, [teamId]: false }));
    
    // 통계 즉시 업데이트
    const squads = engine.getAllSquads();
    const attackerSquads = squads.filter(s => s.teamId === 'attacker');
    const defenderSquads = squads.filter(s => s.teamId === 'defender');
    
    setAttackerStats({
      alive: attackerSquads.reduce((acc, s) => acc + s.aliveSoldiers, 0),
      total: attackerSquads.reduce((acc, s) => acc + s.soldiers.length, 0),
      kills: attackerSquads.reduce((acc, s) => acc + s.kills, 0),
    });
    setDefenderStats({
      alive: defenderSquads.reduce((acc, s) => acc + s.aliveSoldiers, 0),
      total: defenderSquads.reduce((acc, s) => acc + s.soldiers.length, 0),
      kills: defenderSquads.reduce((acc, s) => acc + s.kills, 0),
    });
  };
  
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // ========================================
  // 렌더링
  // ========================================
  
  const selectedSquad = selectedSquadId && engineRef.current 
    ? engineRef.current.getSquad(selectedSquadId) 
    : null;
  
  return (
    <div className={styles.container}>
      <div ref={containerRef} className={styles.canvas} />
      
      {/* 상단 HUD */}
      <div className={styles.topHud}>
        <div className={styles.teamStats}>
          <div className={styles.attackerStats}>
            <span className={styles.teamName}>🏴 조조군 (위)</span>
            <span className={styles.soldiers}>{(attackerStats.alive * TROOPS_PER_SOLDIER).toLocaleString()} / {(attackerStats.total * TROOPS_PER_SOLDIER).toLocaleString()}</span>
            <span className={styles.kills}>💀 {(attackerStats.kills * TROOPS_PER_SOLDIER).toLocaleString()}</span>
          </div>
          <div className={styles.centerPanel}>
            <div className={styles.battleTime}>{formatTime(battleTime)}</div>
            {/* ★ 전황 게이지 */}
            <div className={styles.battleScoreBar}>
              <div 
                className={styles.attackerScoreFill} 
                style={{ width: `${battleScore.attackerScore}%` }}
              />
              <div 
                className={styles.defenderScoreFill} 
                style={{ width: `${battleScore.defenderScore}%` }}
              />
              <div className={styles.scoreCenter}>
                {battleScore.momentum > 10 ? '▶▶' : battleScore.momentum < -10 ? '◀◀' : '◆'}
              </div>
            </div>
            <div className={styles.scoreLabels}>
              <span className={styles.attackerScoreLabel}>{Math.round(battleScore.attackerScore)}</span>
              <span className={styles.scoreTitle}>전황</span>
              <span className={styles.defenderScoreLabel}>{Math.round(battleScore.defenderScore)}</span>
            </div>
          </div>
          <div className={styles.defenderStats}>
            <span className={styles.teamName}>🚩 손오 연합</span>
            <span className={styles.soldiers}>{(defenderStats.alive * TROOPS_PER_SOLDIER).toLocaleString()} / {(defenderStats.total * TROOPS_PER_SOLDIER).toLocaleString()}</span>
            <span className={styles.kills}>💀 {(defenderStats.kills * TROOPS_PER_SOLDIER).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* 전투 컨트롤 */}
      <div className={styles.battleControls}>
        {battleState === 'preparing' && (
          <button className={styles.startButton} onClick={handleStartBattle}>
            ⚔️ 전투 시작
          </button>
        )}
        {(battleState === 'running' || battleState === 'paused') && (
          <button className={styles.pauseButton} onClick={handlePauseBattle}>
            {battleState === 'running' ? '⏸️ 일시정지' : '▶️ 재개'}
          </button>
        )}
        {battleState === 'ended' && (
          <div className={styles.victoryBanner}>
            🏆 {engineRef.current?.getState().winner === 'attacker' ? '조조군 승리! 천하통일!' : '손오 연합 승리! 적벽대첩!'} 
          </div>
        )}
        
        <div className={styles.speedControl}>
          <span>속도:</span>
          <button onClick={() => setBattleSpeed(0.5)} className={battleSpeed === 0.5 ? styles.active : ''}>0.5x</button>
          <button onClick={() => setBattleSpeed(1)} className={battleSpeed === 1 ? styles.active : ''}>1x</button>
          <button onClick={() => setBattleSpeed(2)} className={battleSpeed === 2 ? styles.active : ''}>2x</button>
          <button onClick={() => setBattleSpeed(4)} className={battleSpeed === 4 ? styles.active : ''}>4x</button>
        </div>
        
        <label className={styles.checkbox}>
          <input 
            type="checkbox" 
            checked={showBattleLines} 
            onChange={e => setShowBattleLines(e.target.checked)} 
          />
          전선 표시
        </label>
        
        <label className={styles.checkbox}>
          <input 
            type="checkbox" 
            checked={useInstancedRendering} 
            onChange={e => setUseInstancedRendering(e.target.checked)} 
          />
          최적화 렌더링
        </label>
        
        <label className={styles.checkbox}>
          <input 
            type="checkbox" 
            checked={vfxEnabled} 
            onChange={e => setVfxEnabled(e.target.checked)} 
          />
          VFX 효과
        </label>
        
        {useInstancedRendering && (
          <div className={styles.metrics}>
            DC: {renderMetrics.drawCalls} | 유닛: {renderMetrics.instancesRendered}
          </div>
        )}
        
        {/* ★ 지원군 버튼 */}
        {battleState === 'running' && (
          <div className={styles.reinforcements}>
            {reinforcementsAvailable.attacker && (
              <button 
                className={styles.reinforceBtn}
                style={{ borderColor: '#4682B4' }}
                onClick={() => handleReinforcements('attacker')}
              >
                🏴 조조 본대 도착!
              </button>
            )}
            {reinforcementsAvailable.defender && (
              <button 
                className={styles.reinforceBtn}
                style={{ borderColor: '#CD5C5C' }}
                onClick={() => handleReinforcements('defender')}
              >
                🚩 유비군 증원!
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* 부대 정보 패널 */}
      {selectedSquad && (
        <div className={styles.squadPanel}>
          <h3>{selectedSquad.name}</h3>
          <div className={styles.squadInfo}>
            <div className={styles.infoRow}>
              <span>병력:</span>
              <span>{(selectedSquad.aliveSoldiers * TROOPS_PER_SOLDIER).toLocaleString()} / {(selectedSquad.soldiers.length * TROOPS_PER_SOLDIER).toLocaleString()}</span>
            </div>
            <div className={styles.infoRow}>
              <span>사기:</span>
              <div className={styles.barContainer}>
                <div 
                  className={styles.moraleBar} 
                  style={{ 
                    width: `${selectedSquad.morale}%`,
                    backgroundColor: selectedSquad.morale > 50 ? '#4CAF50' : selectedSquad.morale > 25 ? '#FFC107' : '#F44336',
                  }} 
                />
              </div>
            </div>
            <div className={styles.infoRow}>
              <span>피로도:</span>
              <div className={styles.barContainer}>
                <div 
                  className={styles.fatigueBar} 
                  style={{ width: `${selectedSquad.fatigue}%` }} 
                />
              </div>
            </div>
            <div className={styles.infoRow}>
              <span>상태:</span>
              <span className={styles[selectedSquad.state]}>{selectedSquad.state}</span>
            </div>
          </div>
          
          <div className={styles.formationSelect}>
            <h4>진형</h4>
            <div className={styles.formationButtons}>
              {(['line', 'column', 'square', 'wedge', 'loose', 'shield_wall'] as TWFormation[]).map(f => (
                <button 
                  key={f}
                  className={selectedSquad.formation === f ? styles.active : ''}
                  onClick={() => handleFormationChange(f)}
                  title={FORMATION_CONFIG[f].description}
                >
                  {f === 'line' && '═══'}
                  {f === 'column' && '║'}
                  {f === 'square' && '□'}
                  {f === 'wedge' && '▲'}
                  {f === 'loose' && '···'}
                  {f === 'shield_wall' && '▬▬▬'}
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.stanceSelect}>
            <h4>자세</h4>
            <div className={styles.stanceButtons}>
              <button 
                className={selectedSquad.stance === 'aggressive' ? styles.active : ''}
                onClick={() => handleStanceChange('aggressive')}
              >
                ⚔️ 공격
              </button>
              <button 
                className={selectedSquad.stance === 'defensive' ? styles.active : ''}
                onClick={() => handleStanceChange('defensive')}
              >
                🛡️ 방어
              </button>
              <button 
                className={selectedSquad.stance === 'skirmish' ? styles.active : ''}
                onClick={() => handleStanceChange('skirmish')}
              >
                🏹 산개
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 조작법 안내 */}
      <div className={styles.helpPanel}>
        <p>좌클릭: 부대 선택 | 우클릭: 이동/공격 명령</p>
        <p>마우스 휠: 줌 | 드래그: 회전</p>
      </div>
    </div>
  );
}
