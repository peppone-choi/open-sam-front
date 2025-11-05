# 프론트엔드 TODO 목록

## 🔴 긴급 (Critical)

### 1. Processing 커맨드 폼 미완성 (3개)
- ❌ `che_불가침제의` (Nation) - 불가침 제의 커맨드
- ❌ `che_피장파장` (Nation) - 피장파장 전략 커맨드  
- ❌ `cr_인구이동` (Nation) - 인구 이동 커맨드

**참고**: 이미 `NoAggressionProposalCommandForm`, `PiJangPaJangCommandForm`, `MovePopulationCommandForm`이 구현되어 있지만, 백엔드 연동 및 테스트 필요

### 2. 프론트엔드 컴포넌트 TODO
- `MapViewer.tsx`: `isFullWidth` 실제 값으로 변경 (현재 하드코딩 `true`)
- `SelectCity.tsx`: 실제 사용 불가능 여부 확인 (`notAvailable` 로직)
- `MessagePanel.tsx`: 실제 메시지 패널 구현 완성 (현재 기본 기능만)
- `GeneralBasicCard.tsx`: 실제 이미지 서버 경로 구성 확인
- `MapCityDetail.tsx`: 실제 이미지 경로로 변경 확인

## 🟡 중요 (High Priority)

### 3. 게임 페이지 완성도 향상

#### `board` 페이지
- TipTap 에디터 및 이미지 업로드 구현
- 댓글 작성/수정/삭제 기능
- 게시글 검색 및 필터링

#### `auction` 페이지
- 입찰/낙찰 기능 구현
- 경매 상세 페이지
- 입찰 히스토리 표시

#### `battle-center` 페이지
- 전투 시뮬레이터 연동
- 전투 상세 페이지
- 전투 참가 기능

#### `diplomacy` 페이지
- 외교 메시지 처리 완성
- 외교 상태 표시 개선
- 외교 이력 조회

#### `troop` 페이지
- 부대 목록 API 연동 확인
- 부대 관리 기능 (해체, 편성 등)
- 부대 명령 예약 기능

### 4. UI/UX 개선
- 로딩 상태 표시 개선
- 에러 처리 및 사용자 피드백 강화
- 반응형 디자인 개선
- 다크 모드 지원

## 🟢 낮은 우선순위 (Low Priority)

### 5. 성능 최적화
- 이미지 지연 로딩
- 컴포넌트 메모이제이션
- API 호출 최적화
- 번들 크기 최적화

### 6. 접근성
- 키보드 네비게이션
- 스크린 리더 지원
- ARIA 레이블 추가

### 7. 테스트
- 단위 테스트 작성
- 통합 테스트 작성
- E2E 테스트 작성

## 📊 통계

- **미완성 커맨드 폼**: 3개 (기본 구현 완료, 테스트 필요)
- **컴포넌트 TODO**: 5개
- **게임 페이지 개선**: 5개 페이지
- **기타**: 성능, 접근성, 테스트

## 우선순위 추천

1. **1순위**: Processing 커맨드 폼 테스트 및 완성
2. **2순위**: 게임 페이지 핵심 기능 완성 (auction 입찰, battle-center 전투 연동)
3. **3순위**: 프론트엔드 컴포넌트 TODO 완성
4. **4순위**: UI/UX 개선

