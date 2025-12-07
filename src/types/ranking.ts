/**
 * 랭킹 관련 타입 정의
 */

// 장수 랭킹 항목
export interface GeneralRankingEntry {
  rank: number;
  generalId: number;
  name: string;
  nationId?: number;
  nationName?: string;
  nationColor?: string;
  npc?: boolean;
  // 능력치
  leadership: number;
  power: number;
  intellect: number;
  // 전적
  experience: number;
  kills: number;
  warWins: number;
  warLosses: number;
  // 점수
  score?: number;
  // 업적
  unificationCount?: number;
  // 기타
  level?: number;
  officerLevel?: string;
  specialAbility?: string;
}

// 국가 랭킹 항목
export interface NationRankingEntry {
  rank: number;
  nationId: number;
  name: string;
  color?: string;
  rulerName?: string;
  rulerId?: number;
  // 국력 지표
  power: number;
  territory: number;
  generalCount: number;
  population: number;
  gold: number;
  rice: number;
  // 전적
  warWins: number;
  warLosses: number;
  unificationCount?: number;
  // 점수
  score?: number;
}

// 통일 기록 항목
export interface UnificationRecord {
  id: string;
  seasonNumber: number;
  scenarioName: string;
  // 통일 정보
  unificationYear: number;
  unificationMonth: number;
  unifiedAt?: string; // ISO Date
  // 통일 국가 정보
  nationId: number;
  nationName: string;
  nationColor?: string;
  // 군주 정보
  rulerId: number;
  rulerName: string;
  rulerIcon?: string;
  // 주요 장수
  topGenerals?: {
    id: number;
    name: string;
    kills: number;
    contribution?: number;
  }[];
  // 통계
  duration?: number; // 게임 진행 턴 수
  totalGenerals?: number;
  totalBattles?: number;
  totalDeaths?: number;
  // 게임 모드 정보
  gameMode?: string;
  scenarioType?: string;
}

// 정렬 옵션
export type GeneralSortField = 
  | 'score'
  | 'leadership'
  | 'power'
  | 'intellect'
  | 'experience'
  | 'kills'
  | 'warWins';

export type NationSortField = 
  | 'score'
  | 'power'
  | 'territory'
  | 'generalCount'
  | 'population'
  | 'warWins';

export type SortDirection = 'asc' | 'desc';

// API 응답 타입
export interface GeneralRankingResponse {
  result: boolean;
  data: GeneralRankingEntry[];
  total: number;
  page: number;
  limit: number;
  sort?: GeneralSortField;
  direction?: SortDirection;
}

export interface NationRankingResponse {
  result: boolean;
  data: NationRankingEntry[];
  total: number;
  page: number;
  limit: number;
  sort?: NationSortField;
  direction?: SortDirection;
}

export interface UnificationHistoryResponse {
  result: boolean;
  data: UnificationRecord[];
  total: number;
  page: number;
  limit: number;
}

