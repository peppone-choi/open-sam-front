'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  GridHelper,
  Mesh,
  Color,
  Vector3,
  Raycaster,
  Vector2,
  PlaneGeometry,
  MeshBasicMaterial,
  Group,
  MeshStandardMaterial,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
} from 'three';
import { 
  buildVoxelUnitFromSpec, 
  VOXEL_NATION_PALETTES,
  createAnimationController,
  applyAnimationToUnit,
  type VoxelAnimationController,
} from './units/VoxelUnitBuilder';
import { 
  VOXEL_UNIT_DATABASE,
  type VoxelAnimationState,
} from './units/db/VoxelUnitDefinitions';
import {
  BattleEngine,
  BattleUnit,
  BattleEvent,
  UnitType,
  Formation,
  Stance,
  TerrainType,
  categoryToUnitType,
} from '@/lib/battle/BattleEngine';
import styles from './VoxelBattleMap.module.css';

// ===== 상수 =====
const TROOPS_PER_VOXEL = 100; // 100명당 복셀 유닛 1개

// ===== 타입 정의 =====

interface VoxelBattleMapProps {
  width?: number;
  height?: number;
  attackerUnits?: InitialUnit[];
  defenderUnits?: InitialUnit[];
  terrain?: TerrainType;
  onBattleEnd?: (winner: 'attacker' | 'defender' | 'draw') => void;
}

interface InitialUnit {
  id: string;
  name: string;
  generalName: string;
  unitTypeId: number;
  nation: string;
  position: { x: number; z: number };
  troops: number;
  leadership: number;
  strength: number;
  intelligence: number;
  morale?: number;
  training?: number;
}

// 개별 복셀 병사 데이터
interface VoxelSoldier {
  id: string;
  parentUnitId: string;
  group: Group;
  animController: VoxelAnimationController;
  localOffset: { x: number; z: number }; // 부대 내 상대 위치
  isAlive: boolean;
}

// ===== 컴포넌트 =====

