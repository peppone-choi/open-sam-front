---
name: opensam
description: OpenSAM 삼국지/은하영웅전설 범용 게임 엔진 개발. 데몬 기반 아키텍처(게임 플레이는 캐시만, DB는 영속성/로그만), PHP→TypeScript 마이그레이션, 자율 연속 작업 전문.
---

# OpenSAM Development Skill

병호님의 OpenSAM 프로젝트를 위한 통합 개발 스킬입니다.

## Overview

OpenSAM은 삼국지와 은하영웅전설을 지원하는 범용 전략 게임 엔진입니다. 이 스킬은 다음 작업 시 자동으로 활성화됩니다:

- OpenSAM 프로젝트 코드 작성/수정
- 삼국지/은하영웅전설 게임 기능 구현
- TypeScript 타입 에러 수정
- PHP 레거시 마이그레이션
- 데몬 기반 아키텍처 구현
- 캐시 시스템 개발

**작업 경로:**
- 백엔드: `/mnt/d/opensam/open-sam-backend`
- 프론트엔드: `/mnt/d/opensam/open-sam-frontend`

## When to Apply

이 스킬은 다음 경우에 자동으로 적용됩니다:

- "opensam" 키워드가 포함된 대화
- 삼국지, 은하영웅전설 게임 개발 관련
- TypeScript 타입 에러 수정 요청
- PHP to Node.js 마이그레이션 작업
- 캐시 아키텍처 관련 질문
- `/mnt/d/opensam/` 경로의 파일 작업

## 핵심 원칙

### 1. 자율 연속 실행 (CRITICAL ⚠️)

**Claude는 질문하지 않고 계속 작업합니다.**

```
✅ 올바른 방식:
[완료] 150개 타입 에러 수정 (895개 남음)
[시작] 다음 150개 수정 중...
[완료] 150개 타입 에러 수정 (745개 남음)
[시작] 다음 150개 수정 중...
(병호님이 "멈춰"라고 할 때까지 계속)

❌ 절대 하지 말 것:
"다음 작업을 진행할까요?"
"계속할까요?"
← 이런 질문 하지 않음!
```

**멈추는 조건:**
- 모든 작업 완료
- 병호님이 "멈춰" 명령
- 치명적 에러 발생

### 2. 데몬 기반 아키텍처 (CRITICAL ⚠️)

**핵심 개념: 게임 플레이는 캐시만, DB는 영속성/로그만**

```
API Server (게임 플레이)
  → L1 (메모리) 체크
  → L2 (Redis) 체크
  → 리턴
  (DB 접근 금지!)

API Server (커맨드)
  → Command Queue 푸시
  → Command Log 저장 (DB)

Game Daemon
  → Queue에서 커맨드 pop
  → 커맨드 실행
  → L1/L2 캐시 업데이트
  → Dirty 마킹
  
  → 크론 (5초마다)
     → Dirty 엔티티 → DB 저장

MongoDB
  ← 크론 저장 (영속성)
  ← 로그 저장
  ← 예약 커맨드 저장
  ← 통계 조회
  → 서버 시작 시 캐시 로딩
```

**DB 접근 규칙:**

| 용도 | 데이터 소스 | 예시 |
|------|------------|------|
| 게임 플레이 | L1/L2만 | 장수 정보, 도시 상태, 병력 |
| 로그/히스토리 | DB 조회 OK | 커맨드 로그, 전투 기록 |
| 예약/스케줄 | DB 조회/저장 OK | 턴 예약 커맨드 |
| 통계/분석 | DB 집계 OK | 랭킹, 통계 |
| 서버 시작 | DB → 캐시 | 초기 데이터 로딩 |
| 영속성 보장 | 캐시 → DB | 크론 5초마다 저장 |

**코드 예시:**

```typescript
// ❌ API에서 절대 금지
const general = await General.findById(id); // DB 접근!

// ✅ API - 게임 플레이 (캐시만)
let general = l1Cache.get(`general:${id}`);
if (!general) {
  const cached = await redis.get(`general:${id}`);
  if (cached) {
    general = JSON.parse(cached);
    l1Cache.set(`general:${id}`, general);
  }
}

// ✅ API - 로그 조회 (DB OK)
const logs = await CommandLog.find({ generalId });

// ✅ API - 커맨드 실행 (큐 + 로그)
await commandQueue.push(command);
await CommandLog.create({ ...command, status: 'queued' });

// ✅ 데몬 - 커맨드 처리
const general = JSON.parse(await redis.get(`general:${id}`));
general.data.gold -= 100;
await redis.set(`general:${id}`, JSON.stringify(general));
l1Cache.delete(`general:${id}`);
dirtySet.add(id);

// ✅ 데몬 - 크론 저장 (5초마다)
setInterval(async () => {
  for (const id of dirtySet) {
    const data = await redis.get(`general:${id}`);
    await General.updateOne({ _id: id }, { $set: JSON.parse(data) });
  }
  dirtySet.clear();
}, 5000);
```

### 3. 웹 검색 최우선 (삼국지)

삼국지 관련 작업 시 **반드시 웹 검색**으로 정확한 데이터 사용:

```typescript
// ❌ 추측 금지
const caocao = { leadership: 90 }; // 추측!

// ✅ 웹 검색 기반
// [웹 검색: "삼국지11 조조 능력치"]
const caocao = { 
  leadership: 97,   // 검색 결과
  intelligence: 94,
  politics: 83,
  strength: 72
};
```

