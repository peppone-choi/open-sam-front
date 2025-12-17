import type { InfoSummaryCardProps } from '@/components/info/InfoSummaryCard';
import type { EntryTraitMeta, HistoryTimelineEvent } from '@/types/history';

export interface StatLimits {
  min: number;
  max: number;
  total: number;
}

export interface JoinSummaryContext {
  trait: string;
  statLimits?: StatLimits;
  totalStats: number;
  allowJoinNation: boolean;
  selectedNationName?: string;
  treatmentThreshold?: number;
  autoNationTurn?: number;
  defenceTrain?: boolean;
  hasCustomIcon?: boolean;
}

export interface SelectPoolSummaryContext {
  poolSize: number;
  highlightedName?: string;
  minStat?: number;
  maxStat?: number;
  nationName?: string;
}

export interface NPCSummaryContext {
  npcCount: number;
  keepCount: number;
  pickMoreSeconds: number;
  nationCount: number;
}

export interface InheritSummaryContext {
  totalPoint: number;
  inheritListLength: number;
}

export interface SimpleTimelineSource {
  id: string;
  order: number;
  category?: HistoryTimelineEvent['category'];
  title: string;
  description?: string;
}

const DEFAULT_TRAIT_INFO: EntryTraitMeta = {
  name: '범인',
  description: '평범한 인물',
  details: '최대 90, 보너스 3~5개',
  penalty: '페널티 없음',
  color: '#999999',
  totalMin: 266,
  totalMax: 275,
  max: 90,
};

const TRAIT_MAP: Record<string, EntryTraitMeta> = {
  천재: {
    name: '천재',
    description: '하늘이 내린 재능',
    details: '최대 95, 보너스 5~7개',
    penalty: '유산 1000P, 초기 자원 50%, 나이 -7세',
    color: '#ff6b6b',
    totalMin: 220,
    totalMax: 240,
    max: 95,
  },
  영재: {
    name: '영재',
    description: '남다른 자질',
    details: '최대 92, 보너스 4~6개',
    penalty: '유산 500P, 초기 자원 70%, 나이 -4세',
    color: '#4ecdc4',
    totalMin: 241,
    totalMax: 255,
    max: 92,
  },
  수재: {
    name: '수재',
    description: '뛰어난 소질',
    details: '최대 91, 보너스 4~5개',
    penalty: '유산 200P, 초기 자원 85%, 나이 -2세',
    color: '#95e1d3',
    totalMin: 256,
    totalMax: 265,
    max: 91,
  },
  범인: DEFAULT_TRAIT_INFO,
};

export const getTraitInfo = (traitName: string): EntryTraitMeta => {
  return TRAIT_MAP[traitName as keyof typeof TRAIT_MAP] ?? DEFAULT_TRAIT_INFO;
};

const formatBoolean = (value?: boolean) => (value ? 'ON' : 'OFF');

export const buildJoinSummaryCards = (ctx: JoinSummaryContext): InfoSummaryCardProps[] => {
  const traitInfo = getTraitInfo(ctx.trait);
  const statLimits = ctx.statLimits ?? { min: 0, max: 0, total: 0 };
  const totalDelta = ctx.totalStats - (statLimits.total ?? ctx.totalStats);

  return [
    {
      label: '선택 트레잇',
      value: traitInfo.name,
      description: traitInfo.description,
      accent: 'violet',
      badge: ctx.hasCustomIcon
        ? { label: '아이콘 준비', tone: 'info' }
        : { label: '기본 아이콘', tone: 'neutral' },
      meta: [
        { label: '능력치 합 허용', value: `${traitInfo.totalMin}~${traitInfo.totalMax}` },
        { label: '능력치 최대', value: `${traitInfo.max}` },
      ],
      footer: traitInfo.penalty,
    },
    {
      label: '현재 능력치 합',
      value: `${ctx.totalStats}p`,
      description: '치트 방지를 위해 범위를 확인하세요.',
      accent: 'blue',
      trend: {
        value: `${totalDelta >= 0 ? '+' : ''}${totalDelta}p`,
        label: '기준 합 대비',
        direction: totalDelta === 0 ? 'flat' : totalDelta > 0 ? 'up' : 'down',
        tone: totalDelta >= 0 ? 'positive' : 'negative',
      },
      meta: [
        { label: '최소', value: `${statLimits.min}` },
        { label: '최대', value: `${statLimits.max}` },
      ],
      footer: `기준 합 ${statLimits.total}`,
    },
    {
      label: ctx.allowJoinNation ? '국가 선택 허용' : '재야 전용',
      value: ctx.selectedNationName ? ctx.selectedNationName : ctx.allowJoinNation ? '선택 필요' : '재야 자동 시작',
      description: ctx.selectedNationName ? `${ctx.selectedNationName}에서 시작` : '시작 국가를 선택하세요.',
      accent: ctx.allowJoinNation ? 'green' : 'neutral',
      badge: ctx.allowJoinNation ? undefined : { label: 'LOCKED', tone: 'warning' },
      meta: [
        { label: '치료 시도', value: `${ctx.treatmentThreshold ?? 0}%` },
        { label: '국가 턴', value: formatBoolean((ctx.autoNationTurn ?? 0) > 0) },
      ],
      footer: `수비 훈련: ${formatBoolean(ctx.defenceTrain)} · 아이콘 ${ctx.hasCustomIcon ? 'ON' : 'OFF'}`,
    },
  ];
};

