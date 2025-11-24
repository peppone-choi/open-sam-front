import { 
  StarSystem, 
  Fleet,
  FleetDetail, 
  UserProfile, 
  CommandType 
} from '@/types/logh';
import {
  ChatMessage,
  ChannelType,
  Mail,
  MailBoxInfo,
  AddressBookEntry,
  Handshake,
  HandshakeStatus,
} from '@/types/comm';

const API_BASE = '/api/logh';

// Helper for Auth Headers
const getHeaders = () => {
  const token = process.env.NEXT_PUBLIC_API_TOKEN || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers = { ...getHeaders(), ...options.headers };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const error = await res.text().catch(() => res.statusText);
    throw new Error(`API Error ${res.status}: ${error}`);
  }
  return res.json();
};

// Command Mapping
const CMD_MAP: Record<CommandType, string> = {
  'warp': 'move_fleet',
  'move': 'move_fleet',
  'attack': 'issue_operation',
  'supply': 'issue_operation', 
  'personnel': 'issue_operation',
  'tactics': 'issue_operation'
};

export const loghApi = {
  // Galaxy/Strategy Map APIs
  getGalaxyViewport: async (sessionId?: string) => {
    const params = new URLSearchParams();
    if (sessionId) params.set('sessionId', sessionId);

    // LOGH 전용 갤럭시 뷰포트 엔드포인트 사용
    return fetchWithAuth(`${API_BASE}/galaxy/viewport?${params.toString()}`);
  },


  // Ground Combat APIs
  getGroundCombatState: async (battleId: string, sessionId?: string) => {
    const params = new URLSearchParams();
    if (sessionId) params.set('sessionId', sessionId);
    
    const response = await fetch(`/api/logh/ground-combat/${battleId}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch ground combat state');
    return response.json();
  },

  getOccupationStatus: async (battleId: string, sessionId?: string) => {
    const params = new URLSearchParams();
    if (sessionId) params.set('sessionId', sessionId);
    
    const response = await fetch(`/api/logh/ground-combat/${battleId}/occupation?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch occupation status');
    return response.json();
  },

  getSupplyBatches: async (battleId: string, sessionId?: string) => {
    const params = new URLSearchParams();
    if (sessionId) params.set('sessionId', sessionId);
    
    const response = await fetch(`/api/logh/ground-combat/${battleId}/supplies?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch supply batches');
    return response.json();
  },

  getWarehouseStocks: async (battleId: string, sessionId?: string) => {
    const params = new URLSearchParams();
    if (sessionId) params.set('sessionId', sessionId);
    
    const response = await fetch(`/api/logh/ground-combat/${battleId}/warehouse?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch warehouse stocks');
    return response.json();
  },

  updateOccupation: async (battleId: string, planetId: string, updates: any, sessionId?: string) => {
    const response = await fetch(`/api/logh/ground-combat/${battleId}/occupation/${planetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, sessionId }),
    });
    if (!response.ok) throw new Error('Failed to update occupation status');
    return response.json();
  },

  consumeSupply: async (battleId: string, batchId: string, amount: number, sessionId?: string) => {
    const response = await fetch(`/api/logh/ground-combat/${battleId}/supplies/${batchId}/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, sessionId }),
    });
    if (!response.ok) throw new Error('Failed to consume supply');
    return response.json();
  },

  getUserProfile: async (): Promise<UserProfile> => {
    const data = await fetchWithAuth(`${API_BASE}/galaxy/commanders?my_character=true`);
    if (data.data && data.data.length > 0) {
        const cmd = data.data[0];
        return {
            id: cmd.no.toString(),
            name: cmd.name,
            rank: cmd.rank,
            faction: cmd.faction,
            pcp: cmd.commandPoints?.personal || 0,
            mcp: cmd.commandPoints?.military || 0,
            maxPcp: 100,
            maxMcp: 100,
            jobCards: [] 
        };
    }
    throw new Error('No commander found');
  },

  // Legacy LOGH endpoints (used by game screen)
  getMyCommander: async () => {
    const res = await fetch(`${API_BASE}/my-commander`);
    if (!res.ok) {
      throw new Error('Failed to load commander');
    }
    return res.json();
  },

  getFleetDetail: async (fleetId: string) => {
    const res = await fetch(`${API_BASE}/fleet/${fleetId}`);
    if (!res.ok) {
      throw new Error('Failed to load fleet');
    }
    return res.json();
  },

  executeCommand: async (cardId: string, command: CommandType, target?: any): Promise<{ success: boolean, message: string, pcpCost: number, mcpCost: number }> => {
    const backendCmd = CMD_MAP[command];
    
    const data = await fetchWithAuth(`${API_BASE}/command/execute`, {
      method: 'POST',
      body: JSON.stringify({ 
        command: backendCmd,
        params: { target, cardId }
      })
    });
    
    return {
        success: data.success,
        message: data.message || 'Command executed',
        pcpCost: 0, 
        mcpCost: 0 
    };
  },

  // Economy
  getEconomyState: async (sessionId: string, characterId?: string) => {
    const params = new URLSearchParams({ sessionId });
    if (characterId) params.set('characterId', characterId);
    const response = await fetchWithAuth(`${API_BASE}/galaxy/economy/state?${params}`);
    return response.data;
  },
  
  getEconomyEvents: async (sessionId: string, characterId?: string, limit = 10) => {
    const params = new URLSearchParams({ sessionId, limit: limit.toString() });
    if (characterId) params.set('characterId', characterId);
    const response = await fetchWithAuth(`${API_BASE}/galaxy/economy/events?${params}`);
    return response.data;
  },

  // Communication - Chat
  getChatMessages: async (
    sessionId: string,
    channelType: ChannelType,
    scopeId?: string,
    limit = 50
  ): Promise<ChatMessage[]> => {
    const params = new URLSearchParams({
      sessionId,
      channelType,
      limit: limit.toString(),
    });
    if (scopeId) params.append('scopeId', scopeId);
    
    const data = await fetchWithAuth(`${API_BASE}/galaxy/comm/messages?${params}`);
    return data.data || [];
  },

  sendChatMessage: async (
    sessionId: string,
    channelType: ChannelType,
    senderCharacterId: string,
    message: string,
    scopeId?: string,
    metadata?: Record<string, any>
  ): Promise<ChatMessage> => {
    const data = await fetchWithAuth(`${API_BASE}/galaxy/comm/messages`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        channelType,
        scopeId,
        senderCharacterId,
        message,
        metadata,
      }),
    });
    return data.data;
  },

  // Communication - Handshakes (Messenger)
  getHandshakes: async (sessionId: string, characterId: string): Promise<Handshake[]> => {
    const params = new URLSearchParams({ sessionId, characterId });
    const data = await fetchWithAuth(`${API_BASE}/galaxy/comm/handshakes?${params}`);
    return data.data || [];
  },

  requestHandshake: async (
    sessionId: string,
    requesterCharacterId: string,
    targetCharacterId: string
  ): Promise<Handshake> => {
    const data = await fetchWithAuth(`${API_BASE}/galaxy/comm/handshakes`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        requesterCharacterId,
        targetCharacterId,
      }),
    });
    return data.data;
  },

  respondHandshake: async (
    sessionId: string,
    handshakeId: string,
    responderCharacterId: string,
    action: 'accepted' | 'rejected'
  ): Promise<Handshake> => {
    const data = await fetchWithAuth(
      `${API_BASE}/galaxy/comm/handshakes/${handshakeId}/respond`,
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          responderCharacterId,
          action,
        }),
      }
    );
    return data.data;
  },

  // Communication - Address Book
  getAddressBook: async (sessionId: string, characterId: string): Promise<AddressBookEntry[]> => {
    const params = new URLSearchParams({ sessionId, characterId });
    const data = await fetchWithAuth(`${API_BASE}/galaxy/comm/address-book?${params}`);
    return data.data || [];
  },

  addAddressBookEntry: async (
    sessionId: string,
    ownerCharacterId: string,
    contactCharacterId: string,
    contactName: string
  ): Promise<AddressBookEntry> => {
    const data = await fetchWithAuth(`${API_BASE}/galaxy/comm/address-book`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        ownerCharacterId,
        contactCharacterId,
        contactName,
      }),
    });
    return data.data;
  },

  // Auto-Resolve
  autoResolveBattle: async (battleId: string, resolverCharacterId: string): Promise<any> => {
    return fetchWithAuth(`${API_BASE}/galaxy/tactical-battles/${battleId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ autoResolve: true, resolverCharacterId })
    });
  },

  // Check offline commanders in battle
  checkOfflineCommanders: async (battleId: string, sessionId?: string): Promise<{ hasOfflineCommanders: boolean; offlineCommanderIds: string[] }> => {
    const params = new URLSearchParams();
    if (sessionId) params.set('sessionId', sessionId);
    
    const response = await fetchWithAuth(`${API_BASE}/galaxy/tactical-battles/${battleId}/offline-check?${params}`);
    return response.data || { hasOfflineCommanders: false, offlineCommanderIds: [] };
  },

  // Fleet Management
  getMyFleet: async (): Promise<FleetDetail> => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/fleet/my`);
      if (res.data) return res.data;
    } catch (e) {
      // Fallback
    }
    
    // Fallback Mock Data for Development
    return {
      id: 'mock-fleet-1',
      commanderName: 'Yang Wen-li',
      faction: 'alliance',
      gridX: 10,
      gridY: 10,
      size: 5000,
      status: 'idle',
      formation: 'standard',
      morale: 95,
      supplies: 8000,
      ammo: 7500,
      ships: Array.from({ length: 20 }).map((_, i) => ({
        id: `ship-${i}`,
        name: `Hyperion-${i}`,
        type: i === 0 ? 'battleship' : i < 5 ? 'cruiser' : 'destroyer',
        durability: 100,
        maxDurability: 100,
        crew: 100,
        maxCrew: 100,
        energy: 100,
        maxEnergy: 100,
        status: 'active'
      }))
    } as FleetDetail;
  },

  updateFormation: async (formationId: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`${API_BASE}/fleet/formation`, {
        method: 'POST',
        body: JSON.stringify({ formation: formationId })
      });
      return true;
    } catch (e) {
      console.warn('API failed, using mock success');
      return true;
    }
  },

  getBattleState: async (battleId: string): Promise<any> => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/galaxy/tactical-battles/${battleId}`);
      if (res.data) return res.data;
    } catch(e) {
      // Fallback
    }
    // Mock Data
    return {
      id: battleId,
      turn: 1,
      phase: 'planning',
      fleets: [
        { fleetId: 'f1', name: '13th Fleet', faction: 'alliance', totalShips: 5000, formation: 'standard', tacticalPosition: { x: 2000, y: 5000, heading: 0 } },
        { fleetId: 'f2', name: 'Imperial Fleet', faction: 'empire', totalShips: 8000, formation: 'spindle', tacticalPosition: { x: 8000, y: 5000, heading: 180 } }
      ]
    };
  }
};
