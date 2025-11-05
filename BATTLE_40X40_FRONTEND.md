# 40x40 전투 시스템 구현 계획 (프론트엔드)

**작성일**: 2025-11-05  
**대상**: open-sam-front 40x40 전투 UI

---

## 📋 개요

40x40 그리드 기반 실시간 전투 UI를 React + Socket.IO로 구현합니다.

---

## 🎯 핵심 UI 컴포넌트

### 1. BattleRoom (전투 메인 화면)
- 40x40 그리드 맵
- 유닛 배치/이동/공격 UI
- 턴 타이머
- 아군/적군 정보 패널

### 2. UnitDeployment (배치 단계)
- 장수별 병력 분할
- 드래그 앤 드롭 배치
- 배치 영역 표시

### 3. BattleGrid (전투 그리드)
- 40x40 셀 렌더링
- 지형 표시
- 유닛 표시
- 선택/이동/공격 인터랙션

### 4. ActionPanel (액션 패널)
- 이동/공격/대기 버튼
- 선택한 유닛 정보
- 액션 확정/취소

---

## 🗂️ 데이터 타입

```typescript
// types/battle.ts
interface Battle {
  id: string;
  session_id: string;
  type: 'city_attack' | 'field';
  
  attackers: BattleSide;
  defenders: BattleSide;
  
  state: 'waiting' | 'deploying' | 'fighting' | 'ended';
  current_turn: number;
  max_turns: number;
  
  map: BattleMap;
  winner?: 'attackers' | 'defenders';
}

interface BattleSide {
  nation_id: number;
  nation_name: string;
  generals: BattleGeneral[];
  ready: boolean;
}

interface BattleGeneral {
  general_id: number;
  general_name: string;
  total_crew: number;
  units: BattleUnit[];
  ready: boolean;
}

interface BattleUnit {
  id: string;
  general_id: number;
  crew: number;
  crewtype: number;
  position: { x: number; y: number };
  hp: number;
  status: 'alive' | 'dead';
  
  // UI 상태
  selected?: boolean;
  action?: UnitAction;
}

interface UnitAction {
  type: 'move' | 'attack' | 'wait';
  target?: { x: number; y: number };
  target_unit_id?: string;
}

interface BattleMap {
  width: number;  // 40
  height: number; // 40
  terrain: number[][];
  deployment_zones: {
    attackers: Zone;
    defenders: Zone;
  };
}

interface Zone {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
```

---

## 🎨 UI 플로우

### Phase 1: 전투 참가
```tsx
// app/[server]/battle/[battleId]/page.tsx
export default function BattlePage() {
  const { battleId } = useParams();
  const { socket } = useSocket();
  const [battle, setBattle] = useState<Battle | null>(null);
  
  useEffect(() => {
    // 전투 정보 로드
    loadBattle(battleId);
    
    // Socket 연결
    socket.emit('battle:join', { battleId, generalId });
    
    // 상태 업데이트 리스너
    socket.on('battle:state', (data) => {
      setBattle(data);
    });
  }, [battleId]);
  
  if (!battle) return <div>Loading...</div>;
  
  return (
    <div className={styles.battleRoom}>
      {battle.state === 'deploying' && <UnitDeployment battle={battle} />}
      {battle.state === 'fighting' && <BattleGrid battle={battle} />}
      {battle.state === 'ended' && <BattleResult battle={battle} />}
    </div>
  );
}
```

