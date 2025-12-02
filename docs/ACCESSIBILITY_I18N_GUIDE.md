# 접근성 및 다국어(i18n) 가이드

이 문서는 오픈 삼국 프론트엔드의 접근성(A11y)과 다국어 지원(i18n) 구현을 설명합니다.

## 1. 접근성 (Accessibility)

### 1.1 ARIA 레이블

주요 컴포넌트에 ARIA 속성이 적용되어 있습니다:

| 컴포넌트 | 적용된 ARIA |
|---------|------------|
| `Dialog` | `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`, 포커스 트랩 |
| `Tooltip` | `role="tooltip"`, `aria-describedby` |
| `ToastContainer` | `role="alert"`, `aria-live` (polite/assertive) |
| `TopBackBar` | `aria-label`, `aria-pressed` |
| `GameViewTabs` | `role="tablist"`, `role="tab"`, `aria-selected` |
| `MainControlBar` | `aria-haspopup`, `aria-expanded`, `role="menu"` |

### 1.2 키보드 네비게이션

```tsx
// 포커스 트랩 훅 사용 예시
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Modal({ isOpen, onClose }) {
  const containerRef = useFocusTrap<HTMLDivElement>({ enabled: isOpen });
  
  return (
    <div ref={containerRef} role="dialog">
      {/* 모달 내용 */}
    </div>
  );
}

// 화살표 키 네비게이션 훅
import { useArrowKeyNavigation } from '@/hooks/useFocusTrap';

function Menu() {
  const containerRef = useArrowKeyNavigation<HTMLUListElement>('button');
  
  return (
    <ul ref={containerRef} role="menu">
      <li><button role="menuitem">항목 1</button></li>
      <li><button role="menuitem">항목 2</button></li>
    </ul>
  );
}
```

### 1.3 포커스 스타일

`globals.css`에 정의된 포커스 스타일:

```css
/* 키보드 사용자용 포커스 링 */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* 고대비 포커스 (접근성 옵션) */
.focus-high-contrast:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}
```

### 1.4 색상 대비

WCAG 2.1 AA 기준 준수를 위한 유틸리티:

```tsx
import { 
  checkWCAGCompliance, 
  adjustColorForContrast 
} from '@/lib/utils/colorContrast';

// 대비율 검사
const result = checkWCAGCompliance('#ffffff', '#6366f1');
console.log(result.passes); // true (4.5:1 이상)

// 자동 대비 조정
const adjustedColor = adjustColorForContrast('#888888', '#000000', 4.5);
```

### 1.5 스킵 링크

`layout.tsx`에 구현된 스킵 링크:

```tsx
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only ..."
>
  본문으로 바로가기
</a>
```

### 1.6 Reduced Motion

애니메이션 비활성화 지원:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 2. 다국어 지원 (i18n)

### 2.1 설정

**next-intl** 라이브러리를 사용합니다.

```bash
npm install next-intl
```

**디렉토리 구조:**
```
open-sam-front/
├── messages/
│   ├── ko.json  # 한국어 (기본)
│   └── en.json  # 영어
├── src/
│   ├── i18n/
│   │   ├── routing.ts    # 라우팅 설정
│   │   ├── request.ts    # 서버 요청 설정
│   │   ├── navigation.ts # 네비게이션 API
│   │   └── index.ts      # exports
│   └── middleware.ts     # 로케일 미들웨어
```

### 2.2 서버 컴포넌트에서 사용

```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('common');
  
  return (
    <div>
      <h1>{t('logout')}</h1>
      <p>{t('loading')}</p>
    </div>
  );
}
```

### 2.3 클라이언트 컴포넌트에서 사용

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function Button() {
  const t = useTranslations('common');
  
  return <button>{t('confirm')}</button>;
}
```

### 2.4 파라미터가 있는 번역

```json
// messages/ko.json
{
  "layout": {
    "statusBar": {
      "commandPoint": "명령력: {current}/{max}"
    }
  }
}
```

```tsx
const t = useTranslations('layout.statusBar');
<span>{t('commandPoint', { current: 100, max: 120 })}</span>
// 출력: "명령력: 100/120"
```

### 2.5 로케일 인식 네비게이션

```tsx
import { Link, useRouter, usePathname } from '@/i18n/navigation';

// 링크 (로케일 자동 처리)
<Link href="/game">게임으로</Link>

// 프로그래매틱 네비게이션
const router = useRouter();
router.push('/game');

// 현재 경로 (로케일 없이)
const pathname = usePathname();
// /ko/game → /game
```

### 2.6 언어 전환

```tsx
'use client';

import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
  };

  return (
    <div>
      <button 
        onClick={() => switchLocale('ko')}
        aria-pressed={locale === 'ko'}
      >
        한국어
      </button>
      <button 
        onClick={() => switchLocale('en')}
        aria-pressed={locale === 'en'}
      >
        English
      </button>
    </div>
  );
}
```

---

## 3. 체크리스트

### 접근성 체크리스트

- [x] 스킵 링크 구현
- [x] `lang` 속성 설정 (`lang="ko"`)
- [x] ARIA 레이블 추가 (버튼, 폼, 모달)
- [x] 포커스 관리 및 트랩
- [x] 키보드 네비게이션 지원
- [x] 색상 대비 검증 유틸리티
- [x] `prefers-reduced-motion` 지원
- [x] 고대비 모드 지원

### i18n 체크리스트

- [x] next-intl 설정
- [x] 메시지 파일 구조화 (ko.json, en.json)
- [x] 미들웨어 설정
- [x] 네비게이션 API 생성
- [x] 기본 텍스트 추출

---

## 4. 향후 작업

1. **스크린 리더 테스트**: NVDA, VoiceOver로 실제 테스트
2. **자동 테스트 추가**: jest-axe, Playwright a11y 테스트
3. **번역 완료**: 모든 하드코딩된 텍스트를 메시지 파일로 이동
4. **추가 언어**: 일본어, 중국어 등 지원 확대


