import { 
  InstancedMesh, 
  Object3D, 
  Matrix4, 
  DynamicDrawUsage, 
  Group, 
  Mesh, 
  BufferGeometry, 
  Material,
  Vector3,
  Quaternion,
  Euler
} from 'three';
import { buildVoxelUnitFromSpec, createAnimationController, VoxelAnimationController } from '@/components/battle/units/VoxelUnitBuilder';
import { TeamId, TeamColorManager } from './TeamColorManager';
import { VOXEL_UNIT_DATABASE } from '@/components/battle/units/db/VoxelUnitDefinitions';

// Import types from PhaserVoxelEngine (assuming exported)
// If strict dependency cycle prevents this, we might need to redefine types locally
// For now, defining minimal interface to avoid dependency hell
export interface InstancerSoldier {
  id: string;
  unitTypeId: number;
  teamId: TeamId;
  position: { x: number; y: number };
  facing: number;
  state: string; // 'idle' | 'moving' | 'fighting' ...
  role: string;
}

interface PartInstancers {
  head?: InstancedMesh;
  torso?: InstancedMesh;
  leftArm?: InstancedMesh;
  rightArm?: InstancedMesh;
  leftLeg?: InstancedMesh;
  rightLeg?: InstancedMesh;
  weapon?: InstancedMesh;
  offHand?: InstancedMesh; // Shield or Quiver
}

interface AnimationState {
  controller: VoxelAnimationController;
  dummy: Object3D;
}

export class VoxelInstancer {
  private scene: Group; // Add instanced meshes here
  private instancers: Map<string, PartInstancers> = new Map(); // key: unitTypeId-teamId
  private animationStates: Map<string, AnimationState> = new Map(); // key: unitTypeId (shared controllers per type for sync anims? No, per soldier is too expensive, per type is weird if not synced)
  
  // Optimization: We cannot have 1000 animation controllers updating every frame.
  // Solution: Use a few shared controllers (offset by time) or update only visible ones.
  // For 1000 units, we can use a pool of controllers or just one controller per state/type and offset time?
  // Better: One controller per "Animation Group" (e.g. 10 variants of walking).
  // For now, let's try individual controllers but optimized updates. 
  // Actually, createAnimationController is lightweight logic.
  
  private dummy: Object3D = new Object3D();
  private partDummy: Object3D = new Object3D();
  
  // Cache for geometries
  private geometryCache: Map<string, { geo: BufferGeometry, mat: Material | Material[] }> = new Map();

  constructor(scene: Group) {
    this.scene = scene;
  }

  public init(unitTypeIds: number[], teamIds: TeamId[]): void {
    teamIds.forEach(teamId => {
      unitTypeIds.forEach(unitTypeId => {
        this.createInstancersForUnit(unitTypeId, teamId);
      });
    });
  }

  private createInstancersForUnit(unitTypeId: number, teamId: TeamId): void {
    const key = `${unitTypeId}-${teamId}`;
    if (this.instancers.has(key)) return;

    const palette = TeamColorManager.getInstance().getPalette(teamId);
    
    // Build a template unit
    const template = buildVoxelUnitFromSpec({
      unitId: unitTypeId,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      scale: 1.5 // Default scale
    });

    const parts: PartInstancers = {};
    const maxCount = 500; // Max instances per unit type per team

    // Extract parts
    const human = template.getObjectByName('humanBody');
    if (human) {
      const userDataParts = human.userData.parts;
      if (userDataParts) {
        if (userDataParts.head) parts.head = this.createInstancerFromGroup(userDataParts.head, maxCount);
        if (userDataParts.torso) parts.torso = this.createInstancerFromGroup(userDataParts.torso, maxCount);
        if (userDataParts.leftArm) parts.leftArm = this.createInstancerFromGroup(userDataParts.leftArm, maxCount);
        if (userDataParts.rightArm) parts.rightArm = this.createInstancerFromGroup(userDataParts.rightArm, maxCount);
        if (userDataParts.leftLeg) parts.leftLeg = this.createInstancerFromGroup(userDataParts.leftLeg, maxCount);
        if (userDataParts.rightLeg) parts.rightLeg = this.createInstancerFromGroup(userDataParts.rightLeg, maxCount);
      }
    }

    // Weapon & Offhand (Direct children of unit)
    const weapon = template.getObjectByName('weapon');
    if (weapon) parts.weapon = this.createInstancerFromGroup(weapon, maxCount);

    const shield = template.getObjectByName('shield');
    if (shield) parts.offHand = this.createInstancerFromGroup(shield, maxCount);
    
    const quiver = template.getObjectByName('quiver');
    if (quiver) parts.offHand = this.createInstancerFromGroup(quiver, maxCount); // Overwrite shield if exists (unlikely together)

    this.instancers.set(key, parts);
  }

