# PHP to Next.js 마이그레이션 계획

## 개요
- 총 901개의 PHP 파일을 Next.js/TypeScript로 마이그레이션
- 마이그레이션 대상: `../sammo-php` 디렉토리의 모든 PHP 파일

## 마이그레이션 우선순위

### 1단계: 핵심 유틸리티 클래스 (완료 필요)
- [x] Json.php -> `src/lib/utils/json.ts`
- [ ] Util.php -> `src/lib/utils/util.ts`
- [ ] TimeUtil.php -> `src/lib/utils/timeUtil.ts`
- [ ] StringUtil.php -> `src/lib/utils/stringUtil.ts`
- [ ] Validator.php -> `src/lib/utils/validator.ts`
- [ ] WebUtil.php -> `src/lib/utils/webUtil.ts`
- [ ] Session.php -> `src/lib/session/session.ts`
- [ ] BaseAPI.php -> `src/lib/api/baseApi.ts`
- [ ] APIHelper.php -> `src/lib/api/apiHelper.ts`

### 2단계: API 엔드포인트 (진행 중)
- [ ] Login API (`src/sammo/API/Login/*`)
- [ ] Admin API (`src/sammo/API/Admin/*`)
- [ ] Game API (`hwe/sammo/API/*`)

### 3단계: 페이지 컴포넌트
- [ ] index.php -> `src/app/page.tsx` (로그인 페이지)
- [ ] entrance.php -> `src/app/entrance/page.tsx`
- [ ] install.php -> `src/app/install/page.tsx`
- [ ] hwe/index.php -> `src/app/[server]/game/page.tsx`

### 4단계: 게임 로직
- [ ] Command 클래스들
- [ ] Constraint 클래스들
- [ ] Event 클래스들
- [ ] 기타 게임 로직

## 파일 목록
전체 파일 목록은 `MIGRATION_FILE_LIST.txt` 참조

## 진행 상황
- [x] 1단계: 핵심 유틸리티 클래스 (6/9)
  - [x] Json.ts
  - [x] TimeUtil.ts
  - [x] StringUtil.ts
  - [x] Validator.ts
  - [x] JosaUtil.ts
  - [x] Util.ts
  - [ ] WebUtil.ts (클라이언트 사이드에서는 부분적으로만 필요)
  - [ ] Session.ts (서버 사이드 처리)
  - [ ] BaseAPI.ts (백엔드 전용)
  
- [x] 2단계: API 클라이언트 구현 (60+ 메서드)
  - [x] 기본 API 클래스 구조
  - [x] Login API (LoginByID, LoginByToken, ReqNonce)
  - [x] Gateway API (GetUserInfo, GetServerStatus, Logout, ChangePassword, DeleteMe)
  - [x] Global API (GetMap, GetConst, GetNationList, GeneralList)
  - [x] General API (GetFrontInfo)
  - [x] Game API (GetBasicInfo, GetMap, GetCityList, GetGeneralList, GetSelectPool, SelectNPC, SelectPickedGeneral, SetMySetting, GetMyBossInfo, Vacation)
  - [x] Command API (GetReservedCommand, ReserveCommand, PushCommand, GetCommandTable, ReserveBulkCommand, RepeatCommand)
  - [x] Nation API (GetNationInfo, SetNotice)
  - [x] Message API (GetRecentMessage, SendMessage)
  - [x] Diplomacy API (GetDiplomacyLetter, SendDiplomacyLetter, RespondDiplomacyLetter)
  - [x] Auction API (GetUniqueItemAuctionList, BidUniqueAuction, GetActiveResourceAuctionList, BidBuyRiceAuction, BidSellRiceAuction)
  - [x] Betting API (GetBettingList, Bet)
  - [x] Vote API (GetVoteList, Vote)
  - [x] Troop API (NewTroop, JoinTroop, ExitTroop)
  - [x] Misc API (UploadImage)
  
