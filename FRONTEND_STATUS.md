# FRONTEND_STATUS

## 현재 상태 요약
- 📄 Next.js 페이지: 82개 (모든 핵심 및 부가 기능 페이지 구현 완료)
- 🎨 React 컴포넌트: 65개 (UI 컴포넌트 현대화 완료)
- ⚙️ Admin Hub & 세션 관리: Tailwind 리디자인 + 카드형 서버/시나리오 패널 완성
- ✅ **PHP 원본 대비 포팅 상태**
  - 핵심 게임 로직 (커맨드, 턴 처리 등): API 연결 완료 (PHP 로직 유지)
  - UI/UX: 100% React/Next.js로 현대화 완료
  - 반응형 디자인: 모바일 지원 강화 (MainControlBar, BottomBar 등)

---

## 1. 주요 기능 구현 현황

### ✅ 핵심 기능 (P0)
- **메인 대시보드 (`/game`):** 지도, 장수 정보, 커맨드 큐, 로그 패널 통합
- **커맨드 시스템:**
  - 재야 장수 (거병, 임관, 사관): `PartialReservedCommand` 및 전용 폼 구현 완료
  - 일반/수뇌부 명령: 예약 및 즉시 실행 시스템 구현 완료
  - 폼 UI: `RaiseArmy`, `Move`, `Conscript` 등 모든 레거시 커맨드 폼 이식 완료

### ✅ 정보 조회 (P1)
- **외교 (`/diplomacy`):** 문서 송수신, 수락/거절 처리, 에디터 연동 완료
- **세력 정보 (`/info/nation`):** 국가 정보 카드 및 리스트 뷰 구현
- **장수 정보 (`/info/general`):** 장수 상세 카드, 스택(부대) 정보 표시 구현
- **도시 정보 (`/info/city`):** 정렬 및 필터링 가능한 도시 목록 구현

### ✅ 상호작용 및 전투 (P2)
- **메시지 (`MessagePanel`):** 실시간 채팅형 UI, 장수 아이콘 표시 구현
- **전투 (`/battle`):**
  - 전투 센터 (`/battle-center`): 진행 중인 전투 목록
  - 전투 상세 (`/battle/[id]`): 40x40 헥사/그리드 맵 시뮬레이터 구현
  - 시뮬레이터: 유닛 배치 및 조작 UI 구현
  - 실시간 최적화: requestAnimationFrame 기반 20TPS 동기화 + 모바일 멀티터치 드래그/탭 대응, battle socket 구독 1회화

### ✅ 부가 기능 (Economics/Minigames) - *최종 점검 완료*
- **경매장 (`/auction`):**
  - 유니크 아이템 경매 및 입찰 기능
  - 쌀/금 자원 경매 및 입찰 기능
- **베팅장 (`/betting`):**
  - 진행 중인 베팅 목록 및 상세 정보 조회
  - 후보 선택 및 베팅(투표) 기능
- **토너먼트 (`/tournament`):**
  - 대회 상태 조회 및 참가 신청/취소
- **중원 정보 (`/world`):**
  - 국가 간 외교 관계 매트릭스(Matrix) 뷰
  - 도시 분쟁 현황 그래프
- **유산 관리 (`/inherit`):** 포인트 조회 및 관리

### ✅ 랭킹 및 기록 (Ranking/History)
- **랭킹 (`/archive/*`):** 명장, 국력, 도시 등 다양한 랭킹 페이지 구현
- **역사 (`/history`):** 연도별 역사 기록 조회 기능 구현
- **게시판 (`/board`):** 회의실/기밀실 등 게시판 시스템 연동

## 2. 남은 작업 및 개선 사항
- [ ] **테스트:** admin/battle Playwright 시나리오 추가, 실기기 통합·모바일 터치 회귀 검증 대기
- [x] **최적화:** 전투 맵 RAF 스로틀·소켓 정리 완료, Sprite batching/텍스처 압축 완료
  - `ThreeBattleMap.tsx`: Material/Mesh 풀링 시스템 도입 (메모리 재사용)
  - `IsoTacticalBattleMap.tsx`: Graphics 오브젝트 풀링 적용
  - `assetOptimizer.ts`: WebP 지원, DPR 적응형 이미지, ImageBitmap 최적화
- [x] **테마:** 국가별 색상 테마(ColorSystem) 완료
  - `colorSystem.ts`: `createColorSystem()` 함수로 국가색 기반 동적 테마 생성
  - `ThemeProvider.tsx`: 국가색 연동, CSS 변수 자동 적용
  - 밝은 색상(금색/노란색) 가독성 개선 - 자동 대비 조정

## 3. PHP 페이지 매핑 완료
기존 `j_*`, `a_*`, `b_*` 등 모든 PHP 페이지의 기능이 Next.js 라우트 및 API로 매핑되었습니다.
