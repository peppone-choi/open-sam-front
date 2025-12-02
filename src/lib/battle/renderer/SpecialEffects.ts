import { 
  Group, 
  Mesh, 
  MeshBasicMaterial, 
  SphereGeometry, 
  Color,
  Vector3
} from 'three';
import { TeamId, TeamColorManager } from './TeamColorManager';

export class SpecialEffects {
  private scene: Group;
  private effectsGroup: Group;
  
  // Reuse geometries/materials
  private auraGeometry: SphereGeometry;
  private auraMaterial: MeshBasicMaterial;
  
  private activeEffects: Map<string, Mesh[]> = new Map(); // unitId -> effect meshes

  constructor(scene: Group) {
    this.scene = scene;
    this.effectsGroup = new Group();
    this.scene.add(this.effectsGroup);
    
    this.auraGeometry = new SphereGeometry(1.5, 16, 16);
    this.auraMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
  }

  public update(deltaTime: number): void {
    // Animate effects (pulse, rotate)
    const time = Date.now() * 0.001;
    
    this.effectsGroup.children.forEach((child) => {
      if (child.userData.type === 'aura') {
        const scale = 1 + Math.sin(time * 2) * 0.1;
        child.scale.setScalar(scale);
      }
    });
  }

  public updateUnitEffect(unitId: string, position: Vector3, role: string, teamId: TeamId, isSelected: boolean): void {
    const key = unitId;
    let meshes = this.activeEffects.get(key);

    // General Aura / Selection
    if (role === 'commander' || role === 'general' || isSelected) {
      if (!meshes) {
        meshes = [];
        this.activeEffects.set(key, meshes);
        
        // Create Aura
        const aura = new Mesh(this.auraGeometry, this.auraMaterial.clone());
        const color = TeamColorManager.getInstance().getThreeColor(teamId, 'accent');
        aura.material.color.copy(color);
        aura.userData.type = 'aura';
        this.effectsGroup.add(aura);
        meshes.push(aura);
      }

      // Update Position
      meshes.forEach(mesh => {
        mesh.position.copy(position);
        mesh.position.y = 0.5;
        mesh.visible = true;
      });
    } else {
      // Remove if exists
      if (meshes) {
        meshes.forEach(mesh => {
          mesh.visible = false; 
          // Optimization: Pool them instead of hiding/showing? 
          // For now, just hide.
        });
      }
    }
  }

  public dispose(): void {
    this.scene.remove(this.effectsGroup);
    this.auraGeometry.dispose();
    this.auraMaterial.dispose();
    this.activeEffects.clear();
  }
}
