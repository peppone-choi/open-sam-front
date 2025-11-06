# Toast 알림 시스템 사용 가이드

## 개요

게임 내 사용자 액션에 대한 피드백을 제공하는 Toast 알림 시스템입니다.

## 파일 구조

```
src/
├── contexts/
│   └── ToastContext.tsx          # Toast 전역 상태 관리
├── components/
│   └── common/
│       ├── ToastContainer.tsx    # Toast 표시 컴포넌트
│       └── Toast.module.css      # Toast 스타일
└── app/
    └── layout.tsx                # ToastProvider 적용
```

## 기능

### 1. Toast 타입

- **success**: 성공 메시지 (초록색)
- **error**: 에러 메시지 (빨간색)
- **info**: 정보 메시지 (파란색)
- **warning**: 경고 메시지 (주황색)

### 2. 자동 사라짐

- 모든 Toast는 4초 후 자동으로 사라집니다
- 사용자가 ×버튼을 클릭하여 수동으로 닫을 수 있습니다

### 3. 다중 Toast

- 여러 Toast가 화면 우측 상단에 쌓여서 표시됩니다
- 새로운 Toast는 아래에 추가됩니다

## 사용 방법

### 1. useToast 훅 가져오기

```tsx
import { useToast } from '@/contexts/ToastContext';

function MyComponent() {
  const { showToast } = useToast();
  
  // ...
}
```

### 2. Toast 표시하기

```tsx
// 성공 메시지
showToast('작업이 완료되었습니다.', 'success');

// 에러 메시지
showToast('작업에 실패했습니다.', 'error');

// 정보 메시지
showToast('새로운 메시지가 도착했습니다.', 'info');

// 경고 메시지
showToast('주의가 필요합니다.', 'warning');

// 타입 생략 시 기본값은 'info'
showToast('일반 메시지');
```

## 적용 예시

### 1. 메시지 전송 (MessagePanel.tsx)

```tsx
const { showToast } = useToast();

async function handleSendMessage() {
  try {
    const result = await SammoAPI.MessageSendMessage({ ... });
    
    if (result.success) {
      showToast('메시지를 전송했습니다.', 'success');
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('메시지 전송에 실패했습니다.', 'error');
  }
}
```

### 2. 명령 실행 (PartialReservedCommand.tsx)

```tsx
const { showToast } = useToast();

async function handlePullCommand() {
  try {
    const response = await SammoAPI.PullCommand({ ... });
    
    if (response.success) {
      showToast('명령을 당겼습니다.', 'success');
    } else {
      showToast(`명령 당기기 실패: ${response.message}`, 'error');
    }
  } catch (error) {
    showToast('명령 당기기에 실패했습니다.', 'error');
  }
}
```

## 현재 적용된 위치

### 1. MessagePanel (메시지 패널)
- ✅ 메시지 전송 성공/실패

### 2. PartialReservedCommand (명령 목록)
- ✅ 명령 당기기 성공/실패
- ✅ 명령 미루기 성공/실패
- ✅ 명령 삭제 성공/실패
- ✅ 명령 일괄 적용 성공/실패

## 추가 적용 가능 위치

### 우선순위 높음
1. **갱신 후 동향 변화 알림**
   - 턴 갱신 후 주요 변화 알림
   - 새로운 메시지/외교 알림

2. **투표/설문 알림**
   - 투표 제출 성공
   - 설문 응답 완료

3. **장수 선택/생성**
   - 장수 생성 완료
   - NPC 선택 완료

### 우선순위 중간
4. **전투 관련**
   - 전투 시작 알림
   - 전투 결과 알림

5. **아이템/경매**
   - 입찰 성공/실패
   - 낙찰 알림

### 우선순위 낮음
6. **설정 변경**
   - 프로필 업데이트
   - 설정 저장

## 커스터마이징

### Toast 표시 시간 변경

`src/contexts/ToastContext.tsx`에서 타임아웃 값 수정:

```tsx
setTimeout(() => {
  removeToast(id);
}, 4000); // 4초 -> 원하는 시간(ms)으로 변경
```

### Toast 위치 변경

`src/components/common/Toast.module.css`에서 위치 수정:

```css
.toastContainer {
  position: fixed;
  top: 20px;    /* 상단 여백 */
  right: 20px;  /* 우측 여백 */
  /* left: 20px; 좌측으로 변경 시 */
}
```

### 스타일 커스터마이징

`Toast.module.css`에서 각 타입별 색상, 크기, 애니메이션 등을 수정할 수 있습니다.

## 주의사항

1. **useToast는 컴포넌트 내부에서만 사용 가능**
   - ToastProvider 외부에서는 사용 불가
   - 현재 app/layout.tsx에 전역으로 적용됨

2. **중복 Toast 방지**
   - 같은 메시지가 연속으로 표시되지 않도록 주의
   - 필요시 debounce 적용 고려

3. **메시지 길이**
   - 너무 긴 메시지는 자동 줄바꿈됨
   - 간결하고 명확한 메시지 사용 권장

## 향후 개선 사항

- [ ] Toast 우선순위 시스템 (중요한 Toast 먼저 표시)
- [ ] Toast 클릭 시 상세 정보 표시
- [ ] Toast 히스토리 기능
- [ ] 사운드 효과 추가
- [ ] 모바일 대응 (위치 조정)
