# 프론트엔드-백엔드 API 연결 점검 리포트

## 점검 일시
2025-01-XX

## 수정 완료 항목 ✅

### 1. General API 수정 완료
- ✅ `POST /api/general/front-info` → `GET /api/general/get-front-info`
- ✅ `POST /api/general/command-table` → `GET /api/general/get-command-table`
- ✅ `POST /api/game/select-pool` → `GET /api/general/get-select-pool`
- ✅ `POST /api/game/boss-info` → `GET /api/general/get-boss-info`

### 2. Global API 수정 완료
- ✅ `POST /api/global/map` → `GET /api/global/get-map`
- ✅ `POST /api/global/const` → `GET /api/global/get-const`
- ✅ `POST /api/global/nation-list` → `GET /api/global/get-nation-list`

### 3. Auth API 수정 완료
- ✅ `POST /api/login/by-id` → `POST /api/auth/login` (응답 형식 변환 추가)

### 4. Command API 수정 완료
- ✅ `POST /api/command/get-reserved` → `GET /api/command/get-reserved-command`

## 발견된 문제점 (추가 확인 필요)

### 1. HTTP 메서드 불일치

#### 일반 (General) API
- **프론트엔드**: `POST /api/general/front-info`
- **백엔드**: `GET /api/general/get-front-info` ❌
- **문제**: 메서드 불일치 (POST vs GET), 경로 불일치 (front-info vs get-front-info)

- **프론트엔드**: `POST /api/general/command-table`
- **백엔드**: `GET /api/general/get-command-table` ❌
- **문제**: 메서드 불일치 (POST vs GET), 경로 불일치

- **프론트엔드**: `POST /api/general/select-pool`
- **백엔드**: `GET /api/general/get-select-pool` ❌
- **문제**: 메서드 불일치 (POST vs GET), 경로 불일치

#### 글로벌 (Global) API
- **프론트엔드**: `POST /api/global/map`
- **백엔드**: `GET /api/global/get-map` ❌
- **문제**: 메서드 불일치 (POST vs GET), 경로 불일치 (map vs get-map)

- **프론트엔드**: `POST /api/global/const`
- **백엔드**: `GET /api/global/get-const` ❌
- **문제**: 메서드 불일치 (POST vs GET), 경로 불일치 (const vs get-const)

- **프론트엔드**: `POST /api/global/nation-list`
- **백엔드**: `GET /api/global/get-nation-list` ❌
- **문제**: 메서드 불일치 (POST vs GET), 경로 불일치

### 2. 인증 (Auth) API 경로 불일치
- **프론트엔드**: `POST /api/login/by-id`
- **백엔드**: `POST /api/auth/login` ❌
- **문제**: 경로 불일치 (login vs auth)

- **프론트엔드**: `POST /api/login/by-token`
- **백엔드**: 없음 ❌
- **문제**: 백엔드에 해당 엔드포인트가 없을 수 있음

### 3. 명령 (Command) API 경로 불일치
- **프론트엔드**: `POST /api/command/get-reserved`
- **백엔드**: `GET /api/command/get-reserved-command` ❌
- **문제**: 메서드 불일치 (POST vs GET), 경로 불일치 (get-reserved vs get-reserved-command)

## 수정 필요 사항

### 우선순위 1: 긴급 수정 필요
1. **General API 경로 및 메서드 수정**
   - `POST /api/general/front-info` → `GET /api/general/get-front-info`
   - `POST /api/general/command-table` → `GET /api/general/get-command-table`
   - `POST /api/general/select-pool` → `GET /api/general/get-select-pool`

2. **Global API 경로 및 메서드 수정**
   - `POST /api/global/map` → `GET /api/global/get-map`
   - `POST /api/global/const` → `GET /api/global/get-const`
   - `POST /api/global/nation-list` → `GET /api/global/get-nation-list`

3. **Auth API 경로 수정**
   - `POST /api/login/by-id` → `POST /api/auth/login`
   - `POST /api/login/by-token` → 확인 필요 (백엔드에 존재 여부 확인)

4. **Command API 경로 및 메서드 수정**
   - `POST /api/command/get-reserved` → `GET /api/command/get-reserved-command`

### 우선순위 2: 추가 확인 필요
- 다른 API들도 백엔드 실제 라우트와 비교 필요
- GET 요청은 query parameter 사용, POST 요청은 body 사용 확인

## 수정 가이드

### GET 요청으로 변경해야 하는 경우
```typescript
// 변경 전 (POST)
static async GlobalGetMap(params: {...}): Promise<...> {
  return this.request('/api/global/map', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// 변경 후 (GET)
static async GlobalGetMap(params: {...}): Promise<...> {
  const query = new URLSearchParams(params).toString();
  return this.request(`/api/global/get-map?${query}`, {
    method: 'GET',
  });
}
```

### 경로 수정이 필요한 경우
```typescript
// 변경 전
return this.request('/api/general/front-info', {...});

// 변경 후
return this.request('/api/general/get-front-info', {...});
```

## 다음 단계
1. 백엔드 실제 라우트 파일 전체 확인
2. 프론트엔드 API 호출 전체 리스트 작성
3. 일대일 매핑 확인
4. 불일치 항목 수정

