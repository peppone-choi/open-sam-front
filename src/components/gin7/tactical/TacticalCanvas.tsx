'use client';

import { useRef, useMemo, useCallback, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Grid, Html, useGLTF } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import { useGin7TacticalStore } from '@/stores/gin7TacticalStore';
import type { TacticalUnitState, Vector3 as Vec3, ShipClass } from '@/types/gin7-tactical';

// ============================================================
// Constants
// ============================================================

const CAMERA_FAR = 50000;
const CAMERA_NEAR = 10;
const DEFAULT_CAMERA_POSITION: [number, number, number] = [0, 2000, 3000];

const SHIP_COLORS: Record<string, number> = {
  empire: 0xffd700,    // Gold
  alliance: 0x1e90ff,  // Blue
  phezzan: 0x32cd32,   // Green
  neutral: 0x808080,   // Gray
};

const SHIP_EMISSIVE: Record<string, number> = {
  empire: 0x442200,
  alliance: 0x002244,
  phezzan: 0x004400,
  neutral: 0x222222,
};

const SHIP_SCALES: Record<ShipClass, number> = {
  FLAGSHIP: 8.0,
  BATTLESHIP: 6.5,
  CRUISER: 5.0,
  DESTROYER: 4.0,
  FRIGATE: 3.2,
  CARRIER: 7.0,
  TRANSPORT: 4.0,
  FORTRESS: 12.0,
};

// OBJ model paths for each faction
const SHIP_MODELS: Record<string, string> = {
  empire: '/assets/logh-stellaris/obj/tgef_01_battleship_02.obj',
  alliance: '/assets/logh-stellaris/obj/tfpa_01_battleship_01.obj',
};

// ============================================================
// Starfield Background
// ============================================================

function SpaceBackground() {
  return (
    <>
      <Stars
        radius={15000}
        depth={5000}
        count={10000}
        factor={6}
        saturation={0.1}
        fade
        speed={0.3}
      />
      <ambientLight intensity={0.25} />
      <directionalLight position={[5000, 5000, 5000]} intensity={1.0} color="#fff8e8" castShadow />
      <directionalLight position={[-5000, -2000, -3000]} intensity={0.4} color="#4a6fa5" />
      <hemisphereLight color="#1a1a3a" groundColor="#0a0a1a" intensity={0.3} />
      
      {/* Nebula-like fog effect */}
      <fog attach="fog" args={['#050510', 8000, 25000]} />
    </>
  );
}

// ============================================================
// Grid Floor
// ============================================================

function TacticalGrid() {
  return (
    <Grid
      args={[20000, 20000]}
      cellSize={500}
      cellThickness={0.5}
      cellColor="#1a365d"
      sectionSize={2500}
      sectionThickness={1}
      sectionColor="#2a4a7a"
      fadeDistance={25000}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid
      position={[0, -100, 0]}
    />
  );
}

// ============================================================
// 3D Ship Model Cache and Loader
// ============================================================

// Global model cache to prevent reloading
const modelCache = new Map<string, THREE.Group>();
const modelLoadingPromises = new Map<string, Promise<THREE.Group | null>>();

