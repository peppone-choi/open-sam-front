'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  GridHelper,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  Color,
  Vector3,
  Raycaster,
  Vector2,
  PlaneGeometry,
  MeshBasicMaterial,
  CylinderGeometry,
  SphereGeometry,
  Group,
  TextureLoader,
  CanvasTexture,
  SpriteMaterial,
  Sprite,
  RingGeometry,
  DoubleSide,
} from 'three';
import type { BattleState, BattleUnit, Position } from './TurnBasedBattleMap';
import styles from './TacticalMap.module.css';

// ===== 타입 =====
interface TacticalMapProps {
  battleState: BattleState;
  onUnitSelect?: (unit: BattleUnit | null) => void;
  onMove?: (unitId: string, to: Position) => void;
  onAttack?: (attackerId: string, defenderId: string) => void;
  width?: number;
  height?: number;
}

interface UnitMesh {
  id: string;
  group: Group;
  isEnemy: boolean;
}

// ===== 상수 =====
const GRID_SIZE = 12;
const CELL_SIZE = 1;
const VIEW_SIZE = 14;

const TERRAIN_COLORS = {
  plain: 0x3a5a40,
  forest: 0x2d4a2d,
  mountain: 0x6b5b4f,
  water: 0x3d5a80,
  castle: 0x8b7355,
};

const ALLY_COLOR = 0x3b82f6;
const ENEMY_COLOR = 0xef4444;
const SELECTED_COLOR = 0xfbbf24;
const MOVE_RANGE_COLOR = 0x22c55e;
const ATTACK_RANGE_COLOR = 0xef4444;

