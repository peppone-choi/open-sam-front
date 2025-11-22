import type { Meta, StoryObj } from '@storybook/react';
import HistoryTimeline from './HistoryTimeline';
import type { HistoryTimelineEvent } from '@/types/logh';
import { frontHistoryEvents, entryFlowTimelineEvents, auctionTimelineEvents } from '@/stories/mocks/entrySamples';

const sampleEvents: HistoryTimelineEvent[] = [
  {
    id: 'global-1',
    order: 1,
    category: 'global',
    title: '한 중원에 세력 교체',
    description: '위 ─ 촉의 장안 점령으로 중원 주도권이 바뀌었습니다.',
  },
  {
    id: 'action-2',
    order: 2,
    category: 'action',
    title: '장수 채용',
    description: '문추가 손책에게 귀순해 강동 방어가 강화되었습니다.',
  },
  {
    id: 'nation-3',
    order: 3,
    category: 'nation',
    title: '오 ─ 촉 불가침 체결',
    description: '향후 6개월간 상호 공격을 금지하기로 합의했습니다.',
  },
];

const entryFlowEvents: HistoryTimelineEvent[] = [
  {
    id: 'trait',
    order: 1,
    category: 'system',
    title: '트레잇 선택 완료',
    description: '영재 · 능력치 합 241~255 범위',
  },
  {
    id: 'stat',
    order: 2,
    category: 'action',
    title: '능력치 분배 248p',
    description: '통솔 72 / 무력 64 / 지력 55 / 정치 42 / 매력 15',
  },
  {
    id: 'nation',
    order: 3,
    category: 'nation',
    title: '시작 국가 확정',
    description: '체섭 · 위 (모집 중)',
  },
  {
    id: 'icon',
    order: 4,
    category: 'system',
    title: '전용 아이콘 업로드',
    description: '규격 156×210, 검수 완료',
  },
];

const meta = {
  title: 'Info/HistoryTimeline',
  component: HistoryTimeline,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
} satisfies Meta<typeof HistoryTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: '연감 주요 기록',
    subtitle: '202년 1월',
    events: sampleEvents,
  },
};

export const Empty: Story = {
  args: {
    title: '연감 주요 기록',
    subtitle: '데이터 없음',
    events: [],
    emptyLabel: '아직 기록이 수집되지 않았습니다.',
  },
};

export const EntryFlow: Story = {
  args: {
    title: '입장 절차',
    subtitle: '트레잇 / 조건 요약',
    events: entryFlowEvents,
    variant: 'compact',
  },
};

export const HighlightNation: Story = {
  args: {
    title: '국가 연감',
    subtitle: '천하 정세',
    events: sampleEvents,
    highlightCategory: 'nation',
  },
};

const timelineSampleMap = {
  frontInfo: frontHistoryEvents,
  entryFlow: entryFlowTimelineEvents,
  auction: auctionTimelineEvents,
};

type TimelineSampleKey = keyof typeof timelineSampleMap;

export const ApiMockSelector: Story = {
  args: {
    sample: 'frontInfo' as TimelineSampleKey,
    title: '실제 서버 데이터 (샘플)',
    subtitle: '허창 탈환 턴',
    highlightCategory: 'action',
  },
  argTypes: {
    sample: {
      control: 'select',
      options: Object.keys(timelineSampleMap),
    },
  },
  render: (args) => {
    const { sample, ...rest } = args as { sample: TimelineSampleKey } & Record<string, any>;
    return <HistoryTimeline {...rest} events={timelineSampleMap[sample]} />;
  },
};