export default function VoxelBattleMap({
  width = 1200,
  height = 700,
  attackerUnits: initialAttackers,
  defenderUnits: initialDefenders,
  terrain = TerrainType.PLAIN,
  onBattleEnd,
}: VoxelBattleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  
  // 전투 엔진
  const engineRef = useRef<BattleEngine | null>(null);
  
  // 복셀 병사들
  const soldiersRef = useRef<Map<string, VoxelSoldier>>(new Map());
  
  // 투사체 메시
  const projectileMeshesRef = useRef<Map<string, Mesh>>(new Map());
  
  // UI 상태
  const [battlePhase, setBattlePhase] = useState<'preparation' | 'battle' | 'result'>('preparation');
  const [battleTime, setBattleTime] = useState(0);
  const [battleEvents, setBattleEvents] = useState<BattleEvent[]>([]);
  const [winner, setWinner] = useState<'attacker' | 'defender' | 'draw' | null>(null);
  const [unitStats, setUnitStats] = useState<Map<string, { troops: number; maxTroops: number; morale: number }>>(new Map());

  // 기본 유닛 데이터
  const defaultAttackers: InitialUnit[] = [
    { id: 'att-1', name: '정규보병', generalName: '조조', unitTypeId: 1102, nation: 'wei', position: { x: -8, z: -4 }, troops: 500, leadership: 95, strength: 70, intelligence: 90 },
    { id: 'att-2', name: '장궁병', generalName: '하후연', unitTypeId: 1201, nation: 'wei', position: { x: -8, z: 0 }, troops: 400, leadership: 80, strength: 85, intelligence: 60 },
    { id: 'att-3', name: '호표기', generalName: '조인', unitTypeId: 1304, nation: 'wei', position: { x: -8, z: 4 }, troops: 300, leadership: 85, strength: 90, intelligence: 50 },
  ];

  const defaultDefenders: InitialUnit[] = [
    { id: 'def-1', name: '촉한무위군', generalName: '유비', unitTypeId: 1127, nation: 'shu', position: { x: 8, z: -4 }, troops: 600, leadership: 90, strength: 75, intelligence: 80 },
    { id: 'def-2', name: '장궁병', generalName: '황충', unitTypeId: 1201, nation: 'shu', position: { x: 8, z: 0 }, troops: 350, leadership: 85, strength: 95, intelligence: 55 },
    { id: 'def-3', name: '경기병', generalName: '조운', unitTypeId: 1300, nation: 'shu', position: { x: 8, z: 4 }, troops: 250, leadership: 92, strength: 96, intelligence: 70 },
  ];

  const attackers = initialAttackers || defaultAttackers;
  const defenders = initialDefenders || defaultDefenders;

  // Three.js 및 전투 엔진 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // === Scene 설정 ===
    const scene = new Scene();
    scene.background = new Color(0x0a0a15);
    sceneRef.current = scene;

    // === Camera ===
    const aspect = width / height;
    const viewSize = 22;
    const camera = new OrthographicCamera(
      (-viewSize * aspect) / 2,
      (viewSize * aspect) / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      100
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // === Renderer ===
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // === Lights ===
    const ambient = new AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dirLight = new DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const backLight = new DirectionalLight(0x4488ff, 0.3);
    backLight.position.set(-10, 10, -10);
    scene.add(backLight);

    // === Grid ===
    const gridSize = 30;
    const grid = new GridHelper(gridSize, 30, 0x2d3748, 0x1a202c);
    scene.add(grid);

    // === Ground ===
    const groundGeo = new PlaneGeometry(gridSize, gridSize);
    const groundMat = new MeshBasicMaterial({ visible: false });
    const ground = new Mesh(groundGeo, groundMat);
    ground.rotateX(-Math.PI / 2);
    scene.add(ground);

    // === 전투 엔진 초기화 ===
    const engine = new BattleEngine({
      id: `battle-${Date.now()}`,
      terrain,
      attackerNation: attackers[0]?.nation || 'wei',
      defenderNation: defenders[0]?.nation || 'shu',
    });
    engineRef.current = engine;

    // 유닛 추가 함수
    const addUnitToEngine = (unit: InitialUnit, teamId: 'attacker' | 'defender') => {
      const unitSpec = VOXEL_UNIT_DATABASE[unit.unitTypeId];
      if (!unitSpec) return;

      engine.addUnit({
        id: unit.id,
        name: unit.name,
        generalName: unit.generalName,
        unitType: categoryToUnitType(unitSpec.category),
        unitTypeId: unit.unitTypeId,
        nation: unit.nation,
        teamId,
        position: unit.position,
        heading: teamId === 'attacker' ? 0 : Math.PI,
        moveSpeed: 3,
        troops: unit.troops,
        maxTroops: unit.troops,
        morale: unit.morale || 100,
        training: unit.training || 80,
        leadership: unit.leadership,
        strength: unit.strength,
        intelligence: unit.intelligence,
        formation: Formation.LINE,
        stance: Stance.BALANCED,
        state: 'idle',
      });
    };

    // 공격/방어 유닛 추가
    attackers.forEach(unit => addUnitToEngine(unit, 'attacker'));
    defenders.forEach(unit => addUnitToEngine(unit, 'defender'));

    // 복셀 병사 생성
    engine.getAllUnits().forEach(unit => {
      createSoldiersForUnit(scene, unit);
    });

    // 초기 유닛 상태 저장
    const initialStats = new Map<string, { troops: number; maxTroops: number; morale: number }>();
    engine.getAllUnits().forEach(unit => {
      initialStats.set(unit.id, { troops: unit.troops, maxTroops: unit.maxTroops, morale: unit.morale });
    });
    setUnitStats(initialStats);

    // 이벤트 리스너
    engine.on('damage', (event) => {
      setBattleEvents(prev => [...prev.slice(-20), event]);
      
      // 병사 제거
      const targetUnit = engine.getUnit(event.targetId!);
      if (targetUnit) {
        updateSoldiersForUnit(scene, targetUnit);
        
        // 상태 업데이트
        setUnitStats(prev => {
          const newStats = new Map(prev);
          newStats.set(targetUnit.id, {
            troops: targetUnit.troops,
            maxTroops: targetUnit.maxTroops,
            morale: targetUnit.morale,
          });
          return newStats;
        });
      }
    });

    engine.on('death', (event) => {
      setBattleEvents(prev => [...prev.slice(-20), event]);
    });

    engine.on('projectile', (event) => {
      createProjectileMesh(scene, event.data.projectileId, event.data.type);
    });

    // === 애니메이션 루프 ===
    let lastTime = Date.now();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // 전투 상태 업데이트
      const state = engine.getState();
      setBattleTime(state.currentTime);
      setBattlePhase(state.phase);
      
      if (state.winner && !winner) {
        setWinner(state.winner);
        onBattleEnd?.(state.winner);
      }

      // 복셀 병사 위치/애니메이션 업데이트
      engine.getAllUnits().forEach(unit => {
        updateSoldierPositions(unit, deltaTime);
      });

      // 투사체 업데이트
      engine.getProjectiles().forEach(proj => {
        const mesh = projectileMeshesRef.current.get(proj.id);
        if (mesh) {
          mesh.position.set(proj.position.x, 1, proj.position.z);
        }
      });

      // 사라진 투사체 제거
      const currentProjectileIds = new Set(engine.getProjectiles().map(p => p.id));
      projectileMeshesRef.current.forEach((mesh, id) => {
        if (!currentProjectileIds.has(id)) {
          scene.remove(mesh);
          projectileMeshesRef.current.delete(id);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 정리
    return () => {
      cancelAnimationFrame(animationId);
      engine.stop();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [width, height, terrain]);

  // 부대에 대한 복셀 병사들 생성
  function createSoldiersForUnit(scene: Scene, unit: BattleUnit): void {
    const unitSpec = VOXEL_UNIT_DATABASE[unit.unitTypeId];
    if (!unitSpec) return;

    const palette = VOXEL_NATION_PALETTES[unit.nation] || VOXEL_NATION_PALETTES.neutral;
    const soldierCount = Math.ceil(unit.troops / TROOPS_PER_VOXEL);

    // 진형에 따른 배치 (격자형)
    const cols = Math.ceil(Math.sqrt(soldierCount));
    const spacing = 1.2; // 병사 간 간격

    for (let i = 0; i < soldierCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      // 중앙 정렬 오프셋
      const offsetX = (col - (cols - 1) / 2) * spacing;
      const offsetZ = (row - Math.floor(soldierCount / cols) / 2) * spacing;

      const group = buildVoxelUnitFromSpec({
        unitId: unit.unitTypeId,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        scale: 0.6, // 작은 스케일
      });

      const soldierId = `${unit.id}-soldier-${i}`;
      group.userData.soldierId = soldierId;
      group.userData.parentUnitId = unit.id;

      // 초기 위치
      group.position.set(
        unit.position.x + offsetX,
        0,
        unit.position.z + offsetZ
      );
      group.rotation.y = unit.heading;

      // 애니메이션 컨트롤러
      const animController = createAnimationController(
        unitSpec.category,
        unitSpec.weapon.type,
        unitSpec.id
      );
      animController.play('idle');

      scene.add(group);

      soldiersRef.current.set(soldierId, {
        id: soldierId,
        parentUnitId: unit.id,
        group,
        animController,
        localOffset: { x: offsetX, z: offsetZ },
        isAlive: true,
      });
    }
  }

  // 병력 변화에 따른 병사 업데이트
  function updateSoldiersForUnit(scene: Scene, unit: BattleUnit): void {
    const targetCount = Math.ceil(unit.troops / TROOPS_PER_VOXEL);
    
    // 현재 해당 부대의 살아있는 병사 수
    const currentSoldiers: VoxelSoldier[] = [];
    soldiersRef.current.forEach(soldier => {
      if (soldier.parentUnitId === unit.id && soldier.isAlive) {
        currentSoldiers.push(soldier);
      }
    });

    // 병사 제거 (뒤에서부터)
    const toRemove = currentSoldiers.length - targetCount;
    if (toRemove > 0) {
      for (let i = 0; i < toRemove; i++) {
        const soldier = currentSoldiers[currentSoldiers.length - 1 - i];
        if (soldier) {
          soldier.isAlive = false;
          soldier.animController.play('death');
          
          // 1초 후 제거
          setTimeout(() => {
            scene.remove(soldier.group);
            soldiersRef.current.delete(soldier.id);
          }, 1000);
        }
      }
    }
  }

  // 병사 위치 및 애니메이션 업데이트
  function updateSoldierPositions(unit: BattleUnit, deltaTime: number): void {
    const animState = mapUnitStateToAnimation(unit.state);

    soldiersRef.current.forEach(soldier => {
      if (soldier.parentUnitId !== unit.id || !soldier.isAlive) return;

      // 목표 위치 계산
      const targetX = unit.position.x + soldier.localOffset.x * Math.cos(unit.heading) - soldier.localOffset.z * Math.sin(unit.heading);
      const targetZ = unit.position.z + soldier.localOffset.x * Math.sin(unit.heading) + soldier.localOffset.z * Math.cos(unit.heading);

      // 부드러운 이동
      const lerpFactor = 0.1;
      soldier.group.position.x += (targetX - soldier.group.position.x) * lerpFactor;
      soldier.group.position.z += (targetZ - soldier.group.position.z) * lerpFactor;
      
      // 방향
      soldier.group.rotation.y = unit.heading;

      // 애니메이션 상태 업데이트
      if (soldier.animController.currentState !== animState) {
        soldier.animController.play(animState);
      }

      // 애니메이션 업데이트
      soldier.animController.update(deltaTime);
      const transforms = soldier.animController.getTransforms();
      const colorOverlay = soldier.animController.getColorOverlay();
      const scale = soldier.animController.getScale();
      applyAnimationToUnit(soldier.group, transforms, colorOverlay, scale);
    });
  }

  // 투사체 메시 생성
  function createProjectileMesh(scene: Scene, projectileId: string, type: string): void {
    let mesh: Mesh;

    if (type === 'arrow') {
      const geo = new CylinderGeometry(0.03, 0.03, 0.6, 6);
      const mat = new MeshStandardMaterial({ color: 0x8B4513 });
      mesh = new Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;
    } else {
      const geo = new SphereGeometry(0.15, 8, 8);
      const mat = new MeshStandardMaterial({ color: 0x808080 });
      mesh = new Mesh(geo, mat);
    }

    scene.add(mesh);
    projectileMeshesRef.current.set(projectileId, mesh);
  }

  // 유닛 상태 → 애니메이션 매핑
  function mapUnitStateToAnimation(state: BattleUnit['state']): VoxelAnimationState {
    switch (state) {
      case 'moving': return 'walk';
      case 'attacking': return 'attack';
      case 'defending': return 'defend';
      case 'retreating': return 'walk';
      case 'dead': return 'death';
      default: return 'idle';
    }
  }

  // 전투 시작 (자동 시작)
  const handleStartBattle = () => {
    engineRef.current?.start();
  };

  // 포맷 함수
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // 총 병력 계산
  const getTotalTroops = (teamId: 'attacker' | 'defender') => {
    let total = 0;
    unitStats.forEach((stats, unitId) => {
      const unit = engineRef.current?.getUnit(unitId);
      if (unit?.teamId === teamId) {
        total += stats.troops;
      }
    });
    return total;
  };

  return (
    <div className={styles.container}>
      {/* 3D 맵 */}
      <div ref={containerRef} className={styles.mapCanvas} />

      {/* 상단 정보 바 */}
      <div className={styles.topBar}>
        <div className={styles.teamInfo}>
          <div className={styles.teamBlock}>
            <span className={styles.attackerLabel}>공격군</span>
            <span className={styles.troopCount}>{getTotalTroops('attacker')}명</span>
          </div>
          <span className={styles.vsLabel}>VS</span>
          <div className={styles.teamBlock}>
            <span className={styles.defenderLabel}>방어군</span>
            <span className={styles.troopCount}>{getTotalTroops('defender')}명</span>
          </div>
        </div>
        <div className={styles.battleInfo}>
          <span className={styles.phaseLabel}>
            {battlePhase === 'preparation' ? '⏸️ 준비' : battlePhase === 'battle' ? '⚔️ 전투 중' : '🏁 결과'}
          </span>
          <span className={styles.timeLabel}>{formatTime(battleTime)}</span>
        </div>
        <div className={styles.controls}>
          {battlePhase === 'preparation' && !winner && (
            <button onClick={handleStartBattle} className={styles.startBtn}>
              ⚔️ 자동 전투 시작
            </button>
          )}
        </div>
      </div>

      {/* 부대 상태 패널 */}
      <div className={styles.armyPanel}>
        <div className={styles.armySection}>
          <h4 className={styles.armySectionTitle}>공격군</h4>
          {attackers.map(unit => {
            const stats = unitStats.get(unit.id);
            if (!stats) return null;
            return (
              <div key={unit.id} className={styles.unitRow}>
                <span className={styles.unitRowName}>{unit.generalName}</span>
                <span className={styles.unitRowType}>{unit.name}</span>
                <div className={styles.unitRowBar}>
                  <div 
                    className={styles.unitRowBarFill}
                    style={{ 
                      width: `${(stats.troops / stats.maxTroops) * 100}%`,
                      backgroundColor: stats.troops > stats.maxTroops * 0.5 ? '#22c55e' : stats.troops > stats.maxTroops * 0.25 ? '#fbbf24' : '#ef4444'
                    }}
                  />
                </div>
                <span className={styles.unitRowTroops}>{stats.troops}</span>
              </div>
            );
          })}
        </div>
        <div className={styles.armySection}>
          <h4 className={styles.armySectionTitle}>방어군</h4>
          {defenders.map(unit => {
            const stats = unitStats.get(unit.id);
            if (!stats) return null;
            return (
              <div key={unit.id} className={styles.unitRow}>
                <span className={styles.unitRowName}>{unit.generalName}</span>
                <span className={styles.unitRowType}>{unit.name}</span>
                <div className={styles.unitRowBar}>
                  <div 
                    className={styles.unitRowBarFill}
                    style={{ 
                      width: `${(stats.troops / stats.maxTroops) * 100}%`,
                      backgroundColor: stats.troops > stats.maxTroops * 0.5 ? '#22c55e' : stats.troops > stats.maxTroops * 0.25 ? '#fbbf24' : '#ef4444'
                    }}
                  />
                </div>
                <span className={styles.unitRowTroops}>{stats.troops}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 전투 로그 */}
      <div className={styles.battleLog}>
        <div className={styles.logHeader}>전투 로그</div>
        <div className={styles.logContent}>
          {battleEvents.slice(-10).map((event, i) => (
            <div key={i} className={styles.logEntry}>
              {formatBattleEvent(event, engineRef.current)}
            </div>
          ))}
        </div>
      </div>

      {/* 결과 모달 */}
      {winner && (
        <div className={styles.resultModal}>
          <div className={styles.resultContent}>
            <h2 className={styles.resultTitle}>
              {winner === 'attacker' ? '🏆 공격군 승리!' : winner === 'defender' ? '🏆 방어군 승리!' : '⚖️ 무승부'}
            </h2>
            <p className={styles.resultTime}>전투 시간: {formatTime(battleTime)}</p>
            <div className={styles.resultStats}>
              <div>공격군 잔여: {getTotalTroops('attacker')}명</div>
              <div>방어군 잔여: {getTotalTroops('defender')}명</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 유틸리티 함수
function formatBattleEvent(event: BattleEvent, engine: BattleEngine | null): string {
  if (!engine) return '';
  
  const source = engine.getUnit(event.sourceId);
  const target = event.targetId ? engine.getUnit(event.targetId) : null;

  switch (event.type) {
    case 'damage':
      return `${source?.generalName || '?'} → ${target?.generalName || '?'}: ${event.data.damage}명 피해`;
    case 'death':
      return `💀 ${target?.generalName || '?'}의 ${target?.name || '?'} 전멸!`;
    case 'morale_break':
      return `😱 ${source?.generalName || '?'}의 부대 사기 붕괴!`;
    default:
      return '';
  }
}
