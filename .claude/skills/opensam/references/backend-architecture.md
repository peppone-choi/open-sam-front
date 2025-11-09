# 백엔드 아키텍처

Node.js + TypeScript + MongoDB 백엔드 구조와 패턴.

## 디렉토리 구조

```
src/
├── engine/           # ✅ 범용 엔진
│   ├── core/
│   ├── systems/
│   └── types/
├── models/           # Mongoose 모델
├── repositories/     # 리포지토리 패턴
├── adapters/         # 레거시 어댑터
└── commands/         # → JSON 변환 예정

config/worlds/
├── threekingdoms/
└── galactic/
```

## Mongoose + TypeScript

```typescript
export interface IGeneralData {
  nation: Types.ObjectId;
  gold: number;
}

export interface IGeneral extends Document {
  no: number;
  data: IGeneralData;
}

const generalSchema = new Schema<IGeneral>({
  no: { type: Number, required: true },
  data: {
    nation: { type: Schema.Types.ObjectId, ref: 'Nation' },
    gold: { type: Number, default: 0 }
  }
});
```

## 리포지토리 패턴

```typescript
export class BaseRepository<T extends Document> {
  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }
  
  async updateMany(filter, update) {
    return this.model.updateMany(filter, update).exec();
  }
}

export class GeneralRepository extends BaseRepository<IGeneral> {
  async findByNation(nationId: string) {
    return this.findMany({ 'data.nation': nationId });
  }
}
```

## 어댑터 패턴

```typescript
export class GeneralAdapter implements ICommander {
  constructor(private general: General) {}
  
  get worldType() { return 'threekingdoms'; }
  get stats() {
    return {
      leadership: this.general.leadership,
      strength: this.general.strength
    };
  }
}
```

상세 내용은 full-guide.md 참조.
