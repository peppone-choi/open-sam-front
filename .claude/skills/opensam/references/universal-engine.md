# 범용 엔진 설계

세계/스케일 독립적 게임 엔진 설계 원칙.

## 핵심 원칙

### 1. 세계 독립적 (World-Agnostic)
```typescript
// ❌ 세계 특정
interface General {
  horse: string;  // 삼국지만
}

// ✅ 세계 독립적
interface ICommander {
  worldType: string;
  specificData: Record<string, any>;
}
```

### 2. 스케일 독립적 (Scale-Agnostic)
```typescript
// ❌ 고정
const MAX = 20000;

// ✅ 스케일 독립
interface IMilitaryUnit {
  scaleLevel: number;  // 1~10
  actualCount: number;
}
```

### 3. 설정 기반 (Configuration-Driven)
```typescript
// ❌ 하드코딩
return leadership * 0.6;

// ✅ JSON
{
  "formula": "stats.leadership * 0.6"
}
```

## JSON 액션 시스템

```json
{
  "agriculture": {
    "requirements": { "min_population": 1000 },
    "costs": { "gold": 100 },
    "effects": [{
      "target": "location.agriculture",
      "formula": "stats.politics * 0.7"
    }]
  }
}
```

## 스케일 시스템
- Level 1: 5-50 (소규모)
- Level 5: 1K-10K (중규모)
- Level 10: 100M+ (은하)

상세 내용은 full-guide.md 참조.