### Phase 2: 유닛 배치
```tsx
// components/battle/UnitDeployment.tsx
export default function UnitDeployment({ battle }: { battle: Battle }) {
  const { socket } = useSocket();
  const [units, setUnits] = useState<DeployUnit[]>([]);
  const [deploymentZone, setDeploymentZone] = useState<Zone>();
  
  // 병력 분할
  function splitTroops(general: BattleGeneral) {
    const newUnit = {
      id: generateId(),
      general_id: general.general_id,
      crew: 1000,
      crewtype: general.crewtype,
      position: { x: -1, y: -1 } // 미배치
    };
    setUnits([...units, newUnit]);
  }
  
  // 유닛 배치
  function deployUnit(unitId: string, position: { x: number; y: number }) {
    if (!isInDeploymentZone(position, deploymentZone)) {
      alert('배치 영역 밖입니다');
      return;
    }
    
    setUnits(units.map(u =>
      u.id === unitId ? { ...u, position } : u
    ));
  }
  
  // 배치 완료
  function confirmDeployment() {
    socket.emit('battle:deploy', {
      battleId: battle.id,
      generalId,
      units
    });
    socket.emit('battle:ready', { battleId: battle.id, generalId });
  }
  
  return (
    <div className={styles.deployment}>
      <div className={styles.troopPanel}>
        <h3>병력 분할</h3>
        {battle.myGenerals.map(general => (
          <div key={general.general_id}>
            <div>{general.general_name} - {general.total_crew}명</div>
            <button onClick={() => splitTroops(general)}>부대 생성</button>
          </div>
        ))}
        
        <h3>배치할 부대</h3>
        {units.map(unit => (
          <UnitCard
            key={unit.id}
            unit={unit}
            draggable
            onDragStart={() => setDraggingUnit(unit.id)}
          />
        ))}
      </div>
      
      <BattleGrid
        map={battle.map}
        units={units}
        deploymentZone={deploymentZone}
        onCellClick={(x, y) => {
          if (draggingUnit) {
            deployUnit(draggingUnit, { x, y });
          }
        }}
      />
      
      <button onClick={confirmDeployment} disabled={!allUnitsDeployed()}>
        배치 완료
      </button>
    </div>
  );
}
```

### Phase 3: 전투 진행
```tsx
// components/battle/BattleGrid.tsx
export default function BattleGrid({ battle }: { battle: Battle }) {
  const { socket } = useSocket();
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [action, setAction] = useState<UnitAction | null>(null);
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);
  
  // Socket 이벤트
  useEffect(() => {
    socket.on('battle:turn_start', (data) => {
      setTurnTimeLeft(30);
      // 액션 초기화
      setSelectedUnit(null);
      setAction(null);
    });
    
    socket.on('battle:turn_result', (data) => {
      // 애니메이션 재생
      playTurnAnimation(data);
    });
    
    socket.on('battle:ended', (data) => {
      showBattleResult(data);
    });
  }, []);
  
  // 유닛 선택
  function selectUnit(unitId: string) {
    const unit = findUnit(unitId);
    if (unit.general_id !== myGeneralId) return;
    setSelectedUnit(unitId);
  }
  
  // 이동 명령
  function moveUnit(target: { x: number; y: number }) {
    if (!selectedUnit) return;
    
    setAction({
      type: 'move',
      target
    });
  }
  
  // 공격 명령
  function attackUnit(targetUnitId: string) {
    if (!selectedUnit) return;
    
    setAction({
      type: 'attack',
      target_unit_id: targetUnitId
    });
  }
  
  // 액션 제출
  function submitAction() {
    if (!selectedUnit || !action) return;
    
    socket.emit('battle:submit_action', {
      battleId: battle.id,
      unitId: selectedUnit,
      action
    });
    
    setSelectedUnit(null);
    setAction(null);
  }
  
  return (
    <div className={styles.battleGrid}>
      <div className={styles.turnInfo}>
        <div>턴 {battle.current_turn} / {battle.max_turns}</div>
        <div>남은 시간: {turnTimeLeft}초</div>
      </div>
      
      <div className={styles.grid}>
        {Array.from({ length: 40 }).map((_, y) => (
          <div key={y} className={styles.row}>
            {Array.from({ length: 40 }).map((_, x) => (
              <GridCell
                key={`${x}-${y}`}
                x={x}
                y={y}
                terrain={battle.map.terrain[y][x]}
                unit={findUnitAt(x, y)}
                selected={selectedUnit && findUnitAt(x, y)?.id === selectedUnit}
                actionTarget={action?.target?.x === x && action?.target?.y === y}
                onClick={() => handleCellClick(x, y)}
              />
            ))}
          </div>
        ))}
      </div>
      
      <ActionPanel
        selectedUnit={selectedUnit ? findUnit(selectedUnit) : null}
        action={action}
        onMove={moveUnit}
        onAttack={attackUnit}
        onWait={() => setAction({ type: 'wait' })}
        onSubmit={submitAction}
        onCancel={() => { setSelectedUnit(null); setAction(null); }}
      />
    </div>
  );
}
```

