'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
} from 'three';

export type Relation = 'self' | 'ally' | 'neutral' | 'enemy';

export interface ThreeBattleUnit {
  id: string;
  generalId: number;
  x: number; // map 좌표 (0..mapWidth)
  y: number; // map 좌표 (0..mapHeight)
  color: number;
  troops: number;
  maxTroops: number;
  relation: Relation;
}

interface ThreeBattleMapProps {
  width?: number;
  height?: number;
  mapWidth: number;
  mapHeight: number;
  units: ThreeBattleUnit[];
  myGeneralId: number | null;
  onMoveRequest?: (target: { x: number; y: number }) => void;
  onAttackRequest?: (targetGeneralId: number) => void;
}

interface CubeEntry {
  mesh: Mesh;
  unit: ThreeBattleUnit;
}

/**
 * Material 풀 - 색상별 MeshStandardMaterial 캐싱
 * Three.js Material 생성은 비싸므로 동일 색상은 재사용
 */
class MaterialPool {
  private cache: Map<number, MeshStandardMaterial> = new Map();
  
  get(color: number): MeshStandardMaterial {
    let mat = this.cache.get(color);
    if (!mat) {
      mat = new MeshStandardMaterial({ color });
      this.cache.set(color, mat);
    }
    return mat;
  }
  
  dispose(): void {
    this.cache.forEach(mat => mat.dispose());
    this.cache.clear();
  }
  
  get size(): number {
    return this.cache.size;
  }
}

/**
 * Mesh 오브젝트 풀 - 생성/파괴 비용 절감
 */
class MeshPool {
  private available: Mesh[] = [];
  private geometry: BoxGeometry;
  
  constructor(geometry: BoxGeometry) {
    this.geometry = geometry;
  }
  
  acquire(material: MeshStandardMaterial): Mesh {
    let mesh = this.available.pop();
    if (!mesh) {
      mesh = new Mesh(this.geometry, material);
    } else {
      mesh.material = material;
      mesh.visible = true;
    }
    return mesh;
  }
  
  release(mesh: Mesh, scene: Scene): void {
    scene.remove(mesh);
    mesh.visible = false;
    mesh.scale.set(1, 1, 1);
    mesh.position.set(0, 0, 0);
    this.available.push(mesh);
  }
  
  dispose(): void {
    // Material은 MaterialPool에서 관리하므로 여기서 dispose하지 않음
    this.available = [];
  }
  
  get poolSize(): number {
    return this.available.length;
  }
}

/**
 * 실시간 전투용 three.js 전술맵
 * - 외부에서 전달된 BattleState 기반으로 큐브를 렌더
 * - 내 유닛(큐브 하나)만 조작 가능: 땅 클릭 → 이동, 적 큐브 클릭 → 공격 요청
 */
