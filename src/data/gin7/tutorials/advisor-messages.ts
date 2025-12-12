import type { AdvisorMessage } from '@/types/gin7/tutorial';

/**
 * Advisor 메시지 풀
 * 상황별 조언 메시지 정의
 */

/** 신규 플레이어 메시지 */
export const newPlayerMessages: AdvisorMessage[] = [
  {
    id: 'advisor-welcome',
    type: 'tip',
    title: '환영합니다!',
    content: '은하 영웅전설의 세계에 오신 것을 환영합니다. 튜토리얼을 진행하면 기본 조작법을 배울 수 있습니다.',
    trigger: { type: 'event', value: 'FIRST_LOGIN' },
    priority: 100,
    showOnce: true,
    action: {
      label: '튜토리얼 시작',
      callback: 'startBasicsTutorial',
    },
  },
  {
    id: 'advisor-first-map',
    type: 'tip',
    title: '은하 지도 팁',
    content: '마우스 휠로 줌, 드래그로 이동할 수 있습니다. 성계를 클릭하면 상세 정보를 볼 수 있어요.',
    trigger: { type: 'event', value: 'FIRST_MAP_VIEW' },
    priority: 90,
    showOnce: true,
  },
  {
    id: 'advisor-first-fleet',
    type: 'suggestion',
    title: '함대를 확인해보세요',
    content: '함대 패널에서 배정받은 함대를 확인할 수 있습니다. 함대를 선택하고 이동 명령을 내려보세요.',
    trigger: { type: 'event', value: 'FIRST_FLEET_ASSIGN' },
    priority: 85,
    showOnce: true,
  },
];

/** 전투 관련 메시지 */
export const combatMessages: AdvisorMessage[] = [
  {
    id: 'advisor-first-combat',
    type: 'tip',
    title: '첫 전투!',
    content: '전투가 시작되었습니다! 진형을 선택하고 에너지 배분을 조절하여 유리한 상황을 만드세요.',
    trigger: { type: 'event', value: 'FIRST_COMBAT_START' },
    priority: 95,
    showOnce: true,
  },
  {
    id: 'advisor-combat-losing',
    type: 'warning',
    title: '전투 상황 불리',
    content: '현재 전투에서 열세입니다. 퇴각을 고려해보세요. 함대를 보존하는 것도 전략입니다.',
    trigger: { 
      type: 'condition', 
      value: 'combatDisadvantage',
      params: { threshold: 0.3 }
    },
    priority: 80,
    cooldown: 300, // 5분
    action: {
      label: '퇴각',
      callback: 'retreatFleet',
    },
  },
  {
    id: 'advisor-combat-victory',
    type: 'congratulation',
    title: '전투 승리!',
    content: '축하합니다! 전투에서 승리하셨습니다. 전과에 따라 경험치와 명성을 획득했습니다.',
    trigger: { type: 'event', value: 'COMBAT_VICTORY' },
    priority: 70,
    showOnce: false,
    cooldown: 60,
  },
  {
    id: 'advisor-special-attack',
    type: 'tip',
    title: '특수 공격 사용 가능',
    content: 'MCP가 충분합니다. 특수 공격을 사용하면 전황을 유리하게 바꿀 수 있습니다.',
    trigger: { 
      type: 'condition', 
      value: 'mcpFull',
      params: { threshold: 0.8 }
    },
    priority: 60,
    cooldown: 180,
  },
];

/** 자원/경제 메시지 */
export const economyMessages: AdvisorMessage[] = [
  {
    id: 'advisor-low-resources',
    type: 'warning',
    title: '자원 부족 경고',
    content: '자원이 부족합니다. 생산 시설을 건설하거나 무역을 통해 자원을 확보하세요.',
    trigger: { 
      type: 'condition', 
      value: 'lowResources',
      params: { threshold: 100 }
    },
    priority: 75,
    cooldown: 600, // 10분
    action: {
      label: '경제 관리',
      callback: 'openEconomyPanel',
    },
  },
  {
    id: 'advisor-low-fuel',
    type: 'warning',
    title: '연료 부족',
    content: '함대 연료가 부족합니다. 연료 없이는 함대 이동이 불가능합니다.',
    trigger: { 
      type: 'condition', 
      value: 'lowFuel',
      params: { threshold: 50 }
    },
    priority: 85,
    cooldown: 300,
  },
  {
    id: 'advisor-trade-opportunity',
    type: 'suggestion',
    title: '무역 기회',
    content: '근처 시장에서 좋은 가격에 자원을 거래할 수 있습니다. 무역로를 설정해보세요.',
    trigger: { type: 'event', value: 'TRADE_OPPORTUNITY' },
    priority: 50,
    showOnce: false,
    cooldown: 1800, // 30분
    action: {
      label: '시장 보기',
      callback: 'openMarket',
    },
  },
];

/** CP 관련 메시지 */
export const cpMessages: AdvisorMessage[] = [
  {
    id: 'advisor-pcp-low',
    type: 'warning',
    title: 'PCP 부족',
    content: '개인 커맨드 포인트가 부족합니다. 잠시 후 자동으로 회복됩니다.',
    trigger: { 
      type: 'condition', 
      value: 'lowPCP',
      params: { threshold: 10 }
    },
    priority: 65,
    cooldown: 300,
  },
  {
    id: 'advisor-mcp-low',
    type: 'warning',
    title: 'MCP 부족',
    content: '군사 커맨드 포인트가 부족합니다. 다음 턴에 일부 회복됩니다.',
    trigger: { 
      type: 'condition', 
      value: 'lowMCP',
      params: { threshold: 5 }
    },
    priority: 70,
    cooldown: 300,
  },
  {
    id: 'advisor-cp-recovered',
    type: 'tip',
    title: 'CP 회복 완료',
    content: '커맨드 포인트가 완전히 회복되었습니다. 새로운 행동을 수행할 수 있습니다.',
    trigger: { type: 'event', value: 'CP_FULL_RECOVERED' },
    priority: 40,
    showOnce: false,
    cooldown: 600,
  },
];