### Phase 4: 애니메이션
```tsx
// components/battle/BattleAnimation.tsx
export function playTurnAnimation(result: TurnResult) {
  // 1. 이동 애니메이션
  for (const movement of result.movements) {
    animateMove(movement.unitId, movement.from, movement.to);
  }
  
  // 2. 공격 애니메이션
  for (const attack of result.attacks) {
    animateAttack(attack.attackerId, attack.defenderId, attack.damage);
  }
  
  // 3. 사망 애니메이션
  for (const casualty of result.casualties) {
    animateDeath(casualty.unitId);
  }
}

function animateMove(unitId: string, from: Pos, to: Pos) {
  const element = document.querySelector(`[data-unit-id="${unitId}"]`);
  if (!element) return;
  
  const dx = (to.x - from.x) * CELL_SIZE;
  const dy = (to.y - from.y) * CELL_SIZE;
  
  element.animate([
    { transform: 'translate(0, 0)' },
    { transform: `translate(${dx}px, ${dy}px)` }
  ], {
    duration: 500,
    easing: 'ease-in-out'
  });
}

function animateAttack(attackerId: string, defenderId: string, damage: number) {
  const attacker = document.querySelector(`[data-unit-id="${attackerId}"]`);
  const defender = document.querySelector(`[data-unit-id="${defenderId}"]`);
  
  // 공격 이펙트
  showEffect(attacker, 'attack');
  
  // 피격 이펙트
  showEffect(defender, 'hit');
  
  // 데미지 텍스트
  showDamageText(defender, damage);
}
```

---

## 🎨 스타일링

```css
/* components/battle/BattleGrid.module.css */
.battleGrid {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1a1a;
}

.turnInfo {
  padding: 1rem;
  background: #2a2a2a;
  color: white;
  display: flex;
  justify-content: space-between;
}

.grid {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
}

.cell {
  width: 20px;
  height: 20px;
  border: 1px solid #333;
  position: relative;
  cursor: pointer;
}

.cell.terrain-0 {
  background: #2d5016; /* 평지 */
}

.cell.terrain-1 {
  background: #4a4a4a; /* 산 */
}

.cell.terrain-2 {
  background: #1e3a5f; /* 물 */
}

.cell.selected {
  border: 2px solid yellow;
}

.cell.actionTarget {
  background: rgba(255, 255, 0, 0.3);
}

.unit {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: red;
  transition: all 0.3s;
}

.unit.ally {
  background: blue;
}

.unit.enemy {
  background: red;
}

.unit.selected {
  box-shadow: 0 0 10px yellow;
}
```

---

## 📡 Socket.IO 훅

```typescript
// hooks/useBattle.ts
export function useBattle(battleId: string) {
  const { socket } = useSocket();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [units, setUnits] = useState<BattleUnit[]>([]);
  
  useEffect(() => {
    if (!socket || !battleId) return;
    
    // 전투 참가
    socket.emit('battle:join', { battleId, generalId });
    
    // 이벤트 리스너
    socket.on('battle:state', (data) => {
      setBattle(data);
      setUnits(extractMyUnits(data));
    });
    
    socket.on('battle:deploy_update', (data) => {
      // 배치 업데이트
    });
    
    socket.on('battle:started', (data) => {
      // 전투 시작
    });
    
    socket.on('battle:turn_start', (data) => {
      // 턴 시작
    });
    
    socket.on('battle:turn_result', (data) => {
      // 턴 결과
      playTurnAnimation(data);
    });
    
    socket.on('battle:ended', (data) => {
      // 전투 종료
      showResult(data);
    });
    
    return () => {
      socket.off('battle:state');
      socket.off('battle:deploy_update');
      socket.off('battle:started');
      socket.off('battle:turn_start');
      socket.off('battle:turn_result');
      socket.off('battle:ended');
    };
  }, [socket, battleId]);
  
  return {
    battle,
    units,
    deployUnits: (units) => socket.emit('battle:deploy', { battleId, units }),
    ready: () => socket.emit('battle:ready', { battleId }),
    submitAction: (unitId, action) => socket.emit('battle:submit_action', { battleId, unitId, action })
  };
}
```