export default function ThreeBattleMap({
  width = 960,
  height = 640,
  mapWidth,
  mapHeight,
  units,
  myGeneralId,
  onMoveRequest,
  onAttackRequest,
}: ThreeBattleMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<OrthographicCamera | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const groundMeshRef = useRef<Mesh | null>(null);

  const cubeEntriesRef = useRef<CubeEntry[]>([]);
  const boxGeoRef = useRef<BoxGeometry | null>(null);
  
  // 성능 최적화: Material 및 Mesh 풀링
  const materialPoolRef = useRef<MaterialPool | null>(null);
  const meshPoolRef = useRef<MeshPool | null>(null);

  const [moveDialog, setMoveDialog] = useState<{ target: { x: number; y: number } } | null>(null);

  // three 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new Scene();
    scene.background = new Color(0x020617);

    const aspect = width / height;
    const viewSize = 12;
    const camera = new OrthographicCamera(
      (-viewSize * aspect) / 2,
      (viewSize * aspect) / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      100,
    );

    camera.position.set(10, 10, 10);
    camera.lookAt(new Vector3(0, 0, 0));

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(width, height, false);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 라이트
    const ambient = new AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dirLight = new DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(8, 15, 5);
    scene.add(dirLight);

    // 그리드 / 바닥
    const gridSize = 20;
    const gridDivisions = 20;
    const grid = new GridHelper(gridSize, gridDivisions, 0x1f2937, 0x1f2937);
    grid.position.set(0, 0, 0);
    scene.add(grid);

    const groundGeo = new PlaneGeometry(gridSize, gridSize);
    const groundMat = new MeshBasicMaterial({ visible: false });
    const groundMesh = new Mesh(groundGeo, groundMat);
    groundMesh.rotateX(-Math.PI / 2);
    scene.add(groundMesh);

    // 공유 BoxGeometry
    const boxGeo = new BoxGeometry(1, 1, 1);
    
    // 풀 초기화
    const materialPool = new MaterialPool();
    const meshPool = new MeshPool(boxGeo);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    groundMeshRef.current = groundMesh;
    boxGeoRef.current = boxGeo;
    materialPoolRef.current = materialPool;
    meshPoolRef.current = meshPool;

    const raycaster = new Raycaster();
    const mouse = new Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      if (!rendererRef.current || !cameraRef.current || !groundMeshRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);

      const cubeMeshes = cubeEntriesRef.current.map((e) => e.mesh);
      const intersectObjects = [...cubeMeshes, groundMeshRef.current];

      const intersects = raycaster.intersectObjects(intersectObjects, false);
      if (intersects.length === 0) return;

      const first = intersects[0];

      // 큐브 클릭
      if (cubeMeshes.includes(first.object as Mesh)) {
        const entry = cubeEntriesRef.current.find((e) => e.mesh === first.object);
        if (!entry) return;

        const unit = entry.unit;

        // 적 유닛만 공격 대상으로 허용
        if (unit.relation === 'enemy' && onAttackRequest && myGeneralId) {
          onAttackRequest(unit.generalId);
        }

        return;
      }

      // 땅 클릭 → 이동 요청 다이얼로그
      if (first.object === groundMeshRef.current && onMoveRequest && myGeneralId) {
        const p = first.point;
        // three 좌표 → map 좌표로 역변환
        const gridSizeLocal = gridSize;
        const nx = (p.x + gridSizeLocal / 2) / gridSizeLocal; // 0..1
        const ny = (p.z + gridSizeLocal / 2) / gridSizeLocal; // 0..1

        const mapX = Math.max(0, Math.min(mapWidth, nx * mapWidth));
        const mapY = Math.max(0, Math.min(mapHeight, ny * mapHeight));

        setMoveDialog({ target: { x: mapX, y: mapY } });
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      const rect = container.getBoundingClientRect();
      const newAspect = rect.width / rect.height || aspect;
      const vSize = viewSize;

      cameraRef.current.left = (-vSize * newAspect) / 2;
      cameraRef.current.right = (vSize * newAspect) / 2;
      cameraRef.current.top = vSize / 2;
      cameraRef.current.bottom = -vSize / 2;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(rect.width, rect.height, false);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);

      // 큐브를 풀로 반환
      cubeEntriesRef.current.forEach(({ mesh }) => {
        meshPool.release(mesh, scene);
      });
      cubeEntriesRef.current = [];

      // 씬에서 제거
      scene.remove(grid, groundMesh, ambient, dirLight);
      
      // 풀 정리
      materialPool.dispose();
      meshPool.dispose();
      
      // Geometry/Material dispose
      groundGeo.dispose();
      groundMat.dispose();
      boxGeo.dispose();
      
      // Renderer dispose
      renderer.dispose();
      renderer.forceContextLoss();

      // DOM 정리
      if (container && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      groundMeshRef.current = null;
      boxGeoRef.current = null;
      materialPoolRef.current = null;
      meshPoolRef.current = null;
    };
  }, [width, height, mapWidth, mapHeight, myGeneralId, onMoveRequest, onAttackRequest]);

  // units 변경 시 큐브 재구성 (풀링 사용)
  useEffect(() => {
    const scene = sceneRef.current;
    const boxGeo = boxGeoRef.current;
    const materialPool = materialPoolRef.current;
    const meshPool = meshPoolRef.current;
    if (!scene || !boxGeo || !materialPool || !meshPool) return;

    // 기존 큐브를 풀로 반환 (dispose 대신 재활용)
    cubeEntriesRef.current.forEach(({ mesh }) => {
      meshPool.release(mesh, scene);
    });
    cubeEntriesRef.current = [];

    // 새 큐브 생성 (풀에서 가져오기)
    const gridSize = 20;
    const mapToThreeX = (x: number) => (x / mapWidth) * gridSize - gridSize / 2;
    const mapToThreeZ = (y: number) => (y / mapHeight) * gridSize - gridSize / 2;

    units.forEach((u) => {
      // Material은 풀에서 가져오기 (같은 색상 재사용)
      const mainMat = materialPool.get(u.color);
      
      // 중앙 큐브 (지휘관/부대 중심) - 풀에서 Mesh 가져오기
      const mainMesh = meshPool.acquire(mainMat);

      const centerX = mapToThreeX(u.x);
      const centerZ = mapToThreeZ(u.y);

      mainMesh.position.set(centerX, 0.5, centerZ);
      mainMesh.scale.set(1, 1, 1);
      scene.add(mainMesh);
      cubeEntriesRef.current.push({ mesh: mainMesh, unit: u });

      // 병력 표시용 작은 큐브들: 100명당 1개 (중앙 큐브 포함)
      const totalIcons = Math.max(1, Math.round(u.troops / 100));
      const extraIcons = Math.min(20, totalIcons - 1); // 중앙 큐브 제외, 최대 20개로 제한

      const radius = 0.7; // 중심에서 조금 떨어진 위치

      for (let i = 0; i < extraIcons; i += 1) {
        // 같은 색상 Material 재사용
        const iconMesh = meshPool.acquire(mainMat);
        iconMesh.scale.set(0.5, 0.5, 0.5);

        const angle = (i / extraIcons) * Math.PI * 2;
        const offsetX = Math.cos(angle) * radius;
        const offsetZ = Math.sin(angle) * radius;

        iconMesh.position.set(centerX + offsetX, 0.3, centerZ + offsetZ);

        scene.add(iconMesh);
        cubeEntriesRef.current.push({ mesh: iconMesh, unit: u });
      }
    });
  }, [units, mapWidth, mapHeight]);

  const handleConfirmMove = () => {
    if (!moveDialog || !onMoveRequest) return;
    onMoveRequest(moveDialog.target);
    setMoveDialog(null);
  };

  const handleCancelMove = () => {
    setMoveDialog(null);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: width,
        height,
        border: '1px solid #4b5563',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#020617',
        margin: '0 auto',
      }}
    >
      {moveDialog && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}
        >
          <div
            style={{
              background: '#020617',
              border: '1px solid #4b5563',
              borderRadius: 8,
              padding: '1rem 1.5rem',
              color: '#e5e7eb',
              minWidth: 240,
            }}
          >
            <div style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              이 위치로 이동할까요?
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleCancelMove}
                style={{
                  padding: '0.35rem 0.75rem',
                  background: '#111827',
                  color: '#e5e7eb',
                  border: '1px solid #4b5563',
                  borderRadius: 4,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmMove}
                style={{
                  padding: '0.35rem 0.75rem',
                  background: '#3b82f6',
                  color: '#f9fafb',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                이동
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
