import type { Meta, StoryObj } from '@storybook/react';
import InfoSummaryCard from './InfoSummaryCard';
import {
  buildJoinSummaryCards,
  buildSelectPoolSummary,
  buildNpcSummaryCards,
  buildInheritSummaryCards,
} from '@/lib/utils/game/entryFormatter';
import {
  joinSummarySample,
  selectPoolSummaryContext,
  npcSummaryContext,
  inheritSummaryContext,
} from '@/stories/mocks/entrySamples';

const meta = {
  title: 'Info/KpiCard',
  component: InfoSummaryCard,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
} satisfies Meta<typeof InfoSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: '활성 국가',
    value: '12개',
    description: '불가침 4 / 교전 2',
    meta: [
      { label: '국력 합계', value: '2,450,000' },
      { label: '장수', value: '186명' },
    ],
  },
};

export const WithIcon: Story = {
  args: {
    label: '분쟁 도시',
    value: '5곳',
    description: '도시 다툼이 증가하고 있습니다.',
    accent: 'amber',
    icon: '🔥',
    meta: [
      { label: '최대 치열도', value: '78%' },
      { label: '참전 세력', value: '3국' },
    ],
    footer: '최근 3턴 연속 증가',
  },
};

export const WithTrend: Story = {
  args: {
    label: '능력치 합',
    value: '248p',
    description: '기준치와 비교해 주세요.',
    accent: 'blue',
    trend: {
      value: '+7p',
      label: '기준 합 대비',
      direction: 'up',
      tone: 'positive',
    },
    meta: [
      { label: '최소', value: '60' },
      { label: '최대', value: '92' },
    ],
  },
};

export const EntryFlow: Story = {
  args: {
    label: '선택 트레잇',
    value: '영재',
    description: '능력치 합 241~255, 최대 92',
    accent: 'violet',
    badge: { label: '아이콘 준비', tone: 'info' },
    meta: [
      { label: '유산 비용', value: '500P' },
      { label: '초기 자원', value: '70%' },
    ],
    footer: '페널티: 나이 -4세',
  },
};

export const Dense: Story = {
  args: {
    label: '다시 뽑기',
    value: '대기 중',
    description: '쿨다운 17초 남음',
    accent: 'amber',
    dense: true,
    trend: {
      value: '17초',
      label: '쿨다운',
      direction: 'down',
      tone: 'negative',
    },
    meta: [
      { label: '찜 유지', value: 'ON' },
    ],
  },
};

const joinCards = buildJoinSummaryCards(joinSummarySample);
const selectCards = buildSelectPoolSummary(selectPoolSummaryContext);
const npcCards = buildNpcSummaryCards(npcSummaryContext);
const inheritCards = buildInheritSummaryCards(inheritSummaryContext);

const apiSampleMap = {
  joinTrait: joinCards[0],
  joinStats: joinCards[1],
  joinCondition: joinCards[2],
  selectPool: selectCards[0],
  selectHighlight: selectCards[1],
  npcSummary: npcCards[0],
  npcCooldown: npcCards[1],
  inheritSummary: inheritCards[0],
};

type ApiSampleKey = keyof typeof apiSampleMap;

export const ApiSamples: Story = {
  args: {
    sample: 'joinTrait' as ApiSampleKey,
    dense: false,
  },
  argTypes: {
    sample: {
      control: 'select',
      options: Object.keys(apiSampleMap),
    },
  },
  render: (args) => {
    const { sample, dense } = args as { sample: ApiSampleKey; dense?: boolean };
    const card = apiSampleMap[sample];
    return <InfoSummaryCard {...card} dense={dense ?? card.dense} />;
  },
};
