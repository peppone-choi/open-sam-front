'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

interface ShipModels {
  empire_flagships: string[];
  empire_ships: string[];
  alliance_flagships: string[];
  alliance_ships: string[];
  other_ships: string[];
}

type Category = 'empire_flagships' | 'empire_ships' | 'alliance_flagships' | 'alliance_ships' | 'other_ships';

const CATEGORY_INFO: Record<Category, { name: string; color: number }> = {
  empire_flagships: { name: '🦅 제국 기함', color: 0xffd700 },
  empire_ships: { name: '⚔️ 제국 일반함', color: 0x888888 },
  alliance_flagships: { name: '🌟 동맹 기함', color: 0x00bfff },
  alliance_ships: { name: '🚀 동맹 일반함', color: 0x4a9e4a },
  other_ships: { name: '🔹 기타', color: 0x666666 },
};

const OBJ_PATH = '/assets/logh-stellaris/obj';
const TEXTURE_PATH = '/assets/logh-stellaris/textures-png';

interface ModelCard {
  name: string;
  category: Category;
  canvas: HTMLCanvasElement | null;
  loaded: boolean;
  error: boolean;
}

function ModelThumbnail({ modelName, category }: { modelName: string; category: Category }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = 160;
    const height = 120;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f23);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(50, 30, 50);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    // Load model
    const objLoader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader();

    objLoader.load(
      `${OBJ_PATH}/${modelName}.obj`,
      async (obj) => {
        // Try to load texture
        const textureName = modelName.toLowerCase() + '_diffuse.png';
        let diffuseTexture: THREE.Texture | null = null;
        
        try {
          diffuseTexture = await new Promise<THREE.Texture>((resolve, reject) => {
            textureLoader.load(
              `${TEXTURE_PATH}/${textureName}`,
              resolve,
              undefined,
              reject
            );
          });
          diffuseTexture.colorSpace = THREE.SRGBColorSpace;
        } catch {
          // Texture not found, use color
        }

        // Apply material
        const color = CATEGORY_INFO[category].color;
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: diffuseTexture ? 0xffffff : color,
              metalness: 0.3,
              roughness: 0.7,
              map: diffuseTexture,
            });
          }
        });

        // Fit to view
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 30 / maxDim;
        obj.scale.setScalar(scale);
        obj.position.sub(center.multiplyScalar(scale));
        obj.rotation.x = -Math.PI / 2;

        scene.add(obj);

        // Simple animation loop
        let angle = 0;
        const animate = () => {
          angle += 0.02;
          obj.rotation.z = angle;
          renderer.render(scene, camera);
          requestAnimationFrame(animate);
        };
        animate();

        setLoaded(true);
      },
      undefined,
      () => {
        setError(true);
      }
    );

    return () => {
      renderer.dispose();
    };
  }, [modelName, category]);

  const displayName = modelName.replace(/^(tgef_01_|tfpa_01_|mammalian_01_)/, '');

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-amber-400 transition-all cursor-pointer">
      <canvas
        ref={canvasRef}
        width={160}
        height={120}
        className="w-full"
        style={{ display: 'block' }}
      />
      <div className="p-2">
        <h3 className="text-xs font-medium truncate" title={displayName}>
          {displayName}
        </h3>
        {error && <p className="text-xs text-red-400">로드 실패</p>}
        {!loaded && !error && <p className="text-xs text-slate-500">로딩...</p>}
      </div>
    </div>
  );
}

export default function ModelGridPage() {
  const [models, setModels] = useState<ShipModels | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('empire_flagships');
  const [useTexture, setUseTexture] = useState(true);

  useEffect(() => {
    fetch('/ship-models.json')
      .then((res) => res.json())
      .then((data) => setModels(data))
      .catch(console.error);
  }, []);

  // Filter out frame/empty models
  const currentModels = models
    ? models[selectedCategory].filter(
        (m) => !m.toLowerCase().includes('frame') && 
               !m.toLowerCase().includes('empty') &&
               !m.toLowerCase().includes('dummy')
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-400 mb-2">🚀 3D 모델 그리드 뷰</h1>
        <p className="text-slate-400 mb-6">모든 모델을 한눈에 확인</p>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(Object.keys(CATEGORY_INFO) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {CATEGORY_INFO[cat].name} ({models?.[cat]?.length || 0})
            </button>
          ))}
        </div>

        {/* Options */}
        <div className="mb-6 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useTexture}
              onChange={(e) => setUseTexture(e.target.checked)}
              className="rounded"
            />
            텍스처 적용
          </label>
          <span className="text-slate-400">
            표시 중: {currentModels.length}개 모델
          </span>
        </div>

        {/* Model grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {currentModels.map((modelName) => (
            <ModelThumbnail
              key={modelName}
              modelName={modelName}
              category={selectedCategory}
            />
          ))}
        </div>

        {/* Loading state */}
        {!models && (
          <div className="text-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-slate-400">모델 목록 로딩 중...</p>
          </div>
        )}
      </div>
    </div>
  );
}










