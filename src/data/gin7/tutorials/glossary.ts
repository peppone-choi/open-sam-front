import type { TooltipDefinition } from '@/types/gin7/tutorial';

/**
 * Gin7 게임 용어 사전
 * 툴팁에서 사용되는 용어 정의
 */

/** 능력치 관련 용어 */
export const statTerms: TooltipDefinition[] = [
  {
    id: 'pcp',
    term: 'PCP',
    description: '개인 커맨드 포인트(Personal Command Point). 개인적인 행동(이동, 내정, 외교 등)에 소모됩니다. 시간이 지나면 자동으로 회복됩니다.',
    category: 'stat',
    icon: '⚡',
    link: '/gin7/help/cp',
  },
  {
    id: 'mcp',
    term: 'MCP',
    description: '군사 커맨드 포인트(Military Command Point). 군사적 행동(전투 명령, 함대 지휘 등)에 소모됩니다. 계급이 높을수록 최대치가 증가합니다.',
    category: 'stat',
    icon: '⚔️',
    link: '/gin7/help/cp',
  },
  {
    id: 'stats-command',
    term: '지휘력',
    description: '함대를 지휘하는 능력입니다. 지휘력이 높을수록 더 큰 함대를 효율적으로 운용할 수 있습니다.',
    category: 'stat',
    icon: '🎖️',
  },
  {
    id: 'stats-combat',
    term: '전투력',
    description: '전술적 판단력과 전투 수행 능력입니다. 전투력이 높을수록 전투에서 유리한 상황을 만들 수 있습니다.',
    category: 'stat',
    icon: '🗡️',
  },
  {
    id: 'stats-politics',
    term: '정치력',
    description: '정치적 협상과 외교 능력입니다. 정치력이 높을수록 외교 활동과 인사 명령이 성공할 확률이 높아집니다.',
    category: 'stat',
    icon: '🏛️',
  },
  {
    id: 'stats-intelligence',
    term: '지략',
    description: '전략적 사고와 정보 분석 능력입니다. 지략이 높을수록 첩보 활동과 기습 작전이 효과적입니다.',
    category: 'stat',
    icon: '🧠',
  },
];

/** 명령 관련 용어 */
export const commandTerms: TooltipDefinition[] = [
  {
    id: 'cmd-warp',
    term: '워프 이동',
    description: '워프 항로를 통해 다른 성계로 이동합니다. 함대 규모와 거리에 따라 소요 시간이 달라집니다.',
    category: 'command',
    icon: '🚀',
  },
  {
    id: 'cmd-patrol',
    term: '순찰',
    description: '지정된 구역을 순찰하며 적 함대를 탐지합니다. 순찰 중 적을 발견하면 자동으로 전투에 돌입합니다.',
    category: 'command',
    icon: '👁️',
  },
  {
    id: 'cmd-blockade',
    term: '봉쇄',
    description: '적 성계를 봉쇄하여 물자 수송을 차단합니다. 봉쇄된 성계는 교역이 불가능합니다.',
    category: 'command',
    icon: '🚫',
  },
  {
    id: 'cmd-raid',
    term: '기습',
    description: '적 후방을 기습하여 보급선을 공격합니다. 성공 시 적의 자원을 약탈할 수 있습니다.',
    category: 'command',
    icon: '⚡',
  },
  {
    id: 'cmd-retreat',
    term: '퇴각',
    description: '전투에서 이탈합니다. 손실을 감수하고 함대를 안전한 곳으로 후퇴시킵니다.',
    category: 'command',
    icon: '🏃',
  },
];

