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
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildUnit, UNIT_PRESETS, NATION_PALETTES, type UnitConfig } from './UnitBuilder';
import styles from './UnitPreview.module.css';

interface UnitPreviewProps {
  width?: number;
  height?: number;
}

export default function UnitPreview({ width = 800, height = 600 }: UnitPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const unitGroupRef = useRef<Group | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<string>('spearman');
  const [selectedNation, setSelectedNation] = useState<string>('shu');
  const [showHelmet, setShowHelmet] = useState(true);
  const [showShield, setShowShield] = useState(true);

  // Three.js 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene
    const scene = new Scene();
    scene.background = new Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera
    const camera = new PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2, 2, 3);
    camera.lookAt(0, 0.5, 0);

    // Renderer
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.5, 0);

    // Lights
    const ambient = new AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Grid
    const grid = new GridHelper(4, 8, 0x374151, 0x1f2937);
    scene.add(grid);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();

      // 유닛 회전
      if (unitGroupRef.current) {
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
  }, [width, height]);

  // 유닛 업데이트
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // 기존 유닛 제거
    if (unitGroupRef.current) {
      scene.remove(unitGroupRef.current);
    }

    // 새 유닛 생성
    const palette = NATION_PALETTES[selectedNation];
    const preset = UNIT_PRESETS[selectedPreset] || {};

    const config: UnitConfig = {
      unitType: preset.unitType || 'infantry',
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      weapon: preset.weapon,
      helmet: showHelmet ? (preset.helmet || 'helm') : 'none',
      shield: showShield && preset.shield,
      variant: preset.variant,
      scale: 1.5,
    };

    const unit = buildUnit(config);
    scene.add(unit);
    unitGroupRef.current = unit;
  }, [selectedPreset, selectedNation, showHelmet, showShield]);

  return (
    <div className={styles.previewContainer}>
      <div ref={containerRef} className={styles.canvas} />

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>병종</label>
          <select
            className={styles.select}
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
          >
            <optgroup label="보병">
              <option value="spearman">창병</option>
              <option value="swordsman">도검병</option>
              <option value="halberdier">극병</option>
              <option value="guard">근위병</option>
            </optgroup>
            <optgroup label="궁병">
              <option value="archer">궁병</option>
              <option value="crossbowman">노병</option>
            </optgroup>
            <optgroup label="기병">
              <option value="lightCavalry">경기병</option>
              <option value="heavyCavalry">중기병</option>
            </optgroup>
            <optgroup label="특수">
              <option value="strategist">책사</option>
              <option value="general">장수</option>
            </optgroup>
            <optgroup label="공성">
              <option value="catapult">투석기</option>
              <option value="ram">충차</option>
            </optgroup>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>국가</label>
          <select
            className={styles.select}
            value={selectedNation}
            onChange={(e) => setSelectedNation(e.target.value)}
          >
            <option value="wei">위 (파랑)</option>
            <option value="shu">촉 (초록)</option>
            <option value="wu">오 (빨강)</option>
            <option value="jin">진 (보라)</option>
            <option value="yellow">황건 (노랑)</option>
            <option value="dong">동탁 (회색)</option>
            <option value="neutral">중립</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={showHelmet}
              onChange={(e) => setShowHelmet(e.target.checked)}
            />
            투구 표시
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={showShield}
              onChange={(e) => setShowShield(e.target.checked)}
            />
            방패 표시
          </label>
        </div>
      </div>

      <div className={styles.info}>
        <h3>🎮 모듈러 유닛 시스템</h3>
        <p>파츠를 조합해 다양한 유닛 생성</p>
        <ul>
          <li>머리: 투구, 두건, 관모, 모자</li>
          <li>무기: 창, 검, 극, 활, 노, 지팡이</li>
          <li>베이스: 보병, 기병(말), 공성기</li>
          <li>색상: 국가별 팔레트</li>
        </ul>
      </div>
    </div>
  );
}


