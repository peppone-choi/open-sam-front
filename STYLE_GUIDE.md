# 🎨 오픈 삼국 프론트엔드 스타일 가이드

> CSS 변수 시스템 및 스타일 작성 규칙

---

## 📋 목차

1. [CSS 변수 시스템](#css-변수-시스템)
2. [색상 팔레트](#색상-팔레트)
3. [간격 시스템](#간격-시스템)
4. [반경 및 그림자](#반경-및-그림자)
5. [타이포그래피](#타이포그래피)
6. [반응형 Breakpoints](#반응형-breakpoints)
7. [컴포넌트 스타일 규칙](#컴포넌트-스타일-규칙)
8. [게임 UI 색상](#게임-ui-색상)

---

## CSS 변수 시스템

모든 CSS 변수는 `src/app/globals.css`의 `:root`에 정의됩니다.

### 변수 명명 규칙

```css
/* 배경 */
--bg-{name}         /* 배경 색상 */
--color-surface     /* 표면 색상 (common-layout.css 호환) */

/* 텍스트 */
--text-{name}       /* 텍스트 색상 */
--color-text        /* 기본 텍스트 (common-layout.css 호환) */

/* 간격 */
--space-{size}      /* sm, md, lg, xl, 2xl, 3xl */
--gap-{size}        /* 그리드/플렉스 갭 */
--pad-{number}      /* 패딩 (1-4) */

/* 반경 */
--radius-{size}     /* sm, md, lg, xl */

/* 그림자 */
--shadow-{size}     /* sm, md, lg, xl */
--shadow-{number}   /* 1, 2 (common-layout.css 호환) */

/* 전환 */
--transition-{speed}  /* fast, normal */
--motion-{speed}      /* ms 단위 (common-layout.css 호환) */

/* 게임 UI */
--game-{name}       /* 게임 전용 색상 */
--log-{color}       /* 로그 색상 */
```

---

## 색상 팔레트

### Primary 색상
| 변수 | 값 | 용도 |
|------|-----|------|
| `--primary` | `#6366f1` | 주요 버튼, 액센트 |
| `--primary-hover` | `#4f46e5` | 호버 상태 |
| `--primary-foreground` | `#ffffff` | 텍스트 |

### Secondary 색상
| 변수 | 값 | 용도 |
|------|-----|------|
| `--secondary` | `#ec4899` | 보조 버튼, 강조 |
| `--secondary-hover` | `#db2777` | 호버 상태 |

### 배경 색상
| 변수 | 값 | 용도 |
|------|-----|------|
| `--bg-main` | `#050510` | 전체 배경 |
| `--bg-secondary` | `#101520` | 패널 배경 |
| `--bg-tertiary` | `#1a1a1a` | 카드 배경 |
| `--bg-glass` | `rgba(16, 21, 32, 0.8)` | 글래스모피즘 |

### 텍스트 색상
| 변수 | 값 | 용도 |
|------|-----|------|
| `--text-main` | `#E0E0E0` | 기본 텍스트 |
| `--text-muted` | `#9CA3AF` | 보조 텍스트 |
| `--text-dim` | `#64748b` | 희미한 텍스트 |

### 테두리 색상
| 변수 | 값 | 용도 |
|------|-----|------|
| `--border-color` | `rgba(148, 163, 184, 0.1)` | 기본 테두리 |
| `--border-highlight` | `rgba(148, 163, 184, 0.2)` | 강조 테두리 |

---

## 간격 시스템

### Space (마진, 패딩)
| 변수 | 값 | 픽셀 |
|------|-----|------|
| `--space-xs` | `0.25rem` | 4px |
| `--space-sm` | `0.5rem` | 8px |
| `--space-md` | `1rem` | 16px |
| `--space-lg` | `1.5rem` | 24px |
| `--space-xl` | `2rem` | 32px |
| `--space-2xl` | `2.5rem` | 40px |
| `--space-3xl` | `3rem` | 48px |

### Gap (그리드/플렉스)
| 변수 | 값 |
|------|-----|
| `--gap-xs` | `0.25rem` |
| `--gap-sm` | `0.5rem` |
| `--gap-md` | `1rem` |
| `--gap-lg` | `1.5rem` |

### Padding (숫자)
| 변수 | 값 |
|------|-----|
| `--pad-1` | `0.25rem` |
| `--pad-2` | `0.5rem` |
| `--pad-3` | `0.75rem` |
| `--pad-4` | `1rem` |

---

## 반경 및 그림자

### Border Radius
| 변수 | 값 | 용도 |
|------|-----|------|
| `--radius-sm` | `0.25rem` | 작은 버튼, 태그 |
| `--radius-md` | `0.5rem` | 기본 컴포넌트 |
| `--radius-lg` | `0.75rem` | 카드, 패널 |
| `--radius-xl` | `1rem` | 모달, 대형 카드 |

### Box Shadow
| 변수 | 용도 |
|------|------|
| `--shadow-sm` | 약한 엘리베이션 |
| `--shadow-md` | 기본 카드 |
| `--shadow-lg` | 모달, 드롭다운 |
| `--shadow-xl` | 최상위 레이어 |
| `--shadow-1` | common-layout 호환 |
| `--shadow-2` | common-layout 호환 |

---

## 타이포그래피

### Font Size
| 변수 | 값 | 용도 |
|------|-----|------|
| `--font-size-xs` | `0.75rem` | 캡션, 레이블 |
| `--font-size-sm` | `0.875rem` | 보조 텍스트 |
| `--font-size-md` | `1rem` | 본문 |
| `--font-size-lg` | `1.125rem` | 서브헤딩 |
| `--font-size-xl` | `1.25rem` | 헤딩 |
| `--font-size-2xl` | `1.5rem` | 대형 헤딩 |

### Font Weight
| 변수 | 값 |
|------|-----|
| `--font-weight-normal` | `400` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |
| `--font-weight-bold` | `700` |

### Font Family (Tailwind)
```css
font-sans   /* Outfit - 기본 */
font-serif  /* Times New Roman - Empire 테마 */
font-mono   /* JetBrains Mono - HUD/데이터 */
```

---

## 반응형 Breakpoints

### Tailwind 기본값 사용
| 접두사 | 너비 |
|--------|------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### CSS Media Query
```css
@media (max-width: 768px) {
  /* 모바일 스타일 */
}

@media (max-width: 1024px) {
  /* 태블릿 스타일 */
}
```

---

## 컴포넌트 스타일 규칙

### ✅ 권장 사항

```css
/* 1. CSS 변수 사용 */
.button {
  background-color: var(--bg-secondary);
  color: var(--text-main);
  border-radius: var(--radius-md);
  padding: var(--pad-2) var(--pad-4);
  transition: all var(--transition-fast);
}

/* 2. 게임 UI 색상은 --game-* 변수 사용 */
.attackerUnit {
  background-color: var(--game-attacker);
  border-color: var(--game-attacker-border);
}

/* 3. 로그 색상은 --log-* 변수 사용 */
.logError {
  color: var(--log-red);
}
```

### ❌ 피해야 할 것

```css
/* 하드코딩된 색상 사용 금지 */
.button {
  background-color: #333;  /* ❌ */
  color: white;            /* ❌ */
}

/* 인라인 픽셀 값 사용 금지 */
.card {
  padding: 16px;           /* ❌ */
  border-radius: 8px;      /* ❌ */
}
```

---

## 게임 UI 색상

### 유닛 색상
| 변수 | 용도 |
|------|------|
| `--game-attacker` | 공격자 배경 |
| `--game-attacker-border` | 공격자 테두리 |
| `--game-defender` | 방어자 배경 |
| `--game-defender-border` | 방어자 테두리 |
| `--game-selected` | 선택된 유닛 |

### 패널/그리드 색상
| 변수 | 용도 |
|------|------|
| `--game-grid-bg` | 그리드 셀 배경 |
| `--game-grid-border` | 그리드 테두리 |
| `--game-grid-hover` | 그리드 호버 |
| `--game-panel-bg` | 패널 배경 |
| `--game-panel-border` | 패널 테두리 |

### 상태 색상
| 변수 | 용도 |
|------|------|
| `--game-active` | 활성 상태 |
| `--game-active-border` | 활성 테두리 |
| `--game-disabled` | 비활성 상태 |
| `--game-positive` | 긍정적 값 |
| `--game-negative` | 부정적 값 |

### 로그 색상
| 변수 | 기본값 |
|------|--------|
| `--log-red` | `#ff6b6b` |
| `--log-blue` | `#74b9ff` |
| `--log-green` | `#55efc4` |
| `--log-yellow` | `#ffeaa7` |
| `--log-cyan` | `#81ecec` |
| `--log-magenta` | `#fd79a8` |
| `--log-lime` | `#00b894` |
| `--log-orange` | `#e17055` |
| `--log-white` | `#dfe6e9` |

---

## 파일 구조

```
src/
├── app/
│   └── globals.css          # 전역 CSS 변수 정의
├── styles/
│   ├── common-layout.css    # 공통 레이아웃 클래스
│   └── log.css              # 로그 색상 클래스
└── components/
    └── **/*.module.css      # 컴포넌트별 CSS Module
```

---

## 마이그레이션 가이드

기존 하드코딩된 색상을 CSS 변수로 변환하는 방법:

| 기존 값 | 변환 후 |
|---------|---------|
| `#1a1a1a` | `var(--bg-tertiary)` |
| `#333` | `var(--game-grid-border)` |
| `#666` | `var(--game-panel-border)` |
| `#888` | `var(--text-muted)` |
| `white` | `var(--text-main)` |
| `#0066cc` | `var(--game-active)` |
| `#ff4444` | `var(--game-attacker-border)` |
| `#4444ff` | `var(--game-defender-border)` |
| `0.5rem` | `var(--radius-md)` 또는 `var(--pad-2)` |

---

## 체크리스트

새 컴포넌트 스타일 작성 시:

- [ ] 모든 색상에 CSS 변수 사용
- [ ] 간격(padding, margin)에 `--space-*` 변수 사용
- [ ] 반경에 `--radius-*` 변수 사용
- [ ] 그림자에 `--shadow-*` 변수 사용
- [ ] 전환에 `--transition-*` 변수 사용
- [ ] 게임 UI는 `--game-*` 변수 사용
- [ ] 반응형 breakpoint는 Tailwind 기본값 사용

---

*Last updated: 2025-11-27*




