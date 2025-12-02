'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  Color,
  GridHelper,
  Group,
  FogExp2,
  PCFSoftShadowMap,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  buildUnitById, 
} from './RealismUnitBuilder';
import { UNIT_DATABASE } from './db/UnitDefinitions';
import { NATION_PALETTES } from './DetailedUnitBuilder'; // 기존 팔레트 재사용
import styles from './RealismUnitPreview.module.css';

interface RealismUnitPreviewProps {
  width?: number;
  height?: number;
}

export default function RealismUnitPreview({ width = 800, height = 600 }: RealismUnitPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const unitGroupRef = useRef<Group | null>(null);

  const [selectedUnitId, setSelectedUnitId] = useState<number>(1100);
  const [selectedNation, setSelectedNation] = useState<string>('shu');
  const [autoRotate, setAutoRotate] = useState(true);

  // Three.js 초기화 (기존과 동일)
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new Scene();
    scene.background = new Color(0x1a1a1a);
    scene.fog = new FogExp2(0x1a1a1a, 0.05);
    sceneRef.current = scene;

    const camera = new PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3, 2, 4);
    camera.lookAt(0, 1, 0);

    const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1, 0);

    const ambient = new AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const sunLight = new DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 10, 5);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const rimLight = new DirectionalLight(0x4455ff, 0.5);
    rimLight.position.set(-5, 2, -5);
    scene.add(rimLight);

    const grid = new GridHelper(10, 20, 0x444444, 0x222222);
    scene.add(grid);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();

      if (autoRotate && unitGroupRef.current) {
        unitGroupRef.current.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      controls.dispose();
      container.innerHTML = '';
    };
  }, [width, height, autoRotate]);

  // 유닛 업데이트
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (unitGroupRef.current) {
      scene.remove(unitGroupRef.current);
    }

    const palette = NATION_PALETTES[selectedNation];
    
    // ID로 유닛 생성
    const unit = buildUnitById(selectedUnitId, palette.primary, palette.secondary);
    
    unit.traverse((child) => {
      if ((child as any).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(unit);
    unitGroupRef.current = unit;

  }, [selectedUnitId, selectedNation]);

  // 유닛 목록 그룹화
  const unitGroups = {
    '보병': [1100, 1101, 1102, 1103, 1104, 1105, 1106, 1113, 1114, 1115, 1117, 1120],
    '원거리': [1200, 1201, 1202, 1203, 1204, 1205, 1206, 1211],
    '기병': [1300, 1301, 1302, 1303, 1304, 1305, 1306, 1308, 1310, 1313, 1317, 1319],
    '이민족': [1400, 1401, 1402, 1403, 1404, 1405, 1406, 1407, 1410],
    '공성': [1500, 1501, 1503, 1506, 1508],
  };

  return (
    <div className={styles.container}>
      <div className={styles.canvas} ref={containerRef} />
      
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>유닛 선택 (ID: {selectedUnitId})</label>
          <select 
            value={selectedUnitId} 
            onChange={(e) => setSelectedUnitId(Number(e.target.value))}
            className={styles.select}
          >
            {Object.entries(unitGroups).map(([groupName, ids]) => (
              <optgroup key={groupName} label={groupName}>
                {ids.map(id => (
                  <option key={id} value={id}>
                    {UNIT_DATABASE[id]?.name || `Unit ${id}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label>국가</label>
          <select value={selectedNation} onChange={(e) => setSelectedNation(e.target.value)} className={styles.select}>
            <option value="wei">🔵 위</option>
            <option value="shu">🟢 촉</option>
            <option value="wu">🔴 오</option>
            <option value="jin">🟣 진</option>
            <option value="yellow">🟡 황건</option>
            <option value="dong">⚫ 동탁</option>
          </select>
        </div>

        <div className={styles.checkbox}>
          <input 
            type="checkbox" 
            checked={autoRotate} 
            onChange={(e) => setAutoRotate(e.target.checked)} 
          />
          <span>자동 회전</span>
        </div>
      </div>
    </div>
  );
}
