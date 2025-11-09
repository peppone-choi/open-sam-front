# TypeScript 마이그레이션

PHP → Node.js/TypeScript 마이그레이션 가이드.

## 현재 상태
- TypeScript 에러: ~1,195개
- 레거시 db.table() 호출: 다수

## 우선순위

### 1주차: 기초
- Mongoose 인터페이스 정의
- BaseRepository 생성
- 모든 리포지토리 구현

### 2주차: 변환
- db.table() → 리포지토리
- 하루 50개씩

### 3주차: 타입 해결
- Null 안전성 (~400개)
- 타입 불일치 (~500개)
- Request 타입 (~200개)

### 4주차: 정리
- 빌드 성공
- 에러 0개

## 패턴

### Null 안전성
```typescript
// ❌
const gold = general.data.gold;

// ✅
const gold = general?.data.gold ?? 0;
```

### 타입 불일치
```typescript
// ❌
const id: string = general._id;

// ✅
const id: string = general._id.toString();
```

### 레거시 변환
```typescript
// ❌ db.table
await db.table('general').where('id', id).update({ gold: 100 });

// ✅ Repository
await generalRepository.updateById(id, { $set: { 'data.gold': 100 } });
```

## 진행 추적
```bash
echo "$(date): $(grep -c 'error TS' errors.txt)" >> progress.log
```

상세 내용은 full-guide.md 참조.
