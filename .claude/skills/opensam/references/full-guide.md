# OpenSAM 통합 개발 가이드

## 개요
OpenSAM 프로젝트를 위한 종합 개발 가이드입니다. 이 프로젝트는 여러 전략 게임을 지원하는 범용 게임 엔진을 구축합니다.

**지원 게임:**
1. **삼국지** - 역사 기반 정치 전략 게임
2. **은하영웅전설** - SF 우주 전략 게임
3. **중세 판타지** - 판타지 전략 게임 (향후)

**기술 스택:**
- 백엔드: Node.js + TypeScript + MongoDB/Mongoose
- 프론트엔드: Next.js + TypeScript
- 레거시: PHP + Knex/SQL (마이그레이션 중)

**작업 경로:** `/mnt/d/opensam/open-sam-backend/`

**작업 방침:**
- ✅ **자율적으로 작업 수행**: 한 턴만 하고 멈추지 말 것
- ✅ **다음 할 일 자동 파악**: 작업 완료 후 스스로 다음 작업 찾기
- ✅ **연속 실행**: 사용자가 멈추라고 할 때까지 계속 진행
- ✅ **진행 상황 보고**: 각 단계마다 무엇을 했는지 간략히 보고
- ❌ **매번 물어보지 않기**: "다음에 X를 할까요?" 같은 질문 금지

**작업 흐름 예시:**
```
1. TypeScript 에러 100개 수정 완료
   → 바로 다음 100개 수정 시작
   
2. 함대 관리 컴포넌트 완성
   → 바로 작전 계획 컴포넌트 작업 시작
   
3. 10개 커맨드 JSON 변환 완료
   → 바로 다음 10개 변환 시작
```

---

## 📋 목차

