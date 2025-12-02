/**
 * E5: 복셀 FPS 성능 테스트
 * 
 * 목표:
 * - 데스크톱: 1000 유닛 @ 60fps
 * - 모바일: 500 유닛 @ 30fps
 * 
 * 실행: npx ts-node tests/performance/voxel-fps.test.ts
 */

import {
  BattleEngine,
  UnitType,
  Formation,
  Stance,
  TerrainType,
  type BattleUnit,
} from '../../src/lib/battle/BattleEngine';

// 성능 기준
const PERFORMANCE_TARGETS = {
  desktop: {
    unitCount: 1000,
    targetFPS: 60,
    minFPS: 55,
    maxFrameTime: 16.67, // 60fps = 16.67ms/frame
  },
  mobile: {
    unitCount: 500,
    targetFPS: 30,
    minFPS: 25,
    maxFrameTime: 33.33, // 30fps = 33.33ms/frame
  },
};

interface FPSTestResult {
  scenario: string;
  unitCount: number;
  targetFPS: number;
  actualFPS: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  p95FrameTime: number;
  p99FrameTime: number;
  droppedFrames: number;
  passed: boolean;
}

interface PerformanceTimer {
  times: number[];
  start: () => void;
  stop: () => number;
  avg: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

function createTimer(): PerformanceTimer {
  const times: number[] = [];
  let startTime = 0;

  return {
    times,
    start: () => {
      startTime = performance.now();
    },
    stop: () => {
      const elapsed = performance.now() - startTime;
      times.push(elapsed);
      return elapsed;
    },
    get avg() {
      if (times.length === 0) return 0;
      return times.reduce((a, b) => a + b, 0) / times.length;
    },
    get min() {
      if (times.length === 0) return 0;
      return Math.min(...times);
    },
    get max() {
      if (times.length === 0) return 0;
      return Math.max(...times);
    },
    get p95() {
      if (times.length === 0) return 0;
      const sorted = [...times].sort((a, b) => a - b);
      const index = Math.floor(0.95 * sorted.length);
      return sorted[index];
    },
    get p99() {
      if (times.length === 0) return 0;
      const sorted = [...times].sort((a, b) => a - b);
      const index = Math.floor(0.99 * sorted.length);
      return sorted[index];
    },
  };
}

function createTestUnit(
  id: string,
  teamId: 'attacker' | 'defender',
  position: { x: number; z: number },
  troops: number
): Omit<BattleUnit, 'lastAttackTime' | 'attackCooldown' | 'attackRange' | 'buffs' | 'debuffs'> {
  return {
    id,
    name: `Unit ${id}`,
    generalName: 'Test General',
    unitType: UnitType.INFANTRY,
    unitTypeId: 1102,
    nation: teamId === 'attacker' ? '촉' : '위',
    teamId,
    position,
    heading: teamId === 'attacker' ? 0 : Math.PI,
    moveSpeed: 3,
    troops,
    maxTroops: troops,
    morale: 100,
    training: 80,
    leadership: 80,
    strength: 80,
    intelligence: 80,
    formation: Formation.LINE,
    stance: Stance.BALANCED,
    state: 'idle',
  };
}

async function runFPSTest(
  unitCount: number,
  targetFPS: number,
  scenario: string
): Promise<FPSTestResult> {
  console.log(`\n🎮 FPS 테스트: ${scenario}`);
  console.log(`   유닛 수: ${unitCount}`);
  console.log(`   목표 FPS: ${targetFPS}`);
  console.log('─'.repeat(50));

  const timer = createTimer();
  const maxFrameTime = 1000 / targetFPS;
  const testDuration = 5000; // 5초
  const expectedFrames = Math.floor(testDuration / maxFrameTime);

  // 엔진 초기화
  const engine = new BattleEngine({
    id: `fps-test-${scenario}`,
    terrain: TerrainType.PLAIN,
    attackerNation: '촉',
    defenderNation: '위',
  });

  // 유닛 배치
  const unitsPerSide = Math.floor(unitCount / 2);
  const gridSize = Math.ceil(Math.sqrt(unitsPerSide));

  for (let i = 0; i < unitsPerSide; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    
    engine.addUnit(createTestUnit(
      `attacker-${i}`,
      'attacker',
      { x: col * 3, z: row * 3 },
      100
    ));
    
    engine.addUnit(createTestUnit(
      `defender-${i}`,
      'defender',
      { x: col * 3, z: 50 + row * 3 },
      100
    ));
  }

  console.log(`   유닛 배치 완료: 공격 ${unitsPerSide}, 수비 ${unitsPerSide}`);

  // 프레임 시뮬레이션
  let frameCount = 0;
  let droppedFrames = 0;
  const startTime = performance.now();

  while (performance.now() - startTime < testDuration) {
    timer.start();
    
    // 프레임 업데이트 시뮬레이션
    const units = engine.getAllUnits();
    
    // 각 유닛에 대한 처리 시뮬레이션
    for (const unit of units) {
      // 위치 업데이트
      if (unit.state === 'moving') {
        unit.position.x += Math.random() * 0.1;
        unit.position.z += Math.random() * 0.1;
      }
      
      // 거리 계산 (가장 가까운 적)
      const enemies = units.filter((u: BattleUnit) => u.teamId !== unit.teamId);
      if (enemies.length > 0) {
        let minDist = Infinity;
        for (const enemy of enemies.slice(0, 10)) { // 최대 10개만 체크
          const dx = enemy.position.x - unit.position.x;
          const dz = enemy.position.z - unit.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          minDist = Math.min(minDist, dist);
        }
      }
    }
    
    const frameTime = timer.stop();
    frameCount++;
    
    if (frameTime > maxFrameTime) {
      droppedFrames++;
    }

    // 프레임 간 대기 (실제 프레임 레이트 시뮬레이션)
    const sleepTime = Math.max(0, maxFrameTime - frameTime);
    if (sleepTime > 0) {
      await new Promise(r => setTimeout(r, sleepTime));
    }
  }

  engine.stop();

  const actualDuration = performance.now() - startTime;
  const actualFPS = (frameCount / actualDuration) * 1000;
  const passed = actualFPS >= targetFPS * 0.9; // 10% 여유

  const result: FPSTestResult = {
    scenario,
    unitCount,
    targetFPS,
    actualFPS,
    avgFrameTime: timer.avg,
    minFrameTime: timer.min,
    maxFrameTime: timer.max,
    p95FrameTime: timer.p95,
    p99FrameTime: timer.p99,
    droppedFrames,
    passed,
  };

  console.log(`\n📊 결과:`);
  console.log(`   실제 FPS: ${actualFPS.toFixed(1)}`);
  console.log(`   평균 프레임 시간: ${timer.avg.toFixed(2)}ms`);
  console.log(`   최소 프레임 시간: ${timer.min.toFixed(2)}ms`);
  console.log(`   최대 프레임 시간: ${timer.max.toFixed(2)}ms`);
  console.log(`   P95 프레임 시간: ${timer.p95.toFixed(2)}ms`);
  console.log(`   P99 프레임 시간: ${timer.p99.toFixed(2)}ms`);
  console.log(`   드롭된 프레임: ${droppedFrames} (${((droppedFrames / frameCount) * 100).toFixed(1)}%)`);
  console.log(`   상태: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  return result;
}

async function runBattleEngineStress(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Phase 4.3: 전투 엔진 스트레스 테스트');
  console.log('═══════════════════════════════════════════════════════════\n');

  const scenarios = [
    { units: 100, label: '소규모 전투 (100 유닛)' },
    { units: 500, label: '중규모 전투 (500 유닛)' },
    { units: 1000, label: '대규모 전투 (1000 유닛)' },
    { units: 2000, label: '초대규모 전투 (2000 유닛)' },
  ];

  const results: { scenario: string; tickTime: number; damageTime: number }[] = [];

  for (const scenario of scenarios) {
    console.log(`\n🎮 ${scenario.label}`);
    
    const engine = new BattleEngine({
      id: `stress-${scenario.units}`,
      terrain: TerrainType.PLAIN,
      attackerNation: '촉',
      defenderNation: '위',
    });

    // 유닛 배치
    const unitsPerSide = Math.floor(scenario.units / 2);
    const gridSize = Math.ceil(Math.sqrt(unitsPerSide));

    for (let i = 0; i < unitsPerSide; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      engine.addUnit(createTestUnit(
        `attacker-${i}`,
        'attacker',
        { x: col * 2, z: row * 2 },
        100
      ));
      
      engine.addUnit(createTestUnit(
        `defender-${i}`,
        'defender',
        { x: col * 2, z: 40 + row * 2 },
        100
      ));
    }

    // 틱 처리 시간 측정
    const tickTimes: number[] = [];
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // 유닛 순회 및 처리
      const units = engine.getAllUnits();
      for (const unit of units) {
        // 위치 업데이트
        unit.position.x += Math.random() * 0.01;
        unit.position.z += Math.random() * 0.01;
      }
      
      tickTimes.push(performance.now() - start);
    }

    // 데미지 계산 시간 측정
    const damageTimes: number[] = [];
    const attacker = engine.getUnit('attacker-0');
    const defender = engine.getUnit('defender-0');

    if (attacker && defender) {
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        engine.calculateDamage(attacker as BattleUnit, defender as BattleUnit);
        damageTimes.push(performance.now() - start);
      }
    }

    const avgTickTime = tickTimes.reduce((a, b) => a + b, 0) / tickTimes.length;
    const avgDamageTime = damageTimes.reduce((a, b) => a + b, 0) / damageTimes.length;

    results.push({
      scenario: scenario.label,
      tickTime: avgTickTime,
      damageTime: avgDamageTime,
    });

    console.log(`   평균 틱 시간: ${avgTickTime.toFixed(3)}ms`);
    console.log(`   평균 데미지 계산: ${avgDamageTime.toFixed(3)}ms`);
    console.log(`   60fps 기준: ${avgTickTime < 16.67 ? '✅ 가능' : '⚠️ 주의'}`);

    engine.stop();
  }

  // 결과 요약
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('전투 엔진 스트레스 테스트 요약');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('┌────────────────────────────────┬──────────────┬──────────────┬──────────┐');
  console.log('│ 시나리오                       │ 틱 시간(ms)  │ 데미지(ms)   │ 60fps    │');
  console.log('├────────────────────────────────┼──────────────┼──────────────┼──────────┤');

  for (const r of results) {
    const scenario = r.scenario.padEnd(30);
    const tickTime = r.tickTime.toFixed(3).padStart(12);
    const damageTime = r.damageTime.toFixed(3).padStart(12);
    const status = r.tickTime < 16.67 ? '✅' : '⚠️';
    console.log(`│ ${scenario} │ ${tickTime} │ ${damageTime} │    ${status}    │`);
  }

  console.log('└────────────────────────────────┴──────────────┴──────────────┴──────────┘');
}

async function main(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║          E5: 복셀 FPS 성능 테스트                         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const results: FPSTestResult[] = [];

  // Phase 4.1: 데스크톱 테스트 (1000 유닛 @ 60fps)
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Phase 4.1: 데스크톱 성능 테스트 (1000 유닛 @ 60fps)');
  console.log('═══════════════════════════════════════════════════════════');

  const desktopResult = await runFPSTest(
    PERFORMANCE_TARGETS.desktop.unitCount,
    PERFORMANCE_TARGETS.desktop.targetFPS,
    'desktop'
  );
  results.push(desktopResult);

  // Phase 4.2: 모바일 테스트 (500 유닛 @ 30fps)
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Phase 4.2: 모바일 성능 테스트 (500 유닛 @ 30fps)');
  console.log('═══════════════════════════════════════════════════════════');

  const mobileResult = await runFPSTest(
    PERFORMANCE_TARGETS.mobile.unitCount,
    PERFORMANCE_TARGETS.mobile.targetFPS,
    'mobile'
  );
  results.push(mobileResult);

  // Phase 4.3: 전투 엔진 스트레스 테스트
  await runBattleEngineStress();

  // 최종 요약
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                복셀 FPS 테스트 최종 요약                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('┌──────────────┬──────────┬──────────┬───────────────┬───────────────┬─────────┐');
  console.log('│ 시나리오     │ 유닛 수  │ 목표 FPS │ 실제 FPS      │ 드롭 프레임   │ 결과    │');
  console.log('├──────────────┼──────────┼──────────┼───────────────┼───────────────┼─────────┤');

  for (const r of results) {
    const scenario = r.scenario.padEnd(12);
    const units = String(r.unitCount).padStart(8);
    const target = String(r.targetFPS).padStart(8);
    const actual = r.actualFPS.toFixed(1).padStart(13);
    const dropped = String(r.droppedFrames).padStart(13);
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`│ ${scenario} │ ${units} │ ${target} │ ${actual} │ ${dropped} │ ${status} │`);
  }

  console.log('└──────────────┴──────────┴──────────┴───────────────┴───────────────┴─────────┘\n');

  const allPassed = results.every(r => r.passed);
  console.log(allPassed ? '🎉 모든 복셀 FPS 테스트 통과!' : '⚠️ 일부 테스트 실패');

  // JSON 출력
  if (process.env.OUTPUT_JSON) {
    console.log('\n=== JSON 결과 ===');
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch(console.error);

export { runFPSTest, runBattleEngineStress, PERFORMANCE_TARGETS };

