/**
 * 역사/타임라인 관련 공통 타입
 */

export interface HistoryTimelineEvent {
  id: string;
  title: string;
  description?: string;
  html?: string;
  category: 'global' | 'action' | 'nation' | 'system';
  timestampLabel?: string;
  order?: number;
}

export interface HistoryNationSnapshot {
  id: string;
  name: string;
  color: string;
  cities: number;
  generals: number;
  population: number;
  gold: number;
  rice: number;
}

export interface HistoryRawEntry {
  id: string;
  year: number;
  month: number;
  day?: number;
  type: string;
  message: string;
  actorId?: string;
  actorName?: string;
  targetId?: string;
  targetName?: string;
}

export interface EntryTraitMeta {
  id: string;
  name: string;
  description: string;
  statModifiers?: {
    leadership?: number;
    power?: number;
    intel?: number;
    politics?: number;
    charm?: number;
  };
}

