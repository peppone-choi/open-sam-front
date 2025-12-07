# Agent 14: Battle Replay Visualizer

## 📌 Context
전투 리플레이 JSON 데이터를 받아 턴제 전투를 시각적으로 재생해주는 플레이어 컴포넌트를 개발합니다.

## ✅ Checklist
- [x] `ReplayPlayer` 컴포넌트 구조 설계 (재생/일시정지/배속/슬라이더)
- [x] 캔버스(Canvas) 또는 DOM 기반의 전장 렌더링
- [x] 턴 데이터(`TurnLog`) 파싱 및 상태 업데이트 로직
- [x] 유닛 이동 및 공격 애니메이션 처리

## 💬 Communication
- **Status**: [Completed] ✅
- **Current Issue**: 없음
- **Memo**: DOM + Framer Motion 방식으로 구현 완료. 2D 아이콘 기반 유닛, 부드러운 이동/공격 애니메이션, 데미지 팝업 효과 구현됨.

## 📁 구현 파일
- `src/components/battle/replay/types.ts` - 리플레이 데이터 타입 정의
- `src/components/battle/replay/ReplayPlayer.tsx` - 메인 리플레이 플레이어 컴포넌트
- `src/components/battle/replay/ReplayPlayer.module.css` - 스타일
- `src/components/battle/replay/index.ts` - 모듈 export
- `docs/mocks/sample-replay.json` - 샘플 리플레이 데이터
- `src/app/demo/replay/page.tsx` - 데모 페이지

## 🎯 구현 기능
1. **재생 컨트롤**
   - ▶ 재생 / ⏸ 일시정지 토글
   - ⏮ 처음으로 되돌리기
   - 진행 슬라이더로 탐색
   - 0.5x / 1x / 2x / 4x 배속 조절

2. **전장 렌더링**
   - 그리드 기반 맵 (12x8)
   - 아군(파란색)/적군(빨간색) 구분
   - 유닛 카드: 병종 아이콘, 장수 이름, HP 바, 병력 수

3. **애니메이션**
   - Framer Motion 기반 부드러운 이동
   - 공격 시 유닛 스케일 애니메이션
   - 데미지 팝업 (일반/크리티컬/회피)

4. **결과 화면**
   - 전투 완료 시 승리/패배 오버레이
   - 생존 유닛 수, 처치 수 통계
   - 다시 보기 버튼

## 🚀 실행 방법
```bash
cd open-sam-front
npm run dev
# http://localhost:3000/demo/replay 접속
```

## 🚀 Prompts

### 시작 프롬프트
```markdown
당신은 프론트엔드 인터랙션 개발자입니다.
전투 리플레이 JSON 데이터를 입력받아 화면에 전투 과정을 재생해주는 `ReplayPlayer` 컴포넌트를 만들어야 합니다.

요구사항:
1. 하단에 재생 컨트롤 바 (Play/Pause, 배속 설정, 턴 탐색 슬라이더) 배치
2. 중앙에 전장(Grid/Hex) 표시
3. 매 턴마다 유닛의 위치와 상태(병력 수 등)가 부드럽게 변화해야 함

구현 전략(Canvas vs DOM)을 정하고, 컴포넌트 구조를 잡아주세요.
```

### 이어지는 프롬프트
```markdown
결정된 방식(예: DOM + Framer Motion)으로 `ReplayPlayer`를 구현해주세요.
`Agent 12`가 만든 `docs/sample-replay.json` 더미 데이터를 import해서 테스트할 수 있도록 해주세요.
공격 시 데미지 폰트가 뜨는 효과도 간단히 구현해주세요.
```
