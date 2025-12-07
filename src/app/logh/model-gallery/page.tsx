'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { SHIP_DATA, DEFAULT_LENGTH } from '@/lib/logh/shipModelData';

interface ShipModels {
  [key: string]: string[];
}

type Category = 
  | 'empire_flagships' | 'empire_battleships' | 'empire_cruisers' | 'empire_destroyers' | 'empire_corvettes' 
  | 'empire_carriers' | 'empire_transports' | 'empire_engineering' | 'empire_others'
  | 'alliance_flagships' | 'alliance_battleships' | 'alliance_cruisers' | 'alliance_destroyers' | 'alliance_corvettes'
  | 'alliance_carriers' | 'alliance_transports' | 'alliance_engineering' | 'alliance_others';

const CATEGORY_NAMES: Record<Category, string> = {
  empire_flagships: '🦅 제국 기함',
  empire_battleships: '⚔️ 제국 전함',
  empire_cruisers: '🛡️ 제국 순양함',
  empire_destroyers: '🔱 제국 구축함',
  empire_corvettes: '🚀 제국 뇌격정',
  empire_carriers: '✈️ 제국 항모',
  empire_transports: '📦 제국 수송/양륙',
  empire_engineering: '🔧 제국 공작함',
  empire_others: '🏗️ 제국 기타',
  
  alliance_flagships: '🌟 동맹 기함',
  alliance_battleships: '⚔️ 동맹 전함',
  alliance_cruisers: '🛡️ 동맹 순양함',
  alliance_destroyers: '🔱 동맹 구축함',
  alliance_corvettes: '🚀 동맹 초계함',
  alliance_carriers: '✈️ 동맹 항모',
  alliance_transports: '📦 동맹 수송/양륙',
  alliance_engineering: '🔧 동맹 공작함',
  alliance_others: '🏗️ 동맹 기타',
};

const CATEGORY_COLORS: Record<Category, number> = {
  empire_flagships: 0xffd700,
  empire_battleships: 0xcc9900,
  empire_cruisers: 0xaa7700,
  empire_destroyers: 0x886600,
  empire_corvettes: 0x664400,
  empire_carriers: 0x995500,
  empire_transports: 0x774400,
  empire_engineering: 0x553300,
  empire_others: 0x443300,
  
  alliance_flagships: 0x00bfff,
  alliance_battleships: 0x0099cc,
  alliance_cruisers: 0x007799,
  alliance_destroyers: 0x005566,
  alliance_corvettes: 0x004444,
  alliance_carriers: 0x003355,
  alliance_transports: 0x002244,
  alliance_engineering: 0x001133,
  alliance_others: 0x001122,
};

const getAssetPath = (modelName?: string) => {
  if (modelName && (modelName.startsWith('FPA_') || modelName.startsWith('GE_') || modelName.startsWith('S_'))) {
    return {
      obj: '/assets/logh-sose2/obj',
      texture: '/assets/logh-sose2/textures-png',
    };
  }
  return {
    obj: '/assets/logh-stellaris/obj',
    texture: '/assets/logh-stellaris/textures-png',
  };
};

