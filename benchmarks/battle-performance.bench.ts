/**
 * 전투 시스템 성능 벤치마크
 * 
 * 100/500/1000 유닛 벤치마크
 * 메모리 사용량
 * 로딩 시간
 * 
 * 실행: npx ts-node benchmarks/battle-performance.bench.ts
 */

import {
  BattleEngine,
  UnitType,
  Formation,
  Stance,
  TerrainType,
  type BattleUnit,
} from '../src/lib/battle/BattleEngine';
import {
  convertApiBattleToVoxel,
} from '../src/lib/battle/adapters/BattleDataAdapter';
import {
  calculateSquadSize,
  getUnitBaseStats,
  createVoxelSquad,
} from '../src/lib/battle/adapters/UnitAdapter';

// ========================================
// 벤치마크 설정
// ========================================

interface BenchmarkConfig {
  name: string;
  attackerUnits: number;
  defenderUnits: number;
  iterations: number;
}

interface BenchmarkResult {
  scenario: string;
  unitCount: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  memoryPeak: number;
  loadTime: number;
  tickTime: number;
  damageCalcTime: number;
}

const BENCHMARK_SCENARIOS: BenchmarkConfig[] = [
  { name: 'small_battle', attackerUnits: 100, defenderUnits: 100, iterations: 100 },
  { name: 'medium_battle', attackerUnits: 500, defenderUnits: 500, iterations: 50 },
  { name: 'large_battle', attackerUnits: 1000, defenderUnits: 1000, iterations: 20 },
];

// ========================================
// 벤치마크 유틸리티
// ========================================

class PerformanceTimer {
  private times: number[] = [];
  private startTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  stop(): number {
    const elapsed = performance.now() - this.startTime;
    this.times.push(elapsed);
    return elapsed;
  }

  get avg(): number {
    if (this.times.length === 0) return 0;
    return this.times.reduce((a, b) => a + b, 0) / this.times.length;
  }

  get min(): number {
    if (this.times.length === 0) return 0;
    return Math.min(...this.times);
  }

  get max(): number {
    if (this.times.length === 0) return 0;
    return Math.max(...this.times);
  }

  reset(): void {
    this.times = [];
  }
}

function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatMs(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}

// ========================================
// 테스트 유닛 생성
// ========================================

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

// ========================================
// 벤치마크 실행
// ========================================

async function runEngineBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
  const timer = new PerformanceTimer();
  const loadTimer = new PerformanceTimer();
  const tickTimer = new PerformanceTimer();
  const damageTimer = new PerformanceTimer();

  const memoryBefore = getMemoryUsage();
  let memoryPeak = memoryBefore;

  // 엔진 초기화 벤치마크
  loadTimer.start();
  const engine = new BattleEngine({
    id: `benchmark-${config.name}`,
    terrain: TerrainType.PLAIN,
    attackerNation: '촉',
    defenderNation: '위',
  });

  // 유닛 추가
  const troopsPerUnit = 100;
  const attackerPerUnit = Math.ceil(config.attackerUnits / 10);
  const defenderPerUnit = Math.ceil(config.defenderUnits / 10);

  for (let i = 0; i < 10; i++) {
    engine.addUnit(createTestUnit(
      `attacker-${i}`,
      'attacker',
      { x: i * 5, z: 0 },
      attackerPerUnit
    ));
    engine.addUnit(createTestUnit(
      `defender-${i}`,
      'defender',
      { x: i * 5, z: 50 },
      defenderPerUnit
    ));
  }
  loadTimer.stop();

  // 메모리 측정
  const memoryAfterLoad = getMemoryUsage();
  memoryPeak = Math.max(memoryPeak, memoryAfterLoad);

  // 틱 벤치마크
  for (let i = 0; i < config.iterations; i++) {
    timer.start();
    
    // 데미지 계산 벤치마크
    const attacker = engine.getUnit('attacker-0');
    const defender = engine.getUnit('defender-0');
    
    if (attacker && defender) {
      damageTimer.start();
      for (let j = 0; j < 10; j++) {
        engine.calculateDamage(attacker as BattleUnit, defender as BattleUnit);
      }
      damageTimer.stop();
    }

    timer.stop();

    // 메모리 피크 추적
    const currentMemory = getMemoryUsage();
    memoryPeak = Math.max(memoryPeak, currentMemory);
  }

  engine.stop();

  return {
    scenario: config.name,
    unitCount: config.attackerUnits + config.defenderUnits,
    avgTime: timer.avg,
    minTime: timer.min,
    maxTime: timer.max,
    memoryPeak: memoryPeak - memoryBefore,
    loadTime: loadTimer.avg,
    tickTime: timer.avg,
    damageCalcTime: damageTimer.avg,
  };
}