1. [프로젝트별 참조 규칙](#프로젝트별-참조-규칙)
2. [핵심 설계 원칙](#핵심-설계-원칙)
3. [게임 시스템 문서](#게임-시스템-문서)
4. [백엔드 아키텍처](#백엔드-아키텍처)
5. [TypeScript 마이그레이션](#typescript-마이그레이션)
6. [범용 엔진 개발](#범용-엔진-개발)
7. [프론트엔드 개발](#프론트엔드-개발)
8. [개발 워크플로우](#개발-워크플로우)

---

## 프로젝트별 참조 규칙

### 삼국지 프로젝트

**참조 우선순위:**
1. **웹 검색 우선** - 역사적 사실, 인물 정보, 기존 게임 메카닉
2. **PHP 레거시 코드** - 기존 구현 패턴 참조
3. **일반 지식** - 역사 및 게임 디자인 지식

**가이드라인:**
```
✓ "웹 검색 결과에 따르면, 조조의 초기 능력치는..."
✓ "PHP 레거시 코드에서는 이렇게 구현되어 있습니다..."
✗ "제 생각에는..." (출처 없이)
```

### 은하영웅전설 프로젝트

**참조 우선순위:**
1. **업로드된 매뉴얼 최우선** - 일본어 게임 매뉴얼(銀河英雄伝説Ⅶ)
2. **원작 소설 지식** - 다나카 요시키 소설
3. **추론** - 문서 불명확 시에만

**가이드라인:**
```
✓ "매뉴얼 38페이지에 따르면..."
✓ "업로드된 문서의 작전계획 시스템에서는..."
✗ "아마도..." (문서 확인 가능할 때)
```

**중요:** 다음 항목은 반드시 문서 확인 후 답변
- 게임 메카닉과 시스템
- 군 조직과 계층구조
- 함대 편성과 유닛 타입
- 전투 시스템 (전략/전술)
- 캐릭터 파라미터와 성장
- 세션 관리와 승리 조건

---

## 핵심 설계 원칙

### 1. 세계 독립적 설계 (World-Agnostic)

코드는 **어떤 세계관**에서도 작동해야 합니다.

```typescript
// ❌ 나쁜 예: 세계 특정
interface General {
  soldiers: number;
  horse: string;  // 삼국지 전용
}

// ✅ 좋은 예: 세계 독립적
interface ICommander {
  worldType: string;
  stats: Record<string, number>;
  specificData: Record<string, any>;  // 세계별 데이터 격리
}
```

### 2. 스케일 독립적 설계 (Scale-Agnostic)

코드는 **모든 규모**에서 작동해야 합니다.

```typescript
// ❌ 나쁜 예: 고정 스케일
const MAX_SOLDIERS = 20000;

// ✅ 좋은 예: 스케일 독립적
interface IMilitaryUnit {
  scaleLevel: number;       // 1~10
  actualCount: number;      // 5 또는 5,000,000
  unitTypeId: string;       // 'infantry' | 'battleship'
}
```

**스케일 레벨 예시:**
- 레벨 1: 소규모 (5-50 유닛)
- 레벨 5: 중규모 군대 (1,000-10,000) ← 삼국지 기본값
- 레벨 10: 은하 함대 (수백만 유닛)

### 3. 설정 기반 설계 (Configuration-Driven)

모든 게임 로직은 JSON 설정에 있어야 합니다.

```typescript
// ❌ 나쁜 예: 하드코딩
function calculateEffect() {
  return leadership * 0.6 + strength * 0.4;
}

// ✅ 좋은 예: JSON 설정
// config/worlds/threekingdoms/actions.json
{
  "effects": [{
    "formula": "stats.leadership * 0.6 + stats.strength * 0.4"
  }]
}
```

### 작업 전 체크리스트

코드 작성 전 **반드시 확인:**

- [ ] 다른 세계관에서도 작동하는가?
- [ ] 스케일이 1000배 증가해도 작동하는가?
- [ ] 설정 파일로 이동 가능한가?
- [ ] 세계별 데이터가 `specificData`에 있는가?
- [ ] 함수가 `worldType` 파라미터를 받는가?

---

## 게임 시스템 문서

### 은하영웅전설 - 주요 시스템

#### 1. 세션 시스템
- 세션당 최대 2000명
- 실시간 진행: 1초 = 24초 (24배속)
- 승리 조건 달성 시 종료

#### 2. 시간 흐름
```
실시간 → 게임 시간
1초 → 24초
60초 → 24분
60분 → 24시간
24시간 → 24일
```

#### 3. 캐릭터 파라미터
- 통솔 (統率): 인재 활용, 함대 사기, 징세
- 정치 (政治): 정치적 영향력, 시민 지지
- 운영 (運営): 업무 관리 능력
- 정보 (情報): 정보 수집 및 분석
- 지휘 (指揮): 부대 지휘 반응속도
- 기동 (機動): 함대 기동성
- 공격 (攻撃): 공격 능력
- 방어 (防御): 방어 능력

#### 4. 계급 시스템
**제국군:**
- 원수 (5명) → 상급대장 (5명) → 대장 (10명) → 중장 (20명) → 소장 (40명) → 준장 (80명)

**동맹군:**
- 원수 (5명) → 대장 (10명) → 중장 (20명) → 소장 (40명) → 준장 (80명)

#### 5. 커맨드 시스템
**커맨드 종류:**
- 개인 커맨드: 이동, 개인 행동
- 지휘 커맨드: 작전 계획, 함대 편성
- 병참 커맨드: 보급, 수리, 유닛 할당
- 인사 커맨드: 승진, 강등, 임명
- 정치 커맨드: 국가 정책, 과세
- 첩보 커맨드: 수사, 체포, 간첩 활동

**커맨드 포인트:**
- PCP (정치): 정치/행정 행동
- MCP (군사): 군사 작전
- 회복: 게임 시간 2시간마다 (실시간 5분)

#### 6. 함대 및 유닛
**함대 종류:**
- 함대: 최대 18,000척
- 수송함대: 최대 6,900척
- 순찰대: 최대 900척
- 독행함: 단일 기함

**함선 종류 (제국군):**
- 전함 (8 변형)
- 고속전함 (8 변형)
- 순항함 (8 변형)
- 구축함 (8 변형 + 정찰형)
- 전투정모함 (4 변형)
- 뇌격정모함 (4 변형, 제국 전용)
- 공작함 (4 변형)
- 수송함 (4 변형)
- 병원수송함 (4 변형)
- 양륙함 (4 변형)

#### 7. 작전 계획
**작전 종류:**
- 점령작전: 적 성계 점령
- 방위작전: 성계 통제 유지
- 소탕작전: 독행함 제거

**계획 프로세스:**
1. 작전계획 수립
2. 부대 할당
3. 작전 실행
4. 결과 평가 및 공적 부여

#### 8. 승리 조건
- **결정적 승리**: 인구 90%+ 통제, 함선 10:1 우세
- **한정적 승리**: 적 수도 점령
- **국지적 승리**: 시간 종료 시 인구 우위
- **패배**: 모든 조건 미달성

### 삼국지 - 주요 시스템

#### 캐릭터 시스템
- 역사적 인물들
- 능력치: 무력, 지력, 정치, 통솔력, 매력
- 관계도와 충성도

#### 영토 관리
- 도시 통제 및 개발
- 자원 생산과 과세
- 군사 유닛 징병

#### 외교 시스템
- 동맹 및 배신
- 혼인 동맹
- 조공과 종속

---

## 백엔드 아키텍처

### 디렉토리 구조

```
src/
├── engine/                    # ✅ 범용 엔진 (완료)
│   ├── core/
│   │   └── Calculator.ts      # 수식 계산기
│   ├── systems/
│   │   ├── ModifierSystem.ts  # 수정자 시스템
│   │   └── ActionSystem.ts    # 액션 시스템
│   └── types/
│       └── index.ts           # 범용 인터페이스
│
├── commands/                  # ⚠️ 마이그레이션 필요
│   ├── general/               # 삼국지 전용 → JSON 변환
│   └── nation/
│
├── models/                    # ⚠️ 마이그레이션 필요
│   ├── general.model.ts       # → ICommander
│   └── city.model.ts          # → IStrategicLocation
│
├── repositories/              # ✅ 생성 중
│   ├── base.repository.ts
│   ├── general.repository.ts
│   └── city.repository.ts
│
├── adapters/                  # ✅ 생성 중
│   └── general.adapter.ts     # 레거시 → 범용 인터페이스
│
└── const/                     # ⚠️ 마이그레이션 필요
    └── GameUnitConst.ts       # → JSON

config/worlds/
├── threekingdoms/             # ✅ 생성됨
│   ├── world.json
│   ├── stats.json
│   ├── resources.json
│   ├── unit-types.json
│   ├── nation-types.json
│   └── actions.json
└── galactic/                  # 🔜 향후
    └── ...
```

### 핵심 인터페이스

#### ICommander (범용 지휘관)
```typescript
interface ICommander {
  worldType: string;              // 'threekingdoms' | 'galactic'
  id: string;
  scaleLevel: number;             // 1-10
  stats: Record<string, number>;  // 능력치
  resources: Record<string, number>;
  specificData: Record<string, any>;  // 세계별 데이터
  
  getStatValue(statName: string): number;
  getResourceValue(resourceName: string): number;
}
```

#### IStrategicLocation (범용 전략 거점)
```typescript
interface IStrategicLocation {
  worldType: string;
  id: string;
  locationType: string;           // 'city' | 'planet' | 'fortress'
  scaleLevel: number;
  resources: Record<string, number>;
  specificData: Record<string, any>;
}
```

#### IMilitaryUnit (범용 군사 유닛)
```typescript
interface IMilitaryUnit {
  scaleLevel: number;
  actualCount: number;
  unitTypeId: string;
  effectiveStrength: number;
  displayCount: string;           // "5K", "2.5M"
}
```

### Mongoose + TypeScript 패턴

#### 모델 정의
```typescript
import { Schema, model, Document, Types } from 'mongoose';

// 데이터 인터페이스
export interface IGeneralData {
  nation: Types.ObjectId;
  name: string;
  gold: number;
  rice: number;
  leadership: number;
  strength: number;
  intelligence: number;
}

// 문서 인터페이스
export interface IGeneral extends Document {
  no: number;
  data: IGeneralData;
  var: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// 스키마
const generalSchema = new Schema<IGeneral>({
  no: { type: Number, required: true, unique: true },
  data: {
    nation: { type: Schema.Types.ObjectId, ref: 'Nation' },
    name: { type: String, required: true },
    gold: { type: Number, default: 0 },
    rice: { type: Number, default: 0 },
    leadership: { type: Number, default: 50 },
    strength: { type: Number, default: 50 },
    intelligence: { type: Number, default: 50 }
  },
  var: { type: Map, of: Schema.Types.Mixed }
}, { timestamps: true });

export const General = model<IGeneral>('General', generalSchema);
```

#### 리포지토리 패턴
```typescript
import { FilterQuery, UpdateQuery } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  constructor(protected model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findMany(filter: FilterQuery<T>): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>
  ): Promise<{ modifiedCount: number }> {
    const result = await this.model.updateMany(filter, update).exec();
    return { modifiedCount: result.modifiedCount };
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return doc.save();
  }

  async deleteMany(filter: FilterQuery<T>): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany(filter).exec();
    return { deletedCount: result.deletedCount };
  }
}

// 사용 예
export class GeneralRepository extends BaseRepository<IGeneral> {
  constructor() {
    super(General);
  }

  async findByNation(nationId: string): Promise<IGeneral[]> {
    return this.findMany({ 'data.nation': nationId });
  }

  async updateGold(generalId: string, gold: number): Promise<IGeneral | null> {
    return this.updateById(generalId, { $set: { 'data.gold': gold } });
  }
}
```

---

## TypeScript 마이그레이션

### 현재 상태
- TypeScript 에러: ~1,195개
- 레거시 `db.table()` 호출: 다수
- 마이그레이션 목표: 타입 안전성 확보

### 우선순위별 해결

#### 우선순위 1: 기초 타입 정의 (1주차)
```bash
# 에러 분석
npx tsc --noEmit > type-errors.txt 2>&1
grep "error TS" type-errors.txt | wc -l
```

**해야 할 일:**
- [ ] 모든 Mongoose 인터페이스 정의
- [ ] BaseRepository 제네릭 수정
- [ ] 모든 모델에 리포지토리 구현
- [ ] 배럴 파일(index.ts) 생성

#### 우선순위 2: 레거시 코드 변환 (2주차)
**레거시 db.table() → 리포지토리 변환:**

```typescript
// ❌ 레거시 (Knex)
await db.table('general')
  .where('nation', nationId)
  .update({ gold: newGold });

// ✅ 리포지토리
await generalRepository.updateMany(
  { 'data.nation': nationId },
  { $set: { 'data.gold': newGold } }
);
```

**변환 단계:**
1. 테이블명 식별 → 리포지토리 찾기
2. WHERE 절 → MongoDB 필터 쿼리
3. UPDATE/INSERT → 리포지토리 메서드
4. 반환 값 처리 → 타입 지정

#### 우선순위 3: 타입 에러 해결 (3주차)

**Null 안정성 (~400개 에러):**
```typescript
// ❌ 에러
const gold = general.data.gold;

// ✅ 수정 1: Null 체크
if (!general) throw new Error('Not found');
const gold = general.data.gold;

// ✅ 수정 2: 옵셔널 체이닝
const gold = general?.data.gold ?? 0;
```

**타입 불일치 (~500개 에러):**
```typescript
// ❌ ObjectId → string
const id: string = general._id;

// ✅ 변환
const id: string = general._id.toString();

// ❌ 제네릭 누락
const doc: Document = await Model.findById(id);

// ✅ 제네릭 명시
const doc: IGeneral | null = await Model.findById(id);
```

**Request 타입 확장 (~200개 에러):**
```typescript
import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    nationNo: number;
  };
  general?: IGeneral;
}

// 사용
app.get('/api/general', (req: AuthRequest, res) => {
  const general = req.general;  // ✅ 타입 안전
});
```

### 마이그레이션 체크리스트

#### 1주차: 기초
- [ ] Mongoose 인터페이스 정의 (`models/types/`)
- [ ] BaseRepository 생성
- [ ] 모든 모델 리포지토리 구현
- [ ] 배럴 파일 생성

#### 2주차: 변환
- [ ] `db.table()` 호출 수 파악: `grep -r "db.table" src/ | wc -l`
- [ ] 영향도 높은 파일 식별
- [ ] 파일별 변환 (하루 50개)
- [ ] 변환 후 테스트

#### 3주차: 타입 해결
- [ ] Null 안정성 에러 수정
- [ ] 타입 불일치 수정
- [ ] Request 타입 확장

#### 4주차: 정리
- [ ] 빌드 성공: `npm run build`
- [ ] TypeScript 에러 0개
- [ ] `as any` 제거
- [ ] 테스트 통과

### 진행 추적
```bash
# 일일 진행 추적
echo "$(date): $(grep -c 'error TS' errors.txt) errors" >> progress.log

# 진행 상황 보기
cat progress.log
```

---

## 범용 엔진 개발

### JSON 액션 정의

#### 템플릿
```json
{
  "action_id": {
    "id": "action_id",
    "name": "액션 표시명",
    "description": "액션 설명",
    "category": "domestic|military|diplomatic",
    "requirements": {
      "location_type": "city|battlefield",
      "min_population": 1000,
      "required_stats": {
        "leadership": 50
      }
    },
    "costs": {
      "gold": 100,
      "rice": 50,
      "turns": 1
    },
    "effects": [
      {
        "target": "location.agriculture",
        "formula": "stats.politics * 0.7 + stats.leadership * 0.3",
        "min": 1,
        "max": 100
      }
    ],
    "experience_gain": [
      { "stat": "politics", "amount": 2 },
      { "stat": "leadership", "amount": 1 }
    ],
    "successRate": {
      "base": 0.8,
      "formula": "0.8 + (stats.politics / 200)"
    },
    "cooldown": 0,
    "repeatable": true
  }
}
```

### TypeScript 커맨드 → JSON 변환

#### BEFORE (TypeScript):
```typescript
export async function agriculture(general: General, city: City) {
  // 요구사항
  if (city.population < 1000) throw new Error('인구 부족');
  if (general.politics < 30) throw new Error('정치력 부족');
  
  // 비용
  general.gold -= 100;
  city.rice -= 50;
  general.turn--;
  
  // 효과
  const effect = general.politics * 0.7 + general.leadership * 0.3;
  city.agriculture += effect;
  
  // 경험치
  general.politics++;
  general.leadership++;
}
```

#### AFTER (JSON):
```json
{
  "agriculture": {
    "id": "agriculture",
    "name": "농업 개발",
    "category": "domestic",
    "requirements": {
      "location_type": "city",
      "min_population": 1000,
      "required_stats": {
        "politics": 30
      }
    },
    "costs": {
      "gold": 100,
      "rice": 50,
      "turns": 1
    },
    "effects": [
      {
        "target": "location.agriculture",
        "formula": "stats.politics * 0.7 + stats.leadership * 0.3"
      }
    ],
    "experience_gain": [
      { "stat": "politics", "amount": 1 },
      { "stat": "leadership", "amount": 1 }
    ]
  }
}
```

### 어댑터 패턴

레거시 모델을 범용 인터페이스로 래핑:

```typescript
export class GeneralAdapter implements ICommander {
  constructor(private general: General) {}

  get worldType(): string {
    return 'threekingdoms';
  }

  get stats(): Record<string, number> {
    return {
      leadership: this.general.leadership || 0,
      strength: this.general.strength || 0,
      intelligence: this.general.intelligence || 0,
      politics: this.general.politics || 0
    };
  }

  get resources(): Record<string, number> {
    return {
      gold: this.general.gold || 0,
      rice: this.general.rice || 0
    };
  }

  get specificData(): Record<string, any> {
    return {
      horse: this.general.horse,
      weapon: this.general.weapon,
      // 모든 삼국지 전용 데이터
    };
  }

  getStatValue(statName: string): number {
    return this.stats[statName] ?? 0;
  }
}

// 사용
const general = await General.findById(id);
const commander: ICommander = new GeneralAdapter(general);
await ActionSystem.execute('agriculture', commander, city);
```

---

## 프론트엔드 개발

### 현재 상태

**기존 프론트엔드:**
- 삼국지 레거시 PHP 프론트엔드
- 부분 마이그레이션된 Next.js 삼국지 프론트엔드

**신규 개발 필요:**
- 은하영웅전설 프론트엔드 (처음부터 구축)

### 프로젝트 구조

```
opensam-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/              # 인증
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── (games)/
│   │       ├── threekingdoms/   # 삼국지 (기존)
│   │       └── logh/            # 은하영웅전설 (신규)
│   │           ├── page.tsx     # 메인 대시보드
│   │           ├── character/   # 캐릭터 관리
│   │           ├── fleet/       # 함대 관리
│   │           ├── operation/   # 작전 계획
│   │           ├── battle/      # 전술 전투
│   │           ├── politics/    # 정치 시스템
│   │           ├── logistics/   # 병참 관리
│   │           └── map/         # 우주 지도
│   │
│   ├── components/
│   │   ├── common/              # 공통
│   │   ├── threekingdoms/
│   │   └── logh/                # 은하영웅전설 전용
│   │       ├── character/
│   │       ├── fleet/
│   │       ├── operation/
│   │       ├── battle/
│   │       ├── map/
│   │       ├── ui/
│   │       └── layout/
│   │
│   ├── lib/
│   │   ├── api/logh/            # API 클라이언트
│   │   ├── hooks/logh/          # React 훅
│   │   ├── store/logh/          # Zustand 스토어
│   │   ├── types/logh/          # TypeScript 타입
│   │   └── utils/logh/          # 유틸리티
│   │
│   └── styles/
│       └── logh/                # 테마 CSS
│
└── public/images/logh/          # 이미지 리소스
```

### 기술 스택

```typescript
// package.json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "zustand": "^4.x",               // 상태 관리
    "@tanstack/react-query": "^5.x", // 서버 상태
    "socket.io-client": "^4.x",      // 실시간 통신
    "tailwindcss": "^3.x"            // 스타일링
  }
}
```

### 핵심 타입 정의

```typescript
// src/lib/types/logh/character.ts
export interface Character {
  id: string;
  no: number;
  name: string;
  type: 'original' | 'generated';
  faction: 'empire' | 'alliance';
  
  // 8가지 파라미터 (매뉴얼 기반)
  stats: {
    leadership: number;      // 통솔
    politics: number;        // 정치
    administration: number;  // 운영
    intelligence: number;    // 정보
    command: number;         // 지휘
    mobility: number;        // 기동
    attack: number;          // 공격
    defense: number;         // 방어
  };
  
  rank: Rank;
  position: Position;
  commandPoints: {
    pcp: { current: number; max: number };
    mcp: { current: number; max: number };
    nextRecover: Date;
  };
  
  fleets: string[];
  location: GridCoordinate;
}

// src/lib/types/logh/fleet.ts
export interface Fleet {
  id: string;
  name: string;
  type: 'fleet' | 'transport' | 'patrol' | 'independent';
  commander: string;
  
  maxShips: number;  // 18,000 | 6,900 | 900 | 1
  composition: {
    battleship_i: number;
    battleship_ii: number;
    fast_battleship_i: number;
    // ... 모든 함선 타입
  };
  groundForces: {
    armored_grenadiers: number;
    armored_infantry: number;
    light_infantry: number;
    fleet_crew: number;
  };
  
  location: GridCoordinate;
  fuel: number;
  morale: number;
  status: 'idle' | 'moving' | 'operation' | 'battle';
}

// src/lib/types/logh/operation.ts
export interface Operation {
  id: string;
  type: 'conquest' | 'defense' | 'sweep';
  name: string;
  planner: string;
  
  target: GridCoordinate;
  targetSystems: string[];
  assignedFleets: string[];
  
  status: 'planning' | 'ordered' | 'active' | 'completed';
  progress: number;
  meritPoints: number;
  successRate: number;
}
```

### 상태 관리 (Zustand)

```typescript
// src/lib/store/logh/gameStore.ts
import { create } from 'zustand';

interface GameState {
  // 게임 시간 (24배속)
  gameTime: Date;
  realTime: Date;
  timeSpeed: number;
  
  // 세션
  sessionId: string;
  maxPlayers: number;
  currentPlayers: number;
  
  // 플레이어
  playerId: string;
  characterId: string;
  faction: 'empire' | 'alliance';
  
  // UI
  selectedFleet?: string;
  selectedOperation?: string;
  selectedGrid?: GridCoordinate;
  notifications: Notification[];
  
  // Actions
  updateGameTime: (gameTime: Date, realTime: Date) => void;
  selectFleet: (fleetId: string) => void;
  addNotification: (notification: Notification) => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameTime: new Date(),
  realTime: new Date(),
  timeSpeed: 24,
  
  sessionId: '',
  maxPlayers: 2000,
  currentPlayers: 0,
  
  playerId: '',
  characterId: '',
  faction: 'empire',
  
  notifications: [],
  
  updateGameTime: (gameTime, realTime) => set({ gameTime, realTime }),
  selectFleet: (fleetId) => set({ selectedFleet: fleetId }),
  addNotification: (notification) => 
    set((state) => ({ 
      notifications: [...state.notifications, notification] 
    }))
}));

// src/lib/store/logh/fleetStore.ts
interface FleetState {
  fleets: Record<string, Fleet>;
  loading: boolean;
  
  setFleets: (fleets: Fleet[]) => void;
  updateFleet: (fleetId: string, updates: Partial<Fleet>) => void;
  moveFleet: (fleetId: string, destination: GridCoordinate) => void;
}

export const useFleetStore = create<FleetState>((set) => ({
  fleets: {},
  loading: false,
  
  setFleets: (fleets) => 
    set({ 
      fleets: fleets.reduce((acc, f) => ({ ...acc, [f.id]: f }), {}) 
    }),
  
  updateFleet: (fleetId, updates) =>
    set((state) => ({
      fleets: {
        ...state.fleets,
        [fleetId]: { ...state.fleets[fleetId], ...updates }
      }
    })),
  
  moveFleet: async (fleetId, destination) => {
    // API 호출
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
  }
}));
```

### React Query 훅

```typescript
// src/lib/hooks/logh/useCharacter.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useCharacter(characterId: string) {
  return useQuery({
    queryKey: ['character', characterId],
    queryFn: () => api.getCharacter(characterId),
    staleTime: 30000,
  });
}

export function useUpdateStats() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ characterId, stat, amount }) => 
      api.updateStat(characterId, stat, amount),
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
    queryFn: () => api.getFleets(characterId),
    staleTime: 10000,  // 실시간성 중요
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
  }, [gameTime, realTime]);
  
  return { gameTime, realTime };
}
```

### 실시간 통신 (Socket.io)

```typescript
// src/lib/hooks/logh/useRealtime.ts
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useRealtime() {
  const { sessionId, characterId, addNotification } = useGameStore();
  const { updateFleet } = useFleetStore();
  
  useEffect(() => {
    if (!sessionId || !characterId) return;
    
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      query: { sessionId, characterId }
    });
    
    // 게임 시간 업데이트
    socket.on('time:update', (data) => {
      useGameStore.getState().updateGameTime(
        new Date(data.gameTime),
        new Date(data.realTime)
      );
    });
    
    // 함대 이동
    socket.on('fleet:moved', (data) => {
      updateFleet(data.fleetId, { location: data.location });
    });
    
    // 전투 시작
    socket.on('battle:started', (data) => {
      addNotification({
        type: 'battle',
        message: '전투가 시작되었습니다!',
        battleId: data.battleId
      });
    });
    
    // 작전 완료
    socket.on('operation:completed', (data) => {
      addNotification({
        type: 'operation',
        message: `작전 완료! 공적 +${data.meritPoints}`,
        operationId: data.operationId
      });
    });
    
    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [sessionId, characterId]);
  
  return {
    emitMoveFleet: (fleetId: string, destination: GridCoordinate) => {
      socket?.emit('fleet:move', { fleetId, destination });
    },
    emitBattleCommand: (battleId: string, command: BattleCommand) => {
      socket?.emit('battle:command', { battleId, command });
    }
  };
}
```

### 주요 컴포넌트

#### CharacterCard
```typescript
// src/components/logh/character/CharacterCard.tsx
'use client';

export function CharacterCard({ character }: { character: Character }) {
  return (
    <div className="logh-command-card">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">{character.name}</h3>
          <p className="text-sm text-gray-400">{character.position.name}</p>
        </div>
        <RankBadge rank={character.rank} faction={character.faction} />
      </div>
      
      {/* 커맨드 포인트 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <CommandPointBar
          label="PCP"
          current={character.commandPoints.pcp.current}
          max={character.commandPoints.pcp.max}
          color="blue"
        />
        <CommandPointBar
          label="MCP"
          current={character.commandPoints.mcp.current}
          max={character.commandPoints.mcp.max}
          color="red"
        />
      </div>
      
      {/* 능력치 */}
      <StatsDisplay stats={character.stats} compact />
    </div>
  );
}
```

#### FleetCard
```typescript
// src/components/logh/fleet/FleetCard.tsx
export function FleetCard({ fleet }: { fleet: Fleet }) {
  const totalShips = Object.values(fleet.composition).reduce((a, b) => a + b, 0);
  
  return (
    <div className="logh-command-card">
      <div className="flex items-start gap-4">
        <div className="logh-fleet-icon">
          {fleet.type === 'fleet' ? 'F' : 'T'}
        </div>
        
        <div className="flex-1">
          <h4 className="text-lg font-bold">{fleet.name}</h4>
          <p className="text-sm text-gray-400">사령관: {fleet.commander}</p>
          
          <div className="flex items-center gap-4 text-sm mt-2">
            <div>척수: {totalShips.toLocaleString()}</div>
            <div>항속: {fleet.fuel}</div>
            <div>사기: {fleet.morale}%</div>
          </div>
          
          <StatusBadge status={fleet.status} />
        </div>
      </div>
    </div>
  );
}
```

### 테마 및 스타일

```css
/* src/styles/logh/theme.css */
:root {
  /* 제국 테마 */
  --logh-empire-primary: #1a1a2e;
  --logh-empire-accent: #e94560;
  --logh-empire-gold: #f4a261;
  
  /* 동맹 테마 */
  --logh-alliance-primary: #0f3460;
  --logh-alliance-accent: #00b4d8;
  --logh-alliance-gold: #90e0ef;
  
  /* 공통 */
  --logh-text-primary: #e8e8e8;
  --logh-background: #0a0e27;
}

/* 우주 배경 */
.logh-space-background {
  background: radial-gradient(ellipse at center, #0a0e27 0%, #000 100%);
}

/* 커맨드 카드 */
.logh-command-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 16px;
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
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, #e94560 0%, #1a1a2e 100%);
  border: 2px solid var(--logh-empire-gold);
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
```

### 핵심 화면 구성

#### 1. 메인 대시보드
```
+--------------------------------------------------+
| 세션 정보    게임시간: 798년 2월 15일 14:23     |
+--------------------------------------------------+
| 캐릭터 정보         | 커맨드 포인트              |
| 라인하르트          | PCP: 320/640               |
| 제국 원수           | MCP: 480/640               |
| 통솔95 정치82 운영88|                            |
+--------------------------------------------------+
| 함대 현황                                        |
| 제1함대 (18,000척) - 작전중                     |
| 제7함대 (15,200척) - 대기중                     |
+--------------------------------------------------+
```

#### 2. 함대 관리
```
+--------------------------------------------------+
| 함대 목록           | 함대 상세                  |
| 제1함대             | 사령관: 라인하르트         |
| 18,000척            | 위치: 이제르론 요새        |
| 작전중              | 항속: 850/1000             |
|                     | 사기: 95%                  |
|                     | 함선 구성:                 |
|                     | 전함 I: 3,200척            |
|                     | 순양함 III: 4,500척        |
+--------------------------------------------------+
```

#### 3. 작전 계획
```
+--------------------------------------------------+
| 작전 목록           | 작전 상세                  |
| [#124] 점령작전     | 작전명: 페잔 회랑 점령     |
| 페잔 회랑           | 종류: 점령작전             |
| 진행중 65%          | 할당 함대:                 |
|                     | - 제1함대 (18,000척)       |
|                     | - 제7함대 (15,200척)       |
|                     | 예상 공적: 800-1200        |
+--------------------------------------------------+
```

#### 4. 전술 전투
```
+--------------------------------------------------+
|           전투 지도                              |
| [아군]              [적군]                       |
| 제1함대 ████        ████ 적함대                 |
| 18,000척            12,500척                     |
| 사기 92%            사기 68%                     |
+--------------------------------------------------+
| [이동] [선회] [공격명령] [퇴각명령]             |
+--------------------------------------------------+
```

#### 5. 우주 지도
```
+--------------------------------------------------+
|        제국 영역                                 |
|  ░░░[오딘]░░░[이제르론]░░░                     |
|        [페잔 회랑]                               |
|        동맹 영역                                 |
|  ▓▓▓[하이네센]▓▓▓▓▓▓▓                          |
+--------------------------------------------------+
| 선택: 페잔 회랑 (125, 78)                       |
| 함대: 제1함대 (아군), 동맹 제5함대 (적)         |
+--------------------------------------------------+
```

### 개발 로드맵

#### Phase 1: 기초 (1주)
- [ ] Next.js 프로젝트 생성
- [ ] 디렉토리 구조 설정
- [ ] Tailwind + 테마
- [ ] 타입 정의

#### Phase 2: 캐릭터 (1-2주)
- [ ] 로그인/회원가입
- [ ] 캐릭터 생성/선택
- [ ] 캐릭터 카드
- [ ] 능력치 표시

#### Phase 3: 대시보드 (2주)
- [ ] 게임 시간 시스템
- [ ] 커맨드 포인트
- [ ] 함대 현황 요약
- [ ] 이벤트 로그

#### Phase 4: 함대 관리 (2-3주)
- [ ] 함대 목록
- [ ] 함대 상세 정보
- [ ] 함선 구성
- [ ] 함대 재편성
- [ ] 함대 이동

#### Phase 5: 우주 지도 (2-3주)
- [ ] 그리드 시스템
- [ ] 은하 지도
- [ ] 함대 위치 추적
- [ ] 워프 경로

#### Phase 6: 작전 계획 (2주)
- [ ] 작전 목록
- [ ] 작전 계획 생성
- [ ] 함대 할당
- [ ] 진행 모니터링

#### Phase 7: 전술 전투 (3-4주)
- [ ] 전투 지도
- [ ] 유닛 이동
- [ ] 전투 커맨드
- [ ] 진형 변경

#### Phase 8: 병참 (1-2주)
- [ ] 생산 현황
- [ ] 창고 관리
- [ ] 자원 할당

#### Phase 9: 정치 (1-2주)
- [ ] 인사 시스템
- [ ] 승진/강등
- [ ] 직위 임명

#### Phase 10: 실시간 (2주)
- [ ] Socket.io 연결
- [ ] 시간 동기화
- [ ] 상태 동기화
- [ ] 이벤트 알림

#### Phase 11: 최적화 (2-3주)
- [ ] 성능 최적화
- [ ] 메모리 관리
- [ ] 모바일 반응형
- [ ] 테스트

**총 예상: 18-25주 (4-6개월)**

### 즉시 시작

```bash
# 프로젝트 생성
npx create-next-app@latest opensam-frontend --typescript --tailwind --app

# 패키지 설치
cd opensam-frontend
npm install zustand @tanstack/react-query socket.io-client

# 개발 서버
npm run dev
```

**첫 작업:**
1. `src/lib/types/logh/` 타입 정의
2. 매뉴얼 참조 수치 확인
3. CharacterCard 컴포넌트부터 시작

---

## 개발 워크플로우

### 자율 작업 원칙

**핵심 방침: 묻지 말고 계속 실행**

Claude는 작업을 수행할 때 다음 원칙을 따릅니다:

1. **한 작업 완료 → 즉시 다음 작업**
   - 타입 에러 100개 수정 → 바로 다음 100개
   - 컴포넌트 1개 완성 → 바로 다음 컴포넌트
   - 리포지토리 1개 작성 → 바로 다음 리포지토리

2. **작업 완료 기준**
   - 타입 에러 0개 달성
   - 전체 컴포넌트 완성
   - 모든 테스트 통과
   - 사용자가 "멈춰" 또는 "충분해"라고 할 때

3. **진행 상황 보고 형식**
   ```
   [완료] TypeScript 에러 150개 수정 (1045개 남음)
   [시작] 다음 150개 에러 수정 중...
   [완료] 다음 150개 에러 수정 (895개 남음)
   [시작] 다음 150개 에러 수정 중...
   ```

4. **금지 사항**
   - ❌ "다음에 X를 할까요?"
   - ❌ "계속 진행할까요?"
   - ❌ "이것도 할까요?"
   - ✅ 대신: 바로 다음 작업 시작하고 간단히 보고

5. **우선순위 판단**
   - 에러 수정 → 테스트 → 리팩토링
   - 기초 → 응용
   - 중요도 높음 → 낮음

### 워크플로우 1: TypeScript 커맨드 → JSON 액션

**단계:**
1. 기존 커맨드 파일 읽기 (`src/commands/general/*.ts`)
2. 로직 분석 (요구사항, 비용, 효과, 수식)
3. JSON ActionDefinition으로 변환
4. `config/worlds/threekingdoms/actions.json`에 추가
5. 검증 및 테스트

### 워크플로우 2: 하드코딩 상수 → JSON 설정

**단계:**
1. const 파일 읽기 (`src/const/*.ts`)
2. 데이터 추출 (유닛 타입, 아이템, 국가 타입)
3. JSON 스키마로 변환
4. `config/worlds/threekingdoms/*.json`에 저장
5. 타입 안전성 검증

**예시:**
```typescript
// BEFORE: src/const/GameUnitConst.ts
export const UNIT_TYPES = {
  INFANTRY: { name: '보병', attack: 10, defense: 15 },
  CAVALRY: { name: '기병', attack: 20, defense: 10 }
};

// AFTER: config/worlds/threekingdoms/unit-types.json
{
  "infantry": {
    "id": "infantry",
    "name": "보병",
    "baseStats": {
      "attack": 10,
      "defense": 15
    },
    "scaleMultiplier": 1.0,
    "resourceCosts": {
      "gold": 10,
      "rice": 5
    }
  }
}
```

### 워크플로우 3: 레거시 모델 → 어댑터

**단계:**
1. 기존 모델 분석 (`src/models/*.ts`)
2. 어댑터 패턴 구현
3. 점진적 교체
4. 테스트 작성

### 일일 작업 루틴

**자율 실행 모드:**

**시작 시:**
```bash
# 상태 확인
npx tsc --noEmit > errors.txt 2>&1
grep "error TS" errors.txt | wc -l

# 목표 설정: 오늘 200개 에러 수정
```

**작업 루프 (사용자가 멈출 때까지):**
```
1. 50개 에러 수정
2. 진행 상황 보고
3. 즉시 다음 50개 에러 수정
4. 진행 상황 보고
5. 즉시 다음 50개 에러 수정
... 계속 반복
```

**종료 시:**
```bash
git add .
git commit -m "fix: resolve 200 errors (845 remaining)"
git push
```

**작업 예시 - TypeScript 에러 수정:**
```
[09:00] 시작: 1045개 에러
[09:15] 완료: 50개 수정, 995개 남음 → 즉시 다음 진행
[09:30] 완료: 50개 수정, 945개 남음 → 즉시 다음 진행
[09:45] 완료: 50개 수정, 895개 남음 → 즉시 다음 진행
[10:00] 완료: 50개 수정, 845개 남음 → 즉시 다음 진행
[10:15] 총 200개 에러 수정 완료
```

**작업 예시 - 컴포넌트 개발:**
```
[시작] CharacterCard 컴포넌트 작성
[완료] CharacterCard 완성 → 즉시 다음 진행
[시작] FleetCard 컴포넌트 작성
[완료] FleetCard 완성 → 즉시 다음 진행
[시작] OperationCard 컴포넌트 작성
[완료] OperationCard 완성 → 즉시 다음 진행
```

**작업 예시 - 커맨드 변환:**
```
[완료] agriculture.ts → JSON 변환
[완료] commerce.ts → JSON 변환
[완료] military.ts → JSON 변환
[완료] recruit.ts → JSON 변환
[완료] training.ts → JSON 변환
→ 5개 커맨드 변환 완료, actions.json 업데이트
```

### 코드 리뷰 기준

모든 PR은 다음을 확인:

- [ ] 다른 세계관에서 작동하는가?
- [ ] 스케일이 변경되어도 작동하는가?
- [ ] 하드코딩 값이 없는가?
- [ ] 세계별 데이터가 `specificData`에 있는가?
- [ ] 타입 에러가 없는가?
- [ ] 테스트가 통과하는가?

### 유용한 명령어

```bash
# 타입 체크
npm run typecheck

# 패턴 검색
rg "pattern" src/

# 테스트 실행
npm test -- path/to/test.ts

# 하드코딩 값 찾기
rg "const.*=.*\d+" src/const/

# db.table 호출 수 확인
grep -r "db.table" src/ | wc -l
```

---

## 안티 패턴

### ❌ 하지 말 것

```typescript
// 세계 특정 로직
if (general.horse === 'red_hare') { bonus = 10; }

// 고정 스케일
const MAX_ARMY = 10000;

// 코드 기반 게임 규칙
function calculateDamage() {
  return attacker.strength * 2 - defender.defense;
}

// as any 사용
const general = await General.findById(id) as any;

// db.table() 직접 호출
await db.table('general').where('id', id).update({ gold: 100 });
```

### ✅ 대신 이렇게

```typescript
// 범용 + 설정
const horseBonus = worldConfig.items[general.specificData.horse]?.bonus ?? 0;

// 스케일 독립적
const maxArmy = worldConfig.scaleSettings[scaleLevel].maxUnitCount;

// 설정 기반
const damage = Calculator.evaluate(
  actionDef.effects[0].formula,
  { attacker, defender }
);

// 타입 안전
const general: IGeneral | null = await General.findById(id);

// 리포지토리 사용
await generalRepository.updateById(id, { $set: { 'data.gold': 100 } });
```

---

## 참고 문서

### 은하영웅전설 매뉴얼 주요 섹션
- p.8-17: 게임 개요, 세션, 시간
- p.18-25: 화면 및 조작
- p.26-44: 전략 게임 시스템
- p.45-54: 전술 전투

### 디렉토리별 참조
- `references/world-config-schema.md` - JSON 스키마
- `references/action-conversion-guide.md` - 액션 변환 가이드
- `references/mongoose-patterns.md` - Mongoose 패턴
- `references/repository-examples.md` - 리포지토리 예제
- `references/migration-checklist.md` - 마이그레이션 체크리스트
- `references/scale-system.md` - 스케일 시스템

---

## 성공 기준

프로젝트 완료 시:

- [ ] TypeScript 에러 0개
- [ ] `as any` 사용 0개
- [ ] 레거시 `db.table()` 호출 0개
- [ ] 모든 테스트 통과
- [ ] 빌드 성공: `npm run build` ✅
- [ ] 삼국지 게임 완전 작동
- [ ] 은하영웅전설 기본 시스템 작동
- [ ] 범용 엔진으로 새 게임 추가 가능

---

## 최종 요약

**핵심 원칙:**
1. **삼국지 = 웹 검색 → PHP 레거시 → 일반 지식**
2. **은하영웅전설 = 업로드 문서 → 원작 → 추론**
3. **세계 독립적 (World-Agnostic)**
4. **스케일 독립적 (Scale-Agnostic)**
5. **설정 기반 (Configuration-Driven)**

**타입 안전성:**
- Mongoose + TypeScript 엄격 모드
- 리포지토리 패턴
- 제네릭 활용
- `as any` 절대 사용 금지

**점진적 마이그레이션:**
- 어댑터로 레거시 래핑
- 한 번에 하나씩
- 지속적 테스트
- 진행 상황 추적

이 가이드를 따라 OpenSAM 프로젝트를 안전하고 확장 가능한 범용 게임 엔진으로 발전시킬 수 있습니다.
