// Next.js rewrites를 사용하여 CORS 없이 백엔드 API 호출
const API_BASE = '';

type FetchInit = RequestInit & { signal?: AbortSignal };

async function fetchJson<T>(path: string, init?: FetchInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API 요청 실패: ${response.status} ${response.statusText} - ${text}`);
  }

  return response.json() as Promise<T>;
}

export type GeneralSortKey =
  | 'experience'
  | 'dedication'
  | 'firenum'
  | 'warnum'
  | 'killnum'
  | 'winrate'
  | 'killcrew'
  | 'killrate'
  | 'occupied'
  | 'merit_official'
  | 'emperor';

export interface GeneralRankingItem {
  rank: number;
  generalNo: number;
  type: GeneralSortKey | string;
  value: number;
  season: number;
  scenario: number;
  owner: number | null;
  serverId?: string;
  aux?: Record<string, any>;
}

export interface GeneralRankingResponse {
  success: boolean;
  sort: string;
  session_id?: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: GeneralRankingItem[];
  message?: string;
}

export async function getGeneralRanking(params: {
  sort?: GeneralSortKey;
  page?: number;
  limit?: number;
  sessionId?: string;
  signal?: AbortSignal;
}): Promise<GeneralRankingResponse> {
  const query = new URLSearchParams();
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.sessionId) query.set('session_id', params.sessionId);

  const qs = query.toString();
  return fetchJson<GeneralRankingResponse>(`/api/ranking/generals${qs ? `?${qs}` : ''}`, {
    signal: params.signal,
  });
}

export interface NationRankingItem {
  _id?: string;
  session_id: string;
  nation: number;
  name: string;
  color?: string;
  flagImage?: string;
  flagTextColor?: string;
  flagBgColor?: string;
  flagBorderColor?: string;
  rate?: number;
  gold?: number;
  rice?: number;
  capital?: number;
  level?: number;
  type?: string;
  leader?: number;
  gennum?: number;
  tech?: number;
  country_type?: number;
  scout?: number;
  aux?: Record<string, any>;
  data?: Record<string, any>;
}

export interface NationRankingResponse {
  success: boolean;
  nations: NationRankingItem[];
  message?: string;
}

export async function getNationRanking(params: {
  sessionId?: string;
  signal?: AbortSignal;
} = {}): Promise<NationRankingResponse> {
  const query = new URLSearchParams();
  if (params.sessionId) query.set('session_id', params.sessionId);
  const qs = query.toString();
  return fetchJson<NationRankingResponse>(`/api/ranking/nations${qs ? `?${qs}` : ''}`, {
    signal: params.signal,
  });
}

export interface HistoryEntry {
  _id?: string;
  session_id: string;
  nation_id: number;
  year: number;
  month: number;
  text: string;
  created_at?: string;
}

export interface HistoryResponse {
  success: boolean;
  history: HistoryEntry[];
  message?: string;
}

export async function getHistory(params: {
  sessionId?: string;
  nationId?: number;
  signal?: AbortSignal;
} = {}): Promise<HistoryResponse> {
  const query = new URLSearchParams();
  if (params.sessionId) query.set('session_id', params.sessionId);
  if (typeof params.nationId === 'number' && !Number.isNaN(params.nationId)) {
    query.set('nation_id', String(params.nationId));
  }
  const qs = query.toString();
  return fetchJson<HistoryResponse>(`/api/ranking/history${qs ? `?${qs}` : ''}`, {
    signal: params.signal,
  });
}


