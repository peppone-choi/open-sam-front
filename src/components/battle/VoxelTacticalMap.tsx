'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import styles from './VoxelTacticalMap.module.css';

// ===== 타입 정의 =====
interface TacticalUnit {
  id: string;
  unitTypeId: number;       // VoxelUnitDefinitions의 유닛 ID
  nation: string;           // 국가 (wei, shu, wu 등)
  position: { x: number; z: number };
  heading: number;          // 방향 (라디안)
  hp: number;
  maxHp: number;
  morale: number;
  troops: number;
  maxTroops: number;
  state: 'idle' | 'moving' | 'attacking' | 'defending' | 'retreating' | 'dead';
  target?: string;          // 공격 대상 유닛 ID
}

interface VoxelTacticalMapProps {
  width?: number;
  height?: number;
  units?: TacticalUnit[];
  onUnitSelect?: (unitId: string | null) => void;
  onMoveCommand?: (unitId: string, target: { x: number; z: number }) => void;
  onAttackCommand?: (unitId: string, targetId: string) => void;
}

// ===== 유닛 메시 + 컨트롤러 =====
interface UnitMeshData {
  group: Group;
  animController: VoxelAnimationController;
  data: TacticalUnit;
}

/**
 * 복셀 유닛 기반 전술 맵
 * - Three.js 등각 뷰
 * - 복셀 유닛 렌더링
 * - 애니메이션 시스템 통합
 */
