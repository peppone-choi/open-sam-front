import * as THREE from 'three';
import type {
  GridPos,
  UnitInstance,
  UnitVisualConfig,
} from './isoTacticalMap';

export interface ThreeTacticalMapOptions {
  canvas: HTMLCanvasElement;
  width: number; // 픽셀 폭
  height: number; // 픽셀 높이
  logicalWidth: number; // 논리 그리드 폭 (예: 40)
  logicalHeight: number; // 논리 그리드 높이 (예: 40)
}

interface InternalUnitEntry {
  instance: UnitInstance;
  object: THREE.Object3D;
}

interface Projectile {
  mesh: THREE.Mesh;
  start: THREE.Vector3;
  end: THREE.Vector3;
  startTime: number;
  duration: number;
  arcType: 'flat' | 'high';
}
 
export class ThreeTacticalMapEngine {
  private renderer: THREE.WebGLRenderer;

  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private units: Map<string, InternalUnitEntry>;
  private projectiles: Projectile[] = [];
  private width: number;
  private height: number;
  private logicalWidth: number;
  private logicalHeight: number;
  private animationId: number | null = null;

  constructor(options: ThreeTacticalMapOptions) {
    const { canvas, width, height, logicalWidth, logicalHeight } = options;

    this.width = width;
    this.height = height;
    this.logicalWidth = logicalWidth;
    this.logicalHeight = logicalHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false, // 디버깅을 위해 완전히 불투명 배경 사용
    });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(width, height, false);
    // 렌더러 클리어 색을 눈에 띄는 진회색으로 지정
    this.renderer.setClearColor(0x1f2937, 1);

    this.scene = new THREE.Scene();
    // 씬 배경은 렌더러 clearColor와 비슷하게 유지
    this.scene.background = new THREE.Color(0x1f2937);

    // 화면 좌표계와 일치하는 정사영 카메라 (중심 기준)
    const left = -width / 2;
    const right = width / 2;
    const top = height / 2;
    const bottom = -height / 2;
    this.camera = new THREE.OrthographicCamera(left, right, top, bottom, 0.1, 1000);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    this.units = new Map();

    this.buildGrid();
    this.startLoop();
  }

  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.units.forEach(({ object }) => {
      this.scene.remove(object);
      disposeObject(object);
    });
    this.units.clear();

    this.renderer.dispose();
  }

  screenToGrid(x: number, y: number): GridPos {
    // canvas 좌표(0..width, 0..height)를 논리 그리드(0..logicalWidth, 0..logicalHeight)에 매핑
    const cellW = this.width / this.logicalWidth;
    const cellH = this.height / this.logicalHeight;

    const col = clamp(Math.floor(x / cellW), 0, this.logicalWidth - 1);
    const rowFromTop = clamp(Math.floor(y / cellH), 0, this.logicalHeight - 1);

    // 여기서 row는 "위에서부터 0" 기준의 논리 좌표로 그대로 돌려준다.
    return { row: rowFromTop, col };
  }

  upsertUnit(instance: UnitInstance): void {
    const existing = this.units.get(instance.id);
    if (existing) {
      existing.instance = instance;
      this.updateUnitTransform(existing.object, instance);
      return;
    }

    const object = createVoxelUnitFromInstance(instance);
    this.updateUnitTransform(object, instance);

    this.scene.add(object);
    this.units.set(instance.id, { instance, object });
  }


  removeUnit(id: string): void {
    const entry = this.units.get(id);
    if (!entry) return;

    this.scene.remove(entry.object);
    disposeObject(entry.object);

    this.units.delete(id);
  }


  private buildGrid(): void {
    const cellW = this.width / this.logicalWidth;
    const cellH = this.height / this.logicalHeight;

    const gridGroup = new THREE.Group();

    // 그리드 선은 중간 밝기의 회색으로 눈에 띄게
    const gridColor = new THREE.Color(0x4b5563);
    const material = new THREE.LineBasicMaterial({ color: gridColor, transparent: true, opacity: 0.9 });

    const lines: THREE.Line[] = [];

    // 세로선
    for (let c = 0; c <= this.logicalWidth; c += 1) {
      const x = c * cellW - this.width / 2;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -this.height / 2, 0),
        new THREE.Vector3(x, this.height / 2, 0),
      ]);
      lines.push(new THREE.Line(geometry, material));
    }

    // 가로선
    for (let r = 0; r <= this.logicalHeight; r += 1) {
      const y = r * cellH - this.height / 2;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-this.width / 2, y, 0),
        new THREE.Vector3(this.width / 2, y, 0),
      ]);
      lines.push(new THREE.Line(geometry, material));
    }

    lines.forEach((line) => gridGroup.add(line));

    this.scene.add(gridGroup);
  }

  private updateUnitTransform(object: THREE.Object3D, instance: UnitInstance): void {
    const cellW = this.width / this.logicalWidth;
    const cellH = this.height / this.logicalHeight;
 
    // instance.gridPos.row/col은 "위에서부터 0" 기준의 논리 좌표
    const { row, col } = instance.gridPos;
 
    const x = (col + 0.5) * cellW - this.width / 2;
    const yFromTop = (row + 0.5) * cellH;
 
    // 화면 좌표계: 위가 0, 아래가 height
    // three 씬 좌표계: 가운데가 0, 위가 +height/2, 아래가 -height/2
    const y = this.height / 2 - yFromTop;
 
    object.position.set(x, y, 0);
 
    // 방향(facing)이 있다면 회전 반영 (도 → 라디안)
    const facing = (instance as any).facing;
    if (typeof facing === 'number') {
      // three 씬에서 z축 회전으로 화면상 방향 표현
      object.rotation.z = (facing * Math.PI) / 180;
    }

    // 속도 기반으로 X축을 약간 기울여 돌격/이동 느낌 표현
    const speed = (instance as any).speed as number | undefined;
    const maxTilt = instance.visual.role === 'cavalry' ? 0.35 : 0.2; // 라디안
    if (typeof speed === 'number' && speed > 0) {
      const k = Math.min(1, speed / 100);
      object.rotation.x = -maxTilt * k;
    } else {
      object.rotation.x = 0;
    }
  }
 
  private gridToScene(row: number, col: number): { x: number; y: number } {
    const cellW = this.width / this.logicalWidth;
    const cellH = this.height / this.logicalHeight;
    const x = (col + 0.5) * cellW - this.width / 2;
    const yFromTop = (row + 0.5) * cellH;
    const y = this.height / 2 - yFromTop;
    return { x, y };
  }

  /**
   * 논리 그리드 기준 투사체 생성 (BattleState 기반)
   */
  spawnProjectileGrid(from: GridPos, to: GridPos, arcType: 'flat' | 'high', color: number): void {
    const { x: sx, y: sy } = this.gridToScene(from.row, from.col);
    const { x: ex, y: ey } = this.gridToScene(to.row, to.col);

    const geometry = new THREE.SphereGeometry(3, 6, 6);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(sx, sy, 10);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      start: new THREE.Vector3(sx, sy, 10),
      end: new THREE.Vector3(ex, ey, 10),
      startTime: performance.now(),
      duration: arcType === 'high' ? 600 : 300,
      arcType,
    });
  }
 
  private startLoop(): void {
    const renderLoop = () => {
      const now = performance.now();

      // 투사체 위치 업데이트
      this.projectiles = this.projectiles.filter((p) => {
        const t = (now - p.startTime) / p.duration;
        if (t >= 1) {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          const mat = p.mesh.material as THREE.Material;
          mat.dispose();
          return false;
        }

        const pos = new THREE.Vector3();
        pos.lerpVectors(p.start, p.end, t);

        const arcHeight = p.arcType === 'high' ? 30 : 10;
        const parabola = 4 * t * (1 - t); // 0→1→0 포물선 계수
        pos.z = parabola * arcHeight;

        p.mesh.position.copy(pos);
        return true;
      });

      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(renderLoop);
    };
 
    this.animationId = requestAnimationFrame(renderLoop);
  }


    // 속도 기반으로 X축을 약간 기울여 돌격/이동 느낌 표현
    const speed = (instance as any).speed as number | undefined;
    const maxTilt = instance.visual.role === 'cavalry' ? 0.35 : 0.2; // 라디안
    if (typeof speed === 'number' && speed > 0) {
      const k = Math.min(1, speed / 100); // 임시 정규화
      object.rotation.x = -maxTilt * k;
    } else {
      object.rotation.x = 0;
    }
  }




  private startLoop(): void {
    const renderLoop = () => {
      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(renderLoop);
    };

    this.animationId = requestAnimationFrame(renderLoop);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getUnitColor(visual: UnitVisualConfig): number {
  const isElite = !!visual.isElite;
  const role = visual.role;
  const tags = visual.cultureTags || [];

  const isAttackerSide = tags.includes('Han');

  if (isAttackerSide) {
    if (role === 'cavalry') return isElite ? 0x4ade80 : 0x22c55e; // 녹색 계열
    if (role === 'archer') return isElite ? 0x60a5fa : 0x3b82f6; // 파랑
    if (role === 'spear' || role === 'polearm') return isElite ? 0xfacc15 : 0xeab308; // 노랑
    return isElite ? 0xf97316 : 0xf97316; // 보병 주황
  }

  // 방어측 (황건/기타)
  if (role === 'cavalry') return isElite ? 0xf97316 : 0xea580c; // 주황
  if (role === 'archer') return isElite ? 0x6366f1 : 0x4f46e5; // 보라/파랑 계열
  if (role === 'spear' || role === 'polearm') return isElite ? 0xf97316 : 0xfbbf24; // 노랑/주황
  return isElite ? 0xef4444 : 0xdc2626; // 보병 빨강
}

// ===== 복셀 유닛 생성 유틸 =====

type VoxelUnitKind = 'infantry' | 'cavalry' | 'archer' | 'siege' | 'nonHumanoid';

interface VoxelUnitConfig {
  kind: VoxelUnitKind;
  baseColor: number;
  accentColor: number;
  isElite: boolean;
  troopsRatio: number; // 0~1 병력 비율
}

function createVoxelUnitFromInstance(instance: UnitInstance): THREE.Object3D {
  const visual = instance.visual;
  const baseColor = getUnitColor(visual);
  const accentColor = 0xffffff;
  const isElite = !!visual.isElite;

  const kind: VoxelUnitKind = visual.role === 'cavalry'
    ? 'cavalry'
    : visual.role === 'archer'
    ? 'archer'
    : visual.role === 'scholar'
    ? 'infantry'
    : visual.role === 'spear' || visual.role === 'polearm'
    ? 'infantry'
    : 'infantry';

  const troopsRatio = (instance as any).troopsRatio ?? 1;

  const config: VoxelUnitConfig = {
    kind,
    baseColor,
    accentColor,
    isElite,
    troopsRatio,
  };

  const group = new THREE.Group();

  if (config.kind === 'siege' || config.kind === 'nonHumanoid') {
    createSiegeVoxel(group, config);
  } else if (config.kind === 'cavalry') {
    createCavalryVoxel(group, config);
  } else {
    createInfantryVoxel(group, config, config.kind === 'archer');
  }

  return group;
}

function createInfantryVoxel(
  group: THREE.Group,
  cfg: VoxelUnitConfig,
  isArcher: boolean,
): void {
  const bodyColor = cfg.baseColor;

  // 발판
  const baseGeom = new THREE.BoxGeometry(18, 2, 10);
  const baseMat = new THREE.MeshBasicMaterial({ color: darkenColorInt(bodyColor, 0.3) });
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.set(0, 1, 0);
  group.add(base);

  // 다리
  const legGeom = new THREE.BoxGeometry(4, 6, 4);
  const legMat = new THREE.MeshBasicMaterial({ color: bodyColor });
  const leftLeg = new THREE.Mesh(legGeom, legMat);
  const rightLeg = new THREE.Mesh(legGeom, legMat);
  leftLeg.position.set(-2.5, 6, 0);
  rightLeg.position.set(2.5, 6, 0);
  group.add(leftLeg);
  group.add(rightLeg);

  // 몸통
  const torsoGeom = new THREE.BoxGeometry(10, 10, 6);
  const torsoMat = new THREE.MeshBasicMaterial({ color: bodyColor });
  const torso = new THREE.Mesh(torsoGeom, torsoMat);
  torso.position.set(0, 14, 0);
  group.add(torso);

  // 머리
  const headGeom = new THREE.BoxGeometry(6, 5, 6);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffe0bd });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.set(0, 20, 0);
  group.add(head);

  // 투구
  const helmetGeom = new THREE.BoxGeometry(7, 3, 7);
  const helmetMat = new THREE.MeshBasicMaterial({ color: cfg.isElite ? cfg.accentColor : darkenColorInt(bodyColor, 0.2) });
  const helmet = new THREE.Mesh(helmetGeom, helmetMat);
  helmet.position.set(0, 22.5, 0);
  group.add(helmet);

  // 팔
  const armGeom = new THREE.BoxGeometry(3, 8, 3);
  const armMat = new THREE.MeshBasicMaterial({ color: bodyColor });
  const leftArm = new THREE.Mesh(armGeom, armMat);
  const rightArm = new THREE.Mesh(armGeom, armMat);
  leftArm.position.set(-7, 14, 0);
  rightArm.position.set(7, 14, 0);
  group.add(leftArm);
  group.add(rightArm);

  // 무기/활
  if (isArcher) {
    const bowGeom = new THREE.BoxGeometry(1, 10, 1);
    const bowMat = new THREE.MeshBasicMaterial({ color: cfg.accentColor });
    const bow = new THREE.Mesh(bowGeom, bowMat);
    bow.position.set(9, 16, 0);
    group.add(bow);
  } else {
    const spearGeom = new THREE.BoxGeometry(1, 14, 1);
    const spearMat = new THREE.MeshBasicMaterial({ color: cfg.accentColor });
    const spear = new THREE.Mesh(spearGeom, spearMat);
    spear.position.set(9, 18, 0);
    group.add(spear);
  }
}