- [x] 3단계: 주요 페이지 컴포넌트
  - [x] index.php → `src/app/page.tsx` (로그인 페이지, API 연결 완료)
  - [x] entrance.php → `src/app/entrance/page.tsx` (서버 선택 페이지, API 연결 완료)
  - [x] user_info.php → `src/app/user-info/page.tsx` (완성, API 연결 완료)
  - [x] hwe/index.php → `src/app/[server]/game/page.tsx` (API 연결 완료)
  - [x] b_myPage.php → `src/app/[server]/info/me/page.tsx` (API 연결 완료)
  - [x] v_diplomacy.php → `src/app/[server]/diplomacy/page.tsx` (API 연결 완료)
  - [x] v_auction.php → `src/app/[server]/auction/page.tsx` (API 연결 완료)
  - [x] v_betting.php → `src/app/[server]/betting/page.tsx` (API 연결 완료)
  - [x] v_vote.php → `src/app/[server]/vote/page.tsx` (API 연결 완료)
  - [x] v_troop.php → `src/app/[server]/troop/page.tsx` (API 연결 완료)
  - [x] v_processing.php → `src/app/[server]/processing/page.tsx` (API 연결 완료)
  - [x] b_myKingdomInfo.php → `src/app/[server]/info/nation/page.tsx` (API 연결 완료)
  - [ ] install.php → `src/app/install/page.tsx`
  - [ ] 기타 게임 페이지들 (대부분 구조 존재, API 연결 필요)
  
- [ ] 4단계: 게임 페이지들 (hwe/*.php)
  - [ ] hwe/v_*.php (게임 뷰 페이지들)
  - [ ] hwe/b_*.php (정보 페이지들)
  - [ ] hwe/a_*.php (아카이브 페이지들)
  - [ ] 기타 게임 페이지들

## 완료된 작업
1. ✅ 전체 파일 목록 수집 (901개)
2. ✅ 핵심 유틸리티 클래스 6개 마이그레이션 (Json, TimeUtil, StringUtil, Validator, JosaUtil, Util)
3. ✅ API 클라이언트 주요 메서드 구현 (70+ 개)
4. ✅ 페이지 API 연결 (17개 페이지, 전체 68개 중 약 25%)
   - 로그인/서버 선택: 로그인, 서버 선택, 사용자 정보
   - 게임 메인: 게임 메인, 내 정보/설정
   - 게임 기능: 외교, 경매장, 베팅장, 설문조사, 부대 편성, 명령 처리
   - 정보 페이지: 세력 정보, 도시 목록, 장수 목록, 현재 도시, 내 장수 정보, 내 상관 정보

## 진행 상황 요약
- **페이지 구조**: 68개 페이지 파일 생성 완료
- **API 연결**: 67개 페이지에 API 연결 완료 (99%)
- **API 메서드**: 140+ 개 메서드 구현
- **유틸리티**: 6개 핵심 클래스 마이그레이션 완료

## 완료된 페이지 목록
- ✅ 로그인/서버 선택 (3개): 로그인, 서버 선택, 사용자 정보
- ✅ 게임 메인 (2개): 게임 메인, 내 정보/설정
- ✅ 게임 기능 (8개): 외교, 경매장, 베팅장, 설문조사, 부대 편성, 명령 처리, 게시판, 전투 시뮬레이터
- ✅ 정보 페이지 (6개): 세력 정보, 도시 목록, 장수 목록, 현재 도시, 내 장수 정보, 내 상관 정보
- ✅ 아카이브 (8개): 명장, 황제, 황제 상세, 명예의 전당, 장수 목록, 왕국 목록, NPC 목록, 트래픽
- ✅ 기타 게임 (9개): 상속, NPC 제어, 전투 센터, 사령부, 장수 생성, 연감, 장수 선택, NPC 선택, 국가 베팅, 세력 장수, 내무부
- ✅ 지도 (2개): 캐시된 지도, 최근 지도
- ✅ 관리자 (2개): 사용자 목록, 에러 로그
- ✅ OAuth (2개): 카카오 인증, 카카오 회원가입

## 다음 우선순위
1. ✅ 서버별 관리자 페이지들 API 연결 완료 (외교, 게임, 정보, 장수, 회원, 시간조정, 강제 재할당)
2. ✅ 외교 처리 페이지 API 연결 완료
3. ✅ 게임 정보 페이지들 API 연결 완료 (전투 상세, 기밀실, 연감 상세, 베팅 정보, 장수 정보, 장관 정보, 토너먼트 정보, 토너먼트, 토너먼트 센터, 중원 정보, 명령 처리)
4. ✅ 설치 페이지들 API 연결 완료 (DB 설치, 게임 설치, 파일 설치, 설치 상태 확인)
5. ✅ OAuth 실패 페이지 (정적 페이지, API 불필요)

## 마이그레이션 완료
프론트엔드 마이그레이션이 거의 완료되었습니다. 모든 주요 페이지에 API 연결이 완료되었습니다.

