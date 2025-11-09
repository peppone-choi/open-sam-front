# OpenSAM 프로젝트 요약

> **마지막 업데이트**: 2025-11-09  
> **현재 상태**: 레포지토리 패턴 전환 40% 완료

---

## 🎯 프로젝트 개요

**OpenSAM**은 PHP 기반 웹 게임을 TypeScript + MongoDB + Next.js로 마이그레이션하는 프로젝트입니다.

### 기술 스택
- **백엔드**: Express + TypeScript + MongoDB + Redis
- **프론트엔드**: Next.js 14 + React 19
- **인증**: JWT (httpOnly cookies)
- **실시간**: Socket.io

---

## 📈 현재 진행 상황

### 이번 세션 완료 (2025-11-09)

#### ✅ 백엔드 리팩토링
1. **메시지 시스템 완전 전환**
   - 레포지토리 패턴 100% 적용
   - `.data` 접근 완전 제거
   - MongoDB 쿼리 체이닝 문제 해결

2. **경매 시스템 부분 전환**
   - OpenBuyRiceAuction, OpenSellRiceAuction
   - BidBuyRiceAuction
   - 나머지 6개 파일 작업 필요

3. **Git 커밋**
   - 커밋 ID: `57a0183`
   - 10개 파일 변경 (404 추가, 288 삭제)

#### ✅ 프론트엔드 UI (이전 세션)
1. **메시지 시스템**: 5탭 UI, 타입별 색상
2. **장수 카드**: 통무지정매/병종 표시 개선
3. **턴 테이블**: 30턴 → 50턴 확장

---

## 🔥 핵심 작업: 레포지토리 패턴 전환

### 목표
모든 서비스에서 **`.data` 접근 제거** 및 **레포지토리 패턴 사용**

### 현황 (총 152개 `.data` 접근 발견)

| 우선순위 | 서비스 | `.data` 개수 | 상태 | 예상 시간 |
|---------|--------|-------------|------|----------|
| **P0** | command | 50개 | 🔴 | 2시간 |
| **P1** | global | 47개 | 🔴 | 2시간 |
| **P1** | battle | 25개 | 🔴 | 1시간 |
| **P1** | auction | ~10개 | 🟡 | 30분 |
| **P1** | general | 9개 | 🔴 | 30분 |
| **P2** | vote | 4개 | 🔴 | 15분 |
| **P2** | troop | 1개 | 🔴 | 5분 |
| - | message | 0개 | ✅ | - |
| - | betting | 0개 | ✅ | - |
| - | chief | 0개 | ✅ | - |
| - | nation | 0개 | ✅ | - |
| - | info | 0개 | ✅ | - |

**총 예상 작업 시간**: 6-7시간

---

## 🛠️ 작업 패턴

### ❌ Before
```typescript
const general = await generalRepository.findBySessionAndNo({
  session_id: sessionId,
  'data.no': generalId
});
if (general.data.rice < amount) { ... }
general.data.rice -= amount;
await general.save();
```

### ✅ After
```typescript
const general = await generalRepository.findBySessionAndNo(sessionId, generalId);
if (general.rice < amount) { ... }
await generalRepository.updateBySessionAndNo(sessionId, generalId, {
  rice: general.rice - amount
});
```

---

## 📋 작업 Phase

### Phase 1: 핵심 비즈니스 로직 (3-4시간)
1. ✅ auction 일부 (완료)
2. auction 나머지 (30분)
3. command 서비스 (2시간) - **최우선**
4. general 서비스 (30분)
5. vote, troop (20분)

### Phase 2: 시스템 로직 (3-4시간)
1. global 서비스 (2시간)
2. battle 서비스 (1시간)

---

## 🎯 다음 세션 계획

### 1단계: auction 완료 (30분)
- BidSellRiceAuction
- BidUniqueAuction
- OpenUniqueAuction
- Get* 시리즈 (3개)

### 2단계: command 시작 (2시간)
- ExecuteCommand.service.ts
- PushCommand.service.ts
- RepeatCommand.service.ts
- RaiseArmyCommand.service.ts

### 3단계: 테스트 (1시간)
- TypeScript 컴파일
- 메시지 기능 통합 테스트
- 경매 기능 테스트
- 커맨드 예약/실행 테스트

---

## 📊 전체 진행률

| 영역 | 진행률 | 다음 목표 |
|------|--------|----------|
| 백엔드 레포지토리 | 40% | 80% (Phase 1 완료) |
| 프론트엔드 UI | 70% | 85% (테스트 완료) |
| 기능 테스트 | 0% | 50% (핵심 기능) |
| 문서화 | 10% | 30% (API 문서) |

**전체**: **35%** → 목표 **60%**

---

## 🔍 주요 파일 위치

### 백엔드
```
open-sam-backend/
├── src/services/
│   ├── message/          ✅ 완료
│   ├── auction/          🟡 70% 완료
│   ├── command/          🔴 작업 필요 (최우선)
│   ├── general/          🔴 작업 필요
│   ├── global/           🔴 작업 필요
│   └── battle/           🔴 작업 필요
├── src/repositories/     ✅ 구조 완성
└── src/models/           ✅ 스키마 정의 완료
```

### 프론트엔드
```
open-sam-front/
├── src/components/
│   ├── game/MessagePanel.tsx        ✅ 5탭 UI
│   ├── cards/GeneralBasicCard.tsx   ✅ 개선 완료
│   └── game/PartialReservedCommand.tsx ✅ 50턴 확장
└── src/app/[server]/
    └── game/page.tsx                ✅ 메인 게임 화면
```

---

## 🐛 알려진 이슈

1. **MongoDB 쿼리 체이닝** - ✅ 해결 (배열 메서드 사용)
2. **메시지 system 타입** - 검증 필요
3. **경매 환불 로직** - 검증 필요
4. **`.data` 혼용** - 진행 중 (40% 완료)

---

## 📞 관련 문서

- **상세 TODO**: `TODO.md`
- **백엔드 아키텍처**: `references/backend-architecture.md`
- **데몬 구조**: `references/daemon-architecture.md`
- **TypeScript 마이그레이션**: `references/typescript-migration.md`
- **게임 시스템**: `references/game-systems.md`

---

## 💡 개발 명령어

### 백엔드
```bash
npm run dev           # 서버 + 데몬 (자동 재시작)
npm run typecheck     # TypeScript 체크 (커밋 전 필수)
npm test              # 전체 테스트
npx jest path/to/file.test.ts  # 단일 테스트
```

### 프론트엔드
```bash
npm run dev           # 개발 서버 (port 3000)
npm run build         # 프로덕션 빌드
npm run lint          # ESLint
```

---

## 🎓 코드 스타일

- **TypeScript**: `strict: false` (PHP 마이그레이션 레거시)
- **Imports**: 상대 경로 (`../../models/`)
- **Naming**: camelCase (함수/변수), PascalCase (클래스)
- **Interface**: `I` 접두사 (예: `IGeneral`)
- **Error**: try-catch, 한국어/영어 메시지
- **Comments**: 한국어 허용 (PHP 마이그레이션 레거시)

---

> **Note**: 이 문서는 프로젝트 전체 상황을 빠르게 파악하기 위한 요약입니다.  
> 상세 작업 목록은 `TODO.md`를 참고하세요.