function useShipModel(faction: string) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const modelPath = SHIP_MODELS[faction] || SHIP_MODELS.empire;
  const cacheKey = `${faction}_${modelPath}`;
  
  useEffect(() => {
    // Check cache first
    if (modelCache.has(cacheKey)) {
      setModel(modelCache.get(cacheKey)!.clone());
      return;
    }
    
    // Check if already loading
    if (modelLoadingPromises.has(cacheKey)) {
      modelLoadingPromises.get(cacheKey)!.then((cached) => {
        if (cached) setModel(cached.clone());
      });
      return;
    }
    
    // Load model
    const loadPromise = new Promise<THREE.Group | null>((resolve) => {
      const loader = new OBJLoader();
      loader.load(
        modelPath,
        (obj) => {
          // Apply faction-colored material
          const color = SHIP_COLORS[faction] || SHIP_COLORS.neutral;
          const emissive = SHIP_EMISSIVE[faction] || SHIP_EMISSIVE.neutral;
          
          // Normalize model size
          const box = new THREE.Box3().setFromObject(obj);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const normalizeScale = 100 / maxDim;  // Normalize to 100 units
          obj.scale.setScalar(normalizeScale);
          
          // Center the model
          box.setFromObject(obj);
          const center = new THREE.Vector3();
          box.getCenter(center);
          obj.position.sub(center);
          
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: emissive,
                emissiveIntensity: 0.3,
                metalness: 0.85,
                roughness: 0.25,
              });
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          modelCache.set(cacheKey, obj);
          setModel(obj.clone());
          resolve(obj);
        },
        undefined,
        (error) => {
          console.warn('Failed to load ship model, using fallback:', error);
          resolve(null);
        }
      );
    });
    
    modelLoadingPromises.set(cacheKey, loadPromise);
  }, [modelPath, faction, cacheKey]);
  
  return model;
}

// ============================================================
// Single Ship Mesh with OBJ Model
// ============================================================

interface ShipMeshProps {
  unit: TacticalUnitState;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

function ShipMesh({
  unit,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}: ShipMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const selectionRef = useRef<THREE.Mesh>(null);
  const baseModel = useShipModel(unit.factionId);
  
  // Scale based on ship class and unit count (1 unit = 300 ships)
  const shipClassScale = SHIP_SCALES[unit.shipClass] || 4.0;
  const unitCount = unit.shipCount;  // This is unit count, not individual ships
  const fleetSizeBonus = Math.log10(unitCount + 1) * 0.3;  // Larger fleets appear bigger
  const scale = shipClassScale * (1 + fleetSizeBonus);
  const baseColor = SHIP_COLORS[unit.factionId] || SHIP_COLORS.neutral;
  
  // Animate selection ring and ship heading
  useFrame((state) => {
    if (selectionRef.current && isSelected) {
      selectionRef.current.rotation.y += 0.02;
    }
    
    // Subtle floating animation
    if (groupRef.current && !unit.isDestroyed) {
      groupRef.current.position.y = unit.position.y + Math.sin(state.clock.elapsedTime * 0.5 + unit.position.x * 0.01) * 10;
      
      // Rotate ship to face heading direction
      if (unit.heading !== undefined) {
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y, 
          -unit.heading + Math.PI / 2, 
          0.1
        );
      }
    }
  });

  const hpPercent = unit.hp / unit.maxHp;
  const shieldPercent = (unit.shieldFront + unit.shieldRear + unit.shieldLeft + unit.shieldRight) / (unit.maxShield * 4);

  // Ship count indicator size (more ships = larger indicator)
  const shipCountScale = Math.log10(unit.shipCount + 10) * 0.4;

