# LOGH 프론트엔드 개발 계획

## 1단계: 핵심 페이지 (우선순위 높음)
- [x] `/logh/game` - 메인 게임 화면 (전략/전술 맵)
- [x] `/logh/info/me` - 내 제독 정보
- [ ] `/logh/commands` - 함대 명령 페이지
- [ ] `/logh/fleet` - 함대 관리
- [ ] `/logh/battle/[battleId]` - 전투 화면

## 2단계: 정보 페이지
- [ ] `/logh/info/faction` - 소속 세력 정보
- [ ] `/logh/info/galaxy` - 은하 전체 정보
- [ ] `/logh/message` - 메시지
- [ ] `/logh/diplomacy` - 외교

## 3단계: 부가 기능
- [ ] `/logh/archive` - 역사 기록
- [ ] `/logh/settings` - 설정
- [ ] `/logh/ranking` - 랭킹

## 삼국지 → LOGH 매핑

| 삼국지 | LOGH | 설명 |
|--------|------|------|
| General (장수) | Commander/Admiral (제독) | 플레이어 캐릭터 |
| City (도시) | Stellar System (성계) | 영토 단위 |
| Nation (국가) | Faction (세력) | 은하제국/자유행성동맹 |
| Troop (병력) | Fleet (함대) | 전투 유닛 |
| Command (명령) | Fleet Command (함대 명령) | 턴 행동 |
| Battle (전투) | Space Battle (우주 전투) | 전투 시스템 |

## API 엔드포인트

### 제독 관련
- `GET /api/logh/my-commander` - 내 제독 정보
- `GET /api/logh/commander/:id` - 제독 상세 정보
- `POST /api/logh/commander/update` - 제독 정보 수정

### 함대 관련
- `GET /api/logh/fleet/:id` - 함대 정보
- `POST /api/logh/fleet/command` - 함대 명령 실행
- `GET /api/logh/fleet/formation` - 진형 목록

### 전투 관련
- `GET /api/logh/battle/:id` - 전투 상세
- `POST /api/logh/battle/action` - 전투 행동

### 세력 관련
- `GET /api/logh/faction/:id` - 세력 정보
- `GET /api/logh/galaxy/map` - 은하 지도

## 컴포넌트 구조

```
src/components/logh/
├── StrategicMap.tsx        # 전략 맵 (은하 전체)
├── TacticalMap.tsx         # 전술 맵 (전투)
├── CommandPanel.tsx        # 명령 패널
├── FleetStatus.tsx         # 함대 상태
├── CommanderInfo.tsx       # 제독 정보
├── ShipList.tsx           # 함선 목록
├── FormationEditor.tsx     # 진형 편집
└── BattleView.tsx         # 전투 화면
```

## 현재 상태

### 완료
- ✅ `/logh/game/page.tsx` - 메인 게임 화면
- ✅ `/logh/info/me/page.tsx` - 내 제독 정보
- ✅ 실시간 전투 맵 requestAnimationFrame 스로틀 + 소켓 구독 안정화 (모바일 멀티터치 포함)

### 진행 중
- 🔄 나머지 핵심 페이지 생성

### 다음 단계
1. 함대 명령 페이지 생성
2. 전투 화면 구현
3. API 연동
4. 백엔드와 통합 테스트
