'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Stellaris 모듈
import {
  loadShipFromAsset,
  getStellarisShipsByFaction,
  getStellarisFlagships,
  STELLARIS_FACTION_COLORS,
  type StellarisShipAsset,
  type StellarisShipFaction,
} from '@/lib/logh/LOGHShipLoader';

// SoSE2 모듈
import {
  EMPIRE_ASSETS,
  ALLIANCE_ASSETS,
  EMPIRE_FLAGSHIPS,
  ALLIANCE_FLAGSHIPS,
  type ShipAsset as SoSE2ShipAsset,
} from '@/lib/logh/LOGHAssets';
import { parseSoSE2Mesh, createBufferGeometry } from '@/lib/logh/SoSE2MeshParser';
import { loadDDSTexture } from '@/lib/logh/TextureLoader';

type ModSource = 'stellaris' | 'sose2';
type ViewFaction = 'flagship' | 'empire' | 'alliance';

interface UnifiedShip {
  id: string;
  name: string;
  nameKo: string;
  faction: 'empire' | 'alliance';
  commander?: string;
  source: ModSource;
  // Stellaris 전용
  stellarisAsset?: StellarisShipAsset;
  // SoSE2 전용
  sose2Asset?: SoSE2ShipAsset;
}

/**
 * LOGH 함선 뷰어 페이지 (통합)
 * Stellaris + SoSE2 두 모드의 함선 미리보기
 */
