const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface GetFrontInfoResponse {
  success: boolean;
  result: boolean;
  global: {
    scenarioText: string;
    extendedGeneral: 0 | 1;
    isFiction: 0 | 1;
    npcMode: 0 | 1 | 2;
    joinMode: 'onlyRandom' | 'full';
    startyear: number;
    year: number;
    month: number;
    autorunUser: {
      limit_minutes: number;
      options: Record<string, number>;
    };
    turnterm: number;
    lastExecuted: string;
    lastVoteID: number;
    develCost: number;
    noticeMsg: number;
    onlineNations: string | null;
    onlineUserCnt: number | null;
    apiLimit: number;
    auctionCount: number;
    isTournamentActive: boolean;
    isTournamentApplicationOpen: boolean;
    isBettingActive: boolean;
    isLocked: boolean;
    tournamentType: null | 0 | 1 | 2 | 3;
    tournamentState: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    tournamentTime: string;
    genCount: [number, number][];
    generalCntLimit: number;
    serverCnt: number;
    lastVote: any | null;
  };
  general: {
    no: number;
    name: string;
    officerLevel: number;
    officerLevelText: string;
    city: number;
    permission: number;
    reservedCommand: any[] | null;
    [key: string]: any;
  };
  nation: {
    id: number;
    name: string;
    color: string;
    level: number;
    [key: string]: any;
  } | null;
  city: {
    id: number;
    name: string;
    nationInfo: {
      id: number;
      name: string;
      color: string;
    };
    level: number;
    trust: number;
    pop: [number, number];
    agri: [number, number];
    comm: [number, number];
    secu: [number, number];
    def: [number, number];
    wall: [number, number];
    trade: number | null;
    officerList: Record<2 | 3 | 4, {
      officer_level: 2 | 3 | 4;
      name: string;
      npc: number;
    } | null>;
  } | null;
  recentRecord: {
    history: any[];
    global: any[];
    general: any[];
  };
}

export interface GetMapResponse {
  success: boolean;
  result: boolean;
  cityList: number[][];
  nationList: Array<[number, string, string, number]>;
  myCity: number | null;
  myNation: number | null;
  spyList: Record<number, number>;
  startYear: number;
  year: number;
  month: number;
  version: number;
}

export class SammoAPI {
  private static baseURL = API_BASE_URL;

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async GeneralGetFrontInfo(params: {
    serverID: string;
    lastNationNoticeDate?: string;
    lastGeneralRecordID?: number;
    lastWorldHistoryID?: number;
  }): Promise<GetFrontInfoResponse> {
    return this.request<GetFrontInfoResponse>('/api/general/front-info', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async GlobalGetMap(params: {
    serverID: string;
  }): Promise<GetMapResponse> {
    return this.request<GetMapResponse>('/api/global/map', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
