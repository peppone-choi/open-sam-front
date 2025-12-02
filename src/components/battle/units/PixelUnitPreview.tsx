'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  Color,
  GridHelper,
  Group,
  Mesh,
  Vector2,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { 
  buildDetailedUnit, 
  DETAILED_UNIT_PRESETS, 
  NATION_PALETTES, 
  type DetailedUnitConfig 
} from './DetailedUnitBuilder';
import styles from './PixelUnitPreview.module.css';

// 픽셀화 쉐이더 (개선됨)
const PixelationShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'resolution': { value: new Vector2() },
    'pixelSize': { value: 4.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float pixelSize;
    varying vec2 vUv;
    void main() {
      vec2 dxy = pixelSize / resolution;
      vec2 coord = dxy * floor(vUv / dxy);
      gl_FragColor = texture2D(tDiffuse, coord);
    }
  `
};

interface PixelUnitPreviewProps {
  width?: number;
  height?: number;
}

export default function PixelUnitPreview({ width = 800, height = 600 }: PixelUnitPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const unitGroupRef = useRef<Group | null>(null);
  const outlinePassRef = useRef<OutlinePass | null>(null);
  const pixelPassRef = useRef<ShaderPass | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<string>('heavyInfantry');
  const [selectedNation, setSelectedNation] = useState<string>('shu');
  const [pixelSize, setPixelSize] = useState(4);
  const [autoRotate, setAutoRotate] = useState(true);

  // Three.js 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene
    const scene = new Scene();
    scene.background = new Color(0x2a2a3e);
    sceneRef.current = scene;

    // Camera
    const aspect = width / height;
    const viewSize = 4;
    const camera = new OrthographicCamera(
      -viewSize * aspect, viewSize * aspect,
      viewSize, -viewSize,
      0.1, 100
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new WebGLRenderer({ 
      antialias: false, // 픽셀 아트는 앤티앨리어싱 끔
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1); // 1:1 픽셀 매칭
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Composer
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;

    // 1. Render Pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 2. Outline Pass
    const outlinePass = new OutlinePass(new Vector2(width, height), scene, camera);
    outlinePass.edgeStrength = 4.0;
    outlinePass.edgeGlow = 0.0;
    outlinePass.edgeThickness = 1.0;
    outlinePass.pulsePeriod = 0;
    outlinePass.visibleEdgeColor.set('#000000');
    outlinePass.hiddenEdgeColor.set('#000000');
    composer.addPass(outlinePass);
    outlinePassRef.current = outlinePass;

    // 3. Pixelation Pass
    const pixelPass = new ShaderPass(PixelationShader);
    pixelPass.uniforms.resolution.value = new Vector2(width, height);
    pixelPass.uniforms.pixelSize.value = pixelSize;
    composer.addPass(pixelPass);
    pixelPassRef.current = pixelPass;

    // 4. Gamma Correction (색상 보정)
    composer.addPass(new ShaderPass(GammaCorrectionShader));

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Lights
    const ambient = new AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);
    
    const backLight = new DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-5, 5, -5);
    scene.add(backLight);

    // Grid
    const grid = new GridHelper(4, 8, 0x444455, 0x222233);
    scene.add(grid);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();

      if (autoRotate && unitGroupRef.current) {
        unitGroupRef.current.rotation.y += 0.01;
      }

      if (pixelPassRef.current) {
        pixelPassRef.current.uniforms.pixelSize.value = pixelSize;
      }

      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      controls.dispose();
      container.innerHTML = '';
    };
  }, [width, height, pixelSize, autoRotate]);

  // 유닛 업데이트
  useEffect(() => {
    if (!sceneRef.current || !outlinePassRef.current) return;
    const scene = sceneRef.current;

    if (unitGroupRef.current) {
      scene.remove(unitGroupRef.current);
    }

    const palette = NATION_PALETTES[selectedNation];
    const preset = DETAILED_UNIT_PRESETS[selectedPreset] || {};

    const config: DetailedUnitConfig = {
      ...preset,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
    } as DetailedUnitConfig;

    const unit = buildDetailedUnit(config);
    scene.add(unit);
    unitGroupRef.current = unit;

    // Outline 대상 설정
    const meshes: Mesh[] = [];
    unit.traverse((child) => {
      if ((child as Mesh).isMesh) {
        meshes.push(child as Mesh);
      }
    });
    outlinePassRef.current.selectedObjects = meshes;

  }, [selectedPreset, selectedNation]);

  return (
    <div className={styles.container}>
      <div className={styles.canvas} ref={containerRef} />
      
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>유닛 타입</label>
          <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}>
            <option value="heavyInfantry">🛡️ 중보병</option>
            <option value="lightInfantry">🗡️ 경보병</option>
            <option value="archer">🏹 궁병</option>
            <option value="cavalry">🐴 기병</option>
            <option value="general">👑 장수</option>
            <option value="siege">⚙️ 공성기</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label>국가</label>
          <select value={selectedNation} onChange={(e) => setSelectedNation(e.target.value)}>
            <option value="wei">🔵 위</option>
            <option value="shu">🟢 촉</option>
            <option value="wu">🔴 오</option>
            <option value="jin">🟣 진</option>
            <option value="yellow">🟡 황건</option>
            <option value="dong">⚫ 동탁</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label>픽셀 크기: {pixelSize}</label>
          <input 
            type="range" 
            min="1" 
            max="8" 
            step="1" 
            value={pixelSize} 
            onChange={(e) => setPixelSize(Number(e.target.value))} 
          />
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
