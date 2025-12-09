'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { parseSoSE2Mesh, createIndexedBufferGeometry, extractWeaponPoints, extractExhaustPoints, ParsedMesh } from '@/lib/logh/SoSE2MeshParser';

interface ShipMeshViewerProps {
  meshData?: string;          // .mesh 파일 내용
  meshUrl?: string;           // .mesh 파일 URL
  shipName?: string;
  faction?: 'empire' | 'alliance';
  width?: number;
  height?: number;
  showWeaponPoints?: boolean;
  showExhaustPoints?: boolean;
  autoRotate?: boolean;
}

// 진영별 색상
const FACTION_COLORS = {
  empire: {
    hull: 0x8b7355,      // 갈색/금색 계열
    accent: 0xffd700,    // 금색
    emissive: 0x331100,
  },
  alliance: {
    hull: 0x4a5568,      // 회청색
    accent: 0x4299e1,    // 파랑
    emissive: 0x001133,
  },
};

export default function ShipMeshViewer({
  meshData,
  meshUrl,
  shipName = 'Unknown Ship',
  faction = 'empire',
  width = 800,
  height = 600,
  showWeaponPoints = false,
  showExhaustPoints = true,
  autoRotate = true,
}: ShipMeshViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const shipMeshRef = useRef<THREE.Mesh | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsedMesh, setParsedMesh] = useState<ParsedMesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 10000);
    camera.position.set(200, 100, 300);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.5;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(100, 100, 100);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    fillLight.position.set(-100, -50, -100);
    scene.add(fillLight);

    // 그리드
    const gridHelper = new THREE.GridHelper(500, 50, 0x333355, 0x222244);
    gridHelper.position.y = -100;
    scene.add(gridHelper);

    // 애니메이션
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      controls.dispose();
    };
  }, [width, height, autoRotate]);

  // 메쉬 데이터 로드 및 파싱
  useEffect(() => {
    const loadMesh = async () => {
      setLoading(true);
      setError(null);

      try {
        let data = meshData;
        
        if (!data && meshUrl) {
          const response = await fetch(meshUrl);
          if (!response.ok) throw new Error('Failed to load mesh file');
          data = await response.text();
        }

        if (!data) {
          throw new Error('No mesh data provided');
        }

        const parsed = parseSoSE2Mesh(data);
        setParsedMesh(parsed);

        if (!sceneRef.current) return;

        // 기존 메쉬 제거
        if (shipMeshRef.current) {
          sceneRef.current.remove(shipMeshRef.current);
          shipMeshRef.current.geometry.dispose();
        }

        // 새 geometry 생성
        const geometry = createIndexedBufferGeometry(parsed);

        // 재질 설정
        const colors = FACTION_COLORS[faction];
        const material = new THREE.MeshStandardMaterial({
          color: colors.hull,
          emissive: colors.emissive,
          emissiveIntensity: 0.2,
          metalness: 0.7,
          roughness: 0.3,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // 함선 방향 조정 (Z축이 앞)
        mesh.rotation.x = -Math.PI / 2;
        
        sceneRef.current.add(mesh);
        shipMeshRef.current = mesh;

        // 무기 포인트 표시
        if (showWeaponPoints) {
          const weaponPoints = extractWeaponPoints(parsed);
          for (const wp of weaponPoints) {
            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(2, 8, 8),
              new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            sphere.position.set(wp.position[0], wp.position[2], -wp.position[1]);
            sceneRef.current.add(sphere);
          }
        }

        // 엔진 포인트 표시
        if (showExhaustPoints) {
          const exhaustPoints = extractExhaustPoints(parsed);
          for (const ep of exhaustPoints) {
            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(3, 8, 8),
              new THREE.MeshBasicMaterial({ 
                color: faction === 'empire' ? 0xff6600 : 0x00aaff,
                transparent: true,
                opacity: 0.8,
              })
            );
            sphere.position.set(ep.position[0], ep.position[2], -ep.position[1]);
            sceneRef.current.add(sphere);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    loadMesh();
  }, [meshData, meshUrl, faction, showWeaponPoints, showExhaustPoints]);

  return (
    <div className="relative">
      <div ref={containerRef} style={{ width, height }} />
      
      {/* 정보 오버레이 */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg">
        <div className="text-lg font-bold">{shipName}</div>
        <div className="text-sm text-gray-400 capitalize">{faction}</div>
        
        {parsedMesh && (
          <div className="mt-2 text-xs text-gray-500">
            <div>버텍스: {parsedMesh.vertices.length.toLocaleString()}</div>
            <div>삼각형: {parsedMesh.triangles.length.toLocaleString()}</div>
            <div>크기: {parsedMesh.boundingRadius.toFixed(1)}</div>
          </div>
        )}
      </div>

      {/* 로딩/에러 상태 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">메쉬 로딩 중...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-red-400">오류: {error}</div>
        </div>
      )}
    </div>
  );
}









