# OpenSAM Skill

병호님의 OpenSAM 프로젝트 전용 Claude Skill입니다.

## 설치

```bash
# 압축 해제
unzip opensam.zip

# Claude.ai Settings > Capabilities > Skills에서 업로드
# 또는 Claude Code에 복사
cp -r opensam /mnt/skills/user/
```

## 구성

- `Skill.md` - 메인 스킬 정의
- `scripts/` - 유틸리티 스크립트 (4개)
- `references/` - 참조 문서 (7개)

## 핵심 개념

1. **자율 연속 실행** - 질문 없이 계속 작업
2. **데몬 기반** - 게임 플레이는 캐시만, DB는 영속성/로그만
3. **웹 검색 우선** - 삼국지 데이터는 반드시 검색
4. **타입 안전** - `as any` 금지
5. **범용 설계** - 세계 독립적 코드

## 사용 예시

```
"opensam 타입 에러 수정해줘"
→ 자동으로 계속 수정, 질문하지 않음

"삼국지 조조 능력치 설정해줘"
→ 자동 웹 검색하여 정확한 데이터 사용

"데몬에서 농업 커맨드 구현"
→ 캐시 기반 구현, DB 직접 접근 안 함
```

## 자세한 내용

`Skill.md` 파일을 참조하세요.
