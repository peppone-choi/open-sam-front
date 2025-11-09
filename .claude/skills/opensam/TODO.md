# OpenSAM 개발 TODO 및 작업 현황

> 마지막 업데이트: 2025-11-09  
> 상태: 레포지토리 패턴 전환 진행 중 (40% 완료)

---

## 📊 현재 세션 완료 사항

### ✅ 백엔드 리팩토링 완료
1. **메시지 시스템 레포지토리 패턴 적용**
   - `SendMessage.service.ts`: `.data` 접근 제거, 모델 import 정리
   - `GetMessages.service.ts`: 보안 검증 강화, 직접 필드 참조
   - MongoDB 쿼리 체이닝 문제 해결 (`.sort().limit()` → 배열 메서드)
   - NPC 메시지 체크 주석 처리 (향후 NPC도 메시지 사용 가능)

2. **경매 시스템 일부 리팩토링**
   - `OpenBuyRiceAuction.service.ts`: `general.save()` → `repository.update()`
   - `OpenSellRiceAuction.service.ts`: `general.save()` → `repository.update()`
   - `BidBuyRiceAuction.service.ts`: 모델 import 정리

3. **Git 커밋**
   - 커밋: `57a0183` - "refactor: 메시지 & 경매 서비스를 레포지토리 패턴으로 변경"
   - 변경 파일: 10개 (404 삽입, 288 삭제)

### ✅ 프론트엔드 UI 개선 (이전 세션)
1. **메시지 시스템 UI**
   - 5개 탭 시스템: 🔔시스템 / 전체 / 국가 / 개인 / 외교
   - 타입별 색상 구분 (빨강/파랑/초록/노랑/보라)
   - 시스템 메시지는 읽기 전용

2. **장수 카드 UI**
   - 통무지정매 `undefined` 처리 (`?? 0`)
   - 병종 없을 때 "미편성" 표시

3. **턴 테이블**
   - 접기: 30턴 (스크롤 없음)
   - 펼치기: 50턴 (스크롤)

---

## 🔥 긴급 작업 (P0 - 즉시 필요)

### 백엔드: 레포지토리 패턴 완전 적용

**목표**: 모든 서비스에서 `.data` 접근 제거 및 레포지토리 패턴 사용

#### 📊 `.data` 접근 현황 (총 152개 발견)

| 서비스 | `.data` 개수 | 상태 | 우선순위 | 예상 시간 |
|--------|-------------|------|---------|----------|
| **command** | 50개 | 🔴 미완료 | P0 (최우선) | 2시간 |
| **global** | 47개 | 🔴 미완료 | P1 | 2시간 |
| **battle** | 25개 | 🔴 미완료 | P1 | 1시간 |
| **auction** | 16개 | 🟡 일부 완료 | P1 | 30분 |
| **general** | 9개 | 🔴 미완료 | P1 | 30분 |
| **vote** | 4개 | 🔴 미완료 | P2 | 15분 |
| **troop** | 1개 | 🔴 미완료 | P2 | 5분 |
| **message** | 0개 | ✅ 완료 | - | - |
| **betting** | 0개 | ✅ 완료 | - | - |
| **chief** | 0개 | ✅ 완료 | - | - |
| **nation** | 0개 | ✅ 완료 | - | - |
| **info** | 0개 | ✅ 완료 | - | - |

**총 예상 시간**: 6-7시간

---

## 📋 작업 Phase별 계획

### Phase 1: 핵심 비즈니스 로직 (3-4시간)

**작업 순서**:
1. ✅ ~~auction 일부 (OpenBuy/OpenSell/BidBuy)~~ - 완료
2. **auction 나머지** (16개 → 약 10개 남음, 30분)
   - `BidSellRiceAuction.service.ts`
   - `BidUniqueAuction.service.ts`
   - `OpenUniqueAuction.service.ts`
   - `GetActiveResourceAuctionList.service.ts`
   - `GetUniqueItemAuctionDetail.service.ts`
   - `GetUniqueItemAuctionList.service.ts`

3. **command 서비스** (50개, 2시간)
   - `ExecuteCommand.service.ts`
   - `PushCommand.service.ts`
   - `RaiseArmyCommand.service.ts`
   - `RepeatCommand.service.ts`

4. **general 서비스** (9개, 30분)
   - `GetCommandTable.service.ts`
   - `GetFrontInfo.service.ts`
   - `GetSelectPool.service.ts`

5. **vote 서비스** (4개, 15분)
   - `AddComment.service.ts`
   - `GetVoteDetail.service.ts`

6. **troop 서비스** (1개, 5분)

### Phase 2: 시스템 로직 (3-4시간)

1. **global 서비스** (47개, 2시간)
   - `ExecuteEngine.service.ts`
   - `GetHistory.service.ts`
   - `GetNationList.service.ts`
   - `GetStaticInfo.service.ts`

2. **battle 서비스** (25개, 1시간)
   - `StartBattle.service.ts`
   - `BattleCreation.service.ts`
   - 기타 전투 관련

---