export default function ModelGalleryPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number>(0);

  const [models, setModels] = useState<ShipModels | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('empire_flagships');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useTexture, setUseTexture] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [modelInfo, setModelInfo] = useState<string>('');

  // 모델 목록 로드
  useEffect(() => {
    fetch('/ship-models.json')
      .then((res) => res.json())
      .then((data) => setModels(data))
      .catch(console.error);
  }, []);

  // Three.js 초기화
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(50, 30, 50);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0x4488ff, 0.5);
    directionalLight2.position.set(-50, -20, -50);
    scene.add(directionalLight2);

    // Grid
    const grid = new THREE.GridHelper(200, 40, 0x333366, 0x222244);
    scene.add(grid);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // autoRotate 상태 업데이트
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // 모델 로드
  const loadModel = useCallback(
    async (modelName: string) => {
      if (!sceneRef.current) return;

      setLoading(true);
      setModelInfo('');

      // 기존 모델 제거
      if (currentModelRef.current) {
        sceneRef.current.remove(currentModelRef.current);
        currentModelRef.current = null;
      }

      try {
        const objLoader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        const paths = getAssetPath(modelName);

        // 1. MTL 로드
        let materials: MTLLoader.MaterialCreator | null = null;
        try {
          materials = await new Promise<MTLLoader.MaterialCreator>((resolve, reject) => {
            mtlLoader.setPath(paths.obj + '/');
            mtlLoader.setResourcePath(paths.texture + '/');
            mtlLoader.setCrossOrigin('anonymous');
            mtlLoader.load(
              `${modelName}.mtl`,
              (materials) => {
                materials.preload();
                resolve(materials);
              },
              undefined,
              reject
            );
          });
        } catch (error) {
          console.warn('MTL 로드 실패, 기본 재질 사용:', error);
        }

        // 2. OBJ 로드 (MTL 적용)
        const obj = await new Promise<THREE.Group>((resolve, reject) => {
          if (materials) {
            objLoader.setMaterials(materials);
          }
          
          objLoader.load(
            `${paths.obj}/${modelName}.obj`,
            (loaded) => {
              // 로드된 geometry 검증
              loaded.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  // Geometry 검증
                  if (child.geometry) {
                    const pos = child.geometry.attributes.position;
                    if (pos) {
                      // NaN 값 제거
                      const arr = pos.array as Float32Array;
                      for (let i = 0; i < arr.length; i++) {
                        if (isNaN(arr[i]) || !isFinite(arr[i])) {
                          arr[i] = 0;
                        }
                      }
                      pos.needsUpdate = true;
                    }
                  }
                  
                  // 텍스처 미사용 시 기본 재질 적용
                  if (!useTexture && child.material) {
                    const color = CATEGORY_COLORS[selectedCategory];
                    child.material = new THREE.MeshStandardMaterial({
                      color: color,
                      metalness: 0.3,
                      roughness: 0.7,
                    });
                  }
                }
              });
              resolve(loaded);
            },
            undefined,
            reject
          );
        });

        // 크기 계산 및 정규화
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // NaN 체크
        if (isNaN(size.x) || isNaN(size.y) || isNaN(size.z) || 
            size.x === 0 || size.y === 0 || size.z === 0) {
          console.warn('모델 크기가 유효하지 않음, 기본값 사용');
          obj.scale.setScalar(0.1);
        } else {
          const maxDim = Math.max(size.x, size.y, size.z);
          
          // 실제 길이 데이터 기반 스케일링
          // 기준: 1000m = 50 유닛 (비율 1:20)
          const shipData = SHIP_DATA[modelName];
          const realLength = shipData ? shipData.length : DEFAULT_LENGTH;
          
          // 현재 모델의 길이(가장 긴 축)를 실제 길이에 맞춤
          // 하지만 obj 자체 스케일이 제각각이므로, 일단 정규화(50) 후 비율 적용
          
          // 1. 먼저 50 유닛으로 정규화
          const normalizedScale = 50 / maxDim;
          
          // 2. 실제 길이 비율 적용 (1000m 기준)
          const lengthRatio = realLength / 1000;
          const finalScale = normalizedScale * lengthRatio;
          
          obj.scale.setScalar(isFinite(finalScale) ? finalScale : 1);
          
          // 중앙 정렬
          if (isFinite(center.x) && isFinite(center.y) && isFinite(center.z)) {
            obj.position.sub(center.multiplyScalar(obj.scale.x));
          }
        }
        
        // 초기 회전값 설정
        if (modelName.startsWith('FPA_') || modelName.startsWith('GE_') || modelName.startsWith('S_')) {
          // SoSE: 기본
          obj.rotation.set(0, 0, 0);
        } else {
          // Stellaris: Y축 180도 회전
          obj.rotation.set(0, -Math.PI, 0);
        }

        sceneRef.current.add(obj);
        currentModelRef.current = obj;

        // 카메라 위치 조정
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(80, 50, 80);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }

        // 모델 정보
        let vertexCount = 0;
        let faceCount = 0;
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            const geo = child.geometry;
            vertexCount += geo.attributes.position?.count || 0;
            if (geo.index) {
              faceCount += geo.index.count / 3;
            }
          }
        });
        const shipData = SHIP_DATA[modelName];
        setModelInfo(
          `${shipData ? shipData.name : modelName} | ` +
          `길이: ${shipData ? shipData.length + 'm' : '알 수 없음'} | ` +
          `정점: ${vertexCount.toLocaleString()} | ` +
          `텍스처: ${materials ? '✅' : '❌'}`
        );

      } catch (error) {
        console.error('모델 로드 실패:', error);
        setModelInfo(`❌ 로드 실패: ${error}`);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, useTexture]
  );

  // 모델 선택 시 로드
  useEffect(() => {
    if (selectedModel) {
      loadModel(selectedModel);
    }
  }, [selectedModel, loadModel]);

  // 카테고리별 모델 목록
  const currentModels = models?.[selectedCategory] ?? [];

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* 사이드바 */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-amber-400">🚀 3D 모델 갤러리</h1>
          <p className="text-sm text-slate-400 mt-1">총 117개 모델</p>
        </div>

        {/* 카테고리 탭 */}
        <div className="border-b border-slate-700">
          {(Object.keys(CATEGORY_NAMES) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedModel(null);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition ${
                selectedCategory === cat
                  ? 'bg-slate-700 text-amber-400 border-l-4 border-amber-400'
                  : 'hover:bg-slate-700'
              }`}
            >
              {CATEGORY_NAMES[cat]} ({models?.[cat]?.length || 0})
            </button>
          ))}
        </div>

        {/* 옵션 */}
        <div className="p-3 border-b border-slate-700 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useTexture}
              onChange={(e) => setUseTexture(e.target.checked)}
              className="rounded"
            />
            텍스처 적용
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              className="rounded"
            />
            자동 회전
          </label>
        </div>

        {/* 모델 목록 */}
        <div className="flex-1 overflow-y-auto">
          {currentModels.map((model) => (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              className={`w-full text-left px-4 py-2 text-sm border-b border-slate-700 hover:bg-slate-700 transition ${
                selectedModel === model
                  ? 'bg-slate-700 text-amber-400'
                  : ''
              }`}
            >
              <div className="font-mono">{model.replace(/^(tgef_01_|tfpa_01_|mammalian_01_)/, '')}</div>
              <div className="text-xs text-slate-500">{model}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3D 뷰어 */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />

        {/* 로딩 */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-slate-800 rounded-lg p-6 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full mx-auto" />
              <p className="mt-3 text-sm">로딩 중...</p>
            </div>
          </div>
        )}

        {/* 모델 정보 */}
        {modelInfo && (
          <div className="absolute top-4 left-4 bg-slate-800/90 rounded px-3 py-2 text-xs">
            {modelInfo}
          </div>
        )}

        {/* 선택된 모델 이름 */}
        {selectedModel && (
          <div className="absolute top-4 right-4 bg-amber-500/90 text-black rounded px-4 py-2 font-bold">
            {selectedModel.replace(/^(tgef_01_|tfpa_01_|mammalian_01_)/, '')}
          </div>
        )}

        {/* 안내 */}
        {!selectedModel && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-slate-500">
              <div className="text-6xl mb-4">🚀</div>
              <p>왼쪽 목록에서 모델을 선택하세요</p>
            </div>
          </div>
        )}

        {/* 컨트롤 안내 */}
        <div className="absolute bottom-4 left-4 bg-slate-800/80 rounded-lg p-3 text-xs text-slate-300">
          <div>🖱️ 드래그: 회전</div>
          <div>🔍 스크롤: 줌</div>
          <div>⌨️ 우클릭 드래그: 패닝</div>
        </div>
      </div>
    </div>
  );
}

