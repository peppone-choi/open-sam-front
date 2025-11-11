# 게임 컴포넌트

## NationFlag 컴포넌트

국가 색상을 동적으로 반영하는 깃발 컴포넌트입니다.

### 사용법

```tsx
import NationFlag from '@/components/game/NationFlag';

// 기본 사용 (애니메이션 O)
<NationFlag color="#dc143c" />

// 크기 조절
<NationFlag color="#1e90ff" size={32} />

// 애니메이션 끄기
<NationFlag color="#32cd32" animate={false} />

// 공백지 (회색)
<NationFlag color="#808080" />
// 또는
<NationFlag />  // 기본값이 회색
```

### Props

- `color?: string` - 국가 색상 (hex 코드, 예: #dc143c)
  - 기본값: `#808080` (회색 - 공백지)
- `size?: number` - 크기 (픽셀)
  - 기본값: `48`
- `animate?: boolean` - 애니메이션 여부
  - 기본값: `true`
- `className?: string` - 추가 CSS 클래스

### 권장 색상

- 공백지: `#808080` (회색) 또는 `#d3d3d3` (연한 회색)
- 위나라: `#dc143c` (진홍색)
- 촉나라: `#32cd32` (초록색)
- 오나라: `#1e90ff` (파랑색)
- 기타: 다양한 hex 색상 코드 사용 가능

---

## EventIcon 컴포넌트

게임 이벤트를 나타내는 아이콘 컴포넌트입니다.

### 사용법

```tsx
import EventIcon from '@/components/game/EventIcon';

// 기본 사용
<EventIcon type="battle" />

// 크기 조절
<EventIcon type="diplomacy" size={24} />

// 커스텀 클래스
<EventIcon type="trade" size={20} className="my-icon" />
```

### Props

- `type: EventType` - 이벤트 타입 (필수)
- `size?: number` - 크기 (픽셀)
  - 기본값: `16`
- `className?: string` - 추가 CSS 클래스
- `alt?: string` - 이미지 alt 텍스트

### EventType 목록

| Type | 설명 | 파일명 |
|------|------|--------|
| `default` | 기본 | event0.gif |
| `battle` | 전투 | event1.gif |
| `diplomacy` | 외교 | event2.gif |
| `trade` | 교역 | event3.gif |
| `construction` | 건설 | event31.gif |
| `agriculture` | 농업 | event32.gif |
| `commerce` | 상업 | event33.gif |
| `defense` | 방어 | event34.gif |
| `disaster` | 재해 | event4.gif |
| `fire` | 화재 | event41.gif |
| `flood` | 홍수 | event42.gif |
| `plague` | 역병 | event43.gif |
| `politics` | 정치 | event5.gif |
| `rebellion` | 반란 | event51.gif |
| `festival` | 축제 | event6.gif |
| `recruitment` | 모병 | event7.gif |
| `research` | 연구 | event8.gif |
| `special` | 특수 | event9.gif |

---

## 도시 아이콘에 깃발 적용 예시

```tsx
import NationFlag from '@/components/game/NationFlag';

interface City {
  name: string;
  nation: number;
  nationColor?: string;
}

function CityIcon({ city }: { city: City }) {
  // 공백지 판단
  const isNeutral = city.nation === 0;
  const flagColor = isNeutral ? '#d3d3d3' : city.nationColor || '#808080';
  
  return (
    <div className="city-icon">
      <NationFlag 
        color={flagColor} 
        size={24} 
        animate={!isNeutral} // 공백지는 애니메이션 끄기
      />
      <span>{city.name}</span>
    </div>
  );
}
```

---

## 색상 선택 가이드

### 공백지

**추천**: `#d3d3d3` (연한 회색)
- 이유: 완전한 회색(#808080)보다 밝아서 "비어있음"을 더 잘 표현
- 대안: `#c0c0c0` (은색)

### 국가 색상 예시

```tsx
const NATION_COLORS = {
  wei: '#dc143c',      // 위 - 진홍색
  shu: '#32cd32',      // 촉 - 초록색
  wu: '#1e90ff',       // 오 - 파랑색
  yellow: '#ffd700',   // 황건적 - 금색
  neutral: '#d3d3d3',  // 공백지 - 연한 회색
};
```
