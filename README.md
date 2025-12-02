# OpenSAM Frontend

삼국지 기반 전략 시뮬레이션 게임 프론트엔드

## 🚀 Quick Start

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 📁 프로젝트 구조

```
src/
├── app/              - Next.js App Router 페이지
├── components/       - React 컴포넌트
│   ├── game/        - 게임 관련 컴포넌트
│   ├── battle/      - 전투 시스템 UI
│   ├── ui/          - 공통 UI 컴포넌트
│   └── layout/      - 레이아웃 컴포넌트
├── hooks/           - 커스텀 React Hooks
├── stores/          - Zustand 상태 관리
├── lib/             - 유틸리티 라이브러리
├── types/           - TypeScript 타입 정의
├── styles/          - 글로벌 스타일
└── i18n/            - 국제화 (한국어/영어)

public/
├── assets/          - 게임 이미지 에셋
├── audio/           - 사운드 파일
└── images/          - 정적 이미지
```

## 📚 문서

- [프론트엔드 기능 스펙](./docs/FRONTEND_FEATURE_SPEC.md)
- [접근성 및 i18n 가이드](./docs/ACCESSIBILITY_I18N_GUIDE.md)
- [스타일 가이드](./STYLE_GUIDE.md)

## 🛠️ 기술 스택

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Realtime**: Socket.IO Client
- **Testing**: Jest + Playwright

## 🎮 주요 기능

- 턴제 전략 게임 인터페이스
- 실시간 전투 시뮬레이션 UI
- 장수/국가 관리 대시보드
- 멀티 시나리오 지원 (삼국지, LOGH, GIN7)
- 반응형 디자인 (모바일 지원)

## 🔧 환경 설정

`.env.local` 파일 생성:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## 🎨 UI 테마

게임은 계절별 배경 테마를 지원합니다:
- 봄 (Spring)
- 여름 (Summer)
- 가을 (Fall)
- 겨울 (Winter)

## 🔄 개발 워크플로우

1. **개발 서버**: `npm run dev`
2. **린트**: `npm run lint`
3. **타입 체크**: `npx tsc --noEmit`
4. **테스트**: `npm test`
5. **E2E 테스트**: `npx playwright test`
6. **빌드**: `npm run build`

## 📡 API 연동

백엔드 API는 `/api/*` 경로로 프록시됩니다.
- 개발: `http://localhost:8080`
- WebSocket: 실시간 게임 이벤트

## 📝 License

MIT

