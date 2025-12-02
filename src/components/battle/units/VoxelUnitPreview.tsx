'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
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
import { 
  buildVoxelUnitFromSpec, 
  VOXEL_NATION_PALETTES,
  createAnimationController,
  applyAnimationToUnit,
  getUnitProjectileType,
} from './VoxelUnitBuilder';
import { 
  VOXEL_UNIT_DATABASE, 
  VOXEL_UNIT_CATEGORIES,
  VOXEL_ANIMATIONS,
  WEAPON_ATTACK_TYPE_MAP,
  getAllVoxelUnitIds,
  type VoxelUnitSpec,
  type VoxelAnimationState,
} from './db/VoxelUnitDefinitions';
import styles from './VoxelUnitPreview.module.css';

interface VoxelUnitPreviewProps {
  width?: number;
  height?: number;
}

export default function VoxelUnitPreview({ width = 900, height = 550 }: VoxelUnitPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const unitGroupRef = useRef<Group | null>(null);

  const [selectedUnitId, setSelectedUnitId] = useState<number>(1100);
  const [selectedNation, setSelectedNation] = useState<string>('wei');
  const [selectedCategory, setSelectedCategory] = useState<string>('infantry');
  const [autoRotate, setAutoRotate] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [selectedAnimation, setSelectedAnimation] = useState<VoxelAnimationState>('idle');
  const animationControllerRef = useRef<ReturnType<typeof createAnimationController> | null>(null);

  // 카테고리별 유닛 필터링
  const filteredUnits = useMemo(() => {
    return getAllVoxelUnitIds().filter(id => {
      const unit = VOXEL_UNIT_DATABASE[id];
      return unit && unit.category === selectedCategory;
    });
  }, [selectedCategory]);

  // 선택된 유닛 정보
  const selectedUnit: VoxelUnitSpec | undefined = VOXEL_UNIT_DATABASE[selectedUnitId];

  // Three.js 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new Scene();
    scene.background = new Color(0x0f0f1a);
    sceneRef.current = scene;

    const camera = new PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(1.8, 1.4, 1.8);
    camera.lookAt(0, 0.3, 0);

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.3, 0);
    controls.minDistance = 0.8;
    controls.maxDistance = 5;

    // Lights
    const ambient = new AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new DirectionalLight(0x8888ff, 0.3);
    backLight.position.set(-5, 5, -5);
    scene.add(backLight);

    // Grid
    const grid = new GridHelper(2, 20, 0x2d3748, 0x1a202c);
    scene.add(grid);

    let animationId: number;
    let lastTime = Date.now();
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      if (autoRotate && unitGroupRef.current) {
        unitGroupRef.current.rotation.y += 0.008;
      }
      
      // 애니메이션 업데이트
      if (animationControllerRef.current && unitGroupRef.current) {
        animationControllerRef.current.update(deltaTime);
        const transforms = animationControllerRef.current.getTransforms();
        const colorOverlay = animationControllerRef.current.getColorOverlay();
        const scale = animationControllerRef.current.getScale();
        applyAnimationToUnit(unitGroupRef.current, transforms, colorOverlay, scale);
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

  // 유닛 업데이트 (유닛/국가 변경 시에만)
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (unitGroupRef.current) {
      scene.remove(unitGroupRef.current);
    }

    const palette = VOXEL_NATION_PALETTES[selectedNation];

    const unit = buildVoxelUnitFromSpec({
      unitId: selectedUnitId,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      scale: 1.3,
    });
    
    scene.add(unit);
    unitGroupRef.current = unit;
    
    // 애니메이션 컨트롤러 생성 (무기 타입 포함)
    const unitSpec = VOXEL_UNIT_DATABASE[selectedUnitId];
    if (unitSpec) {
      animationControllerRef.current = createAnimationController(
        unitSpec.category,
        unitSpec.weapon.type,
        unitSpec.id
      );
      animationControllerRef.current.play(selectedAnimation);
    }
  }, [selectedUnitId, selectedNation]);
  
  // 애니메이션 상태 변경 (유닛 재생성 없이)
  useEffect(() => {
    if (animationControllerRef.current) {
      // 기존 위치/회전 초기화 (undefined로 설정해야 다시 저장됨)
      if (unitGroupRef.current) {
        unitGroupRef.current.userData.basePosition = undefined;
        unitGroupRef.current.userData.baseRotation = undefined;
        // baseScale은 유지 (스케일 초기화하면 유닛이 사라짐)
      }
      animationControllerRef.current.play(selectedAnimation);
    }
  }, [selectedAnimation]);

  // 카테고리 변경 시 첫 유닛 선택
  useEffect(() => {
    if (filteredUnits.length > 0 && !filteredUnits.includes(selectedUnitId)) {
      setSelectedUnitId(filteredUnits[0]);
    }
  }, [filteredUnits, selectedUnitId]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🎮 복셀 유닛 뷰어</h2>
        <p>삼국지 고증 기반 복셀 유닛 시스템</p>
      </div>

      <div className={styles.mainContent}>
        {/* 3D 뷰어 */}
        <div className={styles.viewerSection}>
          <div ref={containerRef} className={styles.canvas} />
          
          {/* 유닛 정보 오버레이 */}
          {showInfo && selectedUnit && (
            <div className={styles.unitInfoOverlay}>
              <div className={styles.unitName}>{selectedUnit.name}</div>
              <div className={styles.unitNameEn}>{selectedUnit.nameEn}</div>
              <div className={styles.unitId}>ID: {selectedUnit.id}</div>
            </div>
          )}
        </div>

        {/* 컨트롤 패널 */}
        <div className={styles.controlPanel}>
          {/* 카테고리 선택 */}
          <div className={styles.section}>
            <h3>병종 카테고리</h3>
            <div className={styles.categoryGrid}>
              {Object.entries(VOXEL_UNIT_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  className={`${styles.categoryBtn} ${selectedCategory === key ? styles.active : ''}`}
                  onClick={() => setSelectedCategory(key)}
                >
                  <span className={styles.categoryIcon}>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 유닛 목록 */}
          <div className={styles.section}>
            <h3>유닛 선택 <span className={styles.count}>{filteredUnits.length}개</span></h3>
            <div className={styles.unitList}>
              {filteredUnits.map(id => {
                const unit = VOXEL_UNIT_DATABASE[id];
                if (!unit) return null;
                return (
                  <button
                    key={id}
                    className={`${styles.unitBtn} ${selectedUnitId === id ? styles.active : ''}`}
                    onClick={() => setSelectedUnitId(id)}
                  >
                    <span className={styles.unitBtnId}>{id}</span>
                    <span className={styles.unitBtnName}>{unit.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 국가 선택 */}
          <div className={styles.section}>
            <h3>국가 색상</h3>
            <div className={styles.nationGrid}>
              {Object.entries(VOXEL_NATION_PALETTES).map(([key, pal]) => (
                <button
                  key={key}
                  className={`${styles.nationBtn} ${selectedNation === key ? styles.active : ''}`}
                  onClick={() => setSelectedNation(key)}
                  style={{ 
                    '--nation-color': pal.primary,
                    '--nation-color-light': pal.secondary,
                  } as React.CSSProperties}
                >
                  <span 
                    className={styles.nationDot} 
                    style={{ backgroundColor: pal.primary }}
                  />
                  <span>{getNationName(key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 애니메이션 선택 */}
          <div className={styles.section}>
            <h3>🎬 애니메이션</h3>
            <div className={styles.animationGrid}>
              {(Object.keys(VOXEL_ANIMATIONS) as VoxelAnimationState[]).map((anim) => (
                <button
                  key={anim}
                  className={`${styles.animBtn} ${selectedAnimation === anim ? styles.active : ''}`}
                  onClick={() => setSelectedAnimation(anim)}
                >
                  <span className={styles.animIcon}>{getAnimationIcon(anim)}</span>
                  <span>{getAnimationName(anim)}</span>
                </button>
              ))}
            </div>
            {selectedUnit && (
              <div className={styles.animInfo}>
                <span className={styles.animInfoLabel}>공격 타입:</span>
                <span className={styles.animInfoValue}>
                  {getAttackTypeName(WEAPON_ATTACK_TYPE_MAP[selectedUnit.weapon.type])}
                </span>
                {getUnitProjectileType(selectedUnit.id, selectedUnit.weapon.type) && (
                  <>
                    <span className={styles.animInfoLabel}>투사체:</span>
                    <span className={styles.animInfoValue}>
                      {getProjectileName(getUnitProjectileType(selectedUnit.id, selectedUnit.weapon.type)!)}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 옵션 */}
          <div className={styles.section}>
            <h3>옵션</h3>
            <div className={styles.optionRow}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={autoRotate}
                  onChange={(e) => setAutoRotate(e.target.checked)}
                />
                <span>자동 회전</span>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={showInfo}
                  onChange={(e) => setShowInfo(e.target.checked)}
                />
                <span>정보 표시</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 유닛 상세 정보 */}
      {selectedUnit && (
        <div className={styles.detailSection}>
          <h3>📜 유닛 상세 정보</h3>
          <div className={styles.detailGrid}>
            <DetailItem label="투구/머리" value={selectedUnit.head.details || selectedUnit.head.type} />
            <DetailItem label="갑옷/몸통" value={selectedUnit.body.details || selectedUnit.body.type} />
            <DetailItem label="무기" value={selectedUnit.weapon.details || selectedUnit.weapon.type} />
            {selectedUnit.offHand && (
              <DetailItem label="보조 장비" value={selectedUnit.offHand.details || selectedUnit.offHand.type} />
            )}
            {selectedUnit.mount && selectedUnit.mount.type !== 'none' && (
              <DetailItem label="탈것" value={selectedUnit.mount.details || selectedUnit.mount.type} />
            )}
            {selectedUnit.description && (
              <DetailItem label="설명" value={selectedUnit.description} fullWidth />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={`${styles.detailItem} ${fullWidth ? styles.fullWidth : ''}`}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}

function getNationName(key: string): string {
  const names: Record<string, string> = {
    wei: '위',
    shu: '촉',
    wu: '오',
    jin: '진',
    yellow: '황건',
    dong: '동탁',
    nanman: '남만',
    goguryeo: '고구려',
    neutral: '중립',
  };
  return names[key] || key;
}

function getAnimationIcon(anim: VoxelAnimationState): string {
  const icons: Record<VoxelAnimationState, string> = {
    idle: '🧍',
    attack: '⚔️',
    defend: '🛡️',
    hit: '💥',
    death: '💀',
    walk: '🚶',
    charge: '🐎',
  };
  return icons[anim] || '❓';
}

function getAnimationName(anim: VoxelAnimationState): string {
  const names: Record<VoxelAnimationState, string> = {
    idle: '대기',
    attack: '공격',
    defend: '방어',
    hit: '피해',
    death: '쓰러짐',
    walk: '이동',
    charge: '돌격',
  };
  return names[anim] || anim;
}

function getAttackTypeName(type: string): string {
  const names: Record<string, string> = {
    slash: '베기 (도검)',
    thrust: '찌르기 (창)',
    swing: '휘두르기 (둔기)',
    shoot_bow: '활 쏘기',
    shoot_xbow: '쇠뇌 쏘기',
    throw: '투척',
    cast: '시전 (마법)',
    charge: '돌격 (기병)',
    siege: '공성',
  };
  return names[type] || type;
}

function getProjectileName(type: string): string {
  const names: Record<string, string> = {
    arrow: '화살',
    fire_arrow: '불화살',
    bolt: '쇠뇌 화살',
    stone: '돌',
    javelin: '투창',
    throwing_axe: '투척 도끼',
    oil_jar: '기름 단지',
    poison_dart: '독침',
    fireball: '화염구',
    lightning: '번개',
    curse: '저주',
    heal_wave: '치유파',
    boulder: '바위',
    fire_boulder: '화염 바위',
  };
  return names[type] || type;
}
