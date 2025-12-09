# Agent 18: Frontend Testing (E2E/Unit)

## 📌 Context
프론트엔드 주요 기능에 대한 테스트를 작성하여 안정성을 확보합니다.

## ✅ Checklist
- [ ] 컴포넌트 단위 테스트 (Jest + React Testing Library)
- [ ] 핵심 사용자 흐름 E2E 테스트 (Playwright)
- [ ] 리플레이 플레이어 동작 검증
- [ ] API 모킹(Mocking) 테스트 (MSW 활용 고려)

## 💬 Communication
- **Status**: [Pending]
- **Current Issue**: 
- **Memo**: UI 테스트는 깨지기 쉬우므로 로직 위주나 스냅샷 테스트를 적절히 섞어주세요.

## 🚀 Prompts

### 시작 프롬프트
```markdown
당신은 프론트엔드 QA 엔지니어입니다.
`open-sam-front` 프로젝트의 테스트 환경을 구축하고 주요 테스트를 작성해야 합니다.

1. `Vitest`와 `React Testing Library`를 설정하여 컴포넌트 테스트 기반을 마련하세요.
2. `Agent 13`이 만든 랭킹 페이지 테이블이 데이터를 올바르게 렌더링하는지 확인하는 테스트 코드를 작성하세요.
```

### 이어지는 프롬프트
```markdown
`Playwright`를 사용하여 E2E 테스트를 작성해주세요.
1. 메인 페이지 접속
2. '명예의 전당' 메뉴 클릭
3. 랭킹 리스트가 로딩되는지 확인
4. 탭 전환 시 내용이 바뀌는지 확인
이 과정을 자동화해주세요.
```