## 🛠️ 작업 패턴 가이드

### ❌ Before (잘못된 패턴)
```typescript
// 1. 잘못된 레포지토리 호출
const general = await generalRepository.findBySessionAndNo({
  session_id: sessionId,
  'data.no': generalId
});

// 2. .data 접근
if (general.data.rice < amount) {
  throw new Error('쌀이 부족합니다.');
}

// 3. 직접 모델 수정 및 save()
general.data.rice -= amount;
await general.save();

// 4. 불필요한 모델 import
import { General } from '../../models/general.model';
import { Nation } from '../../models/nation.model';
```

### ✅ After (올바른 패턴)
```typescript
// 1. 올바른 레포지토리 호출 (sessionId, generalId만)
const general = await generalRepository.findBySessionAndNo(sessionId, generalId);

// 2. 직접 필드 참조
if (general.rice < amount) {
  throw new Error('쌀이 부족합니다.');
}

// 3. 레포지토리 update 메서드 사용
await generalRepository.updateBySessionAndNo(sessionId, generalId, {
  rice: general.rice - amount
});

// 4. 레포지토리만 import
import { generalRepository } from '../../repositories/general.repository';
```

### 주요 변환 규칙

| Before | After |
|--------|-------|
| `general.data.rice` | `general.rice` |
| `nation.data.name` | `nation.name` |
| `general.save()` | `generalRepository.update(...)` |
| `General.findOne(...)` | `generalRepository.findBySessionAndNo(...)` |
| `Nation.find(...)` | `nationRepository.findByFilter(...)` |
| `import { General }` | `import { generalRepository }` |

---

## 📝 중요 작업 (P1 - 이번 주)

### 백엔드

- [ ] **NPC 시스템 개선**
  - [ ] NPC도 메시지 사용 가능하도록 활성화
  - [ ] NPC 턴 실행 로직 검증
  - [ ] NPC 커맨드 실행 테스트

- [ ] **커맨드 시스템 안정화**
  - [ ] 턴 예약/수정/삭제 테스트
  - [ ] 실제 턴 실행 및 결과 확인
  - [ ] 커맨드 실행 로그 추적
  - [ ] 에러 처리 강화

- [ ] **인증/세션 시스템 검증**
  - [x] JWT 구조: `userId`, `username`, `grade`만 포함
  - [x] `sessionId`는 URL 파라미터(`serverID`)에서 추출
  - [x] `generalId` 명시적 전달 또는 `userId`로 조회
  - [ ] 보안 검증 로직 일관성 확인 (모든 서비스)
  - [ ] 권한 체크 (`general.owner === userId`) 표준화

- [ ] **로깅 시스템 통일**
  - [ ] `logger` vs `console.log` 정책 결정
  - [ ] 구조화된 로그 포맷 통일
  - [ ] 에러 로그 수집 및 모니터링
  - [ ] 디버그 로그 레벨 관리

### 프론트엔드

- [ ] **메시지 기능 테스트**
  - [ ] 시스템 메시지 수신 확인
  - [ ] 전체 메시지 전송 및 수신
  - [ ] 국가 메시지 전송 (같은 국가만)
  - [ ] 개인 메시지 전송
  - [ ] 외교 메시지 전송 (다른 국가)
  - [ ] 메시지 조회 성능 확인

- [ ] **UI/UX 개선**
  - [ ] 메시지 실시간 알림 시스템
  - [ ] 턴 진행 상태 표시 UI
  - [ ] 로딩 상태 스피너/스켈레톤
  - [ ] 에러 메시지 토스트

- [ ] **성능 최적화**
  - [ ] 메시지 목록 pagination (현재 15개씩)
  - [ ] 장수 목록 가상 스크롤
  - [ ] 불필요한 리렌더링 제거 (React.memo)
  - [ ] API 응답 캐싱

---

## 🔧 기술 부채 (P2 - 다음 주)

### 백엔드

- [ ] **TypeScript strict 모드**
  - 현재: `strict: false` (PHP 마이그레이션 레거시)
  - `any` 타입 점진적 제거
  - 인터페이스 타입 정의 강화

- [ ] **테스트 커버리지**
  - [ ] 메시지 서비스 유닛 테스트
  - [ ] 경매 서비스 유닛 테스트
  - [ ] 커맨드 실행 통합 테스트
  - [ ] 레포지토리 계층 테스트

- [ ] **에러 처리 표준화**
  - try-catch 패턴 통일
  - 에러 메시지 다국어 지원 (한국어/영어)
  - 커스텀 에러 클래스 도입

- [ ] **DB 인덱스 최적화**
  - 메시지 조회 쿼리 인덱스 (`session_id`, `type`, `dest_general_id`)
  - 장수/국가 조회 인덱스 (`session_id`, `no`, `owner`)
  - 커맨드 조회 인덱스 (`session_id`, `general_id`, `turn`)

### 프론트엔드

- [ ] **컴포넌트 리팩토링**
  - `GeneralBasicCard` 복잡도 감소 (현재 648줄)
  - 공통 컴포넌트 추출 (`StatBar`, `ResourceInfo` 등)
  - Hooks 분리 (`useGeneral`, `useMessage`)

