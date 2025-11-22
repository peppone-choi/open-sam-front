export const GIN7_DEFAULT_SESSION_ID = process.env.NEXT_PUBLIC_GIN7_SESSION_ID || 's2-main';

export const GIN7_ALERT_THRESHOLD_MS = Number(process.env.NEXT_PUBLIC_GIN7_LOOP_ALERT_THRESHOLD_MS || 3500);

export const GIN7_ALERT_CHANNEL = process.env.NEXT_PUBLIC_GIN7_ALERT_CHANNEL || 'galaxy:ops-alerts';

export const GIN7_ALERT_TARGET_LABEL =
  process.env.NEXT_PUBLIC_GIN7_ALERT_TARGET || 'Webhook 미설정 (console fallback)';

export function resolveGin7SessionId(sessionId?: string) {
  return sessionId || GIN7_DEFAULT_SESSION_ID;
}