/** 승진/성장 메시지 */
export const progressMessages: AdvisorMessage[] = [
  {
    id: 'advisor-promotion-available',
    type: 'congratulation',
    title: '승진 가능!',
    content: '경험치가 충분합니다. 인사 메뉴에서 승진을 신청할 수 있습니다.',
    trigger: { type: 'event', value: 'PROMOTION_AVAILABLE' },
    priority: 90,
    showOnce: false,
    action: {
      label: '승진 신청',
      callback: 'openPromotionPanel',
    },
  },
  {
    id: 'advisor-skill-up',
    type: 'tip',
    title: '능력치 성장',
    content: '활동을 통해 능력치를 성장시킬 수 있습니다. 전투는 전투력을, 내정은 정치력을 올립니다.',
    trigger: { type: 'event', value: 'FIRST_STAT_GROWTH' },
    priority: 55,
    showOnce: true,
  },
  {
    id: 'advisor-new-rank',
    type: 'congratulation',
    title: '승진 완료!',
    content: '축하합니다! 새로운 계급으로 승진하셨습니다. MCP 최대치가 증가했습니다.',
    trigger: { type: 'event', value: 'RANK_UP' },
    priority: 95,
    showOnce: false,
  },
];

/** 정치 관련 메시지 */
export const politicsMessages: AdvisorMessage[] = [
  {
    id: 'advisor-low-support',
    type: 'warning',
    title: '지지율 하락',
    content: '행성의 지지율이 떨어지고 있습니다. 치안 유지나 복지에 투자하세요.',
    trigger: { 
      type: 'condition', 
      value: 'lowSupport',
      params: { threshold: 30 }
    },
    priority: 75,
    cooldown: 900, // 15분
    action: {
      label: '행정 관리',
      callback: 'openPoliticsPanel',
    },
  },
  {
    id: 'advisor-rebellion-risk',
    type: 'warning',
    title: '폭동 위험!',
    content: '치안이 매우 낮습니다. 즉시 조치를 취하지 않으면 폭동이 발생할 수 있습니다.',
    trigger: { 
      type: 'condition', 
      value: 'rebellionRisk',
      params: { threshold: 20 }
    },
    priority: 95,
    cooldown: 300,
  },
  {
    id: 'advisor-election-coming',
    type: 'tip',
    title: '선거 임박',
    content: '곧 선거가 진행됩니다. 후보를 지지하거나 출마를 고려해보세요.',
    trigger: { type: 'event', value: 'ELECTION_ANNOUNCED' },
    priority: 80,
    showOnce: false,
  },
];

/** 일반 팁 메시지 */
export const generalTips: AdvisorMessage[] = [
  {
    id: 'advisor-tip-shortcuts',
    type: 'tip',
    title: '단축키 팁',
    content: 'M키로 지도, F키로 함대, C키로 캐릭터 정보를 빠르게 열 수 있습니다.',
    trigger: { type: 'time', value: 'after_5_minutes' },
    priority: 30,
    showOnce: true,
  },
  {
    id: 'advisor-tip-help',
    type: 'tip',
    title: '도움말 안내',
    content: '?키를 누르면 도움말 센터를 열 수 있습니다. 궁금한 점이 있으면 검색해보세요.',
    trigger: { type: 'time', value: 'after_10_minutes' },
    priority: 25,
    showOnce: true,
  },
  {
    id: 'advisor-tip-advisor-off',
    type: 'tip',
    title: '조언 끄기',
    content: '설정에서 조언 기능을 끌 수 있습니다. 익숙해지면 끄셔도 됩니다.',
    trigger: { type: 'time', value: 'after_30_minutes' },
    priority: 20,
    showOnce: true,
  },
];

/** 모든 Advisor 메시지 */
export const allAdvisorMessages: AdvisorMessage[] = [
  ...newPlayerMessages,
  ...combatMessages,
  ...economyMessages,
  ...cpMessages,
  ...progressMessages,
  ...politicsMessages,
  ...generalTips,
];

/**
 * ID로 메시지 찾기
 */
export function getMessageById(id: string): AdvisorMessage | undefined {
  return allAdvisorMessages.find(m => m.id === id);
}

/**
 * 이벤트로 메시지 찾기
 */
export function getMessagesByEvent(eventName: string): AdvisorMessage[] {
  return allAdvisorMessages.filter(
    m => m.trigger.type === 'event' && m.trigger.value === eventName
  );
}

/**
 * 조건으로 메시지 찾기
 */
export function getMessagesByCondition(conditionName: string): AdvisorMessage[] {
  return allAdvisorMessages.filter(
    m => m.trigger.type === 'condition' && m.trigger.value === conditionName
  );
}

/**
 * 우선순위순 정렬된 메시지 가져오기
 */
export function getMessagesByPriority(): AdvisorMessage[] {
  return [...allAdvisorMessages].sort((a, b) => b.priority - a.priority);
}















