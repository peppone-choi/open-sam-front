# 프론트엔드 포트레잇 시스템 통합 가이드

## 설치

```bash
npm install react-easy-crop
```

## 컴포넌트

### 1. PortraitDisplay - 포트레잇 표시
```tsx
import { PortraitDisplay } from '@/components/PortraitDisplay';

<PortraitDisplay
  src="/portraits/portrait-123.png"
  alt="조조"
  size="medium"  // small | medium | large | xlarge
  frame="gold"   // none | gold | silver | bronze
/>
```

### 2. PortraitUploader - 업로드 및 크롭
```tsx
import { PortraitUploader } from '@/components/PortraitUploader';

<PortraitUploader
  generalId={123}
  sessionId="session-1"
  currentPortrait="/portraits/current.png"
  onUploadSuccess={(url) => console.log('Uploaded:', url)}
  onUploadError={(err) => console.error(err)}
/>
```

### 3. PortraitGrid - 여러 장수 표시
```tsx
import { PortraitGrid } from '@/components/PortraitDisplay';

<PortraitGrid
  portraits={[
    { id: 1, src: '/p1.png', name: '조조', frame: 'gold' },
    { id: 2, src: '/p2.png', name: '관우', frame: 'none' }
  ]}
  size="small"
  onPortraitClick={(id) => navigate(`/general/${id}`)}
/>
```

## 기존 UI 수정

### 1:1 아바타를 26:35 포트레잇으로 변경

**Before:**
```tsx
<img 
  src={user.avatar} 
  className="w-12 h-12 rounded-full"
/>
```

**After:**
```tsx
<PortraitDisplay
  src={user.portrait}
  alt={user.name}
  size="small"
/>
```

## CSS 스타일

```css
/* 포트레잇 호버 효과 */
.portrait-container:hover img {
  transform: scale(1.05);
  transition: transform 0.2s;
}

/* 포트레잇 그리드 레이아웃 */
.portrait-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(156px, 1fr));
  gap: 1rem;
}
```

## API 통합

```typescript
// 포트레잇 업로드
const uploadPortrait = async (file: File, generalId: number) => {
  const formData = new FormData();
  formData.append('portrait', file);
  formData.append('generalId', generalId.toString());
  formData.append('sessionId', sessionId);
  
  const response = await fetch('/api/portraits/upload', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

// 포트레잇 조회
const getPortrait = async (generalId: number) => {
  const response = await fetch(`/api/portraits/${sessionId}/${generalId}`);
  return response.json();
};
```

## 반응형 디자인

```tsx
// 모바일: small, 태블릿: medium, 데스크톱: large
<div className="portrait-responsive">
  <PortraitDisplay
    src={portrait}
    alt={name}
    size={isMobile ? 'small' : isTablet ? 'medium' : 'large'}
  />
</div>
```

## 성능 최적화

1. **Lazy Loading**
```tsx
<img 
  src={portrait} 
  loading="lazy"
  decoding="async"
/>
```

2. **이미지 캐싱**
```typescript
const portraitCache = new Map<number, string>();

const getPortraitCached = async (id: number) => {
  if (portraitCache.has(id)) {
    return portraitCache.get(id);
  }
  const url = await fetchPortrait(id);
  portraitCache.set(id, url);
  return url;
};
```

## 마이그레이션 체크리스트

- [ ] react-easy-crop 설치
- [ ] 컴포넌트 파일 추가
- [ ] 기존 1:1 아바타를 26:35 포트레잇으로 교체
- [ ] 업로드 UI에 크롭 기능 추가
- [ ] API 엔드포인트 연결
- [ ] 프레임 스타일 선택 UI 추가 (선택사항)
- [ ] 반응형 크기 테스트
- [ ] 성능 테스트 (lazy loading 등)
