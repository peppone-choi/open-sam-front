'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import styles from './TotalWarBattleMap.module.css';

// ========================================
// 최적화된 간단한 전투 시스템
// - React 상태 업데이트 최소화 (100ms 간격)
// - requestAnimationFrame 직접 사용
// - 게임 로직과 렌더링 분리
// ========================================

type TeamId = 'attacker' | 'defender';
type SoldierState = 'idle' | 'moving' | 'charging' | 'fighting' | 'routing' | 'dead';

interface Soldier {
  id: string;
  squadId: string;
  teamId: TeamId;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  isRanged: boolean;
  state: SoldierState;
  morale: number;
  facing: number;
  engagedWith?: string;
  lastAttackTime: number;
  mesh?: THREE.Mesh;
}

interface Squad {
  id: string;
  name: string;
  teamId: TeamId;
  soldiers: string[];
  kills: number;
}

const TROOPS_PER_SOLDIER = 25;

export default function OptimizedBattleMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  // 게임 상태 (ref로 관리, React 리렌더링 방지)
  const soldiersRef = useRef<Map<string, Soldier>>(new Map());
  const squadsRef = useRef<Map<string, Squad>>(new Map());
  const battleStateRef = useRef<'preparing' | 'running' | 'paused' | 'ended'>('preparing');
  const lastTimeRef = useRef(0);
  const animationIdRef = useRef<number>(0);
  
  // UI 상태 (최소한으로만)
  const [isReady, setIsReady] = useState(false);
  const [battleState, setBattleState] = useState<'preparing' | 'running' | 'paused' | 'ended'>('preparing');
  const [attackerStats, setAttackerStats] = useState({ alive: 0, total: 0, kills: 0 });
  const [defenderStats, setDefenderStats] = useState({ alive: 0, total: 0, kills: 0 });
  const [winner, setWinner] = useState<TeamId | null>(null);
  
  // 마지막 통계 업데이트 시간
  const lastStatsUpdateRef = useRef(0);
  
  // ========================================
  // Three.js 초기화
  // ========================================
  useEffect(() => {
    if (!containerRef.current) {
      console.error('❌ Container not found');
      return;
    }
    
    console.log('🎮 Three.js 초기화 시작');
    
    try {
    
    // 기존 캔버스 제거 (Strict Mode 대응)
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 100, 120);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.2;
    controlsRef.current = controls;
    
    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(50, 100, 50);
    directional.castShadow = true;
    scene.add(directional);
    
    // Ground
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x4A7023, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Grid
    const grid = new THREE.GridHelper(300, 30, 0x000000, 0x333333);
    grid.position.y = 0.01;
    (grid.material as THREE.Material).opacity = 0.2;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);
    
    // 초기 부대 생성
    createInitialSquads(scene);
    
    // 렌더 루프 시작
    const animate = (time: number) => {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      // 게임 로직 업데이트 (전투 중일 때만)
      if (battleStateRef.current === 'running') {
        updateGame(deltaTime / 1000);
        
        // 통계 업데이트 (100ms 간격)
        if (time - lastStatsUpdateRef.current > 100) {
          updateStatsUI();
          lastStatsUpdateRef.current = time;
        }
      }
      
      // 렌더링
      controls.update();
      renderer.render(scene, camera);
      
      animationIdRef.current = requestAnimationFrame(animate);
    };
    
    animationIdRef.current = requestAnimationFrame(animate);
    console.log('✅ Three.js 초기화 완료');
    setIsReady(true);
    
    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
    } catch (error) {
      console.error('❌ Three.js 초기화 오류:', error);
    }
  }, []);
  
  // ========================================
  // 초기 부대 생성
  // ========================================
  const createInitialSquads = (scene: THREE.Scene) => {
    const soldiers = soldiersRef.current;
    const squads = squadsRef.current;
    
    const unitConfigs = [
      // 조조군 (attacker) - 북쪽
      { name: '장료 도검대', team: 'attacker' as TeamId, count: 30, x: -20, z: -35, facing: 0, isRanged: false, attack: 45, defense: 35 },
      { name: '서황 극병대', team: 'attacker' as TeamId, count: 30, x: 0, z: -35, facing: 0, isRanged: false, attack: 50, defense: 30 },
      { name: '이전 창병대', team: 'attacker' as TeamId, count: 30, x: 20, z: -35, facing: 0, isRanged: false, attack: 35, defense: 40 },
      { name: '위나라 궁병대', team: 'attacker' as TeamId, count: 20, x: -15, z: -50, facing: 0, isRanged: true, attack: 40, defense: 15, range: 50 },
      { name: '위나라 노병대', team: 'attacker' as TeamId, count: 20, x: 15, z: -50, facing: 0, isRanged: true, attack: 55, defense: 20, range: 60 },
      { name: '하후연 기병대', team: 'attacker' as TeamId, count: 15, x: -40, z: -30, facing: Math.PI / 6, isRanged: false, attack: 50, defense: 35, speed: 6 },
      { name: '조창 돌격대', team: 'attacker' as TeamId, count: 15, x: 40, z: -30, facing: -Math.PI / 6, isRanged: false, attack: 65, defense: 30, speed: 7 },
      
      // 손오 연합 (defender) - 남쪽
      { name: '감녕 도검대', team: 'defender' as TeamId, count: 30, x: -20, z: 35, facing: Math.PI, isRanged: false, attack: 45, defense: 35 },
      { name: '능통 극병대', team: 'defender' as TeamId, count: 30, x: 0, z: 35, facing: Math.PI, isRanged: false, attack: 50, defense: 30 },
      { name: '정보 창병대', team: 'defender' as TeamId, count: 30, x: 20, z: 35, facing: Math.PI, isRanged: false, attack: 35, defense: 40 },
      { name: '오나라 궁병대', team: 'defender' as TeamId, count: 20, x: -15, z: 50, facing: Math.PI, isRanged: true, attack: 40, defense: 15, range: 50 },
      { name: '오나라 노병대', team: 'defender' as TeamId, count: 20, x: 15, z: 50, facing: Math.PI, isRanged: true, attack: 55, defense: 20, range: 60 },
      { name: '여몽 기병대', team: 'defender' as TeamId, count: 15, x: -40, z: 30, facing: Math.PI - Math.PI / 6, isRanged: false, attack: 50, defense: 35, speed: 6 },
      { name: '태사자 돌격대', team: 'defender' as TeamId, count: 15, x: 40, z: 30, facing: Math.PI + Math.PI / 6, isRanged: false, attack: 65, defense: 30, speed: 7 },
    ];
    
    let soldierIndex = 0;
    let attackerTotal = 0, defenderTotal = 0;
    
    unitConfigs.forEach((config, squadIndex) => {
      const squadId = `squad_${squadIndex}`;
      const squad: Squad = {
        id: squadId,
        name: config.name,
        teamId: config.team,
        soldiers: [],
        kills: 0,
      };
      
      // 진형 배치
      const cols = Math.ceil(Math.sqrt(config.count * 2));
      const rows = Math.ceil(config.count / cols);
      const spacing = 1.5;
      
      let idx = 0;
      for (let row = 0; row < rows && idx < config.count; row++) {
        for (let col = 0; col < cols && idx < config.count; col++) {
          const offsetX = (col - cols / 2) * spacing;
          const offsetZ = (row - rows / 2) * spacing;
          
          const cos = Math.cos(config.facing);
          const sin = Math.sin(config.facing);
          const rotatedX = offsetX * cos - offsetZ * sin;
          const rotatedZ = offsetX * sin + offsetZ * cos;
          
          const soldierId = `soldier_${soldierIndex++}`;
          
          const soldier: Soldier = {
            id: soldierId,
            squadId,
            teamId: config.team,
            x: config.x + rotatedX,
            z: config.z + rotatedZ,
            hp: 100,
            maxHp: 100,
            attack: config.attack || 40,
            defense: config.defense || 25,
            speed: config.speed || 3,
            range: config.range || 3,
            isRanged: config.isRanged,
            state: 'idle',
            morale: 100,
            facing: config.facing,
            lastAttackTime: 0,
          };
          
          // 메시 생성
          const isCavalry = (config.speed || 3) > 5;
          const geo = isCavalry 
            ? new THREE.BoxGeometry(1.2, 1.5, 0.8)
            : new THREE.BoxGeometry(0.6, 1.5, 0.4);
          const color = config.team === 'attacker' ? 0xFF4444 : 0x4444FF;
          const mat = new THREE.MeshStandardMaterial({ color });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(soldier.x, 0.75, soldier.z);
          mesh.rotation.y = soldier.facing;
          mesh.castShadow = true;
          mesh.userData.soldierId = soldierId;
          scene.add(mesh);
          soldier.mesh = mesh;
          
          soldiers.set(soldierId, soldier);
          squad.soldiers.push(soldierId);
          idx++;
        }
      }
      
      squads.set(squadId, squad);
      
      if (config.team === 'attacker') {
        attackerTotal += config.count;
      } else {
        defenderTotal += config.count;
      }
    });
    
    setAttackerStats({ alive: attackerTotal, total: attackerTotal, kills: 0 });
    setDefenderStats({ alive: defenderTotal, total: defenderTotal, kills: 0 });
    
    console.log(`✅ 초기화 완료: 조조군 ${attackerTotal}명, 손오연합 ${defenderTotal}명`);
  };
  
  // ========================================
  // 게임 로직 업데이트
  // ========================================
  const updateGame = (deltaSeconds: number) => {
    const soldiers = soldiersRef.current;
    let time = performance.now();
    
    soldiers.forEach(soldier => {
      if (soldier.state === 'dead') return;
      
      // 패주 처리
      if (soldier.state === 'routing') {
        handleRouting(soldier, deltaSeconds);
        updateSoldierMesh(soldier);
        return;
      }
      
      // 교전 중
      if (soldier.engagedWith) {
        const enemy = soldiers.get(soldier.engagedWith);
        if (!enemy || enemy.state === 'dead') {
          soldier.engagedWith = undefined;
          soldier.state = 'idle';
        } else {
          soldier.state = 'fighting';
          soldier.facing = Math.atan2(enemy.x - soldier.x, enemy.z - soldier.z);
          
          // 공격
          if (time - soldier.lastAttackTime > 1500) {
            processMeleeAttack(soldier, enemy, time);
          }
          updateSoldierMesh(soldier);
          return;
        }
      }
      
      // 적 찾기
      const searchRange = soldier.isRanged ? soldier.range : 30;
      const enemies: Soldier[] = [];
      
      soldiers.forEach(other => {
        if (other.teamId !== soldier.teamId && other.state !== 'dead' && other.state !== 'routing') {
          const dist = getDistance(soldier, other);
          if (dist <= searchRange) {
            enemies.push(other);
          }
        }
      });
      
      if (enemies.length === 0) {
        // 전진
        if (soldier.state !== 'fighting') {
          moveTowardsEnemy(soldier, deltaSeconds);
        }
        updateSoldierMesh(soldier);
        return;
      }
      
      // 가장 가까운 적
      let closest: Soldier | null = null;
      let minDist = Infinity;
      for (const enemy of enemies) {
        const dist = getDistance(soldier, enemy);
        if (dist < minDist) {
          minDist = dist;
          closest = enemy;
        }
      }
      
      if (!closest) return;
      
      if (soldier.isRanged) {
        // 원거리 공격
        if (minDist <= soldier.range) {
          // 사거리 내 - 공격
          soldier.state = 'fighting';
          soldier.facing = Math.atan2(closest.x - soldier.x, closest.z - soldier.z);
          
          if (time - soldier.lastAttackTime > 2000) {
            processRangedAttack(soldier, closest, time);
          }
        } else {
          // 사거리 밖 - 전진 (적 방향으로)
          soldier.state = 'moving';
          moveTowards(soldier, closest.x, closest.z, deltaSeconds, false);
        }
      } else {
        // 근접
        if (minDist <= soldier.range) {
          soldier.engagedWith = closest.id;
          closest.engagedWith = soldier.id;
          soldier.state = 'fighting';
          closest.state = 'fighting';
        } else {
          // 돌격/이동
          soldier.state = minDist < 15 ? 'charging' : 'moving';
          moveTowards(soldier, closest.x, closest.z, deltaSeconds, soldier.state === 'charging');
        }
      }
      
      updateSoldierMesh(soldier);
    });
    
    // 사기 업데이트
    updateMorale(deltaSeconds);
    
    // 승패 체크
    checkVictory();
  };
  
  const handleRouting = (soldier: Soldier, deltaSeconds: number) => {
    soldier.engagedWith = undefined;
    const retreatDir = soldier.teamId === 'attacker' ? -Math.PI / 2 : Math.PI / 2;
    const speed = soldier.speed * 1.5 * deltaSeconds;
    soldier.z += Math.cos(retreatDir) * speed;
    soldier.x += (Math.random() - 0.5) * speed * 0.3;
    soldier.facing = retreatDir;
    soldier.morale = Math.min(100, soldier.morale + 0.3 * deltaSeconds);
    if (soldier.morale > 40) {
      soldier.state = 'idle';
    }
  };
  
  const moveTowardsEnemy = (soldier: Soldier, deltaSeconds: number) => {
    // 기본 전진 방향
    const targetZ = soldier.teamId === 'attacker' ? soldier.z + 10 : soldier.z - 10;
    moveTowards(soldier, soldier.x, targetZ, deltaSeconds, false);
    soldier.state = 'moving';
  };
  
  const moveTowards = (soldier: Soldier, targetX: number, targetZ: number, deltaSeconds: number, isCharging: boolean) => {
    const dx = targetX - soldier.x;
    const dz = targetZ - soldier.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 0.5) return;
    
    const speedMult = isCharging ? 1.5 : 1.0;
    const moveSpeed = soldier.speed * speedMult * deltaSeconds;
    const moveDistance = Math.min(moveSpeed, distance);
    
    soldier.x += (dx / distance) * moveDistance;
    soldier.z += (dz / distance) * moveDistance;
    soldier.facing = Math.atan2(dx, dz);
  };
  
  const processMeleeAttack = (attacker: Soldier, target: Soldier, time: number) => {
    attacker.lastAttackTime = time;
    
    // 명중 체크
    if (Math.random() > 0.7) return; // 30% 빗나감
    
    const damage = attacker.attack * (0.8 + Math.random() * 0.4);
    const actualDamage = Math.max(1, damage - target.defense * 0.3);
    
    applyDamage(target, actualDamage, attacker);
  };
  
  const processRangedAttack = (attacker: Soldier, target: Soldier, time: number) => {
    attacker.lastAttackTime = time;
    
    const dist = getDistance(attacker, target);
    const accuracy = 0.5 - (dist / attacker.range) * 0.3;
    if (Math.random() > accuracy) return; // 빗나감
    
    const damage = attacker.attack * 0.6 * (0.8 + Math.random() * 0.4);
    const actualDamage = Math.max(1, damage - target.defense * 0.2);
    
    applyDamage(target, actualDamage, attacker);
  };
  
  const applyDamage = (target: Soldier, damage: number, attacker: Soldier) => {
    target.hp -= damage;
    target.morale -= damage * 0.3;
    
    if (target.hp <= 0) {
      target.hp = 0;
      target.state = 'dead';
      target.engagedWith = undefined;
      attacker.engagedWith = undefined;
      
      // 킬 기록
      const squad = squadsRef.current.get(attacker.squadId);
      if (squad) squad.kills++;
      
      // 메시 숨김
      if (target.mesh) {
        target.mesh.visible = false;
      }
    } else if (target.morale < 20 && target.state !== 'routing') {
      target.state = 'routing';
      target.engagedWith = undefined;
    }
  };
  
  const updateMorale = (deltaSeconds: number) => {
    const soldiers = soldiersRef.current;
    
    soldiers.forEach(soldier => {
      if (soldier.state === 'dead') return;
      
      let nearbyAllies = 0;
      let nearbyEnemies = 0;
      
      soldiers.forEach(other => {
        if (other.state === 'dead') return;
        const dist = getDistance(soldier, other);
        if (dist <= 15) {
          if (other.teamId === soldier.teamId) nearbyAllies++;
          else nearbyEnemies++;
        }
      });
      
      if (nearbyEnemies > nearbyAllies * 2) {
        soldier.morale -= 1.5 * deltaSeconds;
      } else if (nearbyAllies > nearbyEnemies * 2) {
        soldier.morale += 0.5 * deltaSeconds;
      }
      
      soldier.morale = Math.max(0, Math.min(100, soldier.morale));
      
      if (soldier.morale < 20 && soldier.state !== 'routing' && soldier.state !== 'dead') {
        soldier.state = 'routing';
        soldier.engagedWith = undefined;
      }
    });
  };
  
  const checkVictory = () => {
    const soldiers = soldiersRef.current;
    let attackerAlive = 0, defenderAlive = 0;
    
    soldiers.forEach(soldier => {
      if (soldier.state !== 'dead') {
        if (soldier.teamId === 'attacker') attackerAlive++;
        else defenderAlive++;
      }
    });
    
    if (attackerAlive === 0) {
      battleStateRef.current = 'ended';
      setBattleState('ended');
      setWinner('defender');
    } else if (defenderAlive === 0) {
      battleStateRef.current = 'ended';
      setBattleState('ended');
      setWinner('attacker');
    }
  };
  
  const updateSoldierMesh = (soldier: Soldier) => {
    if (!soldier.mesh) return;
    
    soldier.mesh.position.set(soldier.x, 0.75, soldier.z);
    soldier.mesh.rotation.y = soldier.facing;
    
    const mat = soldier.mesh.material as THREE.MeshStandardMaterial;
    if (soldier.state === 'routing') {
      mat.color.setHex(0xFFFF00);
    } else if (soldier.state === 'fighting') {
      mat.color.setHex(soldier.teamId === 'attacker' ? 0xFF0000 : 0x0000FF);
    } else if (soldier.state === 'charging') {
      mat.color.setHex(soldier.teamId === 'attacker' ? 0xFF6600 : 0x0066FF);
    } else {
      mat.color.setHex(soldier.teamId === 'attacker' ? 0xFF4444 : 0x4444FF);
    }
  };
  
  const getDistance = (a: Soldier, b: Soldier) => {
    return Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2);
  };
  
  // ========================================
  // UI 업데이트 (throttled)
  // ========================================
  const updateStatsUI = () => {
    const soldiers = soldiersRef.current;
    const squads = squadsRef.current;
    
    let attackerAlive = 0, attackerKills = 0;
    let defenderAlive = 0, defenderKills = 0;
    
    soldiers.forEach(soldier => {
      if (soldier.state !== 'dead') {
        if (soldier.teamId === 'attacker') attackerAlive++;
        else defenderAlive++;
      }
    });
    
    squads.forEach(squad => {
      if (squad.teamId === 'attacker') attackerKills += squad.kills;
      else defenderKills += squad.kills;
    });
    
    setAttackerStats(prev => ({ ...prev, alive: attackerAlive, kills: attackerKills }));
    setDefenderStats(prev => ({ ...prev, alive: defenderAlive, kills: defenderKills }));
  };
  
  // ========================================
  // 이벤트 핸들러
  // ========================================
  const handleStartBattle = useCallback(() => {
    battleStateRef.current = 'running';
    setBattleState('running');
    console.log('⚔️ 전투 시작!');
  }, []);
  
  const handlePauseBattle = useCallback(() => {
    if (battleStateRef.current === 'running') {
      battleStateRef.current = 'paused';
      setBattleState('paused');
    } else if (battleStateRef.current === 'paused') {
      battleStateRef.current = 'running';
      setBattleState('running');
    }
  }, []);
  
  return (
    <div className={styles.container}>
      {/* 로딩 오버레이 */}
      {!isReady && (
        <div className={styles.loading} style={{ position: 'absolute', zIndex: 100, top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(26,26,46,0.95)' }}>
          <div>
            <div className={styles.spinner}></div>
            <p>최적화 엔진 로딩 중...</p>
          </div>
        </div>
      )}
      
      {/* 상단 HUD */}
      <div className={styles.topHud} style={{ visibility: isReady ? 'visible' : 'hidden', zIndex: 10 }}>
        <div className={styles.statsPanel}>
          <div className={styles.attackerStats}>
            <span className={styles.teamName}>🏴 조조군</span>
            <span className={styles.soldiers}>
              {(attackerStats.alive * TROOPS_PER_SOLDIER).toLocaleString()} / {(attackerStats.total * TROOPS_PER_SOLDIER).toLocaleString()}
            </span>
            <span className={styles.kills}>💀 {(attackerStats.kills * TROOPS_PER_SOLDIER).toLocaleString()}</span>
          </div>
          
          <div className={styles.battleInfo}>
            <span className={styles.fps}>⚔️ 최적화 엔진</span>
            <span className={styles.time}>Three.js Direct</span>
          </div>
          
          <div className={styles.defenderStats}>
            <span className={styles.teamName}>🚩 손오 연합</span>
            <span className={styles.soldiers}>
              {(defenderStats.alive * TROOPS_PER_SOLDIER).toLocaleString()} / {(defenderStats.total * TROOPS_PER_SOLDIER).toLocaleString()}
            </span>
            <span className={styles.kills}>💀 {(defenderStats.kills * TROOPS_PER_SOLDIER).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* Three.js 캔버스 */}
      <div 
        ref={containerRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          zIndex: 0 
        }} 
      />
      
      {/* 전투 컨트롤 */}
      <div className={styles.battleControls} style={{ zIndex: 10 }}>
        {battleState === 'preparing' && (
          <button className={styles.startButton} onClick={handleStartBattle}>
            ⚔️ 전투 시작
          </button>
        )}
        {(battleState === 'running' || battleState === 'paused') && (
          <button className={styles.pauseButton} onClick={handlePauseBattle}>
            {battleState === 'running' ? '⏸️ 일시정지' : '▶️ 재개'}
          </button>
        )}
        {battleState === 'ended' && (
          <div className={styles.victoryBanner}>
            🏆 {winner === 'attacker' ? '조조군 승리!' : '손오 연합 승리!'}
          </div>
        )}
      </div>
      
      {/* 조작 안내 */}
      <div className={styles.controls}>
        <p>마우스 드래그: 회전 | 우클릭 드래그: 이동 | 휠: 줌</p>
      </div>
    </div>
  );
}

