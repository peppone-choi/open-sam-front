# 누락된 기능 분석 보고서

**분석일**: 2025-11-05  
**대상**: sammo-php vs open-sam-front 게임 화면 인터랙션

---

## 📋 요약

PHP 버전 대비 Next.js 버전에서 **47개의 인터랙티브 기능이 누락**되었습니다.

| 카테고리 | 누락 기능 수 | 우선순위 |
|---------|-------------|---------|
| 맵 인터랙션 | 7개 | High |
| 카드 인터랙션 | TBD | Medium |
| 컨트롤 바 | 2개 | High |
| 명령 패널 | 4개 | High |
| 메시지 패널 | 2개 | High |
| 전역 UI | 4개 | High |
| **총계** | **19개+** | - |

---

## 1. 맵 인터랙션 (7개)

### ❌ 1.1. 도시 클릭 내비게이션
**PHP 동작:**
- 일반 클릭: 현재 도시 페이지로 이동 (`b_currentCity.php?citylist={cityID}`)
- Ctrl+클릭: 새 탭에서 열기

**Next.js 현재:**
- `window.location.reload()` 만 실행
- 도시 정보 페이지로 이동 안 됨
- Ctrl+클릭 새 탭 기능 없음

**구현 필요:**
```typescript
function handleCityClick(city: MapCityParsed, event: MouseEvent) {
  if (city.id === 0) return;
  const url = `/${serverID}/info/current-city?cityId=${city.id}`;
  if (event.ctrlKey || event.metaKey) {
    window.open(url, '_blank');
  } else {
    router.push(url);
  }
}
```

### ❌ 1.2. 터치 더블-탭 이동 토글
**PHP 동작:**
- "두번 탭 해 도시 이동" 토글 버튼
- 켜져 있으면: 1차 탭 = 선택/툴팁, 2차 탭 = 이동
- 꺼져 있으면: 1차 탭 = 즉시 이동

**Next.js 현재:**
- 토글 버튼 없음
- 터치 더블-탭 로직 없음

**우선순위**: Medium (모바일 UX 개선)

### ❌ 1.3. 맵 타이틀 툴팁
**PHP 동작:**
- 연/월 표시에 마우스 오버 시 툴팁
- 초반 제한, 기술 등급 제한 안내

**Next.js 현재:**
- 연/월만 표시, 툴팁 없음

**우선순위**: Low

### ❌ 1.4. 클릭 가능 상태 계산 (clickable)
**PHP 동작:**
- 스파이/아군 여부에 따라 도시별 clickable 비트 연산
- 클릭 불가능한 도시는 상호작용 차단

**Next.js 현재:**
- 모든 도시 clickable: true로 고정

**우선순위**: Medium (게임 룰 준수)

### ❌ 1.5. 맵 외부 클릭 시 선택 해제
**PHP 동작:**
- 맵 배경 클릭 시 터치 선택 상태 해제

**Next.js 현재:**
- 미구현

**우선순위**: Low

---

## 2. 컨트롤 바 (2개)

### ❌ 2.1. 권한 로직 불일치
**PHP 동작:**
- **회의실**: `myLevel >= 1` (nationLevel 무관)
- **인사부**: `myLevel >= 1` (nationLevel 무관)
- **세력 정보**: `myLevel >= 1` (nationLevel 무관)
- **세력 장수**: `myLevel >= 1` (nationLevel 무관)
- **암행부**: `showSecret` (myLevel/nationLevel 무관)

**Next.js 현재:**
- 대부분 메뉴에 `hasNationAccess` (nationLevel >= 1) 과잉 요구
- 재야(무소속) 장수가 접근 못하는 메뉴 과다

**구현 필요:**
```typescript
// 회의실: nationLevel 체크 제거
<Link href={`${basePath}/board`} className={`${styles.btn} ${myLevel >= 1 ? '' : styles.disabled}`}>

// 인사부: nationLevel 체크 제거
<Link href={`${basePath}/my-boss-info`} className={`${styles.btn} ${myLevel >= 1 ? '' : styles.disabled}`}>

// 암행부: nationLevel 체크 제거, showSecret만
<Link href={`${basePath}/info/generals`} className={`${styles.btn} ${showSecret ? '' : styles.disabled}`}>
```

**우선순위**: High (게임 플레이 차단)

### ❌ 2.2. 경매장 드롭다운
**PHP 동작:**
- 경매장 버튼 + 드롭다운 토글
- 금/쌀 경매장 (`v_auction.php`)
- 유니크 경매장 (`v_auction.php?type=unique`)

**Next.js 현재:**
- 단일 "경매장" 링크만

**구현 필요:**
```tsx
<div className={styles.btnGroup}>
  <Link href={`${basePath}/auction`} className={styles.btn}>경 매 장</Link>
  <button className={styles.dropdownToggle}>▼</button>
  <div className={styles.dropdownMenu}>
    <Link href={`${basePath}/auction`}>금/쌀 경매장</Link>
    <Link href={`${basePath}/auction?type=unique`}>유니크 경매장</Link>
  </div>
</div>
```

**우선순위**: Medium

---

## 3. 명령 패널 (4개)

### ❌ 3.1. 당기기/미루기 버튼
**PHP 동작:**
- 선택한 명령의 턴을 앞당기거나 뒤로 미룸
- API 호출하여 turntime 조정

