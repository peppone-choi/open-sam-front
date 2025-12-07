'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { parseSoSE2Mesh, createIndexedBufferGeometry, extractExhaustPoints, ParsedMesh } from '@/lib/logh/SoSE2MeshParser';
import { loadDDSTexture } from '@/lib/logh/TextureLoader';
import { ParticleManager } from '@/lib/logh/ParticleSystem';
import { soundManager } from '@/lib/logh/SoundManager';
import { ShipAsset, getShipByMesh } from '@/lib/logh/LOGHAssets';
import { createSoSE2Material, FACTION_COLORS } from '@/lib/logh/SoSE2ShaderMaterial';

interface AssetInfo {
  name: string;
  path: string;
  size: number;
}

interface AssetsResponse {
  meshes: AssetInfo[];
  textures: AssetInfo[];
  sounds: AssetInfo[];
}

interface FullShipRendererProps {
  onShipSelect?: (ship: ShipAsset | null) => void;
}

// 진영별 색상
const FACTION_MATERIALS = {
  empire: {
    color: 0x8b7355,
    emissive: 0x331100,
    metalness: 0.7,
    roughness: 0.3,
  },
  alliance: {
    color: 0x4a5568,
    emissive: 0x001133,
    metalness: 0.6,
    roughness: 0.4,
  },
  neutral: {
    color: 0x666666,
    emissive: 0x111111,
    metalness: 0.5,
    roughness: 0.5,
  },
};

