/**
 * TacticalBattleCanvas Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import TacticalBattleCanvas from './TacticalBattleCanvas';
import { allDemoFleets, allianceFleets, empireFleets } from './demo-data';

const meta: Meta<typeof TacticalBattleCanvas> = {
  title: 'LOGH/TacticalBattleCanvas',
  component: TacticalBattleCanvas,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# 은하영웅전설 전술 전투 Canvas

실시간 우주 함대 전투를 위한 전술 맵 컴포넌트입니다.

## 기능
- 10000x10000 연속좌표 전술 맵
- 진형별 함대 아이콘
- 실시간 이동 애니메이션 (WebSocket)
- 사정거리 원 표시
- 줌/팬/박스 선택
- 미니맵

## 키보드 단축키
| 키 | 명령 |
|---|---|
| F | 이동 |
| D | 평행이동 |
| S | 선회 |
| A | 정지 |
| R | 공격 |
| E | 일제 사격 |
| W | 연속 공격 |
| Q | 공격 중지 |
| Z | 진형 변경 |
| T | 후퇴 |
| Space | 일시정지 |
| ESC | 선택 해제 |

## 마우스 조작
- **좌클릭**: 함대 선택
- **Shift+드래그**: 박스 선택
- **Ctrl+클릭**: 다중 선택
- **우클릭**: 빠른 이동
- **더블클릭**: 기함 부대 전체 선택
- **휠**: 줌
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    sessionId: {
      control: 'text',
      description: '세션 ID',
    },
    battleId: {
      control: 'text',
      description: '전투 ID',
    },
    playerFaction: {
      control: 'select',
      options: ['alliance', 'empire'],
      description: '플레이어 진영',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TacticalBattleCanvas>;

// 기본 스토리
export const Default: Story = {
  args: {
    sessionId: 'demo-session',
    battleId: 'demo-battle-001',
    playerFaction: 'alliance',
    initialFleets: allDemoFleets,
    onClose: () => console.log('Close clicked'),
    onBattleEnd: (winner) => console.log('Battle ended, winner:', winner),
  },
};

// 자유행성동맹 시점 (빨강/녹색)
export const AlliancePerspective: Story = {
  args: {
    ...Default.args,
    playerFaction: 'alliance',
    initialFleets: [...allianceFleets, ...empireFleets],
  },
};

// 은하제국 시점 (파랑/검파랑)
export const EmpirePerspective: Story = {
  args: {
    ...Default.args,
    playerFaction: 'empire',
    initialFleets: [...empireFleets, ...allianceFleets],
  },
};

// 소규모 전투
export const SmallBattle: Story = {
  args: {
    ...Default.args,
    initialFleets: [allianceFleets[0], empireFleets[0]],
  },
};

// 대규모 전투
export const LargeBattle: Story = {
  args: {
    ...Default.args,
    initialFleets: [
      ...allianceFleets,
      ...empireFleets,
      // 추가 함대들
      ...allianceFleets.map((f, i) => ({
        ...f,
        id: `${f.id}-extra-${i}`,
        name: `${f.name} (증원)`,
        tacticalPosition: {
          ...f.tacticalPosition,
          x: f.tacticalPosition.x - 500,
          y: f.tacticalPosition.y + (i - 1) * 600,
        },
      })),
    ],
  },
};

