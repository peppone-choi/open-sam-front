# Accessibility Checklist for OpenSAM Frontend

## Quick Reference for Developers

### Images and Media
- ✅ **Alt Text**: All `<img>` tags have descriptive alt text
- ✅ **Decorative Images**: Use `aria-hidden="true"` for decorative SVGs
- ✅ **Context**: Alt text describes the content AND context

```tsx
// ✅ Good - Descriptive and contextual
<img src="/portrait.jpg" alt="이순신 - 조선 소속 장수 초상" />

// ❌ Bad - Generic
<img src="/portrait.jpg" alt="캐릭터 초상" />

// ✅ Good - Decorative icon with button label
<button aria-label="메뉴 열기">
  <svg aria-hidden="true">...</svg>
</button>
```

---

### Buttons and Interactive Elements

#### Use Semantic HTML
```tsx
// ❌ Bad - div as button
<div onClick={handleClick}>Click me</div>

// ✅ Good - proper button
<button type="button" onClick={handleClick}>
  Click me
</button>
```

#### Add ARIA attributes
```tsx
<button
  type="button"
  aria-label="도시 선택 메뉴 열기"
  aria-expanded={isOpen}
  aria-haspopup="listbox"
>
  {selectedCity.name}
</button>
```

---

### Form Inputs

#### Always Associate Labels
```tsx
// ✅ Visible label
<label htmlFor="username">계정명</label>
<input id="username" type="text" />

// ✅ Screen-reader only label
<label htmlFor="search" className="sr-only">검색</label>
<input id="search" type="text" placeholder="검색..." />

// ✅ ARIA label when no label element possible
<input type="text" aria-label="도시 검색" />
```

#### Number Inputs
```tsx
<input
  type="number"
  aria-label="금액 입력"
  aria-valuemin={0}
  aria-valuemax={1000}
  aria-valuenow={value}
/>
```

---

### Navigation

#### Skip Links
```tsx
// Already implemented in layout.tsx
<a href="#main-content" className="sr-only focus:not-sr-only ...">
  본문으로 바로가기
</a>

<main id="main-content">
  {children}
</main>
```

#### Nav Links
```tsx
<Link href="/user-info" aria-label="비밀번호 및 정보 수정 페이지로 이동">
  비밀번호 &amp; 정보 수정
</Link>
```

---

### SVG Icons

```tsx
// ❌ Bad - no accessibility info
<svg>...</svg>

// ✅ Good - decorative icon in labeled button
<button aria-label="닫기">
  <svg aria-hidden="true">...</svg>
</button>

// ✅ Good - standalone meaningful icon
<svg aria-label="경고 아이콘">...</svg>

// ✅ Good - icon with visible text
<button>
  <svg aria-hidden="true">...</svg>
  <span>로그아웃</span>
</button>
```

---

### Alerts and Notifications

```tsx
// ✅ Error messages
<div role="alert" className="error-message">
  <svg aria-label="오류 아이콘">...</svg>
  {errorMessage}
</div>

// ✅ Live regions for dynamic updates
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

---

### Keyboard Navigation

#### Focus Management
```tsx
// Ensure visible focus indicators
.button:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

// Don't remove outlines!
// ❌ Never do this
.button:focus {
  outline: none;
}
```

#### Keyboard Event Handlers
```tsx
<input
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }}
/>
```

---

### Complex Components

#### Listbox Pattern
```tsx
<button
  aria-label="도시 선택 메뉴 열기"
  aria-expanded={isOpen}
  aria-haspopup="listbox"
>
  {selectedOption}
</button>

{isOpen && (
  <div role="listbox" aria-label="도시 목록">
    {options.map(opt => (
      <button
        role="option"
        aria-selected={opt.value === value}
        aria-disabled={opt.notAvailable}
      >
        {opt.name}
      </button>
    ))}
  </div>
)}
```

---

### Testing

#### Automated Tests
```bash
# Install tools
npm install --save-dev @axe-core/playwright axe-core

# Run tests
npm run test:a11y
```

#### Manual Testing
1. **Tab Navigation**: Tab through entire page, verify all interactive elements
2. **Screen Reader**: Test with VoiceOver (Mac) or NVDA (Windows)
3. **Keyboard Only**: Complete all tasks without mouse
4. **Browser Tools**: Use WAVE or axe DevTools extensions

#### Common Tools
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (built into Chrome)

---

### Screen Reader Only Class

```tsx
// Use this class for labels that should only be visible to screen readers
<label className="sr-only" htmlFor="search">
  검색
</label>

// CSS is already in globals.css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

### Language

```tsx
// Set correct language in html tag (already done in layout.tsx)
<html lang="ko">

// For mixed content
<p>
  This is English text.
  <span lang="ko">이것은 한국어 텍스트입니다.</span>
</p>
```

---

### Color and Contrast

#### Minimum Requirements (WCAG AA)
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

#### Check Contrast
Use browser DevTools or online tools:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools > Inspect > Accessibility pane

---

### Common Mistakes to Avoid

❌ **Don't**:
- Use `<div>` or `<span>` for buttons
- Remove focus outlines
- Use placeholder as label
- Rely only on color to convey information
- Use `title` attribute for critical info
- Nest buttons or links inside each other

✅ **Do**:
- Use semantic HTML elements
- Provide text alternatives for images
- Associate labels with form inputs
- Make all content keyboard accessible
- Test with real assistive technologies
- Include ARIA attributes when semantic HTML isn't enough

---

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Articles](https://webaim.org/articles/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

**Last Updated**: 2025-11-24  
**Maintained by**: OpenSAM Frontend Team
