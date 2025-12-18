// @ts-nocheck
import type { HistoryNationSnapshot, HistoryRawEntry, HistoryTimelineEvent } from '@/types/history';

const TAG_REGEX = /<[^>]+>/g;
const WHITESPACE_REGEX = /\s+/g;

const toArray = (entries?: HistoryRawEntry[] | null): HistoryRawEntry[] => {
  if (!entries) {
    return [];
  }
  return Array.isArray(entries) ? entries : [];
};

const stripHtml = (content?: string): string => {
  if (!content) {
    return '';
  }
  return content.replace(TAG_REGEX, ' ').replace(WHITESPACE_REGEX, ' ').trim();
};

export const normalizeHistoryEntries = (
  entries: HistoryRawEntry[] | null | undefined,
  category: HistoryTimelineEvent['category'],
): HistoryTimelineEvent[] => {
  return toArray(entries).map((entry, index) => {
    const rawId = Array.isArray(entry) ? entry[0] : entry.id ?? index;
    const rawBody = Array.isArray(entry) ? entry[1] : entry.text ?? '';
    const plain = stripHtml(Array.isArray(entry) ? entry[1] : entry.summary ?? entry.text ?? '');
    const title = (Array.isArray(entry) ? plain : entry.title ?? plain) || '기록';

    const timestampLabel = !Array.isArray(entry) && entry.timestamp ? entry.timestamp : undefined;
    const orderValue = typeof rawId === 'number' ? rawId : index;

    return {
      id: `${category}-${String(rawId ?? index)}`,
      order: orderValue,
      category,
      title,
      description: plain || title,
      timestampLabel,
      html: typeof rawBody === 'string' ? rawBody : undefined,
    } satisfies HistoryTimelineEvent;
  });
};

export const sortHistoryEvents = (events: HistoryTimelineEvent[]): HistoryTimelineEvent[] => {
  return [...events].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const getHistoryNationAggregate = (nations?: HistoryNationSnapshot[] | null) => {
  const list = nations ?? [];
  const totalPower = list.reduce((sum, n) => sum + (n.power ?? 0), 0);
  const totalGenerals = list.reduce((sum, n) => sum + (n.gennum ?? 0), 0);
  const topNations = [...list]
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0))
    .slice(0, 3);

  return {
    totalPower,
    totalGenerals,
    totalNations: list.length,
    topNations,
  };
};
