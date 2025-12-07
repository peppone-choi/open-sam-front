# Agent 15: World Map Interface

## 📌 Context
게임의 메인 화면인 천하지도(World Map)를 Hex 또는 Grid 형태로 구현하고, 도시/관문/부대 정보를 표시합니다.

## ✅ Checklist
- [x] 맵 데이터 구조 정의 (좌표계 시스템) - 기존 `MapViewer` 활용
- [x] `WorldMap` 컴포넌트 구현 (Zoom/Pan 기능 포함) - `src/components/game/MapViewer.tsx`
- [x] 도시(City) 및 거점(Point) 렌더링 - `MapCityDetail` 컴포넌트
- [x] 부대(Troop) 이동 경로 시각화 - `MovementLayer` 컴포넌트

## 💬 Communication
- **Status**: ✅ Already Implemented
- **Current Issue**: None
- **Memo**: 기존 `MapViewer` 컴포넌트가 이미 모든 기능을 구현하고 있음. 배경 이미지 기반 + API 연동 방식.

## 📁 기존 구현 파일
- `src/components/game/MapViewer.tsx` - 메인 맵 뷰어 (줌/팬 지원)
- `src/components/game/MapCityDetail.tsx` - 도시 마커 컴포넌트
- `src/components/game/MovementLayer.tsx` - 부대 이동 경로 시각화
- `src/components/game/TerritoryOverlay.tsx` - 세력권 오버레이
- `src/hooks/useMapTransform.ts` - 줌/팬 훅
- `src/app/[server]/world/page.tsx` - 중원 정보 페이지
- `src/app/[server]/map/recent/page.tsx` - 실시간 지도 페이지

## 🔧 기존 구현된 기능
1. **이미지 기반 맵**: 계절별 배경 이미지 (봄/여름/가을/겨울)
2. **줌/팬**: 마우스 휠 줌, 드래그 팬, 핀치 줌, 더블클릭 줌
3. **도시 마커**: 국가별 색상, 수도 표시, 도시명 토글
4. **세력권**: TerritoryOverlay로 국가 영역 시각화
5. **군대 이동**: MovementLayer로 이동 경로 및 화살표 표시
6. **경로 하이라이트**: highlightPath로 선택된 경로 강조

## 🚀 Prompts

### 시작 프롬프트
```markdown
당신은 프론트엔드 게임 개발자입니다.
삼국지 게임의 핵심인 **월드 맵(World Map)**을 구현해야 합니다.

1. 육각형(Hex) 타일 맵을 렌더링하는 전략을 세워주세요. (SVG vs Canvas)
2. 맵 위에서 마우스 드래그로 이동(Pan)하고 휠로 확대/축소(Zoom)하는 기능을 구현해야 합니다.
3. 각 타일에 도시나 지형 정보를 표시할 수 있어야 합니다.
```

### 이어지는 프롬프트
```markdown
HTML5 Canvas API와 React를 연동하여 `HexMapCanvas` 컴포넌트를 작성해주세요.
가상 스크롤(Virtualizing) 기법이나 타일링을 적용하여 맵이 커져도 성능 저하가 없도록 최적화해주세요.
클릭한 타일의 좌표를 콘솔에 찍는 이벤트 핸들러도 붙여주세요.
```