// ===== 메인 컴포넌트 =====
export default function TacticalMap({
  battleState,
  onUnitSelect,
  onMove,
  onAttack,
  width = 800,
  height = 600,
}: TacticalMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<OrthographicCamera | null>(null);
  const unitMeshesRef = useRef<Map<string, UnitMesh>>(new Map());
  const groundMeshRef = useRef<Mesh | null>(null);
  const selectionRingRef = useRef<Mesh | null>(null);
  const moveRangeMeshesRef = useRef<Mesh[]>([]);
  const attackRangeMeshesRef = useRef<Mesh[]>([]);

  const [selectedUnit, setSelectedUnit] = useState<BattleUnit | null>(null);
  const [mode, setMode] = useState<'select' | 'move' | 'attack'>('select');
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);

  // ===== 이동/공격 범위 계산 =====
  const moveRange = useMemo(() => {
    if (!selectedUnit || mode !== 'move') return [];
    const range: Position[] = [];
    const { x, y } = selectedUnit.position;

    for (let dx = -selectedUnit.moveRange; dx <= selectedUnit.moveRange; dx++) {
      for (let dy = -selectedUnit.moveRange; dy <= selectedUnit.moveRange; dy++) {
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance > 0 && distance <= selectedUnit.moveRange) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const occupied = battleState.units.some(
              u => u.position.x === nx && u.position.y === ny
            );
            if (!occupied) {
              range.push({ x: nx, y: ny });
            }
          }
        }
      }
    }
    return range;
  }, [selectedUnit, mode, battleState.units]);

  const attackRange = useMemo(() => {
    if (!selectedUnit || mode !== 'attack') return [];
    const range: Position[] = [];
    const { x, y } = selectedUnit.position;

    for (let dx = -selectedUnit.attackRange; dx <= selectedUnit.attackRange; dx++) {
      for (let dy = -selectedUnit.attackRange; dy <= selectedUnit.attackRange; dy++) {
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance > 0 && distance <= selectedUnit.attackRange) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const enemy = battleState.units.find(
              u => u.position.x === nx && u.position.y === ny && u.isEnemy !== selectedUnit.isEnemy
            );
            if (enemy) {
              range.push({ x: nx, y: ny });
            }
          }
        }
      }
    }
    return range;
  }, [selectedUnit, mode, battleState.units]);

  // ===== Three.js 초기화 =====
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene
    const scene = new Scene();
    scene.background = new Color(0x0a0a0f);
    sceneRef.current = scene;

    // Camera (등각 뷰)
    const aspect = width / height;
    const camera = new OrthographicCamera(
      (-VIEW_SIZE * aspect) / 2,
      (VIEW_SIZE * aspect) / 2,
      VIEW_SIZE / 2,
      -VIEW_SIZE / 2,
      0.1,
      100
    );
    camera.position.set(15, 15, 15);
    camera.lookAt(new Vector3(GRID_SIZE / 2, 0, GRID_SIZE / 2));
    cameraRef.current = camera;

    // Renderer
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
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

    // Grid
    const grid = new GridHelper(GRID_SIZE, GRID_SIZE, 0x374151, 0x1f2937);
    grid.position.set(GRID_SIZE / 2, 0.01, GRID_SIZE / 2);
    scene.add(grid);

    // Ground plane (클릭용)
    const groundGeo = new PlaneGeometry(GRID_SIZE, GRID_SIZE);
    const groundMat = new MeshBasicMaterial({ visible: false });
    const ground = new Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
    scene.add(ground);
    groundMeshRef.current = ground;

    // Terrain tiles
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const tileGeo = new BoxGeometry(CELL_SIZE * 0.95, 0.1, CELL_SIZE * 0.95);
        const tileMat = new MeshStandardMaterial({
          color: TERRAIN_COLORS.plain,
          roughness: 0.8,
          metalness: 0.1,
        });
        const tile = new Mesh(tileGeo, tileMat);
        tile.position.set(x + 0.5, -0.05, z + 0.5);
        scene.add(tile);
      }
    }

    // Selection ring
    const ringGeo = new RingGeometry(0.4, 0.5, 32);
    const ringMat = new MeshBasicMaterial({
      color: SELECTED_COLOR,
      side: DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const selectionRing = new Mesh(ringGeo, ringMat);
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.visible = false;
    scene.add(selectionRing);
    selectionRingRef.current = selectionRing;

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // 유닛 애니메이션
      unitMeshesRef.current.forEach((unitMesh) => {
        if (unitMesh.group.userData.floating) {
          unitMesh.group.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.05;
        }
      });

      // 선택 링 회전
      if (selectionRingRef.current?.visible) {
        selectionRingRef.current.rotation.z += 0.02;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const newAspect = rect.width / rect.height || aspect;

      camera.left = (-VIEW_SIZE * newAspect) / 2;
      camera.right = (VIEW_SIZE * newAspect) / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(rect.width, rect.height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [width, height]);

  // ===== 유닛 메쉬 생성/업데이트 =====
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // 기존 유닛 메쉬 제거
    unitMeshesRef.current.forEach((unitMesh) => {
      scene.remove(unitMesh.group);
    });
    unitMeshesRef.current.clear();

    // 새 유닛 메쉬 생성
    battleState.units.forEach((unit) => {
      if (unit.hp <= 0) return;

      const group = new Group();
      group.userData = { unitId: unit.id, floating: true };

      // 베이스
      const baseGeo = new CylinderGeometry(0.35, 0.4, 0.15, 16);
      const baseMat = new MeshStandardMaterial({
        color: unit.isEnemy ? ENEMY_COLOR : ALLY_COLOR,
        roughness: 0.5,
        metalness: 0.3,
      });
      const base = new Mesh(baseGeo, baseMat);
      base.position.y = 0.075;
      group.add(base);

      // 몸체
      const bodyGeo = new CylinderGeometry(0.25, 0.3, 0.6, 16);
      const bodyMat = new MeshStandardMaterial({
        color: unit.isEnemy ? 0xdc2626 : 0x2563eb,
        roughness: 0.6,
        metalness: 0.2,
      });
      const body = new Mesh(bodyGeo, bodyMat);
      body.position.y = 0.45;
      group.add(body);

      // 머리
      const headGeo = new SphereGeometry(0.2, 16, 16);
      const headMat = new MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.4,
        metalness: 0.3,
      });
      const head = new Mesh(headGeo, headMat);
      head.position.y = 0.85;
      group.add(head);

      // HP 바 (스프라이트)
      const hpCanvas = document.createElement('canvas');
      hpCanvas.width = 64;
      hpCanvas.height = 8;
      const hpCtx = hpCanvas.getContext('2d')!;
      hpCtx.fillStyle = '#1f2937';
      hpCtx.fillRect(0, 0, 64, 8);
      const hpRatio = unit.hp / unit.maxHp;
      hpCtx.fillStyle = hpRatio > 0.6 ? '#4ade80' : hpRatio > 0.3 ? '#fbbf24' : '#ef4444';
      hpCtx.fillRect(1, 1, (64 - 2) * hpRatio, 6);

      const hpTexture = new CanvasTexture(hpCanvas);
      const hpMat = new SpriteMaterial({ map: hpTexture });
      const hpSprite = new Sprite(hpMat);
      hpSprite.position.y = 1.2;
      hpSprite.scale.set(0.8, 0.1, 1);
      group.add(hpSprite);

      // 이름 라벨
      const nameCanvas = document.createElement('canvas');
      nameCanvas.width = 128;
      nameCanvas.height = 32;
      const nameCtx = nameCanvas.getContext('2d')!;
      nameCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      nameCtx.roundRect(0, 0, 128, 32, 4);
      nameCtx.fill();
      nameCtx.fillStyle = '#ffffff';
      nameCtx.font = 'bold 14px sans-serif';
      nameCtx.textAlign = 'center';
      nameCtx.fillText(unit.generalName, 64, 22);

      const nameTexture = new CanvasTexture(nameCanvas);
      const nameMat = new SpriteMaterial({ map: nameTexture });
      const nameSprite = new Sprite(nameMat);
      nameSprite.position.y = 1.45;
      nameSprite.scale.set(1.2, 0.3, 1);
      group.add(nameSprite);

      // 위치 설정
      group.position.set(unit.position.x + 0.5, 0.5, unit.position.y + 0.5);

      scene.add(group);
      unitMeshesRef.current.set(unit.id, {
        id: unit.id,
        group,
        isEnemy: unit.isEnemy,
      });
    });
  }, [battleState.units]);

  // ===== 범위 표시 업데이트 =====
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // 기존 범위 메쉬 제거
    moveRangeMeshesRef.current.forEach(m => scene.remove(m));
    attackRangeMeshesRef.current.forEach(m => scene.remove(m));
    moveRangeMeshesRef.current = [];
    attackRangeMeshesRef.current = [];

    // 이동 범위
    moveRange.forEach(pos => {
      const geo = new PlaneGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9);
      const mat = new MeshBasicMaterial({
        color: MOVE_RANGE_COLOR,
        transparent: true,
        opacity: 0.4,
        side: DoubleSide,
      });
      const mesh = new Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pos.x + 0.5, 0.02, pos.y + 0.5);
      scene.add(mesh);
      moveRangeMeshesRef.current.push(mesh);
    });

    // 공격 범위
    attackRange.forEach(pos => {
      const geo = new RingGeometry(0.3, 0.45, 6);
      const mat = new MeshBasicMaterial({
        color: ATTACK_RANGE_COLOR,
        transparent: true,
        opacity: 0.6,
        side: DoubleSide,
      });
      const mesh = new Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pos.x + 0.5, 0.03, pos.y + 0.5);
      scene.add(mesh);
      attackRangeMeshesRef.current.push(mesh);
    });
  }, [moveRange, attackRange]);

  // ===== 선택 링 업데이트 =====
  useEffect(() => {
    if (!selectionRingRef.current) return;

    if (selectedUnit) {
      selectionRingRef.current.position.set(
        selectedUnit.position.x + 0.5,
        0.02,
        selectedUnit.position.y + 0.5
      );
      selectionRingRef.current.visible = true;
    } else {
      selectionRingRef.current.visible = false;
    }
  }, [selectedUnit]);

  // ===== 클릭 핸들러 =====
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouse = new Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      // 유닛 클릭 확인
      const unitGroups = Array.from(unitMeshesRef.current.values()).map(u => u.group);
      const unitIntersects = raycaster.intersectObjects(unitGroups, true);

      if (unitIntersects.length > 0) {
        let targetGroup = unitIntersects[0].object;
        while (targetGroup.parent && !targetGroup.userData.unitId) {
          targetGroup = targetGroup.parent as any;
        }

        const unitId = targetGroup.userData.unitId;
        const clickedUnit = battleState.units.find(u => u.id === unitId);

        if (clickedUnit) {
          // 공격 모드에서 적 클릭
          if (mode === 'attack' && selectedUnit && clickedUnit.isEnemy !== selectedUnit.isEnemy) {
            const inRange = attackRange.some(
              p => p.x === clickedUnit.position.x && p.y === clickedUnit.position.y
            );
            if (inRange) {
              onAttack?.(selectedUnit.id, clickedUnit.id);
              setMode('select');
              setSelectedUnit(null);
              onUnitSelect?.(null);
              return;
            }
          }

          // 아군 유닛 선택
          if (!clickedUnit.isEnemy && battleState.phase === 'player') {
            if (selectedUnit?.id === clickedUnit.id) {
              setSelectedUnit(null);
              setMode('select');
              onUnitSelect?.(null);
            } else {
              setSelectedUnit(clickedUnit);
              setMode('select');
              onUnitSelect?.(clickedUnit);
            }
          }
        }
        return;
      }

      // 땅 클릭 (이동)
      if (groundMeshRef.current) {
        const groundIntersects = raycaster.intersectObject(groundMeshRef.current);
        if (groundIntersects.length > 0 && mode === 'move' && selectedUnit) {
          const point = groundIntersects[0].point;
          const gridX = Math.floor(point.x);
          const gridY = Math.floor(point.z);

          const inRange = moveRange.some(p => p.x === gridX && p.y === gridY);
          if (inRange) {
            onMove?.(selectedUnit.id, { x: gridX, y: gridY });
            setMode('select');
          }
        }
      }
    },
    [battleState, selectedUnit, mode, moveRange, attackRange, onUnitSelect, onMove, onAttack]
  );

  // ===== 렌더링 =====
  return (
    <div className={styles.tacticalMapContainer}>
      <div
        ref={containerRef}
        className={styles.canvasContainer}
        onClick={handleClick}
      />

      {/* 모드 컨트롤 */}
      {selectedUnit && battleState.phase === 'player' && (
        <div className={styles.modeControls}>
          <button
            className={`${styles.modeBtn} ${mode === 'move' ? styles.active : ''}`}
            onClick={() => setMode(mode === 'move' ? 'select' : 'move')}
            disabled={selectedUnit.hasMoved}
          >
            🚶 이동
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'attack' ? styles.active : ''}`}
            onClick={() => setMode(mode === 'attack' ? 'select' : 'attack')}
            disabled={selectedUnit.hasActed}
          >
            ⚔️ 공격
          </button>
          <button
            className={styles.modeBtn}
            onClick={() => {
              setSelectedUnit(null);
              setMode('select');
              onUnitSelect?.(null);
            }}
          >
            ✕ 취소
          </button>
        </div>
      )}

      {/* 미니맵 */}
      <div className={styles.minimap}>
        <div className={styles.minimapGrid}>
          {battleState.units.map(unit => (
            unit.hp > 0 && (
              <div
                key={unit.id}
                className={`${styles.minimapUnit} ${unit.isEnemy ? styles.enemy : styles.ally}`}
                style={{
                  left: `${(unit.position.x / GRID_SIZE) * 100}%`,
                  top: `${(unit.position.y / GRID_SIZE) * 100}%`,
                }}
              />
            )
          ))}
        </div>
      </div>

      {/* 호버 정보 */}
      {hoveredUnit && (
        <div className={styles.hoverInfo}>
          {battleState.units.find(u => u.id === hoveredUnit)?.generalName}
        </div>
      )}
    </div>
  );
}