export default function FullShipRenderer({
  onShipSelect,
}: FullShipRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const shipMeshRef = useRef<THREE.Mesh | null>(null);
  const particleManagerRef = useRef<ParticleManager | null>(null);
  const clockRef = useRef(new THREE.Clock());
  
  const [assets, setAssets] = useState<AssetsResponse | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<string>('');
  const [selectedShip, setSelectedShip] = useState<ShipAsset | null>(null);
  const [parsedMesh, setParsedMesh] = useState<ParsedMesh | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEffects, setShowEffects] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 에셋 목록 로드
  useEffect(() => {
    async function loadAssets() {
      try {
        const response = await fetch('/api/logh/assets');
        if (response.ok) {
          const data: AssetsResponse = await response.json();
          setAssets(data);
          
          // 첫 번째 메쉬 자동 선택
          if (data.meshes.length > 0 && !selectedMesh) {
            setSelectedMesh(data.meshes[0].path);
          }
        }
      } catch (err) {
        console.error('Failed to load assets:', err);
      }
    }
    loadAssets();
  }, []);

  // Three.js 초기화
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    // 안개 제거 (큰 메쉬가 가려지지 않도록)
    sceneRef.current = scene;

    // Camera - far 클리핑 거리를 충분히 크게
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100000);
    camera.position.set(500, 300, 500);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 리사이즈 핸들러
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controlsRef.current = controls;

    // Lights - 강한 조명으로 메쉬가 보이도록
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(500, 500, 500);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 1.0);
    fillLight.position.set(-500, -200, -500);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffaa88, 0.8);
    rimLight.position.set(0, -300, 500);
    scene.add(rimLight);

    // 헤미스피어 라이트 (위에서 하늘색, 아래에서 갈색)
    const hemiLight = new THREE.HemisphereLight(0x88ccff, 0x886644, 0.5);
    scene.add(hemiLight);

    // 별 배경
    createStarfield(scene);

    // 그리드
    const gridHelper = new THREE.GridHelper(1000, 50, 0x222244, 0x111133);
    gridHelper.position.y = -100;
    scene.add(gridHelper);

    // 파티클 매니저
    const particleManager = new ParticleManager(scene);
    particleManagerRef.current = particleManager;

    // 애니메이션 루프
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const delta = clockRef.current.getDelta();
      
      controls.update();
      particleManager.update(delta);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      particleManager.dispose();
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // 별 배경 생성
  const createStarfield = (scene: THREE.Scene) => {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 4000;
      positions[i3 + 1] = (Math.random() - 0.5) * 4000;
      positions[i3 + 2] = (Math.random() - 0.5) * 4000;
      
      const colorType = Math.random();
      if (colorType > 0.9) {
        colors[i3] = 1; colors[i3 + 1] = 0.8; colors[i3 + 2] = 0.5;
      } else if (colorType > 0.7) {
        colors[i3] = 0.5; colors[i3 + 1] = 0.7; colors[i3 + 2] = 1;
      } else {
        colors[i3] = 1; colors[i3 + 1] = 1; colors[i3 + 2] = 1;
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  };

  // 메쉬 로드
  const loadMesh = useCallback(async (meshPath: string) => {
    if (!sceneRef.current || !meshPath) return;

    setLoading(true);
    setError(null);

    try {
      // 기존 메쉬 제거
      if (shipMeshRef.current) {
        sceneRef.current.remove(shipMeshRef.current);
        shipMeshRef.current.geometry.dispose();
        if (Array.isArray(shipMeshRef.current.material)) {
          shipMeshRef.current.material.forEach(m => m.dispose());
        } else {
          shipMeshRef.current.material.dispose();
        }
        shipMeshRef.current = null;
      }

      // 엔진 효과 제거
      if (particleManagerRef.current) {
        for (let i = 0; i < 10; i++) {
          particleManagerRef.current.removeEngineEffect(`engine-${i}`);
        }
      }

      // 메쉬 파일 로드
      const response = await fetch(meshPath);
      if (!response.ok) throw new Error(`Failed to load mesh: ${meshPath}`);
      const meshText = await response.text();

      // 메쉬 파싱
      const parsed = parseSoSE2Mesh(meshText);
      setParsedMesh(parsed);

      // 메쉬 이름에서 함선 정보 찾기
      const meshName = meshPath.split('/').pop()?.replace('.mesh', '') || '';
      const shipInfo = getShipByMesh(meshName);
      
      // 진영 추측
      const isEmpire = meshName.toLowerCase().includes('ge_') || 
                       meshName.toLowerCase().includes('empire') ||
                       ['brunhild', 'barbarossa', 'beowulf', 'tristan', 'koenigstiger'].some(n => meshName.toLowerCase().includes(n));
      
      const faction = shipInfo?.faction || (isEmpire ? 'empire' : 'alliance');

      // 지오메트리 생성
      const geometry = createIndexedBufferGeometry(parsed);
      
      // 지오메트리를 원점으로 이동 (center)
      geometry.computeBoundingBox();
      if (geometry.boundingBox) {
        const geoCenter = new THREE.Vector3();
        geometry.boundingBox.getCenter(geoCenter);
        geometry.translate(-geoCenter.x, -geoCenter.y, -geoCenter.z);
      }

      // 재질 설정 - 진영별 색상
      const factionColors = {
        empire: 0xcc9966,   // 금갈색 (제국)
        alliance: 0x6699cc, // 청회색 (동맹)
        neutral: 0x888888,  // 회색 (중립)
      };
      const meshColor = factionColors[faction] || factionColors.neutral;
      
      // .mesh 파일에서 텍스처 정보 읽기
      let material: THREE.Material;
      const meshMaterial = parsed.materials[0]; // 첫 번째 재질 사용
      
      if (meshMaterial && meshMaterial.diffuseTexture) {
        const diffuseName = meshMaterial.diffuseTexture.toLowerCase();
        const dataName = meshMaterial.selfIlluminationTexture?.toLowerCase(); // Data 텍스처
        const normalName = meshMaterial.normalTexture?.toLowerCase();
        
        console.log('Loading textures:', { diffuseName, dataName, normalName });
        
        try {
          // 디퓨즈 텍스처 로드 (필수)
          const diffusePath = `/assets/logh/textures/${diffuseName}`;
          const texResponse = await fetch(diffusePath);
          if (!texResponse.ok) throw new Error(`Texture not found: ${diffusePath}`);
          const texBuffer = await texResponse.arrayBuffer();
          const diffuseMap = loadDDSTexture(texBuffer);
          
          if (diffuseMap) {
            // Diffuse 텍스처 sRGB 색상 공간
            diffuseMap.colorSpace = THREE.SRGBColorSpace;
            
            // Data 텍스처 로드 (선택)
            let dataMap: THREE.DataTexture | null = null;
            if (dataName) {
              try {
                const dataPath = `/assets/logh/textures/${dataName}`;
                const dataResponse = await fetch(dataPath);
                if (dataResponse.ok) {
                  const dataBuffer = await dataResponse.arrayBuffer();
                  dataMap = loadDDSTexture(dataBuffer);
                  if (dataMap) {
                    console.log('Data map loaded:', dataName);
                  }
                }
              } catch (e) { console.warn('Data map failed:', e); }
            }
            
            // Normal 텍스처 로드 (선택)
            let normalMap: THREE.DataTexture | null = null;
            if (normalName) {
              try {
                const normalPath = `/assets/logh/textures/${normalName}`;
                const normalResponse = await fetch(normalPath);
                if (normalResponse.ok) {
                  const normalBuffer = await normalResponse.arrayBuffer();
                  normalMap = loadDDSTexture(normalBuffer);
                  if (normalMap) {
                    console.log('Normal map loaded:', normalName);
                  }
                }
              } catch (e) { console.warn('Normal map failed:', e); }
            }
            
            // 진영에 따른 팀 컬러 선택
            const teamColor = faction === 'empire' ? FACTION_COLORS.empire :
                             faction === 'alliance' ? FACTION_COLORS.alliance :
                             FACTION_COLORS.neutral;
            
            // SoSE2 커스텀 셰이더 머티리얼 생성
            material = createSoSE2Material({
              diffuseMap,
              dataMap,
              normalMap,
              teamColor,
              teamColorIntensity: 0.7, // 팀 컬러 강도
            });
            
            console.log('SoSE2 shader material applied with team color:', faction);
          } else {
            throw new Error('Diffuse texture decode failed');
          }
        } catch (err) {
          console.warn('Texture loading failed:', err);
          // 텍스처 로드 실패 시 기본 회색
          material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            side: THREE.DoubleSide,
            metalness: 0.0,
            roughness: 1.0,
          });
        }
      } else {
        // 텍스처 정보 없는 메쉬는 기본 회색
        material = new THREE.MeshStandardMaterial({
          color: 0x888888,
          side: THREE.DoubleSide,
          metalness: 0.0,
          roughness: 1.0,
        });
      }

      // 메쉬 생성
      const mesh = new THREE.Mesh(geometry, material);
      // SoSE2 모델 - 회전 없이 원본 상태로 표시
      mesh.rotation.set(0, 0, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      sceneRef.current.add(mesh);
      shipMeshRef.current = mesh;

      // 카메라 자동 조정
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      
      const box = new THREE.Box3().setFromObject(mesh);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2.5; // 거리를 더 멀리
      
      console.log('Mesh loaded:', meshPath);
      console.log('Size:', size);
      console.log('Center:', center);
      console.log('Max dimension:', maxDim);
      
      // 카메라 위치 설정
      cameraRef.current!.position.set(
        center.x + distance,
        center.y + distance * 0.3,
        center.z + distance
      );
      cameraRef.current!.lookAt(center);
      
      // 컨트롤 타겟 설정
      controlsRef.current!.target.copy(center);
      controlsRef.current!.update();

      // 엔진 효과 추가
      if (showEffects && particleManagerRef.current) {
        const exhaustPoints = extractExhaustPoints(parsed);
        exhaustPoints.forEach((ep, i) => {
          const pos = new THREE.Vector3(ep.position[0], ep.position[2], -ep.position[1]);
          particleManagerRef.current!.addEngineEffect(
            `engine-${i}`,
            pos,
            faction === 'alliance' ? 'alliance' : 'empire'
          );
        });
      }

      // 함선 정보 설정
      const ship: ShipAsset = shipInfo || {
        id: meshName,
        name: meshName,
        nameKo: meshName,
        faction: faction,
        type: 'standard',
        mesh: meshName,
      };
      
      setSelectedShip(ship);
      onShipSelect?.(ship);

      // 사운드
      if (bgmEnabled) {
        await soundManager.resume();
        soundManager.playSFX('ready.battleship');
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mesh');
      setLoading(false);
    }
  }, [assets, showEffects, bgmEnabled, onShipSelect]);

  // 선택 변경 시 로드
  useEffect(() => {
    if (selectedMesh) {
      loadMesh(selectedMesh);
    }
  }, [selectedMesh, loadMesh]);

  // 빔 발사 테스트
  const testFireBeam = useCallback(() => {
    if (!particleManagerRef.current || !shipMeshRef.current) return;

    // 함선의 전방 방향 계산 (로컬 +Z가 전방)
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(shipMeshRef.current.quaternion);
    
    // 함선 위치에서 전방으로 빔 발사
    const shipPos = shipMeshRef.current.position.clone();
    const start = shipPos.clone().add(forward.clone().multiplyScalar(200));
    const end = shipPos.clone().add(forward.clone().multiplyScalar(700));

    const color = selectedShip?.faction === 'alliance' ? 0x44ff44 : 0xff4444;
    particleManagerRef.current.fireBeam(start, end, color);

    if (bgmEnabled) {
      soundManager.playWeaponSound('heavy');
    }
  }, [selectedShip, bgmEnabled]);

  // 폭발 테스트
  const testExplosion = useCallback(() => {
    if (!particleManagerRef.current) return;

    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 200
    );
    
    particleManagerRef.current.triggerExplosion(pos);

    if (bgmEnabled) {
      soundManager.playSFX('voice.underAttack');
    }
  }, [bgmEnabled]);

  // 미사일 발사 테스트
  const testMissile = useCallback(() => {
    if (!particleManagerRef.current || !shipMeshRef.current) return;

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(shipMeshRef.current.quaternion);
    
    const shipPos = shipMeshRef.current.position.clone();
    const start = shipPos.clone().add(forward.clone().multiplyScalar(100));
    const end = shipPos.clone().add(forward.clone().multiplyScalar(800));
    // 약간의 랜덤 오프셋
    end.x += (Math.random() - 0.5) * 100;
    end.y += (Math.random() - 0.5) * 50;

    particleManagerRef.current.fireMissile(start, end);

    if (bgmEnabled) {
      soundManager.playWeaponSound('medium');
    }
  }, [bgmEnabled]);

  // 어뢰 발사 테스트
  const testTorpedo = useCallback(() => {
    if (!particleManagerRef.current || !shipMeshRef.current) return;

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(shipMeshRef.current.quaternion);
    
    const shipPos = shipMeshRef.current.position.clone();
    const start = shipPos.clone().add(forward.clone().multiplyScalar(150));
    const end = shipPos.clone().add(forward.clone().multiplyScalar(1000));

    particleManagerRef.current.fireTorpedo(start, end);

    if (bgmEnabled) {
      soundManager.playWeaponSound('heavy');
    }
  }, [bgmEnabled]);

  // 중성자탄 발사 테스트
  const testNeutronBeam = useCallback(() => {
    if (!particleManagerRef.current || !shipMeshRef.current) return;

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(shipMeshRef.current.quaternion);
    
    const shipPos = shipMeshRef.current.position.clone();
    const start = shipPos.clone().add(forward.clone().multiplyScalar(50));
    const end = shipPos.clone().add(forward.clone().multiplyScalar(600));

    particleManagerRef.current.fireNeutronBeam(start, end);

    if (bgmEnabled) {
      soundManager.playWeaponSound('heavy');
    }
  }, [bgmEnabled]);

  // BGM 토글
  const toggleBGM = useCallback(async () => {
    await soundManager.resume();
    
    if (!bgmEnabled) {
      const category = selectedShip?.faction === 'alliance' ? 'quiet' : 'battle';
      soundManager.playBGM(category);
    } else {
      soundManager.stopBGM();
    }
    
    setBgmEnabled(!bgmEnabled);
  }, [bgmEnabled, selectedShip]);

  // 필터링된 메쉬 목록
  const filteredMeshes = assets?.meshes.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* 왼쪽: 컨트롤 패널 */}
      <div className="w-80 bg-gray-800 p-4 overflow-y-auto border-r border-gray-700">
        <h2 className="text-xl font-bold mb-4">🚀 LOGH 함선 뷰어</h2>
        
        {/* 검색 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="함선 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* 메쉬 목록 */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-400 mb-2">
            메쉬 파일 ({filteredMeshes.length}개)
          </h3>
          <div className="max-h-80 overflow-y-auto space-y-1 bg-gray-700/50 rounded p-2">
            {filteredMeshes.length === 0 ? (
              <div className="text-gray-500 text-sm p-2">
                {assets ? '메쉬 파일이 없습니다' : '로딩 중...'}
              </div>
            ) : (
              filteredMeshes.map(mesh => {
                const name = mesh.name.replace('.mesh', '');
                const isEmpire = name.toLowerCase().includes('ge_') || 
                                 ['brunhild', 'barbarossa', 'beowulf'].some(n => name.toLowerCase().includes(n));
                const isSelected = mesh.path === selectedMesh;
                
                return (
                  <button
                    key={mesh.path}
                    onClick={() => setSelectedMesh(mesh.path)}
                    className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-600'
                    }`}
                  >
                    <span className={isEmpire ? 'text-yellow-400' : 'text-blue-400'}>
                      {isEmpire ? '⚔️' : '🛡️'}
                    </span>
                    {' '}{name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 옵션 */}
        <div className="mb-6 space-y-2">
          <h3 className="text-sm font-bold text-gray-400 mb-2">옵션</h3>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showEffects}
              onChange={(e) => setShowEffects(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">파티클 효과</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bgmEnabled}
              onChange={toggleBGM}
              className="rounded"
            />
            <span className="text-sm">사운드</span>
          </label>
        </div>

        {/* 광선 무기 */}
        <div className="mb-4 space-y-1">
          <h3 className="text-sm font-bold text-gray-400 mb-2">광선 무기</h3>
          <button
            onClick={testNeutronBeam}
            disabled={!shipMeshRef.current}
            className="w-full py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded text-xs"
          >
            ⚡ 중성자 광선포
          </button>
          <button
            onClick={testFireBeam}
            disabled={!shipMeshRef.current}
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-xs"
          >
            🔵 하전입자 광선포
          </button>
          <button
            onClick={() => {
              if (!particleManagerRef.current || !shipMeshRef.current) return;
              const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(shipMeshRef.current.quaternion);
              const pos = shipMeshRef.current.position.clone();
              particleManagerRef.current.fireBeam(
                pos.clone().add(forward.clone().multiplyScalar(200)),
                pos.clone().add(forward.clone().multiplyScalar(700)),
                0x00ff00 // 녹색 레이저
              );
            }}
            disabled={!shipMeshRef.current}
            className="w-full py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-xs"
          >
            🟢 레이저 광선포
          </button>
          <button
            onClick={() => {
              if (!particleManagerRef.current || !shipMeshRef.current) return;
              const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(shipMeshRef.current.quaternion);
              const pos = shipMeshRef.current.position.clone();
              particleManagerRef.current.fireBeam(
                pos.clone().add(forward.clone().multiplyScalar(200)),
                pos.clone().add(forward.clone().multiplyScalar(700)),
                0x8888ff // 보라색 전자빔
              );
            }}
            disabled={!shipMeshRef.current}
            className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-xs"
          >
            🟣 전자빔 광선포
          </button>
        </div>

        {/* 실탄/미사일 */}
        <div className="mb-4 space-y-1">
          <h3 className="text-sm font-bold text-gray-400 mb-2">실탄/미사일</h3>
          <button
            onClick={testTorpedo}
            disabled={!shipMeshRef.current}
            className="w-full py-1.5 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-600 rounded text-xs"
          >
            💨 레일캐논 (초경강탄)
          </button>
          <button
            onClick={testMissile}
            disabled={!shipMeshRef.current}
            className="w-full py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded text-xs"
          >
            🚀 우라늄238 미사일
          </button>
          <button
            onClick={() => {
              if (!particleManagerRef.current || !shipMeshRef.current) return;
              const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(shipMeshRef.current.quaternion);
              const pos = shipMeshRef.current.position.clone();
              // 다중 미사일 발사
              for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                  const offset = new THREE.Vector3((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 30, 0);
                  particleManagerRef.current?.fireMissile(
                    pos.clone().add(forward.clone().multiplyScalar(100)).add(offset),
                    pos.clone().add(forward.clone().multiplyScalar(800)).add(offset.multiplyScalar(3))
                  );
                }, i * 200);
              }
            }}
            disabled={!shipMeshRef.current}
            className="w-full py-1.5 bg-red-700 hover:bg-red-800 disabled:bg-gray-600 rounded text-xs"
          >
            💥 레이저 수폭 미사일
          </button>
        </div>

        {/* 기타 */}
        <div className="mb-6 space-y-1">
          <h3 className="text-sm font-bold text-gray-400 mb-2">기타</h3>
          <button
            onClick={testExplosion}
            className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 rounded text-xs"
          >
            💥 폭발 테스트
          </button>
        </div>

        {/* 선택된 함선 정보 */}
        {selectedShip && (
          <div className="bg-gray-700 rounded p-3">
            <h3 className="font-bold">{selectedShip.nameKo}</h3>
            <p className="text-sm text-gray-400">{selectedShip.name}</p>
            <div className="mt-2 text-xs space-y-1">
              <div>진영: <span className={selectedShip.faction === 'empire' ? 'text-yellow-400' : 'text-blue-400'}>
                {selectedShip.faction === 'empire' ? '은하제국' : '자유행성동맹'}
              </span></div>
              {selectedShip.commander && (
                <div>지휘관: {selectedShip.commander}</div>
              )}
              {selectedShip.description && (
                <div className="text-gray-400 mt-1">{selectedShip.description}</div>
              )}
              {parsedMesh && (
                <>
                  <div className="border-t border-gray-600 pt-1 mt-2">
                    버텍스: {parsedMesh.vertices.length.toLocaleString()}
                  </div>
                  <div>삼각형: {parsedMesh.triangles.length.toLocaleString()}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 에셋 통계 */}
        {assets && (
          <div className="mt-4 text-xs text-gray-500">
            <div>메쉬: {assets.meshes.length}개</div>
            <div>텍스처: {assets.textures.length}개</div>
            <div>사운드: {assets.sounds.length}개</div>
          </div>
        )}
      </div>

      {/* 오른쪽: 3D 뷰어 */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />
        
        {/* 로딩 오버레이 */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-xl">로딩 중...</div>
          </div>
        )}
        
        {/* 에러 */}
        {error && (
          <div className="absolute top-4 right-4 bg-red-600/80 px-4 py-2 rounded">
            {error}
          </div>
        )}
        
        {/* 안내 */}
        {!selectedShip && !loading && !assets?.meshes.length && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🛸</div>
              <div className="text-xl">메쉬 파일이 없습니다</div>
              <div className="text-sm mt-2">
                먼저 에셋 복사 스크립트를 실행하세요:<br/>
                <code className="bg-gray-800 px-2 py-1 rounded mt-2 inline-block">
                  bash scripts/copy-gineiden-assets.sh
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
