# Agent 16: Battle UI Effects

## 📌 Context
전투 화면에서 스킬 발동, 계략 성공, 치명타 등 다양한 시각적 이펙트를 담당합니다.

## ✅ Checklist
- [x] 스킬 컷인(Cut-in) 효과 컴포넌트
- [x] 데미지 플로팅 텍스트 (Damage Floater)
- [x] 상태 이상(화계, 혼란 등) 아이콘 및 오버레이 효과
- [x] 이펙트 큐(Queue) 시스템 (순차/병렬 재생)
- [x] React Portal 기반 BattleEffectsOverlay
- [ ] 사운드 이펙트(SFX) 트리거 연동 (선택 사항)

## 💬 Communication
- **Status**: [Completed]
- **Current Issue**: 
- **Memo**: `Agent 14`의 리플레이 플레이어 위에 덧씌워질 레이어입니다.

## 📁 구현된 파일 목록
- `src/components/battle/effects/types.ts` - 타입 정의
- `src/components/battle/effects/SkillCutIn.tsx` - 스킬 컷인 컴포넌트
- `src/components/battle/effects/SkillCutIn.module.css` - 스킬 컷인 스타일
- `src/components/battle/effects/DamageFloater.tsx` - 데미지 플로터 컴포넌트
- `src/components/battle/effects/DamageFloater.module.css` - 데미지 플로터 스타일
- `src/components/battle/effects/StatusOverlay.tsx` - 상태 이상 오버레이 컴포넌트
- `src/components/battle/effects/StatusOverlay.module.css` - 상태 이상 스타일
- `src/components/battle/effects/EffectQueue.tsx` - 이펙트 큐 시스템
- `src/components/battle/effects/BattleEffectsOverlay.tsx` - 통합 오버레이
- `src/components/battle/effects/BattleEffectsOverlay.module.css` - 오버레이 스타일
- `src/components/battle/effects/index.ts` - 모듈 익스포트
- `src/app/demo/battle-effects/page.tsx` - 데모 페이지
- `src/app/demo/battle-effects/page.module.css` - 데모 페이지 스타일

## 🔧 사용 방법
```tsx
import { BattleEffectsOverlay, useBattleEffects, type BattleEffectsOverlayRef } from '@/components/battle/effects';

// 컴포넌트에서 사용
const [effectsRef, setEffectsRef] = useState<BattleEffectsOverlayRef | null>(null);

// 스킬 컷인
await effectsRef?.showSkillCutIn({
  generalName: '관우',
  skillName: '청룡언월도',
  nationColor: '#22c55e',
  skillType: 'attack',
});

// 데미지 표시
effectsRef?.showDamage(500, { x: 100, y: 100 });
effectsRef?.showCriticalDamage(1000, { x: 100, y: 100 });
effectsRef?.showHeal(200, { x: 100, y: 100 });

// 상태 이상
effectsRef?.showStatus('fire', { x: 100, y: 100 }, 3000);
```

## 🚀 Prompts

### 시작 프롬프트
```markdown
당신은 UI/UX 인터랙션 디자이너이자 개발자입니다.
전투의 박진감을 더해줄 **시각 이펙트 시스템**을 구축해야 합니다.

1. 장수가 스킬을 쓸 때 화면을 가로지르는 컷인(Cut-in) 애니메이션 컴포넌트
2. 유닛 머리 위로 데미지 숫자가 튀어오르는 플로팅 텍스트 관리자
3. 이펙트 큐(Queue) 시스템 (이펙트가 겹치지 않고 순차/병렬 재생되도록)

React Portal을 활용한 오버레이 구조를 설계해주세요.
```

### 이어지는 프롬프트
```markdown
`Framer Motion`을 사용하여 스킬 컷인 컴포넌트(`SkillCutIn`)를 구현해주세요.
장수 일러스트 이미지 경로와 스킬명을 props로 받아서 화려하게 등장했다 사라지는 애니메이션을 만들어주세요.
```

