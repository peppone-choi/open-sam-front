import { Group, Vector3, Scene } from 'three';
import { VoxelInstancer, InstancerSoldier } from './VoxelInstancer';
import { VoxelLOD } from './VoxelLOD';
import { SpecialEffects } from './SpecialEffects';
import { TeamColorManager, TeamId } from './TeamColorManager';
import { PVSoldier, PVSquad } from '../PhaserVoxelEngine';

// Fix type mismatch where PVSquad interface might not explicitly declare these but runtime has them
interface ExtendedPVSquad extends PVSquad {
  teamId: TeamId;
  unitTypeId: number;
}

export class VoxelUnitRenderer {
  private scene: Scene | Group;
  private instancer: VoxelInstancer;
  private lod: VoxelLOD;
  private specialEffects: SpecialEffects;
  private unitContainer: Group;

  // Cache for conversion
  private instancerSoldiers: InstancerSoldier[] = [];
  
  // Frame tracking
  private frameCount: number = 0;

  constructor(scene: Scene | Group) {
    this.scene = scene;
    this.unitContainer = new Group();
    this.unitContainer.name = 'voxel-units-container';
    this.scene.add(this.unitContainer);

    // Initialize Subsystems
    TeamColorManager.getInstance(); // Ensure initialized
    this.instancer = new VoxelInstancer(this.unitContainer);
    this.lod = new VoxelLOD();
    this.specialEffects = new SpecialEffects(this.unitContainer);
  }

  public init(squads: Map<string, PVSquad>): void {
    // Collect all unit types and teams to initialize instancers
    const unitTypes = new Set<number>();
    const teams = new Set<TeamId>();

    squads.forEach(baseSquad => {
      const squad = baseSquad as unknown as ExtendedPVSquad;
      unitTypes.add(squad.unitTypeId);
      teams.add(squad.teamId);
    });

    this.instancer.init(Array.from(unitTypes), Array.from(teams));
    console.log(`[VoxelUnitRenderer] Initialized for ${unitTypes.size} unit types`);
  }

  public update(
    soldiers: Map<string, PVSoldier>, 
    squads: Map<string, PVSquad>, 
    cameraPosition: Vector3,
    delta: number
  ): void {
    this.frameCount++;
    this.lod.updateCameraPosition(cameraPosition);
    this.specialEffects.update(delta);

    // Prepare data for instancer
    // We reuse the array to reduce GC, but need to be careful with length
    let index = 0;
    
    // Temporary vectors for calculations
    const pos = new Vector3();

    soldiers.forEach((soldier) => {
      if (soldier.state === 'dead') return; // Don't render dead for now (or use dead mesh)

      const baseSquad = squads.get(soldier.squadId);
      if (!baseSquad) return;
      const squad = baseSquad as unknown as ExtendedPVSquad;

      // Check LOD
      // Note: For 1000 units, distance check per unit is cheap (simple math)
      pos.set(soldier.position.x, 0, soldier.position.y);
      const lodLevel = this.lod.getLODLevel(pos);

      // Optimization: Skip animation updates for far units based on frequency
      // But Instancer needs to know position every frame to draw.
      // VoxelInstancer handles the "draw" part.
      // We pass all visible soldiers to instancer.
      
      if (index >= this.instancerSoldiers.length) {
        this.instancerSoldiers.push({
          id: soldier.id,
          unitTypeId: squad.unitTypeId,
          teamId: squad.teamId,
          position: { x: soldier.position.x, y: soldier.position.y },
          facing: soldier.facing,
          state: soldier.state,
          role: soldier.role,
        });
      } else {
        const s = this.instancerSoldiers[index];
        s.id = soldier.id;
        s.unitTypeId = squad.unitTypeId;
        s.teamId = squad.teamId;
        s.position.x = soldier.position.x;
        s.position.y = soldier.position.y;
        s.facing = soldier.facing;
        s.state = soldier.state;
        s.role = soldier.role;
      }
      
      // Special Effects
      if (this.lod.shouldUpdate(lodLevel, this.frameCount)) {
        this.specialEffects.updateUnitEffect(
          soldier.id, 
          pos, 
          soldier.role, 
          squad.teamId, 
          false // isSelected TODO
        );
      }

      index++;
    });

    // Trim array effectively for the update call
    const activeSoldiers = this.instancerSoldiers.slice(0, index);

    // Update Instancer
    this.instancer.update(activeSoldiers, delta);
  }


  public dispose(): void {
    this.instancer.dispose();
    this.specialEffects.dispose();
    this.scene.remove(this.unitContainer);
  }
}