**은하영웅전설:** 업로드된 일본어 매뉴얼 최우선 참조

### 4. 타입 안전성

```typescript
// ❌ 절대 금지
const data: any = someFunction();
const result = await Model.findById(id) as any;

// ✅ 올바른 방법
const data: IGeneral | null = await getGeneral(id);
if (!data) throw new Error('Not found');

const gold = general?.data?.gold ?? 0;
const id: string = general._id.toString();
```

### 5. 범용 엔진 설계

세계 독립적 코드 작성:

```typescript
// ❌ 삼국지 전용
interface General {
  horse: string;
  weapon: string;
}

// ✅ 범용 설계
interface ICommander {
  worldType: 'sangokushi' | 'logh' | 'fantasy';
  baseStats: Record<string, number>;
  worldSpecificData: Record<string, any>;
}
```

## 기술 스택

### 백엔드
- Node.js + TypeScript + MongoDB + Mongoose
- Redis (L2 캐시 + 커맨드 큐)
- 레거시: PHP + Knex

### 프론트엔드
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Zustand (상태 관리)
- React Query (서버 상태)
- Socket.io (실시간 통신)

### 인프라
- AWS ECS + Docker
- Jenkins CI/CD
- WSL2 개발 환경

## 레거시 마이그레이션

### PHP → TypeScript 변환

```php
// BEFORE: PHP + Knex
$generals = DB::table('general')->where('nation', $nationId)->get();
foreach ($generals as $g) {
  $g->gold -= 50;
  DB::table('general')->where('no', $g->no)->update(['gold' => $g->gold]);
}
```

```typescript
// AFTER: TypeScript (데몬에서 처리)
const generalIds = await redis.smembers(`nation:${nationId}:generals`);
for (const id of generalIds) {
  const general = JSON.parse(await redis.get(`general:${id}`));
  general.data.gold -= 50;
  await redis.set(`general:${id}`, JSON.stringify(general));
  dirtySet.add(id);
}
```

## 스크립트

스킬에 포함된 유틸리티 스크립트:

1. **scripts/auto-fix-types.sh** - TypeScript 에러 자동 수정 (자율 모드)
2. **scripts/check-legacy.sh** - 레거시 코드 + 직접 DB 조회 검색
3. **scripts/quick-check.sh** - 빠른 타입 체크
4. **scripts/daemon-status.sh** - 데몬 상태 확인 (큐, dirty, 프로세스)

## 참조 문서

상세한 내용은 `references/` 폴더의 문서를 참조하세요:

- **daemon-architecture.md** - 데몬 아키텍처 완전 가이드 (필독!)
- **full-guide.md** - 전체 통합 가이드
- **frontend-guide.md** - Next.js 프론트엔드 상세
- **backend-architecture.md** - 백엔드 구조
- **game-systems.md** - 게임 시스템 문서
- **typescript-migration.md** - TypeScript 마이그레이션
- **universal-engine.md** - 범용 엔진 설계

## 성공 기준

프로젝트 완료 체크리스트:

### 타입 안전성
- [ ] TypeScript 에러 0개
- [ ] `as any` 사용 0개
- [ ] 모든 함수에 타입 명시

### 레거시 마이그레이션
- [ ] `db.table()` 호출 0개
- [ ] PHP 파일 0개
- [ ] 모든 코드 TypeScript 변환

### 아키텍처
- [ ] **게임 플레이에서 DB 직접 조회 0개**
- [ ] **모든 실시간 쓰기는 데몬 통과**
- [ ] 커맨드는 큐로만 전송
- [ ] 크론 저장 정상 작동 (5초마다)
- [ ] 로그/통계는 DB 사용
- [ ] 캐시 히트율 90% 이상

### 빌드 & 테스트
- [ ] 빌드 성공 (Next.js + Backend)
- [ ] 모든 테스트 통과
- [ ] 삼국지 기본 게임 작동
- [ ] 은하영웅전설 기본 시스템 작동

## 빠른 명령어

```bash
# 타입 체크
cd /mnt/d/opensam/open-sam-backend
npm run typecheck

# 빌드
npm run build

# 에러 카운트
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l

# 레거시 코드 찾기
grep -r "db\.table" src/ | wc -l
grep -r " as any" src/ | wc -l

# 데몬 상태
bash scripts/daemon-status.sh
```

## 예시 프롬프트

이 스킬이 활성화되는 예시:

- "opensam 프로젝트의 타입 에러 수정해줘"
- "삼국지 장수 시스템 구현해줘" (자동 웹 검색)
- "PHP 코드를 TypeScript로 마이그레이션"
- "데몬에서 농업 커맨드 처리 구현"
- "캐시 미스가 발생하는 이유 분석"

## 중요 사항

1. **자율 실행**: 한 번 시작하면 멈추지 않고 계속 진행
2. **DB 접근**: 게임 플레이 중 절대 금지!
3. **웹 검색**: 삼국지 데이터는 반드시 검색
4. **타입 안전**: `as any` 절대 사용 금지
5. **범용 설계**: 세계 독립적 코드 작성

---

이 스킬은 병호님의 OpenSAM 프로젝트를 위해 특별히 제작되었습니다.
