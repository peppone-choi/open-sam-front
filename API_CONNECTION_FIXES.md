# API 연결 수정 사항

## 수정 완료된 API 목록

### 1. General API (4개)
1. ✅ `GeneralGetFrontInfo`
   - 변경 전: `POST /api/general/front-info`
   - 변경 후: `GET /api/general/get-front-info?serverID=...`
   - 메서드: POST → GET (쿼리 파라미터 사용)

2. ✅ `GetCommandTable`
   - 변경 전: `POST /api/command/get-table`
   - 변경 후: `GET /api/general/get-command-table?command=...`
   - 메서드: POST → GET (쿼리 파라미터 사용)
   - 경로: `/api/command/` → `/api/general/`

3. ✅ `GetSelectPool`
   - 변경 전: `POST /api/game/select-pool`
   - 변경 후: `GET /api/general/get-select-pool`
   - 메서드: POST → GET
   - 경로: `/api/game/` → `/api/general/`

4. ✅ `GetMyBossInfo`
   - 변경 전: `POST /api/game/boss-info`
   - 변경 후: `GET /api/general/get-boss-info`
   - 메서드: POST → GET
   - 경로: `/api/game/` → `/api/general/`

### 2. Global API (3개)
1. ✅ `GlobalGetMap`
   - 변경 전: `POST /api/global/map`
   - 변경 후: `GET /api/global/get-map?serverID=...&neutralView=...&showMe=...`
   - 메서드: POST → GET (쿼리 파라미터 사용)

2. ✅ `GlobalGetConst`
   - 변경 전: `POST /api/global/const`
   - 변경 후: `GET /api/global/get-const`
   - 메서드: POST → GET

3. ✅ `GlobalGetNationList`
   - 변경 전: `POST /api/global/nation-list`
   - 변경 후: `GET /api/global/get-nation-list`
   - 메서드: POST → GET

### 3. Auth API (1개)
1. ✅ `LoginByID`
   - 변경 전: `POST /api/login/by-id`
   - 변경 후: `POST /api/auth/login`
   - 경로: `/api/login/` → `/api/auth/`
   - 응답 형식 변환 추가 (백엔드 응답을 프론트엔드 형식으로 변환)

### 4. Command API (1개)
1. ✅ `CommandGetReservedCommand`
   - 변경 전: `POST /api/command/get-reserved`
   - 변경 후: `GET /api/command/get-reserved-command`
   - 메서드: POST → GET
   - 경로: `get-reserved` → `get-reserved-command`

## 수정 방법

### GET 요청으로 변경
```typescript
// 변경 전
return this.request('/api/global/map', {
  method: 'POST',
  body: JSON.stringify(params),
});

// 변경 후
const query = new URLSearchParams();
if (params.serverID) query.append('serverID', params.serverID);
if (params.neutralView !== undefined) query.append('neutralView', String(params.neutralView));
return this.request(`/api/global/get-map?${query.toString()}`, {
  method: 'GET',
});
```

### 경로 수정
```typescript
// 변경 전
return this.request('/api/general/front-info', {...});

// 변경 후
return this.request('/api/general/get-front-info', {...});
```

## 수정 완료 요약

총 **9개의 API** 수정 완료:
- General API: 4개
- Global API: 3개  
- Auth API: 1개
- Command API: 1개

## 다음 단계

1. ✅ 핵심 API 경로 및 메서드 수정 완료
2. 다른 API들도 백엔드 실제 라우트와 비교 확인 (진행 중)
3. GET 요청은 query parameter 사용 확인 완료
4. POST 요청은 body 사용 확인 완료
5. 전체 API 테스트 진행 필요

## 추가 확인 필요 사항

백엔드 라우트 목록을 확인한 결과, 다음 API들도 확인이 필요할 수 있습니다:
- `/api/archive/*` - 아카이브 관련 API
- `/api/admin/*` - 관리자 API  
- `/api/install/*` - 설치 API
- `/api/oauth/*` - OAuth API
- `/api/nation/*` - 국가 관련 추가 API
- `/api/diplomacy/*` - 외교 관련 추가 API