export default function VoxelTacticalMap({
  width = 1200,
  height = 800,
  units: initialUnits,
  onUnitSelect,
  onMoveCommand,
  onAttackCommand,
}: VoxelTacticalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<OrthographicCamera | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const groundRef = useRef<Mesh | null>(null);
  
  // 유닛 메시 관리
  const unitMeshesRef = useRef<Map<string, UnitMeshData>>(new Map());
  
  // 선택 상태
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const selectedUnitIdRef = useRef<string | null>(null);
  
  // 이동 다이얼로그
  const [moveDialog, setMoveDialog] = useState<{
    unitId: string;
    target: { x: number; z: number };
  } | null>(null);

  // 데모용 유닛 데이터
  const [units, setUnits] = useState<TacticalUnit[]>(initialUnits || [
    {
      id: 'unit-1',
      unitTypeId: 1102, // 정규보병
      nation: 'wei',
      position: { x: -4, z: -3 },
      heading: 0,
      hp: 100, maxHp: 100,
      morale: 100,
      troops: 500, maxTroops: 500,
      state: 'idle',
    },
    {
      id: 'unit-2',
      unitTypeId: 1201, // 장궁병
      nation: 'wei',
      position: { x: -2, z: -3 },
      heading: 0,
      hp: 80, maxHp: 100,
      morale: 90,
      troops: 300, maxTroops: 500,
      state: 'idle',
    },
    {
      id: 'unit-3',
      unitTypeId: 1300, // 경기병
      nation: 'shu',
      position: { x: 3, z: 2 },
      heading: Math.PI,
      hp: 100, maxHp: 100,
      morale: 100,
      troops: 200, maxTroops: 200,
      state: 'idle',
    },
    {
      id: 'unit-4',
      unitTypeId: 1113, // 황건신도
      nation: 'yellow',
      position: { x: 0, z: 4 },
      heading: -Math.PI / 2,
      hp: 60, maxHp: 100,
      morale: 50,
      troops: 800, maxTroops: 1000,
      state: 'idle',
    },
    {
      id: 'unit-5',
      unitTypeId: 1400, // 귀병
      nation: 'wu',
      position: { x: 5, z: -2 },
      heading: Math.PI / 2,
      hp: 100, maxHp: 100,
      morale: 100,
      troops: 100, maxTroops: 100,
      state: 'idle',
    },
  ]);

  // 선택 상태 동기화
  useEffect(() => {
    selectedUnitIdRef.current = selectedUnitId;
    onUnitSelect?.(selectedUnitId);
  }, [selectedUnitId, onUnitSelect]);

  // Three.js 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene
    const scene = new Scene();
    scene.background = new Color(0x0a0a15);
    sceneRef.current = scene;

    // Camera (등각 뷰)
    const aspect = width / height;
    const viewSize = 14;
    const camera = new OrthographicCamera(
      (-viewSize * aspect) / 2,
      (viewSize * aspect) / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      100
    );
    camera.position.set(12, 12, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new DirectionalLight(0x6688ff, 0.3);
    backLight.position.set(-10, 10, -10);
    scene.add(backLight);

    // Grid
    const gridSize = 20;
    const grid = new GridHelper(gridSize, 20, 0x2d3748, 0x1a202c);
    scene.add(grid);

    // Ground (클릭용)
    const groundGeo = new PlaneGeometry(gridSize, gridSize);
    const groundMat = new MeshBasicMaterial({ visible: false });
    const ground = new Mesh(groundGeo, groundMat);
    ground.rotateX(-Math.PI / 2);
    ground.name = 'ground';
    scene.add(ground);
    groundRef.current = ground;

    // Raycaster
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    // 클릭 핸들러
    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      
      // 유닛 클릭 체크
      const unitGroups = Array.from(unitMeshesRef.current.values()).map(u => u.group);
      const unitIntersects = raycaster.intersectObjects(unitGroups, true);
      
      if (unitIntersects.length > 0) {
        // 유닛 클릭 - 부모 그룹 찾기
        let clickedGroup = unitIntersects[0].object;
        while (clickedGroup.parent && !clickedGroup.userData.unitId) {
          clickedGroup = clickedGroup.parent as any;
        }
        
        if (clickedGroup.userData.unitId) {
          setSelectedUnitId(clickedGroup.userData.unitId);
          setMoveDialog(null);
          return;
        }
      }

      // 땅 클릭 - 선택된 유닛이 있으면 이동 명령
      const groundIntersects = raycaster.intersectObject(ground);
      if (groundIntersects.length > 0 && selectedUnitIdRef.current) {
        const point = groundIntersects[0].point;
        setMoveDialog({
          unitId: selectedUnitIdRef.current,
          target: { x: point.x, z: point.z },
        });
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 애니메이션 루프
    let lastTime = Date.now();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // 유닛 애니메이션 업데이트
      unitMeshesRef.current.forEach((unitMesh) => {
        unitMesh.animController.update(deltaTime);
        const transforms = unitMesh.animController.getTransforms();
        const colorOverlay = unitMesh.animController.getColorOverlay();
        const scale = unitMesh.animController.getScale();
        applyAnimationToUnit(unitMesh.group, transforms, colorOverlay, scale);
      });

      renderer.render(scene, camera);
    };

    animate();

    // 정리
    return () => {
      cancelAnimationFrame(animationId);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [width, height]);

  // 유닛 생성/업데이트
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // 기존 유닛 제거
    unitMeshesRef.current.forEach((unitMesh) => {
      scene.remove(unitMesh.group);
    });
    unitMeshesRef.current.clear();

    // 새 유닛 생성
    units.forEach((unit) => {
      const unitSpec = VOXEL_UNIT_DATABASE[unit.unitTypeId];
      if (!unitSpec) return;

      const palette = VOXEL_NATION_PALETTES[unit.nation] || VOXEL_NATION_PALETTES.neutral;

      const group = buildVoxelUnitFromSpec({
        unitId: unit.unitTypeId,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        scale: 1.0,
      });

      group.userData.unitId = unit.id;
      group.position.set(unit.position.x, 0, unit.position.z);
      group.rotation.y = unit.heading;

      // 애니메이션 컨트롤러 생성
      const animController = createAnimationController(
        unitSpec.category,
        unitSpec.weapon.type,
        unitSpec.id
      );

      // 유닛 상태에 따른 애니메이션
      const animState = mapUnitStateToAnimation(unit.state);
      animController.play(animState);

      scene.add(group);
      unitMeshesRef.current.set(unit.id, {
        group,
        animController,
        data: unit,
      });
    });
  }, [units]);

  // 유닛 상태 → 애니메이션 매핑
  function mapUnitStateToAnimation(state: TacticalUnit['state']): VoxelAnimationState {
    switch (state) {
      case 'moving': return 'walk';
      case 'attacking': return 'attack';
      case 'defending': return 'defend';
      case 'retreating': return 'walk';
      case 'dead': return 'death';
      default: return 'idle';
    }
  }

  // 이동 확인
  const handleConfirmMove = () => {
    if (!moveDialog) return;
    
    // 유닛 위치 업데이트
    setUnits(prev => prev.map(u => 
      u.id === moveDialog.unitId
        ? { ...u, position: moveDialog.target, state: 'moving' as const }
        : u
    ));

    // 이동 애니메이션 재생
    const unitMesh = unitMeshesRef.current.get(moveDialog.unitId);
    if (unitMesh) {
      unitMesh.animController.play('walk');
      
      // 방향 계산 및 회전
      const dx = moveDialog.target.x - unitMesh.group.position.x;
      const dz = moveDialog.target.z - unitMesh.group.position.z;
      const heading = Math.atan2(dx, dz);
      unitMesh.group.rotation.y = heading;
      
      // 위치 이동 (실제 게임에서는 애니메이션으로)
      unitMesh.group.position.x = moveDialog.target.x;
      unitMesh.group.position.z = moveDialog.target.z;
      
      // 잠시 후 idle로 복귀
      setTimeout(() => {
        unitMesh.animController.play('idle');
        setUnits(prev => prev.map(u => 
          u.id === moveDialog.unitId ? { ...u, state: 'idle' as const } : u
        ));
      }, 1000);
    }

    onMoveCommand?.(moveDialog.unitId, moveDialog.target);
    setMoveDialog(null);
  };

  // 공격 명령
  const handleAttack = () => {
    if (!selectedUnitId) return;
    
    const unitMesh = unitMeshesRef.current.get(selectedUnitId);
    if (unitMesh) {
      unitMesh.animController.play('attack');
      setUnits(prev => prev.map(u => 
        u.id === selectedUnitId ? { ...u, state: 'attacking' as const } : u
      ));
    }
  };

  // 방어 명령
  const handleDefend = () => {
    if (!selectedUnitId) return;
    
    const unitMesh = unitMeshesRef.current.get(selectedUnitId);
    if (unitMesh) {
      unitMesh.animController.play('defend');
      setUnits(prev => prev.map(u => 
        u.id === selectedUnitId ? { ...u, state: 'defending' as const } : u
      ));
    }
  };

  // 선택된 유닛 정보
  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const selectedUnitSpec = selectedUnit ? VOXEL_UNIT_DATABASE[selectedUnit.unitTypeId] : null;

  return (
    <div className={styles.container}>
      {/* 3D 맵 */}
      <div ref={containerRef} className={styles.mapCanvas} />

      {/* 선택된 유닛 정보 패널 */}
      {selectedUnit && selectedUnitSpec && (
        <div className={styles.unitPanel}>
          <div className={styles.unitHeader}>
            <span className={styles.unitName}>{selectedUnitSpec.name}</span>
            <span className={styles.unitId}>#{selectedUnit.id}</span>
          </div>
          
          <div className={styles.unitStats}>
            <div className={styles.statRow}>
              <span>HP</span>
              <div className={styles.hpBar}>
                <div 
                  className={styles.hpFill} 
                  style={{ width: `${(selectedUnit.hp / selectedUnit.maxHp) * 100}%` }}
                />
              </div>
              <span>{selectedUnit.hp}/{selectedUnit.maxHp}</span>
            </div>
            
            <div className={styles.statRow}>
              <span>병력</span>
              <span>{selectedUnit.troops}/{selectedUnit.maxTroops}</span>
            </div>
            
            <div className={styles.statRow}>
              <span>사기</span>
              <span>{selectedUnit.morale}%</span>
            </div>
            
            <div className={styles.statRow}>
              <span>상태</span>
              <span className={styles[`state_${selectedUnit.state}`]}>
                {getStateLabel(selectedUnit.state)}
              </span>
            </div>
          </div>

          <div className={styles.unitActions}>
            <button onClick={handleAttack} className={styles.actionBtn}>
              ⚔️ 공격
            </button>
            <button onClick={handleDefend} className={styles.actionBtn}>
              🛡️ 방어
            </button>
          </div>
        </div>
      )}

      {/* 이동 확인 다이얼로그 */}
      {moveDialog && (
        <div className={styles.moveDialog}>
          <p>
            유닛을 ({moveDialog.target.x.toFixed(1)}, {moveDialog.target.z.toFixed(1)})로 이동하시겠습니까?
          </p>
          <div className={styles.dialogButtons}>
            <button onClick={handleConfirmMove} className={styles.confirmBtn}>
              확인
            </button>
            <button onClick={() => setMoveDialog(null)} className={styles.cancelBtn}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* 미니맵/정보 */}
      <div className={styles.infoPanel}>
        <div className={styles.infoRow}>
          <span>유닛 수:</span>
          <span>{units.length}</span>
        </div>
        <div className={styles.infoRow}>
          <span>선택:</span>
          <span>{selectedUnitId || '없음'}</span>
        </div>
      </div>
    </div>
  );
}

function getStateLabel(state: TacticalUnit['state']): string {
  const labels: Record<TacticalUnit['state'], string> = {
    idle: '대기',
    moving: '이동 중',
    attacking: '공격 중',
    defending: '방어 중',
    retreating: '후퇴 중',
    dead: '전멸',
  };
  return labels[state];
}

