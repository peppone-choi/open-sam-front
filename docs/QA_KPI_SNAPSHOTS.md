# KPI & Timeline QA Notes

이 문서는 info/history/world/entry 흐름에서 공유하는 KPI 카드·타임라인의 검증 포인트와 샘플 데이터를 정리합니다. 실제 서버에서 동일한 조건을 재현하기 어려울 때 아래 샘플 JSON을 Storybook Controls 또는 프론트 mock에 주입하면 됩니다.

## 참조 데이터

| 구분 | JSON | Storybook 스토리 |
|------|------|-------------------|
| Join KPI | `docs/mocks/join-sample.json` | `Info/KpiCard > ApiSamples (sample=join)` |
| Select General 풀 | `docs/mocks/select-general-sample.json` | `Info/KpiCard > ApiSamples (sample=selectPool)` |
| Select NPC 후보 | `docs/mocks/select-npc-sample.json` | `Info/KpiCard > ApiSamples (sample=npc)` + NPC Timeline |
| Inherit 요약 | `docs/mocks/inherit-sample.json` | `Info/KpiCard > ApiSamples (sample=inherit)` |
| Front Info Timeline | `docs/mocks/front-info-sample.json` | `Info/HistoryTimeline > ApiMockSelector (sample=frontInfo)` |
| Auction Timeline | `docs/mocks/auction-sample.json` | `Info/HistoryTimeline > ApiMockSelector (sample=auction)` |

Storybook 모듈은 `src/stories/mocks/entrySamples.ts`에서 동일 구조를 import 하므로 QA는 Controls 탭에서 `sample` 값을 전환하며 실제 서비스 응답과 비교할 수 있습니다.

### Storybook 실행 지침
- `npm run storybook -- --smoke-test --ci` 또는 `npm run build-storybook`을 사용할 때는 **반드시** `NODE_OPTIONS="--require ./storybook.next-config-shim.js"`가 설정된 npm script를 이용합니다. 직접 실행 시에도 동일한 옵션을 수동으로 지정해야 Next 16 환경에서 `next/config` 모듈 로딩 오류가 발생하지 않습니다.
- 캡처 및 로그는 `open-sam-front/test-results/` 하위에 `kpi-<screen>-before.png`, `kpi-<screen>-after.png`, `lint.log`, `storybook-dev.log`, `storybook-build.log` 형태로 보관합니다.

## 전/후 비교 스냅샷

| 화면 | Before 요약 | After 요약 |
|------|-------------|------------|
| Join | input form 하단에 텍스트 설명만 존재, 트레잇/능력 합/재야 제한은 표기되지 않음 | KPI 3종(트레잇, 능력치 합, 시작 조건) + 타임라인으로 즉시 검증 가능 |
| Select General | 장수 카드만 존재, 전체 풀/추천/선택 상태 미표기 | 상단 KPI 카드로 풀 규모/추천/선택 상태 표시, 타임라인으로 조작 순서 안내 |
| Select NPC | 찜 상태나 쿨다운을 텍스트로 별도 안내 | KPI 카드의 Trend/Badge로 찜·쿨다운 상태 즉시 확인, Timeline에 다시 뽑기 대기 표시 |
| History/World | 산발적 표, 구간 배경이 일관되지 않음 | 동일 KPI+Timeline 테마 적용, highlightCategory로 국가/액션 강조 |

QA는 위 표를 기준으로 스크린샷을 캡처해 `open-sam-front/test-results/` 폴더에 `kpi-<screen>-before.png`, `kpi-<screen>-after.png` 명명 규칙으로 추가하면 됩니다.

## 체크리스트
- [ ] Storybook `Info/KpiCard > ApiSamples`, `Info/HistoryTimeline > ApiMockSelector` 스토리가 해당 샘플 JSON 값과 동일하게 표시된다.
- [ ] Entry 페이지 실데이터가 샘플 값과 ±2% 이내 차이를 보이는지 확인한다.
- [ ] KPI `trend.tone`이 양수/음수일 때 색상이 Tailwind token (`text-emerald-300`, `text-rose-300`)과 일치한다.
- [ ] Timeline `highlightCategory`가 켜졌을 때 dot/pill 스타일이 강조되고, 다른 카테고리는 기본 명암을 유지한다.