function createCavalryVoxel(group: THREE.Group, cfg: VoxelUnitConfig): void {
  const bodyColor = cfg.baseColor;

  // 말 몸통
  const mountBodyGeom = new THREE.BoxGeometry(20, 6, 10);
  const mountBodyMat = new THREE.MeshBasicMaterial({ color: darkenColorInt(bodyColor, 0.2) });
  const mountBody = new THREE.Mesh(mountBodyGeom, mountBodyMat);
  mountBody.position.set(0, 6, 0);
  group.add(mountBody);

  // 말 다리
  const legGeom = new THREE.BoxGeometry(3, 6, 3);
  const legMat = new THREE.MeshBasicMaterial({ color: darkenColorInt(bodyColor, 0.3) });
  const frontLeft = new THREE.Mesh(legGeom, legMat);
  const frontRight = new THREE.Mesh(legGeom, legMat);
  const backLeft = new THREE.Mesh(legGeom, legMat);
  const backRight = new THREE.Mesh(legGeom, legMat);
  frontLeft.position.set(-6, 3, 3);
  frontRight.position.set(6, 3, 3);
  backLeft.position.set(-6, 3, -3);
  backRight.position.set(6, 3, -3);
  group.add(frontLeft);
  group.add(frontRight);
  group.add(backLeft);
  group.add(backRight);

  // 말 머리
  const headGeom = new THREE.BoxGeometry(6, 5, 6);
  const headMat = new THREE.MeshBasicMaterial({ color: darkenColorInt(bodyColor, 0.1) });
  const horseHead = new THREE.Mesh(headGeom, headMat);
  horseHead.position.set(12, 10, 0);
  group.add(horseHead);

  // 말 꼬리
  const tailGeom = new THREE.BoxGeometry(2, 6, 2);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const tail = new THREE.Mesh(tailGeom, tailMat);
  tail.position.set(-12, 10, 0);
  group.add(tail);

  // 기병 다리/몸통/머리 (말 위)
  const riderTorsoGeom = new THREE.BoxGeometry(8, 9, 6);
  const riderTorsoMat = new THREE.MeshBasicMaterial({ color: bodyColor });
  const riderTorso = new THREE.Mesh(riderTorsoGeom, riderTorsoMat);
  riderTorso.position.set(0, 16, 0);
  group.add(riderTorso);

  const riderHeadGeom = new THREE.BoxGeometry(5, 4, 5);
  const riderHeadMat = new THREE.MeshBasicMaterial({ color: 0xffe0bd });
  const riderHead = new THREE.Mesh(riderHeadGeom, riderHeadMat);
  riderHead.position.set(0, 21, 0);
  group.add(riderHead);

  const riderHelmetGeom = new THREE.BoxGeometry(6, 3, 6);
  const riderHelmetMat = new THREE.MeshBasicMaterial({ color: cfg.isElite ? cfg.accentColor : darkenColorInt(bodyColor, 0.2) });
  const riderHelmet = new THREE.Mesh(riderHelmetGeom, riderHelmetMat);
  riderHelmet.position.set(0, 23, 0);
  group.add(riderHelmet);

  // 창
  const spearGeom = new THREE.BoxGeometry(1, 18, 1);
  const spearMat = new THREE.MeshBasicMaterial({ color: cfg.accentColor });
  const spear = new THREE.Mesh(spearGeom, spearMat);
  spear.position.set(10, 20, 0);
  group.add(spear);
}

function createSiegeVoxel(group: THREE.Group, cfg: VoxelUnitConfig): void {
  const baseColor = cfg.baseColor;
  const bodyGeom = new THREE.BoxGeometry(24, 10, 14);
  const bodyMat = new THREE.MeshBasicMaterial({ color: darkenColorInt(baseColor, 0.2) });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0, 8, 0);
  group.add(body);

  const barrelGeom = new THREE.BoxGeometry(14, 4, 4);
  const barrelMat = new THREE.MeshBasicMaterial({ color: cfg.accentColor });
  const barrel = new THREE.Mesh(barrelGeom, barrelMat);
  barrel.position.set(10, 12, 0);
  group.add(barrel);
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if ((mesh as any).isMesh) {
      mesh.geometry?.dispose?.();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (material) {
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else {
          material.dispose();
        }
      }
    }
  });
}

function darkenColorInt(color: number, amount: number): number {
  const num = color;
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (num & 0xff) * (1 - amount));
  return ((r << 16) | (g << 8) | b) >>> 0;
}

