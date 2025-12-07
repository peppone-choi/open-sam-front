# Agent 13: Hall of Fame & Ranking UI

## 📌 Context
백엔드에서 제공하는 명예의 전당(통일 역사) 및 랭킹 데이터를 보여주는 페이지를 구현합니다.

## ✅ Checklist
- [x] `/history` 페이지 구현: 역대 통일 기록 타임라인 표시
- [x] `/ranking` 페이지 구현: 탭(장수/국가)으로 구분하여 랭킹 테이블 표시
- [x] 페이지네이션 및 정렬 필터 UI
- [x] API 연동 (`/api/history`, `/api/ranking/*`)

## 💬 Communication
- **Status**: [Done]
- **Current Issue**: 없음
- **Memo**: 백엔드 API 명세(Agent 12)가 확정되면 타입을 가져와서 사용하세요.

## 📁 구현된 파일

### 페이지
- `src/app/ranking/page.tsx` - 장수/국가 랭킹 페이지 (탭 기반)
- `src/app/history/page.tsx` - 역대 통일 기록 타임라인 페이지

### 컴포넌트
- `src/components/ranking/RankingTable.tsx` - 랭킹 테이블, 순위 뱃지, 능력치 바, 페이지네이션
- `src/components/ranking/UnificationTimeline.tsx` - 통일 기록 타임라인
- `src/components/ranking/index.ts` - 컴포넌트 export

### 타입
- `src/types/ranking.ts` - GeneralRankingEntry, NationRankingEntry, UnificationRecord 등

### API
- `src/lib/api/sammo.ts` 에 추가:
  - `GetGeneralRanking()` - 장수 랭킹 조회
  - `GetNationRanking()` - 국가 랭킹 조회
  - `GetUnificationHistory()` - 통일 기록 조회

## 🚀 Prompts

### 시작 프롬프트
```markdown
당신은 프론트엔드 UI 개발자입니다.
Next.js 16과 React 19를 사용하여 **명예의 전당 및 랭킹 페이지**를 구현해야 합니다.

1. `/history`: 역대 통일 기록을 카드 리스트나 타임라인 형태로 보여주는 컴포넌트를 설계하세요.
2. `/ranking`: 장수 랭킹과 국가 랭킹을 탭으로 전환하며 볼 수 있는 테이블 컴포넌트를 설계하세요.
   - TanStack Table(React Table) 사용 권장
   - Shadcn UI 컴포넌트 활용
```

### 이어지는 프롬프트
```markdown
설계한 UI를 실제로 구현해주세요.
`fetch` 함수나 `SWR`/`TanStack Query`를 사용하여 백엔드 API(`/api/history`, `/api/ranking/generals`)와 연동하는 로직까지 작성해주세요.
데이터가 로딩 중일 때의 스켈레톤 UI도 포함해주세요.
```

