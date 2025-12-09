'use client';

import { useRef, useMemo, useCallback, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Grid, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGin7TacticalStore } from '@/stores/gin7TacticalStore';
import type { TacticalUnitState, Vector3 as Vec3, ShipClass } from '@/types/gin7-tactical';

// ============================================================
// Constants
// ============================================================

const CAMERA_FAR = 50000;
const CAMERA_NEAR = 10;
const DEFAULT_CAMERA_POSITION: [number, number, number] = [0, 3000, 5000];

const SHIP_COLORS: Record<string, number> = {
  empire: 0xffd700,    // Gold
  alliance: 0x1e90ff,  // Blue
  phezzan: 0x32cd32,   // Green
  neutral: 0x808080,   // Gray
};

const SHIP_SCALES: Record<ShipClass, number> = {
  FLAGSHIP: 2.5,
  BATTLESHIP: 2.0,
  CRUISER: 1.5,
  DESTROYER: 1.2,
  FRIGATE: 1.0,
  CARRIER: 2.2,
  TRANSPORT: 1.3,
  FORTRESS: 4.0,
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
        count={8000}
        factor={6}
        saturation={0.1}
        fade
        speed={0.5}
      />
      <ambientLight intensity={0.15} />
      <directionalLight position={[5000, 5000, 5000]} intensity={0.8} color="#fff8e8" />
      <directionalLight position={[-5000, -2000, -3000]} intensity={0.3} color="#4a6fa5" />
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
// Single Ship Mesh (for non-instanced rendering fallback)
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
  const meshRef = useRef<THREE.Mesh>(null);
  const selectionRef = useRef<THREE.Mesh>(null);
  
  const scale = SHIP_SCALES[unit.shipClass] || 1;
  const baseColor = SHIP_COLORS[unit.factionId] || SHIP_COLORS.neutral;
  
  // Animate selection ring
  useFrame((state) => {
    if (selectionRef.current && isSelected) {
      selectionRef.current.rotation.y += 0.02;
    }
  });

  // Update position from unit state
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(unit.position.x, unit.position.y, unit.position.z);
      
      // Apply rotation from quaternion
      const q = new THREE.Quaternion(
        unit.rotation.x,
        unit.rotation.y,
        unit.rotation.z,
        unit.rotation.w
      );
      meshRef.current.quaternion.copy(q);
    }
  }, [unit.position, unit.rotation]);

  const hpPercent = unit.hp / unit.maxHp;
  const shieldPercent = (unit.shieldFront + unit.shieldRear + unit.shieldLeft + unit.shieldRight) / (unit.maxShield * 4);

  return (
    <group position={[unit.position.x, unit.position.y, unit.position.z]}>
      {/* Main ship body */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        scale={[scale * 30, scale * 15, scale * 80]}
      >
        <boxGeometry />
        <meshStandardMaterial
          color={unit.isDestroyed ? 0x333333 : baseColor}
          emissive={isHovered ? 0x444444 : 0x000000}
          emissiveIntensity={isHovered ? 0.3 : 0}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Engine glow */}
      {!unit.isDestroyed && (
        <mesh position={[0, 0, -scale * 45]} scale={[scale * 10, scale * 8, scale * 5]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={0x00ffff} transparent opacity={0.7} />
        </mesh>
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh ref={selectionRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[scale * 100, scale * 110, 32]} />
          <meshBasicMaterial color={0x00ff00} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover highlight */}
      {isHovered && !isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[scale * 95, scale * 105, 32]} />
          <meshBasicMaterial color={0xffff00} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Health & Shield bars (visible when selected or hovered) */}
      {(isSelected || isHovered) && !unit.isDestroyed && (
        <Html position={[0, scale * 60, 0]} center>
          <div className="pointer-events-none space-y-1 text-center">
            <div className="text-xs text-white/90 font-mono whitespace-nowrap">
              {unit.shipClass} × {unit.shipCount}
            </div>
            {/* HP Bar */}
            <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all"
                style={{ width: `${hpPercent * 100}%` }}
              />
            </div>
            {/* Shield Bar */}
            <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all"
                style={{ width: `${shieldPercent * 100}%` }}
              />
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
// Projectiles
// ============================================================

function Projectiles() {
  const projectiles = useGin7TacticalStore((s) => s.projectiles);
  
  return (
    <>
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
// Effects (Explosions, Shield hits, etc.)
// ============================================================

function Effects() {
  const effects = useGin7TacticalStore((s) => s.effects);
  const tick = useGin7TacticalStore((s) => s.tick);
  
  return (
    <>
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













