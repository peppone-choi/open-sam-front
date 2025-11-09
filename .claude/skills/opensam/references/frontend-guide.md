# 은하영웅전설 프론트엔드 개발 가이드

## 개요

은하영웅전설 게임의 프론트엔드를 처음부터 구축하는 종합 가이드입니다.

**목표:**
- 매뉴얼 기반 정확한 UI/UX 구현
- 실시간 24배속 게임 진행 지원
- 대규모 함대/유닛 관리
- 복잡한 작전 계획 시스템

**기술 스택:**
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Zustand (상태 관리)
- React Query (서버 상태)
- Socket.io (실시간 통신)

---

## 📋 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [핵심 화면 설계](#핵심-화면-설계)
3. [컴포넌트 아키텍처](#컴포넌트-아키텍처)
4. [상태 관리](#상태-관리)
5. [실시간 시스템](#실시간-시스템)
6. [UI/UX 패턴](#uiux-패턴)
7. [개발 로드맵](#개발-로드맵)

---

## 프로젝트 구조

```
opensam-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/              # 인증 페이지
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (games)/
│   │   │   ├── threekingdoms/   # 삼국지 (기존)
│   │   │   └── logh/            # 은하영웅전설 (신규)
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx     # 메인 대시보드
│   │   │       ├── character/   # 캐릭터 관리
│   │   │       ├── fleet/       # 함대 관리
│   │   │       ├── operation/   # 작전 계획
│   │   │       ├── battle/      # 전술 전투
│   │   │       ├── politics/    # 정치 시스템
│   │   │       ├── logistics/   # 병참 관리
│   │   │       └── map/         # 우주 지도
│   │   └── api/                 # API Routes
│   │
│   ├── components/
│   │   ├── common/              # 공통 컴포넌트
│   │   ├── threekingdoms/       # 삼국지 전용
│   │   └── logh/                # 은하영웅전설 전용
│   │       ├── character/
│   │       │   ├── CharacterCard.tsx
│   │       │   ├── StatsDisplay.tsx
│   │       │   └── RankBadge.tsx
│   │       ├── fleet/
│   │       │   ├── FleetList.tsx
│   │       │   ├── FleetComposition.tsx
│   │       │   ├── ShipCard.tsx
│   │       │   └── FleetFormation.tsx
│   │       ├── operation/
│   │       │   ├── OperationPlan.tsx
│   │       │   ├── OperationList.tsx
│   │       │   └── MeritDisplay.tsx
│   │       ├── battle/
│   │       │   ├── TacticalMap.tsx
│   │       │   ├── BattleControls.tsx
│   │       │   ├── UnitDisplay.tsx
│   │       │   └── CommandCircle.tsx
│   │       ├── map/
│   │       │   ├── GalaxyMap.tsx
│   │       │   ├── GridView.tsx
│   │       │   ├── SystemDetail.tsx
│   │       │   └── NavigationPanel.tsx
│   │       ├── ui/
│   │       │   ├── CommandCard.tsx
│   │       │   ├── ResourceBar.tsx
│   │       │   ├── TimeDisplay.tsx
│   │       │   └── NotificationPanel.tsx
│   │       └── layout/
│   │           ├── GameHeader.tsx
│   │           ├── GameSidebar.tsx
│   │           └── SessionInfo.tsx
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   └── logh/
│   │   │       ├── character.ts
│   │   │       ├── fleet.ts
│   │   │       ├── operation.ts
│   │   │       └── battle.ts
│   │   ├── hooks/
│   │   │   └── logh/
│   │   │       ├── useCharacter.ts
│   │   │       ├── useFleet.ts
│   │   │       ├── useOperation.ts
│   │   │       ├── useGameTime.ts
│   │   │       └── useRealtime.ts
│   │   ├── store/
│   │   │   └── logh/
│   │   │       ├── gameStore.ts
│   │   │       ├── characterStore.ts
│   │   │       ├── fleetStore.ts
│   │   │       └── battleStore.ts
│   │   ├── types/
│   │   │   └── logh/
│   │   │       ├── character.ts
│   │   │       ├── fleet.ts
│   │   │       ├── operation.ts
│   │   │       └── battle.ts
│   │   └── utils/
│   │       └── logh/
│   │           ├── formatters.ts
│   │           ├── validators.ts
│   │           └── calculations.ts
│   │
│   └── styles/
│       ├── globals.css
│       └── logh/
│           ├── theme.css      # 은영전 테마
│           └── animations.css
│
└── public/
    └── images/
        └── logh/
            ├── ships/         # 함선 이미지
            ├── icons/         # 아이콘
            └── backgrounds/   # 배경
```

---

## 핵심 화면 설계

### 1. 메인 대시보드 (Main Dashboard)

**화면 구성:**
```
+----------------------------------------------------------+
| [세션 정보]    게임 시간: 798년 2월 15일 14:23          |
| [알림 패널]    실시간: 2025-11-08 15:30:45    [설정]    |
+----------------------------------------------------------+
| 캐릭터 정보                    | 커맨드 포인트              |
| --------------------------------|---------------------------|
| 이름: 라인하르트               | PCP: 320 / 640            |
| 계급: 제국 원수                | MCP: 480 / 640            |
| 직위: 우주함대사령장관          | 회복: 1h 23m              |
|                                |                           |
| 통솔 95  정치 82  운영 88      |                           |
| 정보 76  지휘 98  기동 94      |                           |
| 공격 96  방어 89               |                           |
+----------------------------------------------------------+
| 함대 현황                                                |
| [함대 1] 제1함대 (18,000척)    작전중: 점령작전 α-7     |
| [함대 2] 제7함대 (15,200척)    대기중                   |
| [함대 3] 수송함대 (6,900척)    보급 이동중              |
+----------------------------------------------------------+
| 작전 현황                      | 빠른 액션                 |
| 진행중 작전: 3                 | [함대 이동]               |
| 대기중 작전: 1                 | [작전 계획]               |
| 공적 포인트: 15,240            | [병참 관리]               |
|                                | [정치 활동]               |
+----------------------------------------------------------+
| 최근 이벤트                                              |
| - 제1함대, 이제르론 요새 근방 도착                      |
| - 작전 "페잔 회랑 점령" 성공 (공적 +850)                |
| - 신형 전함 생산 완료 (500척)                           |
+----------------------------------------------------------+
```

**주요 기능:**
- 실시간 게임 시간 표시 (24배속)
- 캐릭터 상태 한눈에 보기
- 커맨드 포인트 모니터링
- 함대 현황 요약
- 작전 진행 상황
- 이벤트 로그

### 2. 함대 관리 화면 (Fleet Management)

**화면 구성:**
```
+----------------------------------------------------------+
| 함대 관리                                      [새 함대] |
+----------------------------------------------------------+
| 함대 목록                      | 함대 상세 정보            |
| --------------------------------|---------------------------|
| [선택됨] 제1함대               | 함대명: 제1함대           |
| ├─ 사령관: 라인하르트          | 사령관: 라인하르트        |
| ├─ 18,000척                    | 위치: 이제르론 요새       |
| └─ 작전중                       | 항속: 850 / 1000          |
|                                | 사기: 95%                 |
| 제7함대                         |                           |
| ├─ 사령관: 미터마이어          | 함선 구성:                |
| ├─ 15,200척                    | 전함 I: 3,200척           |
| └─ 대기중                       | 고속전함 II: 2,800척      |
|                                | 순항함 III: 4,500척       |
| 수송함대 A                      | 구축함 IV: 5,200척        |
| ├─ 사령관: 슈트라우스          | 전투정모함: 1,800척       |
| ├─ 6,900척                     | 공작함: 500척             |
| └─ 보급중                       |                           |
|                                | 지상부대:                 |
|                                | 장갑척탄병: 50,000명      |
+----------------------------------------------------------+
| [함대 재편성] [함대 이동] [작전 할당] [함대 해산]       |
+----------------------------------------------------------+
```

**주요 기능:**
- 함대 목록 및 상태
- 함선 구성 상세 보기
- 함대 재편성 (할당/재편성 커맨드)
- 함대 이동 (그리드 시스템)
- 작전 할당
- 실시간 위치 추적

### 3. 작전 계획 화면 (Operation Planning)

**화면 구성:**
```
+----------------------------------------------------------+
| 작전 계획                                    [신규 작전] |
+----------------------------------------------------------+
| 작전 목록                      | 작전 상세                 |
| --------------------------------|---------------------------|
| [작전 #124] 점령작전           | 작전명: 페잔 회랑 점령    |
| ├─ 목표: 페잔 회랑            | 작전 종류: 점령작전       |
| ├─ 상태: 진행중               | 계획자: 오베르슈타인      |
| └─ 진행률: 65%                 | 비용: 1,280 MCP           |
|                                |                           |
| [작전 #125] 방위작전           | 목표 성계: 페잔 (X:125, Y:78) |
| ├─ 목표: 이제르론             | 목표 시설:                |
| ├─ 상태: 계획중               | - 페잔 본성 (행성)        |
| └─ 발령 대기                   | - 궤도 기지 3개소         |
|                                |                           |
| [작전 #126] 소탕작전           | 할당 함대:                |
| ├─ 목표: 아스타테 구역         | - 제1함대 (18,000척)      |
| ├─ 상태: 대기                  | - 제7함대 (15,200척)      |
| └─ 미발령                       |                           |
|                                | 예상 공적: 800-1,200      |
|                                | 성공률: 78%               |
+----------------------------------------------------------+
| [작전 수정] [함대 할당] [작전 발령] [작전 취소]         |
+----------------------------------------------------------+
| 작전 진행 타임라인                                       |
| =====[제1함대 이동]=======o[제7함대 합류]======>목표     |
|      (2일)               (4일)           (1일)           |
+----------------------------------------------------------+
```

**주요 기능:**
- 작전 계획 수립 (지휘 커맨드)
- 목표 성계 선택
- 함대 할당 (발령)
- 작전 진행 모니터링
- 성공률 및 예상 공적 표시
- 작전 결과 확인

### 4. 전술 전투 화면 (Tactical Battle)

**화면 구성:**
```
+----------------------------------------------------------+
| 전술 전투 - 페잔 회랑                         [일시정지] |
| 게임 시간: 798년 2월 18일 15:47  (24배속)              |
+----------------------------------------------------------+
|                    전투 지도                              |
|                                                          |
|   [아군]                                    [적군]       |
|    제1함대 ████████                        ██████       |
|    18,000척                                12,500척      |
|    사기: 92%                               사기: 68%     |
|                                                          |
|    제7함대 ██████                                        |
|    15,200척                                              |
|    사기: 95%                                             |
|                                                          |
|    [커맨드 범위 서클]                                    |
|         o━━━━━━━━━o                                     |
|                                                          |
+----------------------------------------------------------+
| 전투 커맨드              | 함대 상태                      |
|--------------------------|--------------------------------|
| [이동]    [선회]         | 제1함대                        |
| [평행이동] [공격명령]    | HP: ████████░░ 85%            |
| [사격명령] [대형변경]    | 손상: 경미                     |
| [퇴각명령] [육전대출격]  | 탄약: ███████░░░ 70%         |
|                          |                                |
| 선택 대형: 횡대진        | 제7함대                        |
| [종대진] [방진]          | HP: ██████████ 100%           |
| [함포전] [기동전]        | 손상: 없음                     |
|                          | 탄약: ██████████ 95%          |
+----------------------------------------------------------+
| 전투 로그                                                |
| - 제1함대, 적 함대에 집중포화 (피해 15%)                |
| - 제7함대, 측면 기동 완료                               |
| - 적 순양함 격파 (350척)                                |
+----------------------------------------------------------+
```

**주요 기능:**
- 실시간 전술 지도
- 함대 이동 및 배치
- 전투 커맨드 입력
- 진형 변경
- HP/탄약 모니터링
- 전투 로그
- 퇴각 시스템 (2.5분 대기)

### 5. 우주 지도 (Galaxy Map)

**화면 구성:**
```
+----------------------------------------------------------+
| 우주 지도                              [확대] [축소]     |
+----------------------------------------------------------+
|                                                          |
|  제국 영역 ░░░░░░░░░░░░░░░░░░░░░░░                    |
|  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                      |
|  ░░░[오딘]░░░[이제르론 요새]░░░░                       |
|  ░░░   ☆    ░░░░░   ◆   ░░░░░░                        |
|  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                         |
|                                                          |
|              [페잔 회랑]                                 |
|                  ▒▒▒▒                                   |
|                                                          |
|  동맹 영역 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                    |
|  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                         |
|  ▓▓[하이네센]▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                          |
|  ▓▓▓   ★   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                            |
|  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                             |
|                                                          |
+----------------------------------------------------------+
| 선택 그리드: (125, 78) - 페잔 회랑                      |
| 그리드 종류: 성계 그리드                                 |
| 소속: 중립                                               |
| 주요 시설: 페잔 본성, 궤도 기지 3                       |
| 인구: 5억 2천만                                          |
| 현재 위치 함대:                                          |
| - 제1함대 (18,000척) - 아군                             |
| - 동맹군 제5함대 (12,500척) - 적군                      |
+----------------------------------------------------------+
| [함대 이동] [성계 정보] [워프 계산]                     |
+----------------------------------------------------------+
```

**주요 기능:**
- 전체 은하 지도 표시
- 그리드 시스템 (공간/성계/항행불능)
- 영역 표시 (제국/동맹/중립)
- 함대 위치 실시간 추적
- 워프 경로 계산
- 성계 정보 조회
- 이동 제한 확인 (최대 300유닛/진영)

### 6. 병참 관리 (Logistics)

**화면 구성:**
```
+----------------------------------------------------------+
| 병참 관리                                                |
+----------------------------------------------------------+
| 생산 현황                      | 자원 현황                 |
|--------------------------------|---------------------------|
| 조병공창                       | 행성 창고 (오딘)          |
| 자동 생산 활성화               | 전함 I: 5,200척           |
|                                | 고속전함 II: 3,800척      |
| 생산 중:                       | 순항함 III: 8,500척       |
| - 전함 I: 500척 (완료 2h)     | 구축함 IV: 12,000척       |
| - 순항함 III: 800척 (완료 3h) | 병사: 580,000명           |
|                                |                           |
| 병력 징집                      | 부대 창고 (제1함대)       |
| 가용 인구: 12억 명             | 전함 I: 3,200척           |
| 징집 가능: 60만 명/월         | 고속전함 II: 2,800척      |
|                                | 순항함 III: 4,500척       |
|                                | 구축함 IV: 5,200척        |
|                                | 병사: 50,000명            |
+----------------------------------------------------------+
| 병참 커맨드                                              |
| [할당] [재편성] [보충] [완전수리] [완전보급]            |
+----------------------------------------------------------+
| 할당 대상 선택                                           |
| 출발: [행성 창고 - 오딘]                                |
| 도착: [부대 창고 - 제1함대]                             |
|                                                          |
| 할당 항목:                                               |
| 전함 I:      [1000] 척 (최대: 5,200척)                  |
| 순항함 III:  [500]  척 (최대: 8,500척)                  |
| 병사:        [10000] 명 (최대: 580,000명)               |
|                                                          |
| [할당 실행] [취소]                                       |
+----------------------------------------------------------+
```

**주요 기능:**
- 자동 생산 모니터링
- 행성 창고 관리
- 부대 창고 관리
- 자원 할당 (할당 커맨드)
- 유닛 재편성
- 손상 유닛 보충
- 완전 수리/보급

---

## 컴포넌트 아키텍처

### 타입 정의

```typescript
// src/lib/types/logh/character.ts
export interface Character {
  id: string;
  no: number;
  name: string;
  type: 'original' | 'generated';
  faction: 'empire' | 'alliance';
  
  // 8가지 파라미터
  stats: {
    leadership: number;    // 통솔
    politics: number;      // 정치
    administration: number; // 운영
    intelligence: number;  // 정보
    command: number;       // 지휘
    mobility: number;      // 기동
    attack: number;        // 공격
    defense: number;       // 방어
  };
  
  rank: Rank;
  position: Position;
  commandPoints: {
    pcp: { current: number; max: number };
    mcp: { current: number; max: number };
    nextRecover: Date;
  };
  
  fleets: string[];  // Fleet IDs
  location: GridCoordinate;
}

// src/lib/types/logh/fleet.ts
export interface Fleet {
  id: string;
  name: string;
  type: 'fleet' | 'transport' | 'patrol' | 'independent';
  commander: string;  // Character ID
  
  maxShips: number;  // 18,000 | 6,900 | 900 | 1
  composition: ShipComposition;
  groundForces: GroundForces;
  
  location: GridCoordinate;
  destination?: GridCoordinate;
  fuel: number;
  morale: number;
  
  status: 'idle' | 'moving' | 'operation' | 'battle';
  currentOperation?: string;  // Operation ID
}

export interface ShipComposition {
  battleship_i: number;
  battleship_ii: number;
  // ... all ship types
}

// src/lib/types/logh/operation.ts
export interface Operation {
  id: string;
  type: 'conquest' | 'defense' | 'sweep';
  name: string;
  planner: string;  // Character ID
  
  target: GridCoordinate;
  targetSystems: string[];
  
  assignedFleets: string[];  // Fleet IDs
  status: 'planning' | 'ordered' | 'active' | 'completed';
  
  progress: number;  // 0-100%
  meritPoints: number;
  successRate: number;
  
  startedAt?: Date;
  completedAt?: Date;
}

// src/lib/types/logh/battle.ts
export interface TacticalBattle {
  id: string;
  location: GridCoordinate;
  participants: BattleParticipant[];
  
  status: 'active' | 'retreat' | 'completed';
  startedAt: Date;
  
  battleLog: BattleEvent[];
}

export interface BattleParticipant {
  fleetId: string;
  faction: 'empire' | 'alliance';
  initialStrength: number;
  currentStrength: number;
  hp: number;
  ammunition: number;
  morale: number;
  formation: Formation;
  position: Vector2D;
}

// src/lib/types/logh/grid.ts
export interface GridCoordinate {
  x: number;
  y: number;
}

export interface Grid {
  coordinate: GridCoordinate;
  type: 'space' | 'system' | 'impassable';
  owner?: 'empire' | 'alliance' | 'neutral';
  
  system?: StarSystem;
  units: GridUnit[];
  hazard?: 'plasma_storm' | 'sargasso';
}

export interface StarSystem {
  id: string;
  name: string;
  planets: Planet[];
  fortresses: Fortress[];
  population: number;
  production: Production;
}
```

### 상태 관리 (Zustand)

```typescript
// src/lib/store/logh/gameStore.ts
import { create } from 'zustand';

interface GameState {
  // 게임 시간
  gameTime: Date;
  realTime: Date;
  timeSpeed: number;  // 24x
  
  // 세션 정보
  sessionId: string;
  sessionStartedAt: Date;
  maxPlayers: number;
  currentPlayers: number;
  
  // 현재 플레이어
  playerId: string;
  characterId: string;
  faction: 'empire' | 'alliance';
  
  // UI 상태
  selectedFleet?: string;
  selectedOperation?: string;
  selectedGrid?: GridCoordinate;
  
  // 알림
  notifications: Notification[];
  
  // Actions
  updateGameTime: (gameTime: Date, realTime: Date) => void;
  selectFleet: (fleetId: string) => void;
  selectOperation: (operationId: string) => void;
  selectGrid: (coord: GridCoordinate) => void;
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameTime: new Date(),
  realTime: new Date(),
  timeSpeed: 24,
  
  sessionId: '',
  sessionStartedAt: new Date(),
  maxPlayers: 2000,
  currentPlayers: 0,
  
  playerId: '',
  characterId: '',
  faction: 'empire',
  
  notifications: [],
  
  updateGameTime: (gameTime, realTime) => set({ gameTime, realTime }),
  selectFleet: (fleetId) => set({ selectedFleet: fleetId }),
  selectOperation: (operationId) => set({ selectedOperation: operationId }),
  selectGrid: (coord) => set({ selectedGrid: coord }),
  addNotification: (notification) => 
    set((state) => ({ 
      notifications: [...state.notifications, notification] 
    })),
  clearNotifications: () => set({ notifications: [] }),
}));

// src/lib/store/logh/fleetStore.ts
interface FleetState {
  fleets: Record<string, Fleet>;
  loading: boolean;
  error: string | null;
  
  // Actions
  setFleets: (fleets: Fleet[]) => void;
  updateFleet: (fleetId: string, updates: Partial<Fleet>) => void;
  moveFleet: (fleetId: string, destination: GridCoordinate) => void;
  reorganizeFleet: (fleetId: string, composition: ShipComposition) => void;
}

export const useFleetStore = create<FleetState>((set) => ({
  fleets: {},
  loading: false,
  error: null,
  
  setFleets: (fleets) => 
    set({ 
      fleets: fleets.reduce((acc, fleet) => ({ 
        ...acc, 
        [fleet.id]: fleet 
      }), {}) 
    }),
  
  updateFleet: (fleetId, updates) =>
    set((state) => ({
      fleets: {
        ...state.fleets,
        [fleetId]: { ...state.fleets[fleetId], ...updates }
      }
    })),
  
  moveFleet: async (fleetId, destination) => {
    // API 호출 로직
    set((state) => ({
      fleets: {
        ...state.fleets,
        [fleetId]: { 
          ...state.fleets[fleetId], 
          destination,
          status: 'moving'
        }
      }
    }));
  },
  
  reorganizeFleet: async (fleetId, composition) => {
    // API 호출 로직
    set((state) => ({
      fleets: {
        ...state.fleets,
        [fleetId]: { 
          ...state.fleets[fleetId], 
          composition
        }
      }
    }));
  }
}));
```

### React Query 훅

```typescript
// src/lib/hooks/logh/useCharacter.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as characterApi from '@/lib/api/logh/character';

export function useCharacter(characterId: string) {
  return useQuery({
    queryKey: ['character', characterId],
    queryFn: () => characterApi.getCharacter(characterId),
    staleTime: 30000,  // 30초
  });
}

export function useCharacters(faction: 'empire' | 'alliance') {
  return useQuery({
    queryKey: ['characters', faction],
    queryFn: () => characterApi.getCharacters(faction),
    staleTime: 60000,  // 1분
  });
}

export function useUpdateStats() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      characterId, 
      stat, 
      amount 
    }: { 
      characterId: string; 
      stat: string; 
      amount: number 
    }) => characterApi.updateStat(characterId, stat, amount),
    
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['character', variables.characterId] 
      });
    }
  });
}

// src/lib/hooks/logh/useFleet.ts
export function useFleets(characterId: string) {
  return useQuery({
    queryKey: ['fleets', characterId],
    queryFn: () => fleetApi.getFleets(characterId),
    staleTime: 10000,  // 10초 (실시간성 중요)
  });
}

export function useMoveFleet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      fleetId, 
      destination 
    }: { 
      fleetId: string; 
      destination: GridCoordinate 
    }) => fleetApi.moveFleet(fleetId, destination),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleets'] });
      queryClient.invalidateQueries({ queryKey: ['grids'] });
    }
  });
}

// src/lib/hooks/logh/useGameTime.ts
export function useGameTime() {
  const { gameTime, realTime, updateGameTime } = useGameStore();
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = now.getTime() - realTime.getTime();
      const gameElapsed = elapsed * 24;  // 24배속
      
      const newGameTime = new Date(gameTime.getTime() + gameElapsed);
      updateGameTime(newGameTime, now);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameTime, realTime, updateGameTime]);
  
  return { gameTime, realTime };
}
```

### 실시간 통신 (Socket.io)

```typescript
// src/lib/hooks/logh/useRealtime.ts
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/lib/store/logh/gameStore';
import { useFleetStore } from '@/lib/store/logh/fleetStore';

let socket: Socket | null = null;

export function useRealtime() {
  const { sessionId, characterId, addNotification } = useGameStore();
  const { updateFleet } = useFleetStore();
  
  useEffect(() => {
    if (!sessionId || !characterId) return;
    
    // Socket 연결
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      query: { sessionId, characterId }
    });
    
    // 게임 시간 업데이트
    socket.on('time:update', (data: { gameTime: string; realTime: string }) => {
      useGameStore.getState().updateGameTime(
        new Date(data.gameTime),
        new Date(data.realTime)
      );
    });
    
    // 함대 위치 업데이트
    socket.on('fleet:moved', (data: { fleetId: string; location: GridCoordinate }) => {
      updateFleet(data.fleetId, { location: data.location });
    });
    
    // 전투 시작
    socket.on('battle:started', (data: { battleId: string; fleetIds: string[] }) => {
      addNotification({
        type: 'battle',
        message: '전투가 시작되었습니다!',
        battleId: data.battleId
      });
    });
    
    // 작전 완료
    socket.on('operation:completed', (data: { 
      operationId: string; 
      success: boolean;
      meritPoints: number;
    }) => {
      addNotification({
        type: 'operation',
        message: `작전 완료! 공적 포인트 +${data.meritPoints}`,
        operationId: data.operationId
      });
    });
    
    // 이벤트 알림
    socket.on('event:notification', (data: Notification) => {
      addNotification(data);
    });
    
    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [sessionId, characterId]);
  
  // 이벤트 전송 함수들
  return {
    emitMoveFleet: (fleetId: string, destination: GridCoordinate) => {
      socket?.emit('fleet:move', { fleetId, destination });
    },
    
    emitBattleCommand: (battleId: string, command: BattleCommand) => {
      socket?.emit('battle:command', { battleId, command });
    },
    
    emitOperationOrder: (operationId: string, fleetIds: string[]) => {
      socket?.emit('operation:order', { operationId, fleetIds });
    }
  };
}
```

---

## UI/UX 패턴

### 테마 및 스타일

```css
/* src/styles/logh/theme.css */
:root {
  /* 제국 테마 */
  --logh-empire-primary: #1a1a2e;
  --logh-empire-secondary: #16213e;
  --logh-empire-accent: #e94560;
  --logh-empire-gold: #f4a261;
  
  /* 동맹 테마 */
  --logh-alliance-primary: #0f3460;
  --logh-alliance-secondary: #16213e;
  --logh-alliance-accent: #00b4d8;
  --logh-alliance-gold: #90e0ef;
  
  /* 공통 */
  --logh-text-primary: #e8e8e8;
  --logh-text-secondary: #b8b8b8;
  --logh-border: #2d3748;
  --logh-background: #0a0e27;
  
  /* 상태 색상 */
  --logh-success: #10b981;
  --logh-warning: #f59e0b;
  --logh-danger: #ef4444;
  --logh-info: #3b82f6;
}

/* 우주 배경 효과 */
.logh-space-background {
  background: radial-gradient(ellipse at center, #0a0e27 0%, #000000 100%);
  position: relative;
}

.logh-space-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(2px 2px at 20px 30px, white, transparent),
    radial-gradient(2px 2px at 60px 70px, white, transparent),
    radial-gradient(1px 1px at 50px 50px, white, transparent),
    radial-gradient(1px 1px at 130px 80px, white, transparent);
  background-size: 200px 200px;
  animation: space-stars 200s linear infinite;
}

@keyframes space-stars {
  from { transform: translateX(0); }
  to { transform: translateX(-200px); }
}

/* 커맨드 카드 스타일 */
.logh-command-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid var(--logh-border);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.logh-command-card:hover {
  border-color: var(--logh-empire-accent);
  box-shadow: 0 6px 12px rgba(233, 69, 96, 0.2);
  transform: translateY(-2px);
}

/* 함대 아이콘 */
.logh-fleet-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, #e94560 0%, #1a1a2e 100%);
  border: 2px solid var(--logh-empire-gold);
  border-radius: 50%;
  font-size: 18px;
  font-weight: bold;
  color: white;
  box-shadow: 0 0 10px rgba(233, 69, 96, 0.5);
}

/* 리소스 바 */
.logh-resource-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.logh-resource-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #e94560 0%, #f4a261 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}
```

### 반응형 컴포넌트 예시

```typescript
// src/components/logh/character/CharacterCard.tsx
'use client';

import { Character } from '@/lib/types/logh/character';
import { RankBadge } from './RankBadge';
import { StatsDisplay } from './StatsDisplay';

interface CharacterCardProps {
  character: Character;
  onSelect?: (character: Character) => void;
}

export function CharacterCard({ character, onSelect }: CharacterCardProps) {
  return (
    <div 
      className="logh-command-card cursor-pointer"
      onClick={() => onSelect?.(character)}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-logh-text-primary">
            {character.name}
          </h3>
          <p className="text-sm text-logh-text-secondary">
            {character.position.name}
          </p>
        </div>
        <RankBadge rank={character.rank} faction={character.faction} />
      </div>
      
      {/* 커맨드 포인트 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-logh-text-secondary">PCP</span>
            <span className="text-sm font-medium">
              {character.commandPoints.pcp.current} / {character.commandPoints.pcp.max}
            </span>
          </div>
          <div className="logh-resource-bar">
            <div 
              className="logh-resource-bar-fill bg-blue-500"
              style={{ 
                width: `${(character.commandPoints.pcp.current / character.commandPoints.pcp.max) * 100}%` 
              }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-logh-text-secondary">MCP</span>
            <span className="text-sm font-medium">
              {character.commandPoints.mcp.current} / {character.commandPoints.mcp.max}
            </span>
          </div>
          <div className="logh-resource-bar">
            <div 
              className="logh-resource-bar-fill bg-red-500"
              style={{ 
                width: `${(character.commandPoints.mcp.current / character.commandPoints.mcp.max) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
      
      {/* 능력치 */}
      <StatsDisplay stats={character.stats} compact />
      
      {/* 함대 정보 */}
      <div className="mt-4 pt-4 border-t border-logh-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-logh-text-secondary">보유 함대</span>
          <span className="font-medium">{character.fleets.length}개</span>
        </div>
      </div>
    </div>
  );
}

// src/components/logh/character/StatsDisplay.tsx
interface StatsDisplayProps {
  stats: Character['stats'];
  compact?: boolean;
}

export function StatsDisplay({ stats, compact }: StatsDisplayProps) {
  const statNames = {
    leadership: '통솔',
    politics: '정치',
    administration: '운영',
    intelligence: '정보',
    command: '지휘',
    mobility: '기동',
    attack: '공격',
    defense: '방어'
  };
  
  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className="text-xs text-logh-text-secondary mb-1">
              {statNames[key as keyof typeof statNames]}
            </div>
            <div className="text-lg font-bold">{value}</div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {Object.entries(stats).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-sm text-logh-text-secondary">
            {statNames[key as keyof typeof statNames]}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-32 logh-resource-bar">
              <div 
                className="logh-resource-bar-fill"
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-sm font-medium w-8 text-right">{value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// src/components/logh/fleet/FleetCard.tsx
interface FleetCardProps {
  fleet: Fleet;
  onSelect?: (fleet: Fleet) => void;
}

export function FleetCard({ fleet, onSelect }: FleetCardProps) {
  const totalShips = Object.values(fleet.composition).reduce((a, b) => a + b, 0);
  
  return (
    <div 
      className="logh-command-card cursor-pointer"
      onClick={() => onSelect?.(fleet)}
    >
      <div className="flex items-start gap-4">
        <div className="logh-fleet-icon">
          {fleet.type === 'fleet' ? 'F' : 
           fleet.type === 'transport' ? 'T' : 
           fleet.type === 'patrol' ? 'P' : 'I'}
        </div>
        
        <div className="flex-1">
          <h4 className="text-lg font-bold mb-1">{fleet.name}</h4>
          <p className="text-sm text-logh-text-secondary mb-2">
            사령관: {fleet.commander}
          </p>
          
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-logh-text-secondary">척수: </span>
              <span className="font-medium">{totalShips.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-logh-text-secondary">항속: </span>
              <span className="font-medium">{fleet.fuel}</span>
            </div>
            <div>
              <span className="text-logh-text-secondary">사기: </span>
              <span className="font-medium">{fleet.morale}%</span>
            </div>
          </div>
          
          <div className="mt-2">
            <StatusBadge status={fleet.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 개발 로드맵

### Phase 1: 기초 설정 (1주)
- [ ] Next.js 프로젝트 생성
- [ ] 디렉토리 구조 설정
- [ ] Tailwind CSS + 테마 설정
- [ ] 타입 정의 작성
- [ ] 기본 레이아웃 구성

### Phase 2: 인증 및 캐릭터 (1-2주)
- [ ] 로그인/회원가입 페이지
- [ ] 캐릭터 생성 페이지
- [ ] 캐릭터 선택 화면
- [ ] 캐릭터 카드 컴포넌트
- [ ] 능력치 표시 컴포넌트

### Phase 3: 메인 대시보드 (2주)
- [ ] 게임 시간 시스템
- [ ] 커맨드 포인트 표시
- [ ] 함대 현황 요약
- [ ] 작전 현황 요약
- [ ] 이벤트 로그
- [ ] 알림 시스템

### Phase 4: 함대 관리 (2-3주)
- [ ] 함대 목록 페이지
- [ ] 함대 상세 정보
- [ ] 함선 구성 표시
- [ ] 함대 재편성 UI
- [ ] 함대 이동 인터페이스
- [ ] 지상부대 관리

### Phase 5: 우주 지도 (2-3주)
- [ ] 그리드 시스템 구현
- [ ] 은하 지도 렌더링
- [ ] 영역 표시 (제국/동맹)
- [ ] 함대 위치 추적
- [ ] 워프 경로 계산
- [ ] 성계 상세 정보

### Phase 6: 작전 계획 (2주)
- [ ] 작전 목록 페이지
- [ ] 작전 계획 생성 UI
- [ ] 목표 성계 선택
- [ ] 함대 할당 인터페이스
- [ ] 작전 진행 모니터링
- [ ] 작전 결과 표시

### Phase 7: 전술 전투 (3-4주)
- [ ] 전투 지도 렌더링
- [ ] 유닛 표시 및 이동
- [ ] 전투 커맨드 UI
- [ ] 진형 변경 시스템
- [ ] HP/탄약 표시
- [ ] 전투 로그
- [ ] 퇴각 시스템

### Phase 8: 병참 관리 (1-2주)
- [ ] 생산 현황 페이지
- [ ] 행성 창고 관리
- [ ] 부대 창고 관리
- [ ] 자원 할당 UI
- [ ] 재편성 인터페이스
- [ ] 수리/보급 시스템

### Phase 9: 정치 시스템 (1-2주)
- [ ] 인사 커맨드 UI
- [ ] 승진/강등 시스템
- [ ] 직위 임명
- [ ] 정치 활동
- [ ] 외교 (향후)

### Phase 10: 실시간 시스템 (2주)
- [ ] Socket.io 연결
- [ ] 실시간 게임 시간
- [ ] 함대 위치 동기화
- [ ] 전투 상태 동기화
- [ ] 이벤트 알림
- [ ] 작전 결과 푸시

### Phase 11: 최적화 및 테스트 (2-3주)
- [ ] 성능 최적화
- [ ] 메모리 누수 해결
- [ ] 대량 데이터 처리
- [ ] 모바일 반응형
- [ ] 크로스 브라우저 테스트
- [ ] E2E 테스트

**총 예상 기간: 18-25주 (약 4-6개월)**

---

## 다음 단계

1. **즉시 시작 가능:**
   - Phase 1 기초 설정 시작
   - 타입 정의 작성
   - 매뉴얼 참조하여 정확한 수치 확인

2. **우선 구현 항목:**
   - 캐릭터 시스템 (8가지 파라미터)
   - 커맨드 포인트 시스템
   - 게임 시간 (24배속)

3. **참고 자료:**
   - 업로드된 은하영웅전설 매뉴얼
   - 기존 삼국지 프론트엔드 패턴
   - 백엔드 API 엔드포인트

이 가이드를 따라 단계적으로 구현하면 매뉴얼에 충실한 은하영웅전설 프론트엔드를 완성할 수 있습니다!