---

## 📁 파일 구조

```
src/
├── app/[server]/battle/[battleId]/
│   ├── page.tsx                    # 전투 메인 페이지
│   └── page.module.css
├── components/battle/
│   ├── UnitDeployment.tsx          # 배치 UI
│   ├── UnitDeployment.module.css
│   ├── BattleGrid.tsx              # 전투 그리드
│   ├── BattleGrid.module.css
│   ├── GridCell.tsx                # 그리드 셀
│   ├── UnitCard.tsx                # 유닛 카드
│   ├── ActionPanel.tsx             # 액션 패널
│   ├── BattleAnimation.tsx         # 애니메이션
│   └── BattleResult.tsx            # 결과 화면
├── hooks/
│   └── useBattle.ts                # Socket 훅
└── types/
    └── battle.ts                   # 타입 정의
```

---

## 🧪 테스트

```typescript
// __tests__/battle/BattleGrid.test.tsx
describe('BattleGrid', () => {
  it('should render 40x40 grid', () => {
    const { container } = render(<BattleGrid battle={mockBattle} />);
    const cells = container.querySelectorAll('.cell');
    expect(cells).toHaveLength(1600); // 40 x 40
  });
  
  it('should select unit on click', () => {
    const { getByTestId } = render(<BattleGrid battle={mockBattle} />);
    const unit = getByTestId('unit-1');
    fireEvent.click(unit);
    expect(unit).toHaveClass('selected');
  });
  
  it('should submit action', () => {
    const mockSocket = { emit: jest.fn() };
    const { getByText } = render(<BattleGrid battle={mockBattle} socket={mockSocket} />);
    
    // 유닛 선택 → 이동 → 제출
    fireEvent.click(getByTestId('unit-1'));
    fireEvent.click(getByTestId('cell-10-10'));
    fireEvent.click(getByText('확정'));
    
    expect(mockSocket.emit).toHaveBeenCalledWith('battle:submit_action', {
      battleId: 'test',
      unitId: 'unit-1',
      action: { type: 'move', target: { x: 10, y: 10 } }
    });
  });
});
```

---

## 🚀 최적화

### 1. 가상 스크롤
40x40 그리드는 1600개 셀이므로 가상 스크롤 권장
```typescript
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={40}
  columnWidth={20}
  height={800}
  rowCount={40}
  rowWidth={20}
  width={800}
>
  {({ columnIndex, rowIndex, style }) => (
    <GridCell x={columnIndex} y={rowIndex} style={style} />
  )}
</FixedSizeGrid>
```

### 2. 메모이제이션
```typescript
const GridCell = React.memo(({ x, y, terrain, unit }) => {
  // ...
}, (prev, next) => {
  return prev.terrain === next.terrain &&
         prev.unit?.id === next.unit?.id &&
         prev.selected === next.selected;
});
```

### 3. Canvas 렌더링 (대안)
성능이 중요하면 Canvas로 그리드 렌더링
```typescript
import { useEffect, useRef } from 'react';

export function BattleCanvas({ battle }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 그리드 그리기
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 40; x++) {
        const terrain = battle.map.terrain[y][x];
        ctx.fillStyle = getTerrainColor(terrain);
        ctx.fillRect(x * 20, y * 20, 20, 20);
      }
    }
    
    // 유닛 그리기
    for (const unit of battle.units) {
      ctx.fillStyle = unit.side === 'ally' ? 'blue' : 'red';
      ctx.beginPath();
      ctx.arc(unit.position.x * 20 + 10, unit.position.y * 20 + 10, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [battle]);
  
  return <canvas ref={canvasRef} width={800} height={800} />;
}
```

---

## 📚 참고 자료

- [React DnD](https://react-dnd.github.io/react-dnd/) - 드래그 앤 드롭
- [react-window](https://github.com/bvaughn/react-window) - 가상 스크롤
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
