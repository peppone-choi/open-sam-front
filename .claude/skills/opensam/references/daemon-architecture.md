# 데몬 기반 아키텍처

OpenSAM의 핵심 설계 문서입니다.

## 핵심 원칙

**게임 플레이 데이터는 오직 캐시에만 존재합니다.**  
**DB는 영속성 보장 + 로그/통계/예약만 담당합니다.**

## 데이터 흐름

```
사용자
  ↓ 조회
API → L1 캐시 → L2 캐시 → 리턴
  ↓ 커맨드
Command Queue + Log(DB)
  ↓
Daemon → 실행 → L1/L2 업데이트 → Dirty 마킹
  ↓ (크론 5초)
MongoDB 저장
```

## DB 접근 규칙

### ✅ 허용
- 서버 시작: DB → 캐시 로딩
- 로그 조회: CommandLog.find()
- 예약 조회: ScheduledCommand.find()
- 통계: General.aggregate()
- 크론 저장: 변경분 저장

### ❌ 금지
- 게임 플레이 중: General.findById()
- 실시간 쓰기: General.updateOne()

더 자세한 내용은 Skill.md를 참조하세요.