async function runAdapterBenchmark(): Promise<void> {
  console.log('\n=== 어댑터 성능 벤치마크 ===\n');

  const timer = new PerformanceTimer();

  // UnitAdapter 벤치마크
  const unitIds = [1100, 1102, 1201, 1301, 1401, 1501];
  const iterations = 1000;

  console.log('createVoxelSquad 벤치마크:');
  for (const unitId of unitIds) {
    timer.reset();
    for (let i = 0; i < iterations; i++) {
      timer.start();
      createVoxelSquad(unitId, 1000, 100, 80);
      timer.stop();
    }
    console.log(`  Unit ${unitId}: avg=${formatMs(timer.avg)}, min=${formatMs(timer.min)}, max=${formatMs(timer.max)}`);
  }

  // calculateSquadSize 벤치마크
  console.log('\ncalculateSquadSize 벤치마크:');
  const crewCounts = [100, 500, 1000, 5000, 10000];
  for (const crew of crewCounts) {
    timer.reset();
    for (let i = 0; i < iterations; i++) {
      timer.start();
      calculateSquadSize(crew);
      timer.stop();
    }
    console.log(`  Crew ${crew}: avg=${formatMs(timer.avg)}, min=${formatMs(timer.min)}, max=${formatMs(timer.max)}`);
  }

  // getUnitBaseStats 벤치마크
  console.log('\ngetUnitBaseStats 벤치마크:');
  for (const unitId of unitIds) {
    timer.reset();
    for (let i = 0; i < iterations; i++) {
      timer.start();
      getUnitBaseStats(unitId);
      timer.stop();
    }
    console.log(`  Unit ${unitId}: avg=${formatMs(timer.avg)}, min=${formatMs(timer.min)}, max=${formatMs(timer.max)}`);
  }
}

// ========================================
// 메인 실행
// ========================================

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     복셀 전투 시스템 성능 벤치마크              ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const results: BenchmarkResult[] = [];

  // 엔진 벤치마크
  console.log('=== 전투 엔진 벤치마크 ===\n');

  for (const scenario of BENCHMARK_SCENARIOS) {
    console.log(`Running ${scenario.name}...`);
    const result = await runEngineBenchmark(scenario);
    results.push(result);

    console.log(`  유닛 수: ${result.unitCount}`);
    console.log(`  로드 시간: ${formatMs(result.loadTime)}`);
    console.log(`  평균 틱 시간: ${formatMs(result.avgTime)}`);
    console.log(`  최소 틱 시간: ${formatMs(result.minTime)}`);
    console.log(`  최대 틱 시간: ${formatMs(result.maxTime)}`);
    console.log(`  데미지 계산 시간: ${formatMs(result.damageCalcTime)}`);
    console.log(`  메모리 피크: ${formatBytes(result.memoryPeak)}`);
    console.log('');
  }

  // 어댑터 벤치마크
  await runAdapterBenchmark();

  // 결과 요약
  console.log('\n=== 벤치마크 결과 요약 ===\n');
  console.log('┌─────────────────┬───────────┬───────────┬───────────┬───────────┬───────────┐');
  console.log('│ 시나리오        │ 유닛 수   │ 로드(ms)  │ 평균(ms)  │ 최대(ms)  │ 메모리    │');
  console.log('├─────────────────┼───────────┼───────────┼───────────┼───────────┼───────────┤');

  for (const result of results) {
    const name = result.scenario.padEnd(15);
    const units = result.unitCount.toString().padStart(7);
    const load = result.loadTime.toFixed(2).padStart(9);
    const avg = result.avgTime.toFixed(2).padStart(9);
    const max = result.maxTime.toFixed(2).padStart(9);
    const mem = formatBytes(result.memoryPeak).padStart(9);
    console.log(`│ ${name} │ ${units}   │ ${load} │ ${avg} │ ${max} │ ${mem} │`);
  }

  console.log('└─────────────────┴───────────┴───────────┴───────────┴───────────┴───────────┘');

  // 성능 기준 체크
  console.log('\n=== 성능 기준 충족 여부 ===\n');

  const PERFORMANCE_THRESHOLDS = {
    small: { loadTime: 100, tickTime: 5, memory: 10 * 1024 * 1024 },
    medium: { loadTime: 200, tickTime: 10, memory: 50 * 1024 * 1024 },
    large: { loadTime: 500, tickTime: 20, memory: 100 * 1024 * 1024 },
  };

  let allPassed = true;

  for (const result of results) {
    const threshold = result.scenario.includes('small') 
      ? PERFORMANCE_THRESHOLDS.small 
      : result.scenario.includes('medium') 
        ? PERFORMANCE_THRESHOLDS.medium 
        : PERFORMANCE_THRESHOLDS.large;

    const loadPassed = result.loadTime <= threshold.loadTime;
    const tickPassed = result.avgTime <= threshold.tickTime;
    const memPassed = result.memoryPeak <= threshold.memory;

    const status = loadPassed && tickPassed && memPassed ? '✅ PASS' : '❌ FAIL';
    allPassed = allPassed && loadPassed && tickPassed && memPassed;

    console.log(`${result.scenario}: ${status}`);
    if (!loadPassed) console.log(`  ⚠️ 로드 시간 초과: ${formatMs(result.loadTime)} > ${formatMs(threshold.loadTime)}`);
    if (!tickPassed) console.log(`  ⚠️ 틱 시간 초과: ${formatMs(result.avgTime)} > ${formatMs(threshold.tickTime)}`);
    if (!memPassed) console.log(`  ⚠️ 메모리 초과: ${formatBytes(result.memoryPeak)} > ${formatBytes(threshold.memory)}`);
  }

  console.log('\n' + (allPassed ? '🎉 모든 벤치마크 통과!' : '⚠️ 일부 벤치마크 실패'));

  // JSON 출력 (CI 통합용)
  if (process.env.CI || process.env.OUTPUT_JSON) {
    console.log('\n=== JSON 결과 ===\n');
    console.log(JSON.stringify(results, null, 2));
  }
}

// 직접 실행 시
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}

// 모듈 내보내기 (테스트용)
export {
  BENCHMARK_SCENARIOS,
  runEngineBenchmark,
  runAdapterBenchmark,
  PerformanceTimer,
  getMemoryUsage,
  formatBytes,
  formatMs,
  type BenchmarkConfig,
  type BenchmarkResult,
};