export const buildSelectPoolSummary = (ctx: SelectPoolSummaryContext): InfoSummaryCardProps[] => {
  const availabilityTone = ctx.poolSize > 0 ? 'positive' : 'negative';

  return [
    {
      label: '선발 장수',
      value: `${ctx.poolSize}명`,
      description: '현재 회차에서 선택 가능한 장수',
      accent: 'blue',
      trend: {
        value: ctx.poolSize > 0 ? '충분' : '품절',
        label: '가용 슬롯',
        direction: ctx.poolSize > 0 ? 'up' : 'down',
        tone: availabilityTone,
      },
      meta: [
        { label: '최소 능력', value: ctx.minStat ? `${ctx.minStat}` : '-' },
        { label: '최대 능력', value: ctx.maxStat ? `${ctx.maxStat}` : '-' },
      ],
    },
    {
      label: '추천 장수',
      value: ctx.highlightedName ?? '미지정',
      description: '커서가 위치한 장수 정보를 표시합니다.',
      accent: 'green',
      badge: ctx.nationName ? { label: ctx.nationName, tone: 'success' } : undefined,
      meta: [
        { label: '주요 국가', value: ctx.nationName ?? '재야' },
        { label: '선발 순번', value: '선착순' },
      ],
    },
  ];
};

export const buildNpcSummaryCards = (ctx: NPCSummaryContext): InfoSummaryCardProps[] => {
  return [
    {
      label: 'NPC 후보',
      value: `${ctx.npcCount}명`,
      description: '시나리오에서 선택 가능한 캐릭터',
      accent: 'blue',
      badge: { label: `${ctx.nationCount}개 국가`, tone: 'info' },
      meta: [
        { label: '국가 수', value: `${ctx.nationCount}` },
        { label: '찜 목록', value: `${ctx.keepCount}` },
      ],
    },
    {
      label: '다시 뽑기',
      value: ctx.pickMoreSeconds > 0 ? `${ctx.pickMoreSeconds}초` : '가능',
      description: '퍼블릭 풀 새로고침 대기 시간',
      accent: ctx.pickMoreSeconds > 0 ? 'amber' : 'green',
      trend: {
        value: ctx.pickMoreSeconds > 0 ? '대기 중' : '즉시 가능',
        label: '쿨다운',
        direction: ctx.pickMoreSeconds > 0 ? 'down' : 'up',
        tone: ctx.pickMoreSeconds > 0 ? 'negative' : 'positive',
      },
      meta: [
        { label: '상태', value: ctx.pickMoreSeconds > 0 ? '대기 중' : '즉시 가능' },
        { label: '찜 유지', value: ctx.keepCount > 0 ? 'ON' : 'OFF' },
      ],
    },
  ];
};

export const buildInheritSummaryCards = (ctx: InheritSummaryContext): InfoSummaryCardProps[] => {
  return [
    {
      label: '보유 유산',
      value: `${ctx.totalPoint.toLocaleString()} P`,
      description: '다음 회차 시작 시 사용 가능',
      accent: 'amber',
      badge: { label: ctx.totalPoint > 0 ? '활성화' : '0P', tone: ctx.totalPoint > 0 ? 'success' : 'warning' },
      trend: {
        value: ctx.totalPoint > 0 ? '사용 준비 완료' : '추가 적립 필요',
        label: '최근 상태',
        direction: ctx.totalPoint > 0 ? 'up' : 'flat',
        tone: ctx.totalPoint > 0 ? 'positive' : 'neutral',
      },
      meta: [
        { label: '적립 기록', value: `${ctx.inheritListLength}건` },
        { label: '상태', value: ctx.totalPoint > 0 ? '충분' : '부족' },
      ],
    },
  ];
};

export const buildTimelineFromSources = (sources: SimpleTimelineSource[]): HistoryTimelineEvent[] => {
  return sources.map((source) => ({
    id: source.id,
    order: source.order,
    category: source.category ?? 'system',
    title: source.title,
    description: source.description,
  }));
};