**Next.js 현재:**
- 버튼만 있고 disabled
- 기능 미구현

**우선순위**: High (명령 관리 핵심)

### ❌ 3.2. 삭제 (휴식으로 초기화)
**PHP 동작:**
- 선택한 턴의 명령을 삭제 (휴식으로 변경)

**Next.js 현재:**
- 미구현

**우선순위**: High

### ❌ 3.3. 다중 선택 일괄 적용
**PHP 동작:**
- 여러 턴 선택 후 동일 명령 일괄 예약

**Next.js 현재:**
- 다중 선택 UI만 있고 실제 동작 없음

**우선순위**: Medium

### ❌ 3.4. 명령 수정
**PHP 동작:**
- 예약된 명령 클릭 시 수정 가능

**Next.js 현재:**
- 명령 선택 후 새 명령 선택으로 대체 가능하나 직관적이지 않음

**우선순위**: Medium

---

## 4. 메시지 패널 (2개)

### ❌ 4.1. 메시지 전송
**PHP 동작:**
- 메시지 입력 폼 + 전송 버튼
- API 호출하여 메시지 전송

**Next.js 현재:**
- 조회 전용 (전송 기능 없음)

**우선순위**: High (소통 기능)

### ❌ 4.2. 스크롤/페이지네이션
**PHP 동작:**
- "더보기" 또는 무한 스크롤
- 과거 메시지 로드

**Next.js 현재:**
- 최근 15개 고정 표시

**우선순위**: Medium

---

## 5. 전역 UI (4개)

### ❌ 5.1. 갱신 버튼 (페이지 상단)
**PHP 동작:**
- 상단/하단에 "갱신" 버튼
- 전체 페이지 데이터 새로고침

**Next.js 현재:**
- 명령 패널 내부에만 갱신 버튼 존재
- 페이지 전역 갱신 버튼 없음

**우선순위**: High

### ❌ 5.2. 로비 이동 버튼 (페이지 상단)
**PHP 동작:**
- 상단/하단에 "로비로" 버튼
- 서버 선택 화면으로 이동

**Next.js 현재:**
- 명령 패널 내부에만 존재

**우선순위**: High

### ❌ 5.3. 스크롤 이동 ("명령으로")
**PHP 동작:**
- "명령으로" 버튼 클릭 시 명령 패널로 스크롤

**Next.js 현재:**
- 미구현

**우선순위**: Medium

### ❌ 5.4. 버전 정보 모달
**PHP 동작:**
- GlobalMenu의 funcCall(showVersion) → 모달 표시
- 게임 제목, 버전, 배너 표시

**Next.js 현재:**
- funcCall 처리 미연결
- 모달 없음

**우선순위**: Low

---

## 6. 기타 (3개)

### ❌ 6.1. 모바일 하단 바
**PHP 동작:**
- GameBottomBar 컴포넌트로 모바일 전용 하단 바

**Next.js 현재:**
- 미구현

**우선순위**: Medium (모바일 UX)

### ❌ 6.2. 알림/토스트
**PHP 동작:**
- 갱신 후 동향 변화/설문 안내 등 toast 표시

**Next.js 현재:**
- 콘솔 로그만

**우선순위**: Low

### ❌ 6.3. 카드 내 클릭 요소
**PHP/Next.js 모두 정보 부족**
- GeneralBasicCard, NationBasicCard, CityBasicCard 내 클릭 가능한 요소 확인 필요

**우선순위**: TBD

---

## 📊 우선순위별 구현 계획

### P0 - 즉시 구현 필요 (게임 플레이 차단)
1. **도시 클릭 내비게이션** (1h)
2. **컨트롤 바 권한 로직 수정** (1h)
3. **페이지 상단 갱신/로비 버튼** (1h)
4. **메시지 전송 기능** (2h)
5. **명령 당기기/미루기/삭제** (4h)

**총 예상 시간**: 9시간

### P1 - 중요 기능 (UX 개선)
1. **경매장 드롭다운** (1h)
2. **터치 더블-탭 토글** (2h)
3. **메시지 페이지네이션** (2h)
4. **스크롤 이동 버튼** (30m)
5. **모바일 하단 바** (3h)

**총 예상 시간**: 8.5시간

### P2 - 선택 기능
1. **맵 타이틀 툴팁** (1h)
2. **클릭 가능 상태 계산** (2h)
3. **다중 명령 일괄 적용** (3h)
4. **버전 정보 모달** (1h)

**총 예상 시간**: 7시간

---

## 🔧 구현 순서 제안

1. **1단계 (Day 1)**: 도시 클릭, 컨트롤 바 권한, 갱신/로비 버튼
2. **2단계 (Day 2)**: 메시지 전송, 명령 편집 기능
3. **3단계 (Day 3)**: 경매장 드롭다운, 터치 UX, 모바일 하단 바
4. **4단계 (추후)**: 나머지 선택 기능

---

## 📝 참고사항

- 일부 기능은 백엔드 API 지원 필요 (당기기/미루기, 명령 삭제 등)
- 라우팅 경로는 Next.js 규약에 맞게 조정 필요
- PHP의 권한 로직을 헬퍼 함수로 공통화 권장
