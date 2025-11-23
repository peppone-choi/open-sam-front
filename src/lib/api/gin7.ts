import {
  Gin7ApiBundle,
  Gin7CommandPlan,
  Gin7EnergyProfile,
  Gin7SessionOverview,
  Gin7StrategicState,
  Gin7TacticalState,
  Gin7ChatMessage,
  Gin7TelemetrySample,
  Gin7SessionSnapshot,
  Gin7StrategySnapshot,
  Gin7CommandExecutionResult,
} from '@/types/gin7';
import { resolveGin7SessionId } from '@/config/gin7';

const API_BASE = '/api/gin7';

type RequestOptions<T> = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: T;
  headers?: Record<string, string>;
};

function withSession(path: string, sessionId?: string) {
  const resolved = resolveGin7SessionId(sessionId);
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}sessionId=${encodeURIComponent(resolved)}`;
}

async function request<TResponse, TBody = unknown>(path: string, options?: RequestOptions<TBody>): Promise<TResponse> {
  const init: RequestInit = {
    method: options?.method ?? 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options?.headers || {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  };

  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    const payload = await safeJson(response);
    const message = payload?.message || response.statusText || 'GIN7 API error';
    throw new Error(`${path} failed: ${message}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const payload = await safeJson(response);
  return (payload?.data ?? payload) as TResponse;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export type Gin7TelemetryPayload = Omit<Gin7TelemetrySample, 'collectedAt'>;

export const gin7Api = {
  async getBundle(sessionId?: string): Promise<Gin7ApiBundle> {
    const scoped = resolveGin7SessionId(sessionId);
    const [session, strategic, plans, tactical, chat] = await Promise.all([
      gin7Api.getSessionOverview(scoped),
      gin7Api.getStrategicState(scoped),
      gin7Api.getCommandPlans(scoped),
      gin7Api.getTacticalState(scoped),
      gin7Api.getChatLog(scoped),
    ]);

    return { session, strategic, plans, tactical, chat };
  },

  getSessionOverview: (sessionId?: string) => request<Gin7SessionOverview>(withSession('/session', sessionId)),
  getStrategicState: (sessionId?: string) => request<Gin7StrategicState>(withSession('/strategy', sessionId)),
  getCommandPlans: (sessionId?: string) => request<Gin7CommandPlan[]>(withSession('/operations', sessionId)),
  getTacticalState: (sessionId?: string) => request<Gin7TacticalState>(withSession('/tactical', sessionId)),
  getChatLog: (sessionId?: string) => request<Gin7ChatMessage[]>(withSession('/chat', sessionId)),

  getSessionSnapshot: (sessionId?: string) =>
    request<Gin7SessionSnapshot>(`/session/sessions/${resolveGin7SessionId(sessionId)}/overview`),

  getStrategySnapshot: (sessionId?: string) =>
    request<Gin7StrategySnapshot>(`/strategy/sessions/${resolveGin7SessionId(sessionId)}/map`),

  getTelemetrySamples: (sessionId?: string, limit = 6) =>
    request<Gin7TelemetrySample[]>(withSession(`/telemetry?limit=${limit}`, sessionId)),

  updateEnergyProfile(energy: Gin7EnergyProfile, sessionId?: string): Promise<Gin7EnergyProfile> {
    return request<Gin7EnergyProfile, { energy: Gin7EnergyProfile }>(withSession('/tactical/energy', sessionId), {
      method: 'POST',
      body: { energy },
    });
  },

  upsertPlan(plan: Partial<Gin7CommandPlan>, sessionId?: string): Promise<Gin7CommandPlan> {
    return request<Gin7CommandPlan, Partial<Gin7CommandPlan>>(withSession('/operations', sessionId), {
      method: 'POST',
      body: plan,
    });
  },

  submitTelemetry(payload: Gin7TelemetryPayload, sessionId?: string) {
    return request<void, Gin7TelemetryPayload>(withSession('/telemetry', sessionId), {
      method: 'POST',
      body: payload,
    });
  },

  executeCommand(params: {
    sessionId?: string;
    cardId: string;
    commandCode: string;
    characterId: string;
    args?: Record<string, unknown>;
  }): Promise<Gin7CommandExecutionResult> {
    const sessionId = resolveGin7SessionId(params.sessionId);
    const path = `/authority/sessions/${sessionId}/cards/${encodeURIComponent(params.cardId)}/commands/${encodeURIComponent(params.commandCode)}/execute`;
    return request<Gin7CommandExecutionResult, { characterId: string; args?: Record<string, unknown> }>(path, {
      method: 'POST',
      body: {
        characterId: params.characterId,
        args: params.args,
      },
    });
  },
};