export default function LOGHShipViewerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number>(0);

  const [modSource, setModSource] = useState<ModSource>('stellaris');
  const [selectedFaction, setSelectedFaction] = useState<ViewFaction>('flagship');
  const [shipList, setShipList] = useState<UnifiedShip[]>([]);
  const [selectedShip, setSelectedShip] = useState<UnifiedShip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useTextures, setUseTextures] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  // SoSE2 모델 로드 함수
  const loadSoSE2Model = useCallback(async (asset: SoSE2ShipAsset): Promise<THREE.Group> => {
    const meshPath = `/assets/logh/meshes/${asset.mesh}.mesh`;
    const response = await fetch(meshPath);
    if (!response.ok) throw new Error(`Failed to fetch mesh: ${meshPath}`);
    
    const meshText = await response.text();
    const parsedMesh = parseSoSE2Mesh(meshText);
    const geometry = createBufferGeometry(parsedMesh);
    
    const group = new THREE.Group();
    
    let material: THREE.Material;
    
    if (useTextures && asset.textures?.diffuse) {
      try {
        const diffuseMap = await loadDDSTexture(asset.textures.diffuse);
        material = new THREE.MeshStandardMaterial({
          map: diffuseMap,
          metalness: 0.3,
          roughness: 0.7,
        });
      } catch {
        material = new THREE.MeshStandardMaterial({
          color: asset.faction === 'empire' ? 0x1a237e : 0x1b5e20,
          metalness: 0.5,
          roughness: 0.5,
        });
      }
    } else {
      material = new THREE.MeshStandardMaterial({
        color: asset.faction === 'empire' ? 0x1a237e : 0x1b5e20,
        metalness: 0.5,
        roughness: 0.5,
      });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    
    return group;
  }, [useTextures]);

  // Three.js 초기화
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(5, 3, 5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x4444ff, 0.3);
    backLight.position.set(-10, 5, -10);
    scene.add(backLight);

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x333366, 0x222244);
    scene.add(gridHelper);

    // Starfield background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Animation loop (autoRotate 상태 참조)
  useEffect(() => {
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controlsRef.current?.update();

      if (autoRotate && currentModelRef.current) {
        currentModelRef.current.rotation.y += 0.002;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [autoRotate]);

  // 모드/진영 변경 시 함선 목록 업데이트
  useEffect(() => {
    const ships: UnifiedShip[] = [];

    if (modSource === 'stellaris') {
      let stellarisShips: StellarisShipAsset[] = [];
      if (selectedFaction === 'flagship') {
        stellarisShips = getStellarisFlagships();
      } else {
        stellarisShips = getStellarisShipsByFaction(selectedFaction as StellarisShipFaction);
      }
      
      for (const ship of stellarisShips) {
        ships.push({
          id: `stellaris_${ship.id}`,
          name: ship.name,
          nameKo: ship.nameKo,
          faction: ship.faction as 'empire' | 'alliance',
          commander: ship.commander,
          source: 'stellaris',
          stellarisAsset: ship,
        });
      }
    } else {
      // SoSE2
      let soseShips: SoSE2ShipAsset[] = [];
      if (selectedFaction === 'flagship') {
        soseShips = [...EMPIRE_FLAGSHIPS, ...ALLIANCE_FLAGSHIPS];
      } else if (selectedFaction === 'empire') {
        soseShips = [...EMPIRE_FLAGSHIPS, ...EMPIRE_ASSETS];
      } else {
        soseShips = [...ALLIANCE_FLAGSHIPS, ...ALLIANCE_ASSETS];
      }
      
      for (const ship of soseShips) {
        ships.push({
          id: `sose2_${ship.id}`,
          name: ship.name,
          nameKo: ship.nameKo,
          faction: ship.faction as 'empire' | 'alliance',
          commander: ship.commander,
          source: 'sose2',
          sose2Asset: ship,
        });
      }
    }

    setShipList(ships);
    setSelectedShip(null);
  }, [modSource, selectedFaction]);

  // 함선 선택 시 모델 로드
  useEffect(() => {
    if (!selectedShip || !sceneRef.current) return;

    const loadModel = async () => {
      setLoading(true);
      setError(null);

      try {
        // 기존 모델 제거
        if (currentModelRef.current) {
          sceneRef.current!.remove(currentModelRef.current);
          currentModelRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }

        let model: THREE.Group | null = null;

        if (selectedShip.source === 'stellaris' && selectedShip.stellarisAsset) {
          model = await loadShipFromAsset(selectedShip.stellarisAsset, {
            useTextures,
            color: useTextures
              ? undefined
              : STELLARIS_FACTION_COLORS[selectedShip.stellarisAsset.faction].primary,
          });
        } else if (selectedShip.source === 'sose2' && selectedShip.sose2Asset) {
          model = await loadSoSE2Model(selectedShip.sose2Asset);
        }

        if (model) {
          // 모델 바운딩 박스 계산
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          // 크기에 맞게 스케일 조정
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) {
            const scale = 5 / maxDim;
            model.scale.multiplyScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
          }
          model.position.y = 1;

          currentModelRef.current = model;
          sceneRef.current!.add(model);

          // 카메라 위치 리셋
          if (cameraRef.current) {
            cameraRef.current.position.set(5, 3, 5);
            cameraRef.current.lookAt(0, 1, 0);
          }
          if (controlsRef.current) {
            controlsRef.current.target.set(0, 1, 0);
            controlsRef.current.update();
          }
        }
      } catch (err) {
        console.error('Failed to load model:', err);
        setError(`모델 로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [selectedShip, useTextures, loadSoSE2Model]);

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* 사이드바 */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-amber-400">LOGH 함선 뷰어</h1>
          <p className="text-sm text-slate-400 mt-1">두 모드 통합 뷰어</p>
        </div>

        {/* 모드 선택 탭 */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setModSource('stellaris')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              modSource === 'stellaris'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            🌟 Stellaris
          </button>
          <button
            onClick={() => setModSource('sose2')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              modSource === 'sose2'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            ⚔️ SoSE2
          </button>
        </div>

        {/* 필터 */}
        <div className="p-4 border-b border-slate-700 space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">진영/카테고리</label>
            <select
              value={selectedFaction}
              onChange={(e) => setSelectedFaction(e.target.value as ViewFaction)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
            >
              <option value="flagship">⭐ 기함 (플래그십)</option>
              <option value="empire">🦅 은하제국</option>
              <option value="alliance">🌟 자유행성동맹</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useTextures"
              checked={useTextures}
              onChange={(e) => setUseTextures(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="useTextures" className="text-sm text-slate-300">
              텍스처 사용
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRotate"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="autoRotate" className="text-sm text-slate-300">
              자동 회전
            </label>
          </div>
        </div>

        {/* 함선 목록 */}
        <div className="flex-1 overflow-y-auto">
          {shipList.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              함선이 없습니다
            </div>
          ) : (
            shipList.map((ship) => (
              <button
                key={ship.id}
                onClick={() => setSelectedShip(ship)}
                className={`w-full text-left p-3 border-b border-slate-700 hover:bg-slate-700 transition ${
                  selectedShip?.id === ship.id ? 'bg-slate-700 border-l-4 border-l-amber-400' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={ship.faction === 'empire' ? 'text-blue-400' : 'text-green-400'}>
                    {ship.faction === 'empire' ? '🦅' : '🌟'}
                  </span>
                  <span className="font-medium text-sm">{ship.nameKo}</span>
                </div>
                <div className="text-xs text-slate-400 ml-6">{ship.name}</div>
                {ship.commander && (
                  <div className="text-xs text-amber-400 ml-6 mt-1">🎖️ {ship.commander}</div>
                )}
              </button>
            ))
          )}
        </div>

        {/* 선택된 함선 정보 */}
        {selectedShip && (
          <div className="p-4 border-t border-slate-700 bg-slate-850">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs ${
                selectedShip.source === 'stellaris' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-orange-600 text-white'
              }`}>
                {selectedShip.source === 'stellaris' ? 'Stellaris' : 'SoSE2'}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                selectedShip.faction === 'empire' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-green-600 text-white'
              }`}>
                {selectedShip.faction === 'empire' ? '제국' : '동맹'}
              </span>
            </div>
            <h3 className="font-bold text-amber-400 mt-2">{selectedShip.nameKo}</h3>
            <p className="text-xs text-slate-400">{selectedShip.name}</p>
            {selectedShip.commander && (
              <p className="text-xs text-amber-300 mt-1">지휘관: {selectedShip.commander}</p>
            )}
          </div>
        )}
      </div>

      {/* 3D 뷰어 */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />

        {/* 모드 표시 배지 */}
        <div className="absolute top-4 right-4 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            modSource === 'stellaris' 
              ? 'bg-purple-600 text-white' 
              : 'bg-orange-600 text-white'
          }`}>
            {modSource === 'stellaris' ? '🌟 Stellaris MOD' : '⚔️ SoSE2 MOD'}
          </span>
        </div>

        {/* 로딩 오버레이 */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-slate-800 rounded-lg p-6 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full mx-auto" />
              <p className="mt-3 text-sm">모델 로드 중...</p>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        )}

        {/* 컨트롤 안내 */}
        <div className="absolute bottom-4 left-4 bg-slate-800/80 rounded-lg p-3 text-xs text-slate-300">
          <div>🖱️ 드래그: 회전</div>
          <div>🔍 스크롤: 줌</div>
          <div>⌨️ 우클릭 드래그: 패닝</div>
        </div>

        {/* 모델 없음 안내 */}
        {!selectedShip && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-slate-500">
              <div className="text-6xl mb-4">🚀</div>
              <p>왼쪽 목록에서 함선을 선택하세요</p>
              <p className="text-sm mt-2">Stellaris / SoSE2 모드 전환 가능</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