- [ ] **타입 안정성**
  - API 응답 타입 정의 (`zod` 도입 고려)
  - Props 타입 엄격화
  - 전역 상태 타입 안정성

---

## 📚 문서화 (P3 - 추후)

- [ ] **API 문서**
  - [ ] 메시지 API 명세
  - [ ] 경매 API 명세
  - [ ] 커맨드 API 명세
  - [ ] 인증/세션 API 명세

- [ ] **아키텍처 문서**
  - [ ] 레포지토리 패턴 가이드 작성
  - [ ] 서비스 레이어 구조 설명
  - [ ] 데이터 플로우 다이어그램

- [ ] **개발 가이드**
  - [ ] 개발 환경 설정 가이드 업데이트
  - [ ] 커맨드 시스템 사용 가이드
  - [ ] 테스트 작성 가이드

---

## 🐛 알려진 이슈

### 백엔드
- [x] ~~MongoDB 쿼리 체이닝 문제~~ - 해결 (배열 메서드 사용)
- [ ] 메시지 타입 `system` 처리 완전 검증 필요
- [ ] 경매 입찰 시 이전 입찰자 환불 로직 검증
- [ ] `general.data?.no` vs `general.no` 혼용 (레포지토리 통일 필요)
- [ ] 일부 서비스에서 `general.save()` 직접 호출

### 프론트엔드
- [ ] 메시지 실시간 업데이트 미구현
- [ ] 페이지네이션 없이 전체 로드 (성능 이슈 가능)
- [ ] 에러 핸들링 불완전 (일부 API 실패 시 UI 멈춤)

---

## 📊 전체 진행률

| 영역 | 진행률 | 상태 |
|------|--------|------|
| **백엔드 레포지토리 패턴** | 40% | 🟡 진행 중 |
| **프론트엔드 UI** | 70% | 🟢 대부분 완료 |
| **기능 테스트** | 0% | 🔴 시작 전 |
| **문서화** | 10% | 🔴 시작 전 |

**전체 프로젝트 진행률**: **약 35%**

---

## 🎯 다음 세션 작업 계획

### 1단계: auction 서비스 완료 (30분)
```bash
# 작업 파일
src/services/auction/BidSellRiceAuction.service.ts
src/services/auction/BidUniqueAuction.service.ts
src/services/auction/OpenUniqueAuction.service.ts
src/services/auction/Get*.service.ts
```

### 2단계: command 서비스 시작 (2시간)
```bash
# 우선순위 높은 파일
src/services/command/ExecuteCommand.service.ts  # 커맨드 실행 핵심
src/services/command/PushCommand.service.ts     # 커맨드 예약
src/services/command/RepeatCommand.service.ts   # 반복 명령
src/services/command/RaiseArmyCommand.service.ts
```

### 3단계: 테스트 & 검증 (1시간)
- [ ] TypeScript 컴파일 확인 (`npm run typecheck`)
- [ ] 메시지 기능 통합 테스트
- [ ] 경매 기능 테스트
- [ ] 커맨드 예약/실행 테스트

### 4단계: 커밋 & 문서 업데이트
```bash
git add src/services/auction/*.ts src/services/command/*.ts
git commit -m "refactor: auction 완료 및 command 서비스 레포지토리 패턴 적용"
```

---

## 🔍 체크리스트

### Phase 1: 핵심 서비스 (72개)
- [x] message 서비스 (0개) ✅
- [ ] auction 서비스 (16개)
  - [x] OpenBuyRiceAuction ✅
  - [x] OpenSellRiceAuction ✅
  - [x] BidBuyRiceAuction ✅
  - [ ] BidSellRiceAuction
  - [ ] BidUniqueAuction
  - [ ] OpenUniqueAuction
  - [ ] GetActiveResourceAuctionList
  - [ ] GetUniqueItemAuctionDetail
  - [ ] GetUniqueItemAuctionList
- [ ] command 서비스 (50개)
- [ ] general 서비스 (9개)
- [ ] vote 서비스 (4개)
- [ ] troop 서비스 (1개)

### Phase 2: 시스템 서비스 (80개)
- [ ] global 서비스 (47개)
- [ ] battle 서비스 (25개)

### 검증
- [ ] TypeScript 컴파일 성공
- [ ] 기능 테스트 통과
- [ ] 성능 테스트 통과
- [ ] 문서 업데이트

---

## 📞 참고 자료

- **레포지토리 패턴**: `@.claude/skills/opensam/references/backend-architecture.md`
- **데몬 구조**: `@.claude/skills/opensam/references/daemon-architecture.md`
- **타입 마이그레이션**: `@.claude/skills/opensam/references/typescript-migration.md`
- **게임 시스템**: `@.claude/skills/opensam/references/game-systems.md`

---

> **Note**: 이 문서는 `.claude/skills/opensam/TODO.md`에 저장되며, 각 세션마다 업데이트됩니다.