  return (
    <group 
      ref={groupRef}
      position={[unit.position.x, unit.position.y, unit.position.z]}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* Main ship model or fallback */}
      {baseModel ? (
        <primitive 
          object={baseModel} 
          scale={[scale, scale, scale]}
        />
      ) : (
        // Fallback: stylized ship shape - ALWAYS VISIBLE
        <group scale={[scale, scale, scale]}>
          {/* Main hull - Arrow/Wedge shape like Star Destroyer */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[20, 80, 4]} />
            <meshStandardMaterial
              color={unit.isDestroyed ? 0x333333 : baseColor}
              emissive={isHovered ? 0x666666 : SHIP_EMISSIVE[unit.factionId] || 0x222222}
              emissiveIntensity={isHovered ? 0.6 : 0.3}
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          {/* Command tower */}
          <mesh position={[0, 8, -10]}>
            <boxGeometry args={[12, 16, 20]} />
            <meshStandardMaterial
              color={unit.isDestroyed ? 0x333333 : baseColor}
              emissive={SHIP_EMISSIVE[unit.factionId] || 0x222222}
              emissiveIntensity={0.3}
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          {/* Side fins */}
          <mesh position={[15, 0, -20]} rotation={[0, 0, Math.PI / 6]}>
            <boxGeometry args={[15, 3, 30]} />
            <meshStandardMaterial
              color={unit.isDestroyed ? 0x333333 : baseColor}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[-15, 0, -20]} rotation={[0, 0, -Math.PI / 6]}>
            <boxGeometry args={[15, 3, 30]} />
            <meshStandardMaterial
              color={unit.isDestroyed ? 0x333333 : baseColor}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        </group>
      )}

      {/* Engine glow particles */}
      {!unit.isDestroyed && (
        <group position={[0, 0, -scale * 10]}>
          <pointLight color={unit.factionId === 'empire' ? 0xff6600 : 0x00ffff} intensity={1.5} distance={scale * 30} />
          <mesh scale={[scale * 2, scale * 1.5, scale * 3]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial 
              color={unit.factionId === 'empire' ? 0xff6600 : 0x00ffff} 
              transparent 
              opacity={0.6} 
            />
          </mesh>
        </group>
      )}

      {/* Unit count indicator - cluster of small dots (1 dot per 10 units) */}
      <group position={[0, scale * 12, 0]}>
        {Array.from({ length: Math.min(5, Math.ceil(unit.shipCount / 10)) }).map((_, i) => (
          <mesh key={i} position={[(i - 2) * 15 * shipCountScale, 0, 0]}>
            <sphereGeometry args={[5 * shipCountScale, 8, 8]} />
            <meshBasicMaterial color={baseColor} transparent opacity={0.8} />
          </mesh>
        ))}
      </group>

      {/* Selection ring */}
      {isSelected && (
        <mesh ref={selectionRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[scale * 18, scale * 20, 32]} />
          <meshBasicMaterial color={0x00ff00} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover highlight */}
      {isHovered && !isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[scale * 17, scale * 19, 32]} />
          <meshBasicMaterial color={0xffff00} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Damage indicator */}
      {unit.isDestroyed && (
        <mesh>
          <sphereGeometry args={[scale * 8, 16, 16]} />
          <meshBasicMaterial color={0xff4400} transparent opacity={0.3} />
        </mesh>
      )}

      {/* Health & Shield bars (visible when selected or hovered) */}
      {(isSelected || isHovered) && !unit.isDestroyed && (
        <Html position={[0, scale * 15, 0]} center>
          <div className="pointer-events-none space-y-1 text-center bg-black/70 rounded px-2 py-1 border border-white/20">
            <div className="text-xs text-white font-mono whitespace-nowrap font-bold">
              {unit.name || unit.id.slice(-6)}
            </div>
            <div className="text-[10px] text-white/70">
              {unit.shipCount.toLocaleString()} 유닛 ({(unit.shipCount * 300).toLocaleString()} 척)
            </div>
            {/* HP Bar */}
            <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{ 
                  width: `${hpPercent * 100}%`,
                  background: `linear-gradient(90deg, #ef4444 0%, #22c55e ${hpPercent * 100}%)`
                }}
              />
            </div>
            {/* Shield Bar */}
            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all"
                style={{ width: `${shieldPercent * 100}%` }}
              />
            </div>
            {/* Morale */}
            <div className="text-[10px] text-yellow-400">
              사기 {Math.round(unit.morale)}%
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================
// Instanced Ships (for performance with many units)
// ============================================================

interface InstancedShipsProps {
  units: TacticalUnitState[];
  selectedIds: Set<string>;
  onSelectUnit: (unitId: string, additive: boolean) => void;
}

function InstancedShips({ units, selectedIds, onSelectUnit }: InstancedShipsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hoveredUnit = useGin7TacticalStore((s) => s.hoveredUnitId);
  const setHoveredUnit = useGin7TacticalStore((s) => s.setHoveredUnit);
  
  // Group units by faction for coloring
  const factionGroups = useMemo(() => {
    const groups: Record<string, TacticalUnitState[]> = {};
    units.forEach(u => {
      const key = u.factionId;
      if (!groups[key]) groups[key] = [];
      groups[key].push(u);
    });
    return groups;
  }, [units]);

  // For simplicity, render each unit as an individual mesh
  // In production, use InstancedMesh with custom shader for faction colors
  return (
    <>
      {units.map((unit) => (
        <ShipMesh
          key={unit.id}
          unit={unit}
          isSelected={selectedIds.has(unit.id)}
          isHovered={hoveredUnit === unit.id}
          onClick={(e) => {
            e.stopPropagation();
            onSelectUnit(unit.id, e.shiftKey);
          }}
          onPointerOver={() => setHoveredUnit(unit.id)}
          onPointerOut={() => setHoveredUnit(null)}
        />
      ))}
    </>
  );
}

// ============================================================
// Projectiles and Attack Beams
// ============================================================

function Projectiles() {
  const projectiles = useGin7TacticalStore((s) => s.projectiles);
  const units = useGin7TacticalStore((s) => s.units);
  
  // Generate beam lines between attacking units and their targets
  const attackBeams = useMemo(() => {
    const beams: { from: Vec3; to: Vec3; faction: string }[] = [];
    
    units.forEach(unit => {
      if (unit.isDestroyed || !unit.targetId) return;
      
      const target = units.find(u => u.id === unit.targetId);
      if (!target || target.isDestroyed) return;
      
      beams.push({
        from: unit.position,
        to: target.position,
        faction: unit.factionId,
      });
    });
    
    return beams;
  }, [units]);
  
  return (
    <>
      {/* Attack beams between fleets */}
      {attackBeams.map((beam, index) => {
        const dx = beam.to.x - beam.from.x;
        const dy = beam.to.y - beam.from.y;
        const dz = beam.to.z - beam.from.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const midX = (beam.from.x + beam.to.x) / 2;
        const midY = (beam.from.y + beam.to.y) / 2;
        const midZ = (beam.from.z + beam.to.z) / 2;
        
        // Calculate rotation to point beam at target
        const phi = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
        const theta = Math.atan2(dx, dz);
        
        const beamColor = beam.faction === 'empire' ? 0xff4400 : 0x00aaff;
        
        return (
          <group key={`beam-${index}`}>
            {/* Main beam */}
            <mesh
              position={[midX, midY, midZ]}
              rotation={[phi, theta, 0]}
            >
              <cylinderGeometry args={[2, 2, distance, 6]} />
              <meshBasicMaterial 
                color={beamColor} 
                transparent 
                opacity={0.4 + Math.random() * 0.3} 
              />
            </mesh>
            {/* Beam glow */}
            <mesh
              position={[midX, midY, midZ]}
              rotation={[phi, theta, 0]}
            >
              <cylinderGeometry args={[5, 5, distance, 6]} />
              <meshBasicMaterial 
                color={beamColor} 
                transparent 
                opacity={0.15} 
              />
            </mesh>
          </group>
        );
      })}
      
      {/* Individual projectiles */}
      {projectiles.map((proj) => {
        const color = proj.type === 'BEAM' ? 0xff0000 : proj.type === 'MISSILE' ? 0xff8800 : 0xffff00;
        const size = proj.type === 'BEAM' ? [5, 5, 100] : proj.type === 'MISSILE' ? [15, 15, 30] : [8, 8, 8];
        
        return (
          <mesh
            key={proj.id}
            position={[proj.position.x, proj.position.y, proj.position.z]}
          >
            <boxGeometry args={size as [number, number, number]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} />
          </mesh>
        );
      })}
    </>
  );
}

// ============================================================
// Effects (Explosions, Shield hits, Battle Damage)
// ============================================================

function Effects() {
  const effects = useGin7TacticalStore((s) => s.effects);
  const units = useGin7TacticalStore((s) => s.units);
  const tick = useGin7TacticalStore((s) => s.tick);
  
  // Generate damage effects for units taking damage
  const [damageEffects, setDamageEffects] = useState<Array<{
    id: string;
    position: Vec3;
    startTick: number;
  }>>([]);
  
  // Track HP changes to trigger damage effects
  const prevHpRef = useRef<Record<string, number>>({});
  
  useEffect(() => {
    const newEffects: typeof damageEffects = [];
    
    units.forEach(unit => {
      const prevHp = prevHpRef.current[unit.id] ?? unit.hp;
      if (unit.hp < prevHp && !unit.isDestroyed) {
        // Unit took damage - create effect
        newEffects.push({
          id: `dmg-${unit.id}-${tick}`,
          position: {
            x: unit.position.x + (Math.random() - 0.5) * 50,
            y: unit.position.y + (Math.random() - 0.5) * 50,
            z: unit.position.z + (Math.random() - 0.5) * 50,
          },
          startTick: tick,
        });
      }
      prevHpRef.current[unit.id] = unit.hp;
    });
    
    if (newEffects.length > 0) {
      setDamageEffects(prev => [...prev, ...newEffects].slice(-20));  // Keep last 20
    }
    
    // Clean up old effects
    setDamageEffects(prev => prev.filter(e => tick - e.startTick < 30));
  }, [units, tick]);
  
  return (
    <>
      {/* Store-based effects */}
      {effects.map((effect) => {
        const progress = Math.min(1, (tick - effect.startTick) / (effect.duration * 16));
        const opacity = 1 - progress;
        const scale = effect.scale * (1 + progress * 0.5);
        
        let color = 0xff8800;
        if (effect.type === 'SHIELD_HIT') color = 0x00ffff;
        if (effect.type === 'BEAM_FIRE') color = 0xff0000;
        if (effect.type === 'ENGINE_FLARE') color = 0x00ff88;
        
        return (
          <mesh
            key={effect.id}
            position={[effect.position.x, effect.position.y, effect.position.z]}
            scale={scale}
          >
            <sphereGeometry args={[30, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={opacity * 0.8} />
          </mesh>
        );
      })}
      
      {/* Damage flash effects */}
      {damageEffects.map((effect) => {
        const age = tick - effect.startTick;
        const opacity = Math.max(0, 1 - age / 20);
        const scale = 20 + age * 3;
        
        return (
          <group key={effect.id} position={[effect.position.x, effect.position.y, effect.position.z]}>
            {/* Explosion core */}
            <mesh scale={scale * 0.5}>
              <sphereGeometry args={[1, 12, 12]} />
              <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
            </mesh>
            {/* Explosion outer */}
            <mesh scale={scale}>
              <sphereGeometry args={[1, 12, 12]} />
              <meshBasicMaterial color={0xff4400} transparent opacity={opacity * 0.5} />
            </mesh>
            {/* Point light for flash */}
            <pointLight color={0xff8800} intensity={opacity * 3} distance={scale * 5} />
          </group>
        );
      })}
      
      {/* Destroyed unit debris */}
      {units.filter(u => u.isDestroyed).map(unit => (
        <group key={`debris-${unit.id}`} position={[unit.position.x, unit.position.y, unit.position.z]}>
          <mesh>
            <sphereGeometry args={[40, 8, 8]} />
            <meshBasicMaterial color={0x442200} transparent opacity={0.3} />
          </mesh>
          {/* Smoke particles */}
          {Array.from({ length: 3 }).map((_, i) => (
            <mesh 
              key={i} 
              position={[
                Math.sin(tick * 0.05 + i * 2) * 30, 
                (tick * 0.5 + i * 10) % 100, 
                Math.cos(tick * 0.05 + i * 2) * 30
              ]}
            >
              <sphereGeometry args={[15 + i * 5, 8, 8]} />
              <meshBasicMaterial color={0x333333} transparent opacity={0.4} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

// ============================================================
// Camera Controller
// ============================================================

function CameraController() {
  const { camera } = useThree();
  const cameraPosition = useGin7TacticalStore((s) => s.cameraPosition);
  const cameraZoom = useGin7TacticalStore((s) => s.cameraZoom);
  
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(
        cameraPosition.x,
        cameraPosition.y + 3000 / cameraZoom,
        cameraPosition.z + 5000 / cameraZoom
      );
      camera.lookAt(cameraPosition.x, 0, cameraPosition.z);
    }
  }, [camera, cameraPosition, cameraZoom]);
  
  return null;
}

// ============================================================
// Click Handler for ground clicks (move commands)
// ============================================================

function GroundClickHandler() {
  const selectedUnitIds = useGin7TacticalStore((s) => s.selectedUnitIds);
  const clearSelection = useGin7TacticalStore((s) => s.clearSelection);
  const queueCommand = useGin7TacticalStore((s) => s.queueCommand);
  
  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (e.button === 2 && selectedUnitIds.size > 0) {
      // Right click = move command
      const point = e.point;
      queueCommand({
        type: 'MOVE',
        unitIds: Array.from(selectedUnitIds),
        timestamp: Date.now(),
        data: {
          targetPosition: { x: point.x, y: 0, z: point.z },
        },
      });
    } else if (e.button === 0) {
      // Left click on empty space = clear selection
      clearSelection();
    }
  }, [selectedUnitIds, clearSelection, queueCommand]);
  
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -50, 0]}
      onClick={handleClick}
      onContextMenu={handleClick}
      visible={false}
    >
      <planeGeometry args={[50000, 50000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// ============================================================
// Loading Fallback
// ============================================================

function LoadingFallback() {
  return (
    <Html center>
      <div className="text-white font-mono text-sm animate-pulse">
        Loading tactical view...
      </div>
    </Html>
  );
}

// ============================================================
// Main Scene
// ============================================================

function TacticalScene() {
  const units = useGin7TacticalStore((s) => s.units);
  const selectedUnitIds = useGin7TacticalStore((s) => s.selectedUnitIds);
  const selectUnit = useGin7TacticalStore((s) => s.selectUnit);
  
  const visibleUnits = useMemo(
    () => units.filter(u => !u.isDestroyed),
    [units]
  );
  
  return (
    <>
      <SpaceBackground />
      <TacticalGrid />
      <CameraController />
      <GroundClickHandler />
      
      <InstancedShips
        units={visibleUnits}
        selectedIds={selectedUnitIds}
        onSelectUnit={selectUnit}
      />
      
      <Projectiles />
      <Effects />
      
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={500}
        maxDistance={15000}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
        panSpeed={1.5}
        zoomSpeed={1.2}
        rotateSpeed={0.5}
      />
    </>
  );
}

// ============================================================
// Main Component
// ============================================================

export interface TacticalCanvasProps {
  className?: string;
}

export default function TacticalCanvas({ className = '' }: TacticalCanvasProps) {
  const status = useGin7TacticalStore((s) => s.status);
  const isConnected = useGin7TacticalStore((s) => s.isConnected);
  
  return (
    <div className={`relative w-full h-full min-h-[400px] bg-[#030810] rounded-lg overflow-hidden ${className}`}>
      <Canvas
        camera={{
          fov: 60,
          near: CAMERA_NEAR,
          far: CAMERA_FAR,
          position: DEFAULT_CAMERA_POSITION,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Suspense fallback={<LoadingFallback />}>
          <TacticalScene />
        </Suspense>
      </Canvas>
      
      {/* Status overlay */}
      <div className="absolute top-2 left-2 text-xs font-mono">
        <div className={`px-2 py-1 rounded ${isConnected ? 'bg-green-900/80 text-green-400' : 'bg-red-900/80 text-red-400'}`}>
          {isConnected ? '● CONNECTED' : '○ DISCONNECTED'}
        </div>
        {status !== 'RUNNING' && status !== 'WAITING' && (
          <div className="mt-1 px-2 py-1 rounded bg-yellow-900/80 text-yellow-400">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}