/** 유닛 관련 용어 */
export const unitTerms: TooltipDefinition[] = [
  {
    id: 'unit-battleship',
    term: '전함',
    description: '주력 전투함입니다. 높은 화력과 장갑을 갖추고 있으며 함대의 핵심 전력을 구성합니다.',
    category: 'unit',
    icon: '🚢',
  },
  {
    id: 'unit-cruiser',
    term: '순양함',
    description: '다목적 함선입니다. 전함보다 빠르고 기동성이 좋아 다양한 임무에 투입됩니다.',
    category: 'unit',
    icon: '🛳️',
  },
  {
    id: 'unit-destroyer',
    term: '구축함',
    description: '소형 고속 전투함입니다. 정찰, 호위, 대잠수함 작전에 주로 사용됩니다.',
    category: 'unit',
    icon: '⛵',
  },
  {
    id: 'unit-carrier',
    term: '항공모함',
    description: '함재기를 운용하는 대형 함선입니다. 원거리 타격과 정찰에 강점이 있습니다.',
    category: 'unit',
    icon: '✈️',
  },
  {
    id: 'unit-armored',
    term: '기갑병',
    description: '중장갑을 갖춘 지상 전투 유닛입니다. 보병에 강하지만 척탄병에 취약합니다.',
    category: 'unit',
    icon: '🛡️',
  },
  {
    id: 'unit-grenadier',
    term: '척탄병',
    description: '대장갑 무기를 장비한 특수 보병입니다. 기갑에 강하지만 일반 보병에 취약합니다.',
    category: 'unit',
    icon: '💣',
  },
  {
    id: 'unit-infantry',
    term: '보병',
    description: '기본 지상 전투 유닛입니다. 척탄병에 강하지만 기갑에 취약합니다.',
    category: 'unit',
    icon: '🪖',
  },
];

/** 세력 관련 용어 */
export const factionTerms: TooltipDefinition[] = [
  {
    id: 'faction-empire',
    term: '은하제국',
    description: '골든바움 왕조가 통치하는 전제군주국입니다. 강력한 군사력과 중앙집권적 체제가 특징입니다.',
    category: 'faction',
    icon: '👑',
    link: '/gin7/help/factions',
  },
  {
    id: 'faction-alliance',
    term: '자유행성동맹',
    description: '민주주의를 표방하는 공화국입니다. 의회 정치와 선거 제도가 특징입니다.',
    category: 'faction',
    icon: '🏛️',
    link: '/gin7/help/factions',
  },
  {
    id: 'faction-phezzan',
    term: '페잔',
    description: '양대 세력 사이에서 중립을 유지하는 상업 국가입니다. 경제력과 정보력이 뛰어납니다.',
    category: 'faction',
    icon: '💰',
    link: '/gin7/help/factions',
  },
];

/** 일반 용어 */
export const generalTerms: TooltipDefinition[] = [
  {
    id: 'term-warp',
    term: '워프',
    description: '초광속 항해 기술입니다. 항해 가능한 워프 회랑을 통해 성계 간 이동이 가능합니다.',
    category: 'term',
    icon: '🌀',
  },
  {
    id: 'term-fortress',
    term: '요새',
    description: '대규모 방어 시설입니다. 강력한 화력과 방어력을 갖추고 있어 전략적 요충지 방어에 사용됩니다.',
    category: 'term',
    icon: '🏰',
  },
  {
    id: 'term-iserlohn',
    term: '이제를론',
    description: '양대 세력 경계에 위치한 거대 요새입니다. "난공불락"이라 불리는 전략적 요충지입니다.',
    category: 'term',
    icon: '🏰',
  },
  {
    id: 'term-rank',
    term: '계급',
    description: '군인의 지위를 나타냅니다. 계급이 높을수록 더 큰 함대를 지휘하고 더 많은 명령을 내릴 수 있습니다.',
    category: 'term',
    icon: '⭐',
    link: '/gin7/help/ranks',
  },
  {
    id: 'term-turn',
    term: '턴',
    description: '게임의 시간 단위입니다. 매 턴마다 각종 이벤트가 처리되고 자원이 생산됩니다.',
    category: 'term',
    icon: '⏱️',
  },
];

/** 모든 용어 통합 */
export const allTerms: TooltipDefinition[] = [
  ...statTerms,
  ...commandTerms,
  ...unitTerms,
  ...factionTerms,
  ...generalTerms,
];

/**
 * ID로 용어 찾기
 */
export function getTermById(id: string): TooltipDefinition | undefined {
  return allTerms.find(t => t.id === id);
}

/**
 * 키워드로 용어 찾기 (term 필드 일치)
 */
export function getTermByKeyword(keyword: string): TooltipDefinition | undefined {
  return allTerms.find(t => t.term === keyword);
}

/**
 * 카테고리별 용어 가져오기
 */
export function getTermsByCategory(category: TooltipDefinition['category']): TooltipDefinition[] {
  return allTerms.filter(t => t.category === category);
}

/**
 * 용어 검색 (term, description에서 검색)
 */
export function searchTerms(query: string): TooltipDefinition[] {
  const lowerQuery = query.toLowerCase();
  return allTerms.filter(
    t =>
      t.term.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery)
  );
}















