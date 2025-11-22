import type {
  JoinSummaryContext,
  SelectPoolSummaryContext,
  NPCSummaryContext,
  InheritSummaryContext,
} from '@/lib/utils/game/entryFormatter';
import type { HistoryTimelineEvent } from '@/types/logh';

export const joinSummarySample: JoinSummaryContext = {
  trait: '영재',
  statLimits: { min: 15, max: 92, total: 255 },
  totalStats: 248,
  allowJoinNation: true,
  selectedNationName: '위',
  treatmentThreshold: 40,
  autoNationTurn: 1,
  defenceTrain: true,
  hasCustomIcon: true,
};

export const selectPoolSample = {
  pool: [
    {
      no: 101,
      name: '문추',
      imgsvr: 0,
      picture: 3051,
      leadership: 78,
      strength: 82,
      intel: 48,
      politics: 41,
      charm: 52,
      nationName: '위',
    },
    {
      no: 102,
      name: '방덕',
      imgsvr: 0,
      picture: 3052,
      leadership: 74,
      strength: 69,
      intel: 52,
      politics: 55,
      charm: 47,
      nationName: '촉',
    },
    {
      no: 103,
      name: '감녕',
      imgsvr: 1,
      picture: 1881,
      leadership: 82,
      strength: 90,
      intel: 43,
      politics: 36,
      charm: 61,
      nationName: '오',
    },
  ],
};

export const npcPoolSample = {
  pick: [
    {
      no: 201,
      name: '하후위',
      nation: 1,
      leadership: 70,
      strength: 75,
      intel: 55,
      politics: 42,
      picture: 4101,
      imgsvr: 0,
      personal: '강습',
    },
    {
      no: 202,
      name: '곽가',
      nation: 1,
      leadership: 48,
      strength: 32,
      intel: 94,
      politics: 78,
      picture: 4102,
      imgsvr: 0,
      personal: '지모',
    },
  ],
  keep: [201],
  pickMoreSeconds: 18,
};

const selectPoolTotals = selectPoolSample.pool.map((general) =>
  (general.leadership ?? 0) +
  (general.strength ?? 0) +
  (general.intel ?? 0) +
  (general.politics ?? 0) +
  (general.charm ?? 0),
);

export const selectPoolSummaryContext: SelectPoolSummaryContext = {
  poolSize: selectPoolSample.pool.length,
  highlightedName: selectPoolSample.pool[0]?.name,
  nationName: selectPoolSample.pool[0]?.nationName,
  minStat: Math.min(...selectPoolTotals),
  maxStat: Math.max(...selectPoolTotals),
};

export const npcSummaryContext: NPCSummaryContext = {
  npcCount: npcPoolSample.pick.length,
  keepCount: npcPoolSample.keep.length,
  pickMoreSeconds: npcPoolSample.pickMoreSeconds,
  nationCount: new Set(npcPoolSample.pick.map((npc) => npc.nation)).size,
};

export const inheritSummaryContext: InheritSummaryContext = {
  totalPoint: 12400,
  inheritListLength: 3,
};

export const frontHistoryEvents: HistoryTimelineEvent[] = [
  {
    id: 'global-41230',
    order: 1,
    category: 'global',
    title: '허창 탈환',
    description: '조조군이 허창을 탈환했습니다',
    timestampLabel: '02-11 12:10',
  },
  {
    id: 'global-41231',
    order: 2,
    category: 'global',
    title: '남만과 교역 체결',
    description: '손권이 남만과 교역 협정을 맺었습니다',
    timestampLabel: '02-11 14:20',
  },
  {
    id: 'action-59800',
    order: 3,
    category: 'action',
    title: '문추 귀순',
    description: '문추가 손책에게 귀순했습니다',
    timestampLabel: '02-11 15:00',
  },
  {
    id: 'action-59802',
    order: 4,
    category: 'action',
    title: '방덕 장안 수비 배치',
    description: '방덕이 장안 수비에 배치되었습니다',
    timestampLabel: '02-11 16:10',
  },
];

export const entryFlowTimelineEvents: HistoryTimelineEvent[] = [
  {
    id: 'entry-trait',
    order: 1,
    category: 'system',
    title: '트레잇 확정',
    description: '영재 · 총합 241~255 · 최대 92',
  },
  {
    id: 'entry-stats',
    order: 2,
    category: 'action',
    title: '능력치 합 248p',
    description: '통솔 72 / 무력 64 / 지력 55 / 정치 42 / 매력 15',
  },
  {
    id: 'entry-nation',
    order: 3,
    category: 'nation',
    title: '시작 국가 선택',
    description: '위 (모집 중)',
  },
  {
    id: 'entry-icon',
    order: 4,
    category: 'system',
    title: '전용 아이콘 등록',
    description: '156×210 / 검수 완료',
  },
];

export const auctionTimelineEvents: HistoryTimelineEvent[] = [
  {
    id: 'auction-1',
    order: 1,
    category: 'system',
    title: "유니크 무기 '청룡언월도' 경매 개시",
    description: '시작가 20,000금 · 즉시구매가 75,000금',
  },
  {
    id: 'auction-2',
    order: 2,
    category: 'action',
    title: '곽가 35,000금 입찰',
    description: '입찰 시퀀스 #58',
  },
  {
    id: 'auction-3',
    order: 3,
    category: 'action',
    title: '장료 45,000금 입찰',
    description: '선택된 최고가',
  },
  {
    id: 'auction-4',
    order: 4,
    category: 'global',
    title: '경매 종료',
    description: '낙찰가 45,000금 · 구매자 장료',
  },
];
