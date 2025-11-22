import { 
  StarSystem, 
  Fleet,
  FleetDetail, 
  UserProfile, 
  CommandType 
} from '@/types/logh';

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
  getUniverseViewport: async (x: number, y: number, zoom: number): Promise<{ systems: StarSystem[], fleets: Fleet[] }> => {
    const [systemsData, fleetsData] = await Promise.all([
      fetchWithAuth(`${API_BASE}/galaxy/systems`),
      fetchWithAuth(`${API_BASE}/galaxy/fleets`)
    ]);

    return {
      systems: systemsData.data || [],
      fleets: fleetsData.data || []
    };
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
  getEconomyState: async () => {
    return fetchWithAuth(`${API_BASE}/economy/state`);
  },
  
  getEconomyEvents: async () => {
    return fetchWithAuth(`${API_BASE}/economy/events`);
  },

  // Communication
  getMessages: async () => {
    return fetchWithAuth(`${API_BASE}/comm/messages`);
  },

  getHandshakes: async () => {
    return fetchWithAuth(`${API_BASE}/comm/handshakes`);
  },

  getAddressBook: async () => {
    return fetchWithAuth(`${API_BASE}/comm/address-book`);
  },

  // Auto-Resolve
  autoResolveBattle: async (battleId: string): Promise<any> => {
    return fetchWithAuth(`${API_BASE}/galaxy/tactical-battles/${battleId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ autoResolve: true })
    });
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