  private createInstancerFromGroup(group: Object3D, count: number): InstancedMesh | undefined {
    let geometry: BufferGeometry | undefined;
    let material: Material | Material[] | undefined;

    // Traverse to find the first mesh
    group.traverse((obj) => {
      if (!geometry && (obj as Mesh).isMesh) {
        const mesh = obj as Mesh;
        geometry = mesh.geometry.clone(); // Clone to be safe
        material = mesh.material;
      }
    });

    if (geometry && material) {
      const instancedMesh = new InstancedMesh(geometry, material, count);
      instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      this.scene.add(instancedMesh);
      return instancedMesh;
    }
    return undefined;
  }

  private getAnimationController(id: string, unitTypeId: number): VoxelAnimationController {
    let state = this.animationStates.get(id);
    if (!state) {
      const spec = VOXEL_UNIT_DATABASE[unitTypeId];
      const category = spec?.category || 'infantry';
      const weaponType = spec?.weapon?.type;
      
      state = {
        controller: createAnimationController(category, weaponType, unitTypeId),
        dummy: new Object3D()
      };
      this.animationStates.set(id, state);
    }
    return state.controller;
  }

  public update(soldiers: InstancerSoldier[], delta: number): void {
    // Reset counts
    const counts: Map<string, number> = new Map();

    // Update each soldier
    soldiers.forEach(soldier => {
      const key = `${soldier.unitTypeId}-${soldier.teamId}`;
      const parts = this.instancers.get(key);
      if (!parts) return;

      let count = counts.get(key) || 0;
      // If buffer full, skip (or resize later)
      if (count >= 500) return; 

      // Update animation
      const controller = this.getAnimationController(soldier.id, soldier.unitTypeId);
      
      // Map state string to animation state
      // soldier.state: 'idle' | 'moving' | 'fighting' | 'charging' ...
      // controller state: 'idle' | 'walk' | 'attack' ...
      let animState: any = 'idle';
      if (soldier.state === 'moving' || soldier.state === 'charging') animState = 'walk';
      else if (soldier.state === 'fighting') animState = 'attack';
      else if (soldier.state === 'dead') animState = 'death';
      
      if (controller.currentState !== animState) {
        controller.play(animState);
      }
      controller.update(delta * 1000); // delta is seconds, controller expects ms? 
      // Wait, VoxelAnimationController.update uses Date.now() internally for elapsed.
      // But the interface says update(deltaTime: number).
      // Checking implementation: "update(deltaTime: number) { if (!isPlaying) return; const elapsed = Date.now() - startTime; ... }"
      // It actually ignores deltaTime arg and uses Date.now(). 
      // That's fine, but we should sync time if possible.
      
      const transforms = controller.getTransforms();
      
      // Helper to set matrix
      const setPartMatrix = (instancedMesh: InstancedMesh | undefined, partName: string, parentMatrix: Matrix4) => {
        if (!instancedMesh) return;
        
        // Reset part dummy
        this.partDummy.position.set(0, 0, 0);
        this.partDummy.rotation.set(0, 0, 0);
        this.partDummy.scale.set(1, 1, 1);
        this.partDummy.updateMatrix();

        // Apply animation transforms
        // transforms is { head: { pos, rot, scale }, ... }
        const t = (transforms as any)[partName];
        if (t) {
          if (t.position) this.partDummy.position.set(t.position[0], t.position[1], t.position[2]);
          if (t.rotation) this.partDummy.rotation.setFromVector3(new Vector3(t.rotation[0], t.rotation[1], t.rotation[2]));
          if (t.scale) this.partDummy.scale.setScalar(t.scale);
        }
        
        this.partDummy.updateMatrix();
        
        // Multiply with parent (unit) matrix
        const finalMatrix = this.partDummy.matrix.clone().premultiply(parentMatrix);
        instancedMesh.setMatrixAt(count, finalMatrix);
      };

      // Setup Unit Matrix (Position & Facing)
      this.dummy.position.set(soldier.position.x, 0, soldier.position.y); // Y is up in 3D, Z in Phaser logic? 
      // PhaserVoxelEngine: "mesh.position.set(soldier.position.x, 0, soldier.position.y);" -> Z is Y
      this.dummy.rotation.set(0, soldier.facing + Math.PI / 2, 0); // Adjust facing
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();

      // Apply to parts
      // Human parts need to consider the 'humanBody' offset if any?
      // In Builder: unit.position.set(-0.08, -0.15, -0.08); -> Center offset.
      // We should apply this offset to dummy.
      this.dummy.translateX(-0.08);
      this.dummy.translateY(-0.15);
      this.dummy.translateZ(-0.08);
      this.dummy.updateMatrix();

      const parentMatrix = this.dummy.matrix;

      setPartMatrix(parts.head, 'head', parentMatrix);
      setPartMatrix(parts.torso, 'torso', parentMatrix);
      setPartMatrix(parts.leftArm, 'leftArm', parentMatrix);
      setPartMatrix(parts.rightArm, 'rightArm', parentMatrix);
      setPartMatrix(parts.leftLeg, 'leftLeg', parentMatrix);
      setPartMatrix(parts.rightLeg, 'rightLeg', parentMatrix);
      
      // Weapon logic (attached to right hand usually)
      if (parts.weapon) {
        // Weapon transform is tricky, it's attached to hand hardpoint.
        // For now, simplify: attach to right arm matrix?
        // Or just use the 'weapon' transform from animation if it exists?
        // VoxelAnimation usually animates 'weapon' part if it's a separate bone.
        // Let's assume 'weapon' key exists in transforms.
        setPartMatrix(parts.weapon, 'weapon', parentMatrix);
      }
      
      if (parts.offHand) {
        setPartMatrix(parts.offHand, 'shield', parentMatrix);
      }

      counts.set(key, count + 1);
    });

    // Update instances
    this.instancers.forEach((parts, key) => {
      const count = counts.get(key) || 0;
      if (parts.head) { parts.head.count = count; parts.head.instanceMatrix.needsUpdate = true; }
      if (parts.torso) { parts.torso.count = count; parts.torso.instanceMatrix.needsUpdate = true; }
      if (parts.leftArm) { parts.leftArm.count = count; parts.leftArm.instanceMatrix.needsUpdate = true; }
      if (parts.rightArm) { parts.rightArm.count = count; parts.rightArm.instanceMatrix.needsUpdate = true; }
      if (parts.leftLeg) { parts.leftLeg.count = count; parts.leftLeg.instanceMatrix.needsUpdate = true; }
      if (parts.rightLeg) { parts.rightLeg.count = count; parts.rightLeg.instanceMatrix.needsUpdate = true; }
      if (parts.weapon) { parts.weapon.count = count; parts.weapon.instanceMatrix.needsUpdate = true; }
      if (parts.offHand) { parts.offHand.count = count; parts.offHand.instanceMatrix.needsUpdate = true; }
    });
  }

  public dispose(): void {
    this.instancers.forEach(parts => {
      Object.values(parts).forEach(mesh => {
        if (mesh) {
          mesh.geometry.dispose();
          // Material dispose?
          this.scene.remove(mesh);
        }
      });
    });
    this.instancers.clear();
  }
}
