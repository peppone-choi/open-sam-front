# 전투 오디오 리소스

이 디렉토리에는 복셀 전투 시스템의 오디오 파일이 들어갑니다.

## 디렉토리 구조

```
public/audio/battle/
├── music/              # 배경 음악
│   ├── preparation.mp3   # 전투 준비 (루프)
│   ├── tension.mp3       # 긴장감 (루프)
│   ├── battle_calm.mp3   # 전투 시작 (루프)
│   ├── battle_intense.mp3 # 격렬한 전투 (루프)
│   ├── victory.mp3       # 승리
│   └── defeat.mp3        # 패배
│
└── sfx/                # 효과음
    ├── weapons/        # 무기 소리
    │   ├── sword_clash.wav
    │   ├── sword_swing.wav
    │   ├── spear_thrust.wav
    │   ├── arrow_shot.wav
    │   ├── arrow_hit.wav
    │   ├── crossbow_fire.wav
    │   └── axe_hit.wav
    │
    ├── defense/        # 방어 소리
    │   ├── shield_block.wav
    │   ├── armor_hit.wav
    │   └── hit_flesh.wav
    │
    ├── units/          # 유닛 소리
    │   ├── footstep.wav
    │   ├── march.wav
    │   ├── charge_horn.wav
    │   ├── retreat_horn.wav
    │   ├── battle_cry.wav
    │   └── death_cry.wav
    │
    ├── horse/          # 말 소리
    │   ├── horse_gallop.wav
    │   ├── horse_neigh.wav
    │   └── horse_whinny.wav
    │
    ├── ambient/        # 환경 소리
    │   ├── wind.wav
    │   ├── rain.wav
    │   └── fire_crackle.wav
    │
    ├── abilities/      # 특수 능력
    │   ├── special_ability.wav
    │   ├── heal.wav
    │   ├── buff.wav
    │   └── debuff.wav
    │
    └── ui/             # UI 소리
        ├── click.wav
        ├── hover.wav
        ├── notification.wav
        ├── success.wav
        └── error.wav
```

## 현재 상태

**절차적 사운드 사용 중**: 현재는 Web Audio API를 사용한 절차적(procedural) 사운드 생성을 사용합니다.
외부 오디오 파일을 추가하면 자동으로 절차적 사운드 대신 사용됩니다.

## 오디오 파일 추가 방법

### 1. 배경 음악 추가

```typescript
import { initSoundManager } from '@/lib/battle/audio';

const soundManager = await initSoundManager();

// 외부 음악 파일 로드
await soundManager.preloadAudio([
  { id: 'battle_intense', url: '/audio/battle/music/battle_intense.mp3', category: 'music' },
  { id: 'victory', url: '/audio/battle/music/victory.mp3', category: 'music' },
]);
```

### 2. 효과음 추가

```typescript
await soundManager.preloadAudio([
  { id: 'sword_clash', url: '/audio/battle/sfx/weapons/sword_clash.wav', category: 'combat' },
  { id: 'arrow_shot', url: '/audio/battle/sfx/weapons/arrow_shot.wav', category: 'combat' },
]);
```

## 권장 오디오 형식

| 타입 | 형식 | 비트레이트 | 샘플레이트 |
|------|------|-----------|-----------|
| 음악 | MP3/OGG | 128-192 kbps | 44.1 kHz |
| SFX | WAV/OGG | - | 44.1 kHz |

## 라이선스 고려사항

오디오 파일을 추가할 때 라이선스를 확인하세요:
- CC0 (퍼블릭 도메인)
- CC BY (저작자 표시)
- 로열티 프리

### 추천 무료 오디오 소스
- [Freesound.org](https://freesound.org)
- [OpenGameArt.org](https://opengameart.org)
- [Kenney.nl](https://kenney.nl/assets)
- [Mixkit](https://mixkit.co/free-sound-effects/)





