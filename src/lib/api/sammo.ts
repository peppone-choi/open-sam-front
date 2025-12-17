import type { RawUnitDefinition } from '@/stores/unitStore';

// Next.js rewrites를 사용하여 /api/* 요청을 백엔드로 프록시
// 상대 경로를 사용하면 CORS 문제 없이 API 호출 가능
const API_BASE_URL = '';

type NationPolicyResponse = {
  policy?: {
    rate: number;
    bill: number;
    secretLimit: number;
    blockWar: boolean;
    blockScout: boolean;
  };
  warSettingCnt?: {
    remain: number;
    inc: number;
    max: number;
  };
  notices?: {
    nation?: any;
    scout?: string;
  };
};

export interface ChiefFinanceStat {
  current: number;
  income: number;
  outcome: number;
  net: number;
  breakdown: Record<string, number>;
}

export interface ChiefFinancePayload {
  gold: ChiefFinanceStat;
  rice: ChiefFinanceStat;
}

export interface ChiefPolicyPayload {
  rate: number;
  bill: number;
  secretLimit: number;
  blockWar: boolean;
  blockScout: boolean;
}

export interface ChiefNoticePayload {
  nation?: {
    msg?: string;
    author?: string;
    authorID?: number;
    date?: string;
  } | null;
  scout?: string;
}

export interface ChiefWarSettingPayload {
  remain: number;
  inc: number;
  max: number;
}

export interface ChiefTimelinePayload {
  year: number;
  month: number;
  turnTerm: number;
  maxChiefTurn: number;
 }
 
 export interface NationStratFinanPayload {
   year: number;
   month: number;
   nationID: number;
   officerLevel: number;
   editable: boolean;
   nationsList: Array<{
     nation: number;
     name: string;
     color: string;
     cityCnt: number;
     gennum: number;
     power: number;
     diplomacy: {
       state: number;
       term: number | null;
     };
   }>;
   nationMsg: string;
   scoutMsg: string;
   gold: number;
   rice: number;
   policy: {
     rate: number;
     bill: number;
     secretLimit: number;
     blockWar: boolean;
     blockScout: boolean;
   };
   warSettingCnt: {
     remain: number;
     inc: number;
     max: number;
   };
   income: {
     gold: {
       city: number;
       war: number;
     };
     rice: {
       city: number;
       wall: number;
     };
   };
   outcome: number;
 }
 
 export interface ChiefCenterPayload {
  nation: {
    id: number;
    name: string;
    level: number;
    color?: string;
    capital?: number;
    type?: string;
    cityCount?: number;
    generalCount?: number;
  };
  chief: {
    generalId: number | null;
    name: string;
    officerLevel: number;
  };
  powers: {
    gold: number;
    rice: number;
    tech: number;
  };
  policy?: ChiefPolicyPayload;
  warSettingCnt?: ChiefWarSettingPayload;
  notices?: ChiefNoticePayload;
  finance?: ChiefFinancePayload;
  timeline?: ChiefTimelinePayload;
}

export interface ChiefCenterResponse {
  result: boolean;
  center?: ChiefCenterPayload;
  reason?: string;
}

export interface GetFrontInfoResponse {
  success: boolean;
  result: boolean;
  global: {
    serverName?: string; // 세션 표시 이름
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
    turnTime?: string;
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
    /** 세션 상태: preparing, running, paused, finished, united */
    sessionStatus?: 'preparing' | 'running' | 'paused' | 'finished' | 'united';
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
    injury?: number;
    leadership?: number;
    strength?: number;
    intel?: number;
    politics?: number;
    charm?: number;
    leadership_exp?: number;
    strength_exp?: number;
    intel_exp?: number;
    politics_exp?: number;
    charm_exp?: number;
    lbonus?: number;
    sbonus?: number;
    ibonus?: number;
    pbonus?: number;
    cbonus?: number;
    officer_city?: number;
    turntime?: string | Date;
    horse?: string;
    weapon?: string;
    book?: string;
    item?: string;
    gold?: number;
    rice?: number;
    crewtype?: string | number | { id: number; label: string };
    crew?: number;
    personal?: string;
    train?: number;
    atmos?: number;
    specialDomestic?: string;
    specialWar?: string;
    explevel?: number;
    experience?: number;
    age?: number;
    defence_train?: number;
    killturn?: number;
    troop?: number;
    troopInfo?: {
      name: string;
      leader?: {
        city?: number;
        reservedCommand?: Array<any> | null;
      };
    };
    refreshScoreTotal?: number;
    refreshScore?: number;
    picture?: string;
    imgsvr?: number;
    unitStacks?: {
      totalTroops: number;
      stackCount: number;
      averageTrain?: number;
      averageMorale?: number;
      stacks: Array<{
        id: string;
        crewTypeId: number;
        crewTypeName?: string;
        troops: number;
        train: number;
        morale: number;
        updatedAt?: string;
      }>;
    } | null;
    [key: string]: any;
  };

  nation: {
    id: number;
    name: string;
    color: string;
    level: number;
    onlineGen?: string; // 국가 내 접속 장수 목록 (쉼표 구분)
    notice?: { msg: string };
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
      no?: number;
      name: string;
      npc: number;
    } | null>;
    defense?: {
      wall: [number, number];
      gate: [number, number];
      towerLevel?: number;
      repairRate?: number;
      lastDamageAt?: string;
      lastRepairAt?: string;
    } | null;
    garrison?: {
      totalTroops: number;
      stackCount: number;
      stacks: Array<{
        id: string;
        crewTypeId: number;
        crewTypeName?: string;
        troops: number;
        train: number;
        morale: number;
        updatedAt?: string;
      }>;
    };
  } | null;
  recentRecord: {
    history: ([number, string] | { id: number; text: string; timestamp: Date })[];  // [id, html text] or object
    global: ([number, string] | { id: number; text: string; timestamp: Date })[];   // [id, html text] or object
    general: ([number, string] | { id: number; text: string; timestamp: Date })[];  // [id, html text] or object
    flushHistory?: number;
    flushGlobal?: number;
    flushGeneral?: number;
  };
  cityConstMap?: {
    /**
     * 지역/레벨/관직/국가 레벨 상수 맵
     * - region: 지역 ID → 지역 이름/라벨
     * - level: 도시 레벨 → 레벨 텍스트 (향/수/진/관/…)
     * - officerTitles: 관직 레벨 → 직위명 (군주/태수/도위 등)
     * - nationLevels: 국가 레벨 → 국가 등급명
     */
    region?: Record<number | string, string | { id?: number; name?: string; label?: string }>;
    level?: Record<number, string>;
    officerTitles?: Record<number | string, string>;
    nationLevels?: Record<number | string, string>;
  };
 }


export type CityInfo = NonNullable<GetFrontInfoResponse['city']>;
export type NationInfo = NonNullable<GetFrontInfoResponse['nation']>;

export interface GetMapResponse {
  success: boolean;
  result: boolean;
  cityList: number[][];
  roadList?: [number, number][];  // 도시 간 도로 연결 [fromCity, toCity]
  nationList: Array<[number, string, string, number, string, string, string, string]>; // id, name, color, capital, flagImage, flagTextColor, flagBgColor, flagBorderColor
  myCity: number | null;
  myNation: number | null;
  spyList: Record<number, number>;
  shownByGeneralList: number[];
  startYear: number;
  year: number;
  month: number;
  version: number;
  tileMap?: {
    columns: number;
    rows: number;
    tileSize?: number;
    tiles: Array<{
      type: string;
      variant?: number;
      elevation?: number;
      decoration?: string | null;
    }>;
  };
}

interface JoinCreateGeneralPayload {
  name: string;
  nation: number;
  leadership: number;
  strength: number;
  intel: number;
  politics: number;
  charm: number;
  character: string;
  trait: string;
  pic?: boolean;
  city?: number;
  serverID: string;
}

export interface JoinNationSummary {
  nation: number;
  name: string;
  color: string;
  scout?: string;
  scoutmsg?: string;
}

export interface JoinCitySummary {
  id: number;
  name: string;
  x: number;
  y: number;
  nation?: number;
}

export interface JoinStatLimits {
  min: number;
  max: number;
  total: number;
}

export interface JoinNationsResponse {
  result: boolean;
  reason?: string;
  allowJoinNation?: boolean;
  nations?: JoinNationSummary[];
  cities?: JoinCitySummary[];
  statLimits?: JoinStatLimits;
}

export type BattleCenterEntry = {
  battleId?: number;
  id: string | number;
  type: 'active' | 'general' | 'world';
  status: string;
  text: string;
  date: string | Date;
  generalId?: number;
  nationId?: number;
  attackerNationId?: number;
  defenderNationId?: number;
  targetCityId?: number;
  currentPhase?: string;
  currentTurn?: number;
};

export class SammoAPI {
  private static baseURL = API_BASE_URL;

  private static getToken(): string | null {
    // 브라우저 환경에서만 실행
    if (typeof window === 'undefined') return null;
    
    // 쿠키에서 토큰 찾기
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token' || name === 'authToken') {
        return decodeURIComponent(value);
      }
    }
    
    // localStorage에서 토큰 찾기
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      return token;
    } catch {
      return null;
    }
  }

  // 쿠키에서 CSRF 토큰 읽기
  private static getCSRFToken(): string | null {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    const csrfToken = this.getCSRFToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    
    // 토큰이 있으면 Authorization 헤더에 추가
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // CSRF 토큰 추가 (state-changing 요청에 필요)
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }
    
    try {
      console.log(`API Request: ${url}`, options);
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      });

      console.log(`API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        // 에러 응답 본문 읽기
        const errorText = await response.text();
        let errorData: any;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || response.statusText };
        }
        
        // 401 에러는 특별 처리 (인증 실패는 정상적인 경우일 수 있음)
        if (response.status === 401) {
          const error = new Error(errorData.message || errorData.reason || errorData.error || '인증이 필요합니다');
          (error as any).status = 401;
          throw error;
        }
        
        // 다른 에러는 상세 메시지 포함
        const errorMessage = errorData.reason || errorData.message || errorData.error || this.getKoreanStatusText(response.status);
        const error = new Error(`요청 실패: ${errorMessage}`);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }

      const responseData = await response.json();
      console.log(`API Response Data:`, responseData);
      return responseData;
    } catch (error: any) {
      // 네트워크 에러나 fetch 자체가 실패한 경우
      if (error.status) {
        // 이미 처리된 HTTP 에러는 그대로 throw
        throw error;
      }
      // fetch 실패 (네트워크 연결 끊김, CORS 에러 등)
      throw new Error(`서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.`);
    }
  }

  private static getKoreanStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      400: '잘못된 요청입니다',
      403: '접근 권한이 없습니다',
      404: '요청한 리소스를 찾을 수 없습니다',
      500: '서버 내부 오류가 발생했습니다',
      502: '게이트웨이 오류가 발생했습니다',
      503: '서비스를 사용할 수 없습니다',
      504: '게이트웨이 시간 초과',
    };
    return statusTexts[status] || `오류가 발생했습니다 (${status})`;
  }

  static async GeneralGetFrontInfo(params: {
    serverID: string;
    lastNationNoticeDate?: string;
    lastGeneralRecordID?: number; // 장수동향
    lastPersonalHistoryID?: number; // 개인기록
    lastGlobalHistoryID?: number; // 중원정세
  }): Promise<GetFrontInfoResponse> {
    const query = new URLSearchParams();
    query.append('serverID', params.serverID);
    if (params.lastNationNoticeDate) query.append('lastNationNoticeDate', params.lastNationNoticeDate);
    if (params.lastGeneralRecordID) query.append('lastGeneralRecordID', String(params.lastGeneralRecordID));
    if (params.lastPersonalHistoryID) query.append('lastPersonalHistoryID', String(params.lastPersonalHistoryID));
    if (params.lastGlobalHistoryID) query.append('lastGlobalHistoryID', String(params.lastGlobalHistoryID));
    
    return this.request<GetFrontInfoResponse>(`/api/general/get-front-info?${query.toString()}`, {
      method: 'GET',
    });
  }

  static async GlobalGetMap(params: {
    serverID?: string;
    neutralView?: 0 | 1;
    showMe?: 0 | 1;
  }): Promise<GetMapResponse> {
    const query = new URLSearchParams();
    if (params.serverID) query.append('serverID', params.serverID);
    if (params.neutralView !== undefined) query.append('neutralView', String(params.neutralView));
    if (params.showMe !== undefined) query.append('showMe', String(params.showMe));
    
    return this.request<GetMapResponse>(`/api/global/get-map?${query.toString()}`, {
      method: 'GET',
    });
  }

  // Login API
  static async LoginByID(params: {
    username: string;
    password: string;
    otp?: string;
  }): Promise<{
    result: boolean;
    reqOTP: boolean;
    reason: string;
    nextToken?: [number, string];
    token?: string;
    userId?: string;
    message?: string;
  }> {
    try {
      const result = await this.request<{
        message: string;
        token: string;
        userId: string;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      
      // 백엔드 응답 형식에 맞게 변환
      return {
        result: !!result.token,
        reqOTP: false,
        reason: result.message || '로그인 성공',
        token: result.token,
        userId: result.userId,
        message: result.message,
      };
    } catch (error: any) {
      // 에러를 result 형식으로 변환
      return {
        result: false,
        reqOTP: false,
        reason: error.message || '로그인에 실패했습니다',
        token: undefined,
        userId: undefined,
        message: error.message,
      };
    }
  }

  static async LoginByToken(params: {
    tokenID: number;
    token: string;
  }): Promise<{
    result: boolean;
    reason: string;
  }> {
    return this.request('/api/login/by-token', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async Register(params: {
    username: string;
    password: string;
    nickname: string;
    secret_agree: boolean;
    secret_agree2: boolean;
    third_use: boolean;
  }): Promise<{
    result: boolean;
    reason?: string;
    message?: string;
    userId?: string;
  }> {
    const result = await this.request<{
      message: string;
      userId: string;
      error?: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    return {
      result: !result.error && !!result.userId,
      reason: result.error || result.message,
      message: result.message,
      userId: result.userId,
    };
  }

  static async ReqNonce(): Promise<{
    result: boolean;
    nonce: string;
  }> {
    return this.request('/api/login/req-nonce', {
      method: 'POST',
    });
  }

  // Global API
  static async GlobalGetConst(): Promise<{
    result: boolean;
    data?: any;
  }> {
    const response = await this.request<{
      result: boolean;
      data?: {
        gameUnitConst?: Record<string, RawUnitDefinition>;
      };
    }>('/api/global/get-const', {
      method: 'GET',
    });

    try {
      const { setUnitDataFromApi } = await import('@/stores/unitStore');
      if (response?.result && response.data?.gameUnitConst) {
        setUnitDataFromApi(response.data.gameUnitConst);
      }
    } catch (error) {
      console.warn('[SammoAPI] Failed to synchronize unit data store:', error);
    }

    return response;
  }

  static async GlobalGetMenu(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    menu: Array<{
      type?: 'item' | 'multi' | 'split';
      name: string;
      url?: string;
      newTab?: boolean;
      funcCall?: string;
      condShowVar?: string;
      subMenu?: Array<{
        type?: 'item' | 'line';
        name?: string;
        url?: string;
        newTab?: boolean;
      }>;
      main?: {
        name: string;
        url: string;
        newTab?: boolean;
      };
    }>;
    version: number;
  }> {
    const query = new URLSearchParams();
    if (params?.serverID) query.append('serverID', params.serverID);
    if (params?.session_id) query.append('session_id', params.session_id);
    
    return this.request(`/api/global/get-global-menu?${query.toString()}`, {
      method: 'GET',
    });
  }

  static async GlobalGetNationList(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    nations?: any[];
    nationList?: Array<[number, string, string, number]>;
  }> {
    const query = new URLSearchParams();
    if (params?.session_id) query.append('session_id', params.session_id);
    
    return this.request(`/api/global/get-nation-list?${query.toString()}`, {
      method: 'GET',
    });
  }

  static async GlobalGetDiplomacy(params?: {
    session_id?: string;
    serverID?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    nations?: any[];
    conflict?: [number, Record<number, number>][];
    diplomacyList?: Record<number, Record<number, number>>;
    myNationID?: number;
    message?: string;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }

    return this.request('/api/global/diplomacy', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  
  static async GlobalGeneralList(params: {

    token?: string;
  }): Promise<{
    result: boolean;
    generalList: any[];
  }> {
    return this.request('/api/global/general-list', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Command API
  static async CommandGetReservedCommand(params?: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
  }): Promise<{
     success: boolean;
     result: boolean;
     turn: Array<{
       action: string;
       brief: string;
       arg: any;
     }>;
     /** 다음 개인 턴 기준 시각 (ISO 문자열) */
     turnTime: string;
     /** 한 턴 길이 (분 단위) */
     turnTerm: number;
     /** 장수의 다음 turnTime 기준 in‑game 년/월 */
     year: number;
     month: number;
     /** 세션 전체 관점의 현재 in‑game 년/월 (없으면 year/month와 동일) */
     sessionYear?: number;
     sessionMonth?: number;
     /** 응답 생성 시 서버 시각 (ISO 문자열) */
     date: string;
     autorun_limit?: number | null;
     reason?: string;
   }> {

    const query = new URLSearchParams();
    if (params?.serverID) query.append('session_id', params.serverID);
    if (params?.session_id) query.append('session_id', params.session_id);
    if (params?.general_id) query.append('general_id', String(params.general_id));
    
    return this.request(`/api/command/get-reserved-command?${query.toString()}`, {
      method: 'GET',
    });
  }

  static async CommandReserveCommand(params: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
    turn_idx?: number;
    turnList?: number[];
    action: string;
    arg?: any;
    brief?: string;
  }): Promise<{
    success: boolean;
    result?: boolean;
    reason?: string;
    message?: string;
  }> {
    const query = new URLSearchParams();
    if (params?.serverID) query.append('session_id', params.serverID);
    if (params?.session_id) query.append('session_id', params.session_id);
    
    const body: any = {
      general_id: params.general_id,
      action: params.action,
      arg: params.arg || {},
      brief: params.brief,
    };

    // turnList가 있으면 우선 사용, 없으면 turn_idx 사용
    if (params.turnList && params.turnList.length > 0) {
      body.turnList = params.turnList;
    } else if (params.turn_idx !== undefined) {
      body.turn_idx = params.turn_idx;
    }
    
    console.log('[SammoAPI.CommandReserveCommand] params.arg:', JSON.stringify(params.arg));
    console.log('[SammoAPI.CommandReserveCommand] body:', JSON.stringify(body));

    // serverID가 있으면 session_id로 매핑
    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }
    if (params.session_id) {
      body.session_id = params.session_id;
    }

    return this.request(`/api/command/reserve-command?${query.toString()}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async CommandPushCommand(params: {
    command: string;
    args: any;
    turnList: number[];
  }): Promise<{
    result: boolean;
    reason?: string;
  } & NationPolicyResponse> {
    return this.request('/api/command/push', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // NationCommand API (Chief / nation turns)
  static async NationCommandGetReservedCommand(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    lastExecute: string | Date;
    year: number;
    month: number;
    turnTerm: number;
    date: string | Date;
    chiefList: Record<number, {
      name: string | null;
      turnTime: string | null;
      officerLevel?: number;
      officerLevelText: string;
      npcType: number | null;
      turn: Record<number, {
        action: string;
        brief: string;
        arg: any;
      }>;
    }>;
    troopList: Record<number, string>;
    isChief: boolean;
    autorun_limit: number;
    officerLevel: number;
    commandList: any;
    mapName: string;
    unitSet: string;
    maxChiefTurn?: number;
    message?: string;
  }> {
    const query = new URLSearchParams();
    if (params?.serverID) query.append('session_id', params.serverID);
    if (params?.session_id) query.append('session_id', params.session_id);

    return this.request(`/api/nation-command/get-reserved-command?${query.toString()}`, {
      method: 'GET',
    });
  }

  static async NationCommandReserveCommand(params: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
    action: string;
    turnList: number[];
    arg?: any;
  }): Promise<{
    success: boolean;
    result: boolean;
    brief?: string;
    reason?: string;
    message?: string;
  }> {
    const body: any = {
      action: params.action,
      turnList: params.turnList,
      arg: params.arg || {},
    };

    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }
    if (params.session_id) {
      body.session_id = params.session_id;
    }
    if (params.general_id) {
      body.general_id = params.general_id;
    }

    return this.request('/api/nation-command/reserve-command', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationCommandReserveBulkCommand(params: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
    commands: Array<{
      turnList: number[];
      action: string;
      arg: any;
    }>;
  }): Promise<{
    success: boolean;
    result: boolean;
    briefList?: Record<number, string>;
    reason?: string;
    message?: string;
  }> {
    const body: any = {
      commands: params.commands,
    };

    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }
    if (params.session_id) {
      body.session_id = params.session_id;
    }
    if (params.general_id) {
      body.general_id = params.general_id;
    }

    return this.request('/api/nation-command/reserve-bulk-command', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationCommandPushCommand(params: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
    amount: number;
  }): Promise<{
    success: boolean;
    result?: boolean;
    message?: string;
  }> {
    const body: any = {
      amount: params.amount,
    };

    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }
    if (params.session_id) {
      body.session_id = params.session_id;
    }
    if (params.general_id) {
      body.general_id = params.general_id;
    }

    return this.request('/api/nation-command/push-command', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationCommandRepeatCommand(params: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
    amount: number;
  }): Promise<{
    success: boolean;
    result?: boolean;
    message?: string;
  }> {
    const body: any = {
      amount: params.amount,
    };

    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }
    if (params.session_id) {
      body.session_id = params.session_id;
    }
    if (params.general_id) {
      body.general_id = params.general_id;
    }

    return this.request('/api/nation-command/repeat-command', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Nation API
  static async NationGetNationInfo(params?: {
    session_id?: string;
    serverID?: string;
    general_id?: number;
    generalID?: number;
    full?: boolean;
  }): Promise<{
    result: boolean;
    nation: NationInfo;
  }> {
    const body: Record<string, any> = {};

    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }

    const generalId = params?.general_id ?? params?.generalID;
    if (typeof generalId !== 'undefined') {
      body.general_id = generalId;
    }

    if (typeof params?.full !== 'undefined') {
      body.full = params.full;
    }

    return this.request('/api/nation/info', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationSetNotice(params: {
    msg: string;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  } & NationPolicyResponse> {
    const body: Record<string, any> = {
      msg: params.msg,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/nation/set-notice', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationSetScoutMsg(params: {
    msg: string;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  } & NationPolicyResponse> {
    const body: Record<string, any> = {
      msg: params.msg,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/nation/set-scout-msg', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationSetRate(params: {
    amount: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  } & NationPolicyResponse> {
    const body: Record<string, any> = {
      amount: params.amount,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/nation/set-rate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationSetBill(params: {
    amount: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  } & NationPolicyResponse> {
    const body: Record<string, any> = {
      amount: params.amount,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/nation/set-bill', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationSetSecretLimit(params: {
    amount: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    availableCnt?: number;
  } & NationPolicyResponse> {
    const body: Record<string, any> = {
      amount: params.amount,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/nation/set-secret-limit', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationSetBlockWar(params: {
    value: boolean;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  } & NationPolicyResponse> {
    const body: Record<string, any> = {
      value: params.value,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/nation/set-block-war', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationSetBlockScout(params: {
    value: boolean;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: Record<string, any> = {
      value: params.value,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/nation/set-block-scout', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Message API
  static async MessageGetRecentMessage(params?: {
    serverID?: string;
    session_id?: string;
    type?: string;
    limit?: number;
    sequence?: number;
  }): Promise<{
    success: boolean;
    result: boolean;
    messages?: any[];
    message?: string;
  }> {
    return this.request('/api/message/get-recent', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async MessageGetMessages(params?: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    result: boolean;
    messages?: any[];
    total?: number;
    hasMore?: boolean;
    message?: string;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.general_id) queryParams.append('general_id', params.general_id.toString());

    return this.request(`/api/message/get-messages?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  static async GetRecentMessage(params?: {
    serverID?: string;
    session_id?: string;
    type?: string;
    limit?: number;
    sequence?: number;
  }): Promise<{
    success: boolean;
    result: boolean;
    messages?: any[];
    message?: string;
  }> {
    return this.MessageGetRecentMessage(params);
  }

  static async MessageSendMessage(params: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
    mailbox?: number;
    to_general_id?: number;
    text: string;
    type?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    reason?: string;
    message?: string;
  }> {
    return this.request('/api/message/send-message', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async GetContactList(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    nation?: Array<{
      mailbox: number;
      name: string;
      color: number;
      general: Array<[number, string, number]>;
    }>;
    message?: string;
  }> {
    return this.request('/api/message/get-contact-list', {
      method: 'GET',
    });
  }

  // Auction API
  static async AuctionGetUniqueItemAuctionList(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    list?: any[];
    obfuscatedName?: string;
    message?: string;
  }> {
    return this.request('/api/auction/get-unique-list', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async AuctionBidUniqueAuction(params: {
    auctionID?: number;
    auction_id?: number;
    bidAmount?: number;
    bidPrice?: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const auctionID = params.auctionID || params.auction_id;
    const bidAmount = params.bidAmount || params.bidPrice;
    return this.request('/api/auction/bid-unique-auction', {
      method: 'POST',
      body: JSON.stringify({
        auctionID: auctionID,
        auction_id: auctionID,
        amount: bidAmount,
        bid_price: bidAmount,
        session_id: params.serverID || params.session_id,
      }),
    });
  }

  // Betting API
  static async BettingGetBettingList(params?: {
    session_id?: string;
    serverID?: string;
    req?: string;
  }): Promise<{
    result: boolean;
    success?: boolean;
    bettings?: any[];
    bettingList?: Record<string, any>;
    reason?: string;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }
    if (params?.req) {
      body.req = params.req;
    }
    return this.request('/api/betting/get-list', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async GetBettingDetail(params: {
    betting_id: number;
    session_id?: string;
    serverID?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    bettingDetail?: any;
    myBetting?: any;
    bettingInfo?: any;
    remainPoint?: number;
    year?: number;
    month?: number;
    reason?: string;
  }> {
    const query = new URLSearchParams();
    query.append('betting_id', String(params.betting_id));
    if (params.session_id) {
      query.append('session_id', params.session_id);
    } else if (params.serverID) {
      query.append('session_id', params.serverID);
    }
    return this.request(`/api/betting/get-betting-detail?${query.toString()}`, {
      method: 'GET',
    });
  }

  static async BettingBet(params: {
    bettingID: number;
    bettingType: Array<string | number>;
    amount: number;
    session_id?: string;
    serverID?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    success?: boolean;
  }> {
    const body: Record<string, any> = {
      bettingID: params.bettingID,
      bettingType: params.bettingType,
      amount: params.amount,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/betting/bet', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Vote API
  static async VoteGetVoteList(): Promise<{
    result: boolean;
    votes: any[];
  }> {
    return this.request('/api/vote/get-list', {
      method: 'POST',
    });
  }

  static async VoteVote(params: {
    voteID: number;
    option: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/vote/vote', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Troop API
  static async TroopNewTroop(params: {
    name: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    success?: boolean;
  }> {
    return this.request('/api/troop/new', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async TroopJoinTroop(params: {
    troopID: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/troop/join', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Misc API
  static async MiscUploadImage(params: FormData): Promise<{
    result: boolean;
    url?: string;
    reason?: string;
  }> {
    const url = `${this.baseURL}/api/misc/upload-image`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: params,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Gateway API (i_entrance)
  static async GetUserInfo(): Promise<{
    result: boolean;
    id: string;
    name: string;
    grade: string;
    picture: string;
    icon?: string;
    global_salt: string;
    join_date: string;
    third_use: boolean;
    acl: string;
    oauth_type: string | null;
    token_valid_until: string | null;
  }> {
    return this.request('/api/gateway/get-user-info', {
      method: 'POST',
    });
  }

  static async ExpandLoginToken(): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/gateway/expand-login-token', {
      method: 'POST',
    });
  }

  static async DisallowThirdUse(): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/gateway/disallow-third-use', {
      method: 'POST',
    });
  }

  static async ChangeIcon(params: FormData): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const url = `${this.baseURL}/api/gateway/change-icon`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: params,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async DeleteIcon(): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/gateway/delete-icon', {
      method: 'POST',
    });
  }

  static async GetServerStatus(): Promise<{
    result: boolean;
    notice?: string;
    server: Array<{
      color: string;
      korName: string;
      name: string;
      exists: boolean;
      enable: boolean;
      allow_npc_possess?: boolean;
    }>;
  }> {
    return this.request('/api/gateway/get-server-status', {
      method: 'POST',
    });
  }

  static async Logout(): Promise<{
    result: boolean;
    reason: string;
  }> {
    return this.request('/api/gateway/logout', {
      method: 'POST',
    });
  }

  static async ChangePassword(params: {
    password: string;
    newPassword: string;
    globalSalt: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/gateway/change-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async GetPhpScenarios(): Promise<{
    success: boolean;
    data: {
      scenarios: Array<{
        id: string;
        title: string;
        startYear: number;
        mapName: string;
      }>;
      total: number;
    };
  }> {
    return this.request('/api/scenarios/templates', {
      method: 'GET',
    });
  }

  static async DeleteMe(params: {
    password: string;
    globalSalt: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/gateway/delete-me', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Game API (hwe/j_*.php)
  static async GetBasicInfo(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    generalID: number;
    myNationID: number;
    isChief: boolean;
    officerLevel: number;
    permission: number;
  }> {
    return this.request('/api/game/basic-info', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetMap(params: {
    session_id?: string;
    year?: number | null;
    month?: number | null;
    aux?: any;
    neutralView?: boolean;
    showMe?: boolean;
  }): Promise<GetMapResponse> {
    return this.request('/api/game/map', {
      method: 'POST',
      body: JSON.stringify({ 
        session_id: params.session_id,
        data: {
          year: params.year,
          month: params.month,
          aux: params.aux,
          neutralView: params.neutralView,
          showMe: params.showMe
        }
      }),
    });
  }

  static async GetCityList(params?: {
    session_id?: string;
    type?: number;
  }): Promise<{
    result: boolean;
    cityList?: any[];
    cities?: any[];
    nations?: any;
    cityArgsList?: string[];
  }> {
    return this.request('/api/game/city-list', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetGeneralList(params?: {
    session_id?: string;
    token?: string;
    type?: number;
  }): Promise<{
    success?: boolean;
    result: boolean;
    generals?: any[];
    generalList?: any[];
  }> {
    return this.request('/api/nation/general-list', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetSelectPool(): Promise<{
    result: boolean;
    pool: any[];
  }> {
    return this.request('/api/general/get-select-pool', {
      method: 'GET',
    });
  }

  static async SelectNPC(params: {
    pick: number;
    session_id: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    general_name?: string;
  }> {
    return this.request('/api/general/select-npc', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async SelectPickedGeneral(params: {
    generalID: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/game/select-picked-general', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async SetMySetting(params: {
    session_id?: string;
    use_treatment?: number;
    use_auto_nation_turn?: number;
    defence_train?: number;
    tnmt?: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/game/set-my-setting', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async GetMyBossInfo(params?: {
    serverID?: string;
    session_id?: string;
    generalID?: number;
    general_id?: number;
  }): Promise<{
    result: boolean;
    bossInfo: any;
  }> {
    const query = new URLSearchParams();

    if (params?.session_id) {
      query.append('session_id', params.session_id);
    } else if (params?.serverID) {
      query.append('session_id', params.serverID);
    }

    const generalId = params?.general_id ?? params?.generalID;
    if (typeof generalId !== 'undefined') {
      query.append('general_id', String(generalId));
    }

    const qs = query.toString();
    const endpoint = `/api/general/get-boss-info${qs ? `?${qs}` : ''}`;

    return this.request(endpoint, {
      method: 'GET',
    });
  }

  static async OfficerAppoint(params: {
    serverID?: string;
    session_id?: string;
    officerLevel: number;
    destGeneralID?: number;
    destCityID?: number;
  }): Promise<{
    result: boolean;
    message?: string;
    reason?: string;
  }> {
    const body: Record<string, any> = {
      officerLevel: params.officerLevel,
    };

    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }

    if (typeof params.destGeneralID !== 'undefined') {
      body.destGeneralID = params.destGeneralID;
    }

    if (typeof params.destCityID !== 'undefined') {
      body.destCityID = params.destCityID;
    }

    return this.request('/api/game/officer/appoint', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * 장수 추방 (수뇌부 전용)
   */
  static async KickGeneral(params: {
    serverID?: string;
    session_id?: string;
    destGeneralID: number;
  }): Promise<{
    result: boolean;
    success?: boolean;
    message?: string;
    reason?: string;
  }> {
    const body: Record<string, any> = {
      destGeneralID: params.destGeneralID,
    };

    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }

    return this.request('/api/game/officer/kick', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async Vacation(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/game/vacation', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  /**
   * 서버 기본 정보 조회
   */
  static async GetServerBasicInfo(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    game?: any;
    me?: any;
    reason?: string;
  }> {
    return this.request('/api/game/server-basic-info', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  /**
   * 장수 권한 설정 (군주 전용)
   */
  static async SetGeneralPermission(params: {
    session_id?: string;
    isAmbassador: boolean;
    genlist?: number[];
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/game/set-general-permission', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 이벤트 트리거 (관리자 전용)
   */
  static async RaiseEvent(params: {
    session_id?: string;
    event: string;
    arg?: any;
  }): Promise<{
    result: boolean;
    reason?: string;
    info?: any;
  }> {
    return this.request('/api/game/raise-event', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Diplomacy API
  static async GetDiplomacyLetter(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    letters?: Array<{
      no: number;
      fromNation: string;
      toNation: string;
      brief: string;
      detail: string;
      date: string;
      status: string;
    }>;
    message?: string;
  }> {
    return this.request('/api/diplomacy/get-letter', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async SendDiplomacyLetter(params: {
    serverID?: string;
    session_id?: string;
    prevNo?: number;
    destNationID: number;
    brief: string;
    detail: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    reason?: string;
    message?: string;
  }> {
    return this.request('/api/diplomacy/send-letter', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async RespondDiplomacyLetter(params: {
    letterNo: number;
    accept?: boolean;
    action?: 'accept' | 'reject';
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const action = params.action || (params.accept ? 'accept' : 'reject');
    const session_id = params.serverID || params.session_id;

    return this.request('/api/diplomacy/respond-letter', {
      method: 'POST',
      body: JSON.stringify({
        letterNo: params.letterNo,
        action,
        session_id,
      }),
    });
  }

  // Auction API (추가)
  static async GetActiveResourceAuctionList(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    buyRiceList?: any[];
    sellRiceList?: any[];
    recentLogs?: any[];
    generalID?: number;
    message?: string;
  }> {
    return this.request('/api/auction/get-active-resource-list', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async BidBuyRiceAuction(params: {
    auctionID?: number;
    auction_id?: number;
    bidAmount?: number;
    bidPrice?: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const auctionID = params.auctionID || params.auction_id;
    const bidAmount = params.bidAmount || params.bidPrice;
    return this.request('/api/auction/bid-buy-rice-auction', {
      method: 'POST',
      body: JSON.stringify({
        auctionID: auctionID,
        auction_id: auctionID,
        amount: bidAmount,
        bid_price: bidAmount,
        session_id: params.serverID || params.session_id,
      }),
    });
  }

  static async BidSellRiceAuction(params: {
    auctionID?: number;
    auction_id?: number;
    bidAmount?: number;
    bidPrice?: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const auctionID = params.auctionID || params.auction_id;
    const bidAmount = params.bidAmount || params.bidPrice;
    return this.request('/api/auction/bid-sell-rice-auction', {
      method: 'POST',
      body: JSON.stringify({
        auctionID: auctionID,
        auction_id: auctionID,
        amount: bidAmount,
        bid_price: bidAmount,
        session_id: params.serverID || params.session_id,
      }),
    });
  }

  // Command API (추가)
  static async GetCommandTable(params?: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
    command?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    commandTable: Array<{
      category: string;
      values: Array<{
        value: string;
        simpleName: string;
        reqArg: number;
        possible: boolean;
        compensation: number;
        title: string;
      }>;
    }>;
    reason?: string;
  }> {
    const query = new URLSearchParams();
    if (params?.serverID) query.append('session_id', params.serverID);
    if (params?.session_id) query.append('session_id', params.session_id);
    if (params?.general_id) query.append('general_id', String(params.general_id));
    if (params?.command) query.append('command', params.command);
    
    return this.request(`/api/general/get-command-table?${query.toString()}`, {
      method: 'GET',
    });
  }

  static async ReserveBulkCommand(params: {
    commands: Array<{
      command: string;
      args: any;
      turnList: number[];
    }>;
    serverID?: string;
    session_id?: string;
    general_id?: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: any = { ...params };

    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }

    return this.request('/api/command/reserve-bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async CommandReserveBulkCommand(params: {
    serverID?: string;
    general_id: number;
    commands: Array<{
      turnList: number[];
      action: string;
      arg: any;
    }>;
  }): Promise<{
    success: boolean;
    result: boolean;
    briefList?: any;
    reason?: string;
  }> {
    const body: any = {
      commands: params.commands,
    };

    if (params.serverID) {
      body.session_id = params.serverID;
    }
    if (params.general_id) {
      body.general_id = params.general_id;
    }

    return this.request('/api/command/reserve-bulk-command', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async RepeatCommand(params: {
    commandID: number;
    repeatCount: number;
    serverID?: string;
    session_id?: string;
    general_id?: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: any = { ...params };

    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }

    return this.request('/api/command/repeat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async PushCommand(params: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
    turn_cnt: number;
  }): Promise<{
    success: boolean;
    result: boolean;
    message?: string;
  }> {
    const body: any = { ...params };

    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }

    return this.request('/api/command/push-command', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async PullCommand(params: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
    turn_cnt: number;
  }): Promise<{
    success: boolean;
    result: boolean;
    message?: string;
  }> {
    const body: any = { ...params };

    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }

    return this.request('/api/command/pull-command', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async DeleteCommand(params: {
    serverID?: string;
    session_id?: string;
    general_id?: number;
    turn_list: number[];
  }): Promise<{
    success: boolean;
    result: boolean;
    reason?: string;
  }> {
    const body: any = { ...params };

    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }

    return this.request('/api/command/delete-command', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async TroopExitTroop(): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/troop/exit', {
      method: 'POST',
    });
  }

  // City API
  // GetCityList is defined earlier in the file

  static async GetCurrentCity(sessionId?: string): Promise<{
    result: boolean;
    city?: CityInfo;
  }> {
    const query = new URLSearchParams();
    if (sessionId) query.append('sessionId', sessionId);
    
    return this.request(`/api/game/current-city?${query.toString()}`, {
      method: 'GET',
      credentials: 'include'
    });
  }

  static async InfoGetCity(params: {
    serverID: string;
    cityID: number;
  }): Promise<{
    result: boolean;
    city: CityInfo;
    error?: string;
  }> {
    return this.request('/api/info/city', {
      method: 'POST',
      body: JSON.stringify({
        session_id: params.serverID,
        cityID: params.cityID
      }),
    });
  }

  static async GetMyCityInfo(): Promise<{
    result: boolean;
    city: CityInfo;
  }> {
    return this.request('/api/game/my-city-info', {
      method: 'POST',
    });
  }

  // General API (추가)
  // GetGeneralList is defined earlier in the file

  static async GetMyGenInfo(): Promise<{
    result: boolean;
    general: any;
  }> {
    return this.request('/api/game/my-gen-info', {
      method: 'POST',
    });
  }

  // GetMyBossInfo는 위에 이미 정의됨 (중복 제거)

  // Archive API
  static async GetBestGeneralList(params?: {
    session_id?: string;
    type?: string;
    btn?: string; // '유저 보기' | 'NPC 보기'
  }): Promise<{
    result: boolean;
    generalList: any[];
  }> {
    return this.request('/api/archive/best-general', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetEmperiorList(): Promise<{
    result: boolean;
    emperiorList: any[];
    currentNation?: any;
  }> {
    return this.request('/api/archive/emperior', {
      method: 'POST',
    });
  }

  static async GetEmperiorDetail(params: {
    id: number;
  }): Promise<{
    result: boolean;
    emperior: any;
  }> {
    return this.request('/api/archive/emperior-detail', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async GetHallOfFame(params?: {
    seasonIdx?: number;
    scenarioIdx?: number;
  }): Promise<{
    result: boolean;
    scenarioList?: any;
    hallOfFame?: any;
    searchSeason?: number;
    searchScenario?: number;
  }> {
    return this.request('/api/archive/hall-of-fame', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetGenList(params?: {
    session_id?: string;
    type?: number;
  }): Promise<{
    result: boolean;
    generalList: any[];
  }> {
    return this.request('/api/archive/gen-list', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetKingdomList(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    kingdomList: any[];
  }> {
    // 현재 세션의 국가 목록 조회
    const response = await this.request('/api/global/get-nation-list', {
      method: 'GET',
    });
    
    // nationList를 kingdomList로 변환
    if (response.result && response.nationList) {
      const nationList = response.nationList;
      const kingdomList = Object.values(nationList)
        .filter((nation: any) => nation.nation !== 0) // 재야 제외
        .map((nation: any) => {
          // cities가 객체인 경우 배열로 변환
          const citiesObj = nation.cities || {};
          const citiesArray = Object.entries(citiesObj).map(([id, name]) => ({ id: Number(id), name }));
          // generals 배열
          const generalsArray = nation.generals || [];
          // 국력 계산: stat.gen + stat.city*100 또는 장수수 + 도시수*100
          const stat = nation.stat || {};
          const power = nation.power || stat.gen || (generalsArray.length + citiesArray.length * 100);
          
          return {
            ...nation, // 원본 데이터 먼저 스프레드
            nation: nation.nation,
            name: nation.name,
            color: nation.color || '#808080',
            power,
            cities: citiesArray, // 변환된 배열로 덮어쓰기
            generals: generalsArray,
          };
        })
        .sort((a, b) => b.power - a.power); // 국력순 정렬
      return {
        result: true,
        kingdomList
      };
    }
    
    return {
      result: false,
      kingdomList: []
    };
  }
  
  // 역대 통합 기록 조회 (명예의 전당용)
  static async GetArchivedKingdomList(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    kingdomList: any[];
  }> {
    return this.request('/api/archive/kingdom-list', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetNPCList(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    npcList: any[];
  }> {
    return this.request('/api/archive/npc-list', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetTraffic(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    traffic: any;
  }> {
    return this.request('/api/archive/traffic', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  // History API
  static async GetHistory(params: {
    year?: number;
    month?: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    history: any;
  }> {
    return this.request('/api/game/history', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async JoinGetNations(serverID: string): Promise<any> {
    return this.request('/api/join/get-nations', {
      method: 'POST',
      body: JSON.stringify({
        serverID,
        session_id: serverID,
      }),
    });
  }

  static async JoinCreateGeneral(params: JoinCreateGeneralPayload): Promise<any> {
    return this.request('/api/join/create-general', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Board API

  static async GetBoardArticles(params: {
    isSecret?: boolean;
    session_id?: string;
  }): Promise<{
    result: boolean;
    articles: any[];
  }> {
    return this.request('/api/board/get-articles', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async PostBoardArticle(params: {
    isSecret?: boolean;
    title: string;
    text: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/board/post-article', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async PostBoardComment(params: {
    documentNo: number;
    text: string;
    isSecret?: boolean;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    comment?: any;
  }> {
    return this.request('/api/board/comment', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Battle Simulator API
  static async SimulateBattle(params: {
    year?: number;
    month?: number;
    seed?: string;
    repeatCount?: number;
    attacker?: {
      nation: any;
      general: any;
    };
    defenders?: Array<{
      nation: any;
      general: any;
    }>;
    // Legacy format support
    units?: Array<{
      id: string;
      x: number;
      y: number;
      name: string;
      type: 'attacker' | 'defender';
      crew: number;
    }>;
  }): Promise<{
    result: boolean;
    simulation?: {
      warcnt?: number;
      phase?: number;
      killed?: number;
      dead?: number;
      minKilled?: number;
      maxKilled?: number;
      minDead?: number;
      maxDead?: number;
      attackerRice?: number;
      defenderRice?: number;
      attackerSkills?: string[];
      defenderSkills?: string[][];
      battleLog?: string;
      detailLog?: string;
    };
    reason?: string;
  }> {
    return this.request('/api/battle/simulate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Inherit API
  static async GetInheritPoint(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    totalPoint: number;
    inheritList: any[];
  }> {
    return this.request('/api/inherit/get-point', {
      method: 'POST',
      body: params ? JSON.stringify(params) : undefined,
    });
  }

  static async UseInheritPoint(params: {
    amount: number;
    type: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/inherit/use-point', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // NPC Control API
  static async GetNPCControl(params?: {
    session_id?: string;
    serverID?: string;
  }): Promise<{
    result: boolean;
    control?: any;
    npcControl?: any;
    reason?: string;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/npc/get-control', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async SetNPCControl(params: {
    type: 'nationPolicy' | 'nationPriority' | 'generalPriority';
    control: any;
    session_id?: string;
    serverID?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    message?: string;
  }> {
    const body: Record<string, any> = {
      type: params.type,
      control: params.control,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/npc/set-control', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Battle Center API
  static async GetBattleCenter(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    battles?: BattleCenterEntry[];
    message?: string;
  }> {
    return this.request('/api/battle/center', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  // Chief API
  static async GetChiefCenter(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<ChiefCenterResponse> {
    const body: any = { ...(params || {}) };

    // serverID를 session_id로 매핑
    if (params?.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }

    return this.request('/api/chief/center', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Join API
  static async GetJoinNations(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    nations: any[];
    allowJoinNation?: boolean;
    statLimits?: {
      min: number;
      max: number;
      total: number;
    };
    cities?: Array<{
      id: number;
      name: string;
      x: number;
      y: number;
    }>;
  }> {
    const query = new URLSearchParams();
    if (params?.serverID) query.append('serverID', params.serverID);
    if (params?.session_id) query.append('session_id', params.session_id);
    
    return this.request(`/api/join/get-nations?${query.toString()}`, {
      method: 'POST',
      body: params ? JSON.stringify(params) : undefined,
    });
  }

  static async CreateGeneral(params: {
    name: string;
    nation?: number;
    icon?: number;
    npcType?: number;
    serverID?: string;
    session_id?: string;
    leadership?: number;
    strength?: number;
    intel?: number;
    politics?: number;    // 정치
    charm?: number;       // 매력
    trait?: string;       // 특성
    character?: string;
    pic?: boolean;
    city?: number;
    inheritCity?: number;
  }): Promise<{
    result: boolean;
    reason?: string;
    general?: any;
  }> {
    return this.request('/api/join/create-general', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Admin API
  static async AdminGetUserList(): Promise<{
    result: boolean;
    users: any[];
  }> {
    return this.request('/api/admin/userlist', {
      method: 'POST',
    });
  }

  static async AdminUpdateUser(params: {
    userID: string | number;
    action: string;
    data?: Record<string, unknown>;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/update-user', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminGetErrorLog(params: {
    from?: number;
    limit?: number;
  }): Promise<{
    result: boolean;
    errorLogs: any[];
  }> {
    return this.request('/api/admin/error-log', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // OAuth API
  static async OAuthKakaoCallback(params: {
    code: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/oauth/kakao/callback', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async OAuthKakaoJoin(params: {
    username: string;
    password: string;
    oauthID: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/oauth/kakao/join', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Nation API (추가)
  static async NationGetBetting(params?: {
    session_id?: string;
    serverID?: string;
  }): Promise<{
    result: boolean;
    bettings: any[];
    reason?: string;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/nation/betting', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationGetGenerals(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    generals?: any[];
    list?: any[];
    troops?: any[];
    message?: string;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }

    return this.request('/api/nation/generals', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async NationGeneralList(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    list?: any[];
    troops?: any[];
    permission?: number;
    env?: any;
    myGeneralID?: number;
    message?: string;
  }> {
    return this.request('/api/nation/general-list', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async NationGetStratFinan(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    stratFinan: NationStratFinanPayload;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/nation/stratfinan', {
      method: 'POST',
      body: Object.keys(body).length ? JSON.stringify(body) : undefined,
    });
  }

  // Server Admin API
  static async AdminGetDiplomacy(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    diplomacyList: Array<{
      no: number | string;
      srcNationId: number;
      destNationId: number;
      brief: string;
      status: string;
      date: string;
    }>;
  }> {
    return this.request('/api/admin/diplomacy', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async AdminGetGameInfo(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    gameInfo: any;
  }> {
    return this.request('/api/admin/game-info', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async AdminUpdateGame(params: {
    session_id?: string;
    action: string;
    data: Record<string, unknown>;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/update-game', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 전역 공지사항 설정 (관리자 전용)
   */
  static async AdminSetGlobalNotice(params: {
    notice: string;
  }): Promise<{
    result: boolean;
    message?: string;
    reason?: string;
  }> {
    return this.request('/api/admin/set-global-notice', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * GameSession 관리용 관리자 API (구 Entity용)
   * 현재 어드민 UI에서는 sessions 컬렉션을 사용하므로
   * 이 메서드들은 더 이상 직접 사용하지 않습니다.
   */
  static async AdminListGameSessions(params?: {
    limit?: number;
    skip?: number;
  }): Promise<{
    data: any[];
    meta: {
      total: number;
      limit: number;
      skip: number;
      page: number;
      pages: number;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.skip) query.append('skip', String(params.skip));

    return this.request(`/api/game-session?${query.toString()}`, {
      method: 'GET',
    });
  }

  static async AdminCreateGameSession(params: {
    scenarioId: string;
    title?: string;
    startYear?: number;
    mapName?: string;
  }): Promise<{
    data: any;
  }> {
    return this.request('/api/game-session', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminDeleteGameSession(id: string): Promise<{
    message: string;
  }> {
    return this.request(`/api/game-session/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * 전역 세션(sessions 컬렉션) 관리용 관리자 API
   */
  static async AdminSessionList(): Promise<{
    success: boolean;
    sessions: Array<{
      sessionId: string;
      scenario: string;
      year?: number;
      month?: number;
      turnterm?: number;
      status: string;
      statusText: string;
      createdAt?: string;
      updatedAt?: string;
    }>;
  }> {
    return this.request('/api/admin/session/list', {
      method: 'GET',
    });
  }

  static async AdminSessionCreate(params: {
    sessionId: string;
    scenario?: string;
    turnterm?: number;
    config?: any;
  }): Promise<{
    success: boolean;
    message: string;
    session?: {
      sessionId: string;
      scenario: string;
    };
  }> {
    return this.request('/api/admin/session/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminSessionReset(params: {
    sessionId: string;
  }): Promise<{
    success: boolean;
    message?: string;
    session?: {
      sessionId: string;
      status: string;
    };
  }> {
    return this.request('/api/admin/session/reset', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminSessionOpen(params: {
    sessionId: string;
  }): Promise<{
    success: boolean;
    message?: string;
    session?: {
      sessionId: string;
      status: string;
      nextTurntime?: string;
    };
  }> {
    return this.request('/api/admin/session/open', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminSessionClose(params: {
    sessionId: string;
  }): Promise<{
    success: boolean;
    message?: string;
    session?: {
      sessionId: string;
      status: string;
    };
  }> {
    return this.request('/api/admin/session/close', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminGetInfo(params: {
    type?: number;
    type2?: number;
  }): Promise<{
    result: boolean;
    infoList: any[];
  }> {
    return this.request('/api/admin/info', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminGetGeneral(params: {
    generalID?: number;
  }): Promise<{
    result: boolean;
    general: any;
  }> {
    return this.request('/api/admin/general', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminGetMember(params: {
    memberID?: number;
  }): Promise<{
    result: boolean;
    members: any[];
  }> {
    return this.request('/api/admin/member', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminGetTimeControl(): Promise<{
    result: boolean;
    timeControl: any;
  }> {
    return this.request('/api/admin/time-control', {
      method: 'POST',
    });
  }

  static async AdminUpdateTimeControl(params: {
    action: string;
    data: any;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/update-time-control', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminForceRehall(params?: {
    generalID?: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/force-rehall', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async AdminGetSystemStatus(): Promise<{
    result: boolean;
    status: {
      turntime: string | null;
      starttime: string | null;
      tnmt_time: string | null;
      plock: number;
      turnterm: number;
    };
  }> {
    return this.request('/api/admin/system-status', {
      method: 'GET',
    });
  }

  static async AdminAdjustTime(params: {
    type: 'turn_advance' | 'turn_delay' | 'tournament_advance' | 'tournament_delay';
    minutes: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/adjust-time', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminToggleLock(params: {
    lock: boolean;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/toggle-lock', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async AdminPaySalary(params: {
    type: 'gold' | 'rice';
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/pay-salary', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Diplomacy Process API
  static async DiplomacyProcess(params: {
    serverID?: string;
    session_id?: string;
    letterNo: number;
    action: string;
    data?: any;
  }): Promise<{
    success: boolean;
    result: boolean;
    reason?: string;
    message?: string;
  }> {
    return this.request('/api/diplomacy/process', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 외교 히스토리 조회
   */
  static async GetDiplomacyHistory(params?: {
    serverID?: string;
    session_id?: string;
    nationId?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    result: boolean;
    history?: Array<{
      type: string;
      srcNationId: number;
      srcNationName: string;
      destNationId: number;
      destNationName: string;
      oldState?: number;
      newState?: number;
      proposalType?: string;
      message?: string;
      timestamp?: string;
      year?: number;
      month?: number;
      generalName?: string;
    }>;
    reason?: string;
  }> {
    return this.request('/api/diplomacy/history', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  // Battle API
  static async GetBattleDetail(params: {
    battleID: number;
  }): Promise<{
    result: boolean;
    battle: any;
  }> {
    return this.request('/api/battle/detail', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Info API
  static async GetBettingInfo(params?: { session_id?: string }): Promise<{
    result: boolean;
    bettingList: any[];
  }> {
    return this.request('/api/info/betting', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetGeneralInfo(params?: {
    generalID?: number;
    general_id?: number;
    session_id?: string;
    serverID?: string;
  }): Promise<{
    result: boolean;
    general: any;
  }> {
    const body: Record<string, any> = {};

    const generalId = params?.general_id ?? params?.generalID;
    if (typeof generalId !== 'undefined') {
      // API는 generalID/general_id 둘 다 허용하므로 둘 다 포함
      body.generalID = generalId;
      body.general_id = generalId;
    }

    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }

    return this.request('/api/info/general', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async GetOfficerInfo(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    officer: any;
    reason?: string;
  }> {
    return this.request('/api/info/officer', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetTournamentInfo(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    tournament: any;
  }> {
    return this.request('/api/info/tournament', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  // Tournament API (별도 엔드포인트)

  static async GetTournament(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    tournament: any;
  }> {
    return this.request('/api/tournament/info', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async JoinTournament(params?: {
    session_id?: string;
    generalNo?: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/tournament/apply', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async CancelTournament(params?: {
    session_id?: string;
    generalNo?: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/tournament/cancel', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetTournamentBracket(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    bracket?: any;
  }> {
    return this.request('/api/tournament/bracket', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async GetTournamentCenter(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    tournament: any;
  }> {
    return this.request('/api/tournament/info', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  // World API
  static async GetWorldInfo(params?: {
    session_id?: string;
  }): Promise<{
    result: boolean;
    world?: any;
  }> {
    return this.request('/api/world/info', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  // Command Processing API
  static async GetCommandData(params: {
    command: string;
    turnList?: number[];
    isChief?: boolean;
    serverID?: string;
    session_id?: string;
    general_id?: number;
  }): Promise<{
    result: boolean;
    commandData: any;
    reason?: string;
  }> {
    const body: any = { ...params };

    // serverID를 session_id로 매핑
    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }

    return this.request('/api/processing/command', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async SubmitCommand(params: {
    command: string;
    turnList?: number[];
    isChief?: boolean;
    data: any;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: any = { ...params };

    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }

    return this.request('/api/processing/submit-command', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Install API
  static async CheckInstallStatus(): Promise<{
    result: boolean;
    installed: boolean;
    status?: any;
  }> {
    return this.request('/api/install/status', {
      method: 'POST',
    });
  }

  static async InstallDB(params: {
    db_host: string;
    db_name: string;
    db_user: string;
    db_password: string;
    full_reset?: boolean;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/install/db', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async GetInstallConfig(params?: {
    serverID?: string;
  }): Promise<{
    result: boolean;
    config: any;
  }> {
    return this.request('/api/install/config', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  static async InstallGame(params: {
    serverID?: string;
    config: any;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/install/game', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async InstallFileInstall(params: {
    db_host: string;
    db_name: string;
    db_user: string;
    db_password: string;
    config?: any;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/install/file-install', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async GetSelectNpcToken(params: {
    session_id: string;
    refresh?: boolean;
    keep?: number[];
  }): Promise<{
    result: boolean;
    npcs?: any[];
    token?: string;
  }> {
    return this.request('/api/general/get-select-npc-token', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================================
  // Auction API (누락된 함수들)
  // ============================================================

  /**
   * 군량 구매 경매 생성
   */
  static async OpenBuyRiceAuction(params: {
    amount: number;
    closeTurnCnt: number;
    startBidAmount: number;
    finishBidAmount: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    auctionID?: number;
  }> {
    const body: Record<string, any> = {
      amount: params.amount,
      closeTurnCnt: params.closeTurnCnt,
      startBidAmount: params.startBidAmount,
      finishBidAmount: params.finishBidAmount,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/auction/open-buy-rice-auction', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * 군량 판매 경매 생성
   */
  static async OpenSellRiceAuction(params: {
    amount: number;
    closeTurnCnt: number;
    startBidAmount: number;
    finishBidAmount: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    auctionID?: number;
  }> {
    const body: Record<string, any> = {
      amount: params.amount,
      closeTurnCnt: params.closeTurnCnt,
      startBidAmount: params.startBidAmount,
      finishBidAmount: params.finishBidAmount,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/auction/open-sell-rice-auction', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * 유니크 아이템 경매 상세 조회
   */
  static async GetUniqueItemAuctionDetail(params: {
    auctionID: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    auction?: {
      auctionID: number;
      itemID: string;
      itemName: string;
      itemType: string;
      hostGeneralID: number;
      hostGeneralName: string;
      closeDate: string;
      startBidAmount: number;
      currentBidAmount: number;
      bidderGeneralID?: number;
      bidderGeneralName?: string;
      bidHistory?: Array<{
        generalID: number;
        generalName: string;
        amount: number;
        date: string;
      }>;
    };
    reason?: string;
  }> {
    const query = new URLSearchParams();
    query.append('auctionID', String(params.auctionID));
    if (params.session_id) {
      query.append('session_id', params.session_id);
    } else if (params.serverID) {
      query.append('session_id', params.serverID);
    }
    return this.request(`/api/auction/get-unique-auction-detail?${query.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * 유니크 아이템 경매 생성
   */
  static async OpenUniqueAuction(params: {
    itemID: string;
    amount: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    auctionID?: number;
  }> {
    const body: Record<string, any> = {
      itemID: params.itemID,
      amount: params.amount,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/auction/open-unique-auction', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ============================================================
  // General API (누락된 함수들)
  // ============================================================

  /**
   * 장수 가입 (Vue SammoAPI.General.Join 대응)
   */
  static async GeneralJoin(params: {
    name: string;
    nationID?: number;
    leadership: number;
    strength: number;
    intel: number;
    politics: number;
    charm: number;
    character: string;
    trait: string;
    city?: number;
    pic?: boolean;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    generalID?: number;
  }> {
    const body: Record<string, any> = { ...params };
    if (params.serverID && !body.session_id) {
      body.session_id = params.serverID;
    }
    return this.request('/api/general/join', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * 장수 로그 조회
   */
  static async GetGeneralLog(params: {
    reqType: 'action' | 'battle' | 'history' | 'personal';
    reqTo?: number;
    generalID?: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    logs?: Array<{
      id: number;
      text: string;
      date: string;
    }>;
    reason?: string;
  }> {
    const query = new URLSearchParams();
    query.append('reqType', params.reqType);
    if (params.reqTo) query.append('reqTo', String(params.reqTo));
    if (params.generalID) query.append('generalID', String(params.generalID));
    if (params.session_id) {
      query.append('session_id', params.session_id);
    } else if (params.serverID) {
      query.append('session_id', params.serverID);
    }
    return this.request(`/api/general/get-general-log?${query.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * 아이템 버리기
   */
  static async DropItem(params: {
    itemType: 'horse' | 'weapon' | 'book' | 'item';
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: Record<string, any> = {
      itemType: params.itemType,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/general/drop-item', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * 게임 시작 전 사망 처리
   */
  static async DieOnPrestart(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/general/die-on-prestart', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * 즉시 퇴각
   */
  static async InstantRetreat(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/general/instant-retreat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * 건국 후보 설정
   */
  static async BuildNationCandidate(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/general/build-nation-candidate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ============================================================
  // Global API (누락된 함수들)
  // ============================================================

  /**
   * 토큰 기반 장수 목록 조회
   */
  static async GlobalGeneralListWithToken(params?: {
    token?: string;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    generalList?: any[];
  }> {
    const body: Record<string, any> = {};
    if (params?.token) body.token = params.token;
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/global/general-list-with-token', {
      method: 'GET',
    });
  }

  /**
   * 캐시된 지도 조회
   */
  static async GlobalGetCachedMap(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    cityList?: number[][];
    nationList?: Array<[number, string, string, number, string, string, string, string]>;
    myCity?: number | null;
    myNation?: number | null;
    spyList?: Record<number, number>;
    shownByGeneralList?: number[];
    startYear?: number;
    year?: number;
    month?: number;
    version?: number;
    history?: string[]; // 중원 정세 히스토리
  }> {
    const query = new URLSearchParams();
    if (params?.session_id) {
      query.append('session_id', params.session_id);
    } else if (params?.serverID) {
      query.append('session_id', params.serverID);
    }
    return this.request(`/api/global/get-cached-map?${query.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * 현재 역사 조회
   */
  static async GlobalGetCurrentHistory(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    history?: Array<{
      id: number;
      text: string;
      date: string;
    }>;
    year?: number;
    month?: number;
  }> {
    const query = new URLSearchParams();
    if (params?.session_id) {
      query.append('session_id', params.session_id);
    } else if (params?.serverID) {
      query.append('session_id', params.serverID);
    }
    return this.request(`/api/global/get-current-history?${query.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * 턴 엔진 실행 (관리자)
   */
  static async GlobalExecuteEngine(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    reqRefresh?: boolean;
    executedTurn?: number;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.serverID = params.session_id;
    } else if (params?.serverID) {
      body.serverID = params.serverID;
    }
    return this.request('/api/global/execute-engine', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ============================================================
  // InheritAction API (계승 포인트 - 전체 누락)
  // ============================================================

  /**
   * 숨겨진 버프 구매
   */
  static async InheritBuyHiddenBuff(params: {
    type: 'leadership' | 'strength' | 'intel' | 'politics' | 'charm' | 'warSpecial' | 'domesticSpecial';
    level: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    remainPoint?: number;
  }> {
    const body: Record<string, any> = {
      type: params.type,
      level: params.level,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/inherit-action/buy-hidden-buff', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * 랜덤 유니크 아이템 구매
   */
  static async InheritBuyRandomUnique(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    itemName?: string;
    itemType?: string;
    remainPoint?: number;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/inherit-action/buy-random-unique', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * 특수 전쟁 리셋
   */
  static async InheritResetSpecialWar(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    remainPoint?: number;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/inherit-action/reset-special-war', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * 턴 시간 리셋
   */
  static async InheritResetTurnTime(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    remainPoint?: number;
  }> {
    const body: Record<string, any> = {};
    if (params?.session_id) {
      body.session_id = params.session_id;
    } else if (params?.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/inherit-action/reset-turn-time', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * 다음 특수 전쟁 설정
   */
  static async InheritSetNextSpecialWar(params: {
    type: string;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    remainPoint?: number;
  }> {
    const body: Record<string, any> = {
      type: params.type,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/inherit-action/set-next-special-war', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * 계승 로그 추가 조회
   */
  static async InheritGetMoreLog(params: {
    lastID: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    logs?: Array<{
      id: number;
      text: string;
      date: string;
    }>;
    reason?: string;
  }> {
    const query = new URLSearchParams();
    query.append('lastID', String(params.lastID));
    if (params.session_id) {
      query.append('session_id', params.session_id);
    } else if (params.serverID) {
      query.append('session_id', params.serverID);
    }
    return this.request(`/api/inherit-action/get-more-log?${query.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * 소유자 확인
   */
  static async InheritCheckOwner(params: {
    destGeneralID: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    isOwner?: boolean;
  }> {
    const body: Record<string, any> = {
      destGeneralID: params.destGeneralID,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/inherit-action/check-owner', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * 스탯 리셋
   */
  static async InheritResetStat(params: {
    leadership?: number;
    strength?: number;
    intel?: number;
    politics?: number;
    charm?: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    remainPoint?: number;
  }> {
    const body: Record<string, any> = {};
    if (params.leadership !== undefined) body.leadership = params.leadership;
    if (params.strength !== undefined) body.strength = params.strength;
    if (params.intel !== undefined) body.intel = params.intel;
    if (params.politics !== undefined) body.politics = params.politics;
    if (params.charm !== undefined) body.charm = params.charm;
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/inherit-action/reset-stat', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // ============================================================
  // Message API (누락된 함수들)
  // ============================================================

  /**
   * 메시지 삭제
   */
  static async DeleteMessage(params: {
    msgID: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: Record<string, any> = {
      msgID: params.msgID,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/message/delete-message', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * 메시지 응답 결정 (외교 제의 등)
   */
  static async DecideMessageResponse(params: {
    msgID: number;
    response: boolean;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: Record<string, any> = {
      msgID: params.msgID,
      response: params.response,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/message/decide-message-response', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * 이전 메시지 조회
   */
  static async GetOldMessage(params: {
    to: number;
    type: 'private' | 'diplomacy' | 'nation' | 'all';
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    messages?: Array<{
      msgID: number;
      from: number;
      fromName: string;
      to: number;
      toName: string;
      text: string;
      date: string;
      msgType: string;
      isRead: boolean;
    }>;
    reason?: string;
  }> {
    const query = new URLSearchParams();
    query.append('to', String(params.to));
    query.append('type', params.type);
    if (params.session_id) {
      query.append('session_id', params.session_id);
    } else if (params.serverID) {
      query.append('session_id', params.serverID);
    }
    return this.request(`/api/message/get-old-message?${query.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * 최근 메시지 읽음 처리
   */
  static async ReadLatestMessage(params: {
    type: 'diplomacy' | 'private';
    msgID: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: Record<string, any> = {
      type: params.type,
      msgID: params.msgID,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/message/read-latest-message', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // ============================================================
  // Nation API (누락된 함수들)
  // ============================================================

  /**
   * 국가 장수 로그 조회
   */
  static async NationGetGeneralLog(params: {
    generalID: number;
    reqType: 'action' | 'battle' | 'history' | 'personal';
    reqTo?: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    logs?: Array<{
      id: number;
      text: string;
      date: string;
    }>;
    reason?: string;
  }> {
    const query = new URLSearchParams();
    query.append('generalID', String(params.generalID));
    query.append('reqType', params.reqType);
    if (params.reqTo) query.append('reqTo', String(params.reqTo));
    if (params.session_id) {
      query.append('session_id', params.session_id);
    } else if (params.serverID) {
      query.append('session_id', params.serverID);
    }
    return this.request(`/api/nation/get-general-log?${query.toString()}`, {
      method: 'GET',
    });
  }

  // ============================================================
  // Troop API (누락된 함수들)
  // ============================================================

  /**
   * 부대명 변경
   */
  static async TroopSetTroopName(params: {
    troopID: number;
    troopName: string;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: Record<string, any> = {
      troopID: params.troopID,
      troopName: params.troopName,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/troop/set-troop-name', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * 부대에서 강퇴
   */
  static async TroopKickFromTroop(params: {
    troopID: number;
    generalID: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    const body: Record<string, any> = {
      troopID: params.troopID,
      generalID: params.generalID,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/troop/kick-from-troop', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // ============================================================
  // Vote API (누락된 함수들)
  // ============================================================

  /**
   * 투표 코멘트 추가
   */
  static async VoteAddComment(params: {
    voteID: number;
    text: string;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    commentID?: number;
  }> {
    const body: Record<string, any> = {
      voteID: params.voteID,
      text: params.text,
    };
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/vote/add-comment', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * 투표 상세 조회
   */
  static async VoteGetVoteDetail(params: {
    voteID: number;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    vote?: {
      voteID: number;
      title: string;
      options: Array<{
        optionID: number;
        text: string;
        count: number;
      }>;
      multipleOptions?: number;
      endDate?: string;
      isEnded: boolean;
      mySelection?: number[];
      comments?: Array<{
        commentID: number;
        generalID: number;
        generalName: string;
        text: string;
        date: string;
      }>;
    };
    reason?: string;
  }> {
    const query = new URLSearchParams();
    query.append('voteID', String(params.voteID));
    if (params.session_id) {
      query.append('session_id', params.session_id);
    } else if (params.serverID) {
      query.append('session_id', params.serverID);
    }
    return this.request(`/api/vote/get-vote-detail?${query.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * 새 투표 생성
   */
  static async VoteNewVote(params: {
    title: string;
    options: string[];
    multipleOptions?: number;
    endDate?: string;
    keepOldVote?: boolean;
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
    voteID?: number;
  }> {
    const body: Record<string, any> = {
      title: params.title,
      options: params.options,
    };
    if (params.multipleOptions !== undefined) body.multipleOptions = params.multipleOptions;
    if (params.endDate) body.endDate = params.endDate;
    if (params.keepOldVote !== undefined) body.keepOldVote = params.keepOldVote;
    if (params.session_id) {
      body.session_id = params.session_id;
    } else if (params.serverID) {
      body.session_id = params.serverID;
    }
    return this.request('/api/vote/new-vote', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ============================================================
  // Admin Root API (SammoRootAPI.ts 대응)
  // ============================================================

  /**
   * 이메일 주소 차단 (관리자)
   * Vue SammoRootAPI.Admin.BanEmailAddress 대응
   */
  static async AdminBanEmailAddress(params: {
    email: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/ban-email-address', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 사용자 차단 (관리자)
   */
  static async AdminBanUser(params: {
    userID: number | string;
    reason?: string;
    duration?: number; // 차단 기간 (일), 0이면 영구
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/ban-user', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 사용자 차단 해제 (관리자)
   */
  static async AdminUnbanUser(params: {
    userID: number | string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/unban-user', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 서버 공지 설정 (관리자)
   */
  static async AdminSetNotice(params: {
    message: string;
    serverID?: string;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/set-notice', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 게임 리셋 (관리자)
   */
  static async AdminResetGame(params: {
    serverID: string;
    scenarioId?: string;
    confirm?: boolean;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/reset-game', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 장수 수정 (관리자)
   */
  static async AdminUpdateGeneral(params: {
    generalID: number;
    updates: Record<string, any>;
  }): Promise<{
    result: boolean;
    reason?: string;
    general?: any;
  }> {
    return this.request('/api/admin/update-general', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 국가 수정 (관리자)
   */
  static async AdminUpdateNation(params: {
    nationID: number;
    updates: Record<string, any>;
  }): Promise<{
    result: boolean;
    reason?: string;
    nation?: any;
  }> {
    return this.request('/api/admin/update-nation', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 도시 수정 (관리자)
   */
  static async AdminUpdateCity(params: {
    cityID: number;
    updates: Record<string, any>;
  }): Promise<{
    result: boolean;
    reason?: string;
    city?: any;
  }> {
    return this.request('/api/admin/update-city', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 게임 로그 조회 (관리자)
   */
  static async AdminGetLogs(params?: {
    type?: 'error' | 'action' | 'battle' | 'system';
    limit?: number;
    offset?: number;
    from?: string;
    to?: string;
  }): Promise<{
    result: boolean;
    logs?: any[];
    total?: number;
  }> {
    return this.request('/api/admin/logs', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  /**
   * 서버 상태 조회 (관리자)
   */
  static async AdminGetServerStatus(): Promise<{
    result: boolean;
    status?: {
      uptime: number;
      memory: {
        used: number;
        total: number;
      };
      connections: number;
      lastTurnTime?: string;
      nextTurnTime?: string;
      isLocked: boolean;
      version: string;
    };
  }> {
    return this.request('/api/admin/server-status', {
      method: 'GET',
    });
  }

  // ============================================================
  // 군대 이동 시각화 API
  // ============================================================

  /**
   * 군대 이동 정보 조회
   * 지도에 표시할 예약된/진행 중인 군대 이동 목록
   */
  static async GetTroopMovements(params: {
    serverID?: string;
    session_id?: string;
    includeEnemy?: boolean;
  }): Promise<{
    result: boolean;
    movements?: TroopMovementResponse[];
    count?: number;
    reason?: string;
  }> {
    return this.request('/api/game/troop-movements', {
      method: 'POST',
      body: JSON.stringify({
        session_id: params.session_id || params.serverID,
        includeEnemy: params.includeEnemy ?? true,
      }),
    });
  }

  // ===============================
  // 랭킹 API
  // ===============================

  /**
   * 장수 랭킹 조회
   */
  static async GetGeneralRanking(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
    includeNpc?: boolean;
  }): Promise<{
    result: boolean;
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.request('/api/ranking/generals', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  /**
   * 국가 랭킹 조회
   */
  static async GetNationRanking(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
  }): Promise<{
    result: boolean;
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.request('/api/ranking/nations', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  /**
   * 역대 통일 기록 조회
   */
  static async GetUnificationHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    result: boolean;
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.request('/api/history/unifications', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }
}

/** 군대 이동 응답 타입 */
export interface TroopMovementResponse {
  id: string;
  generalId: number;
  generalName: string;
  generalIcon?: string;
  nationId: number;
  nationName: string;
  nationColor: string;
  troops: number;
  crewType?: number;
  crewTypeName?: string;
  fromCityId: number;
  fromCityName: string;
  fromX: number;
  fromY: number;
  toCityId: number;
  toCityName: string;
  toX: number;
  toY: number;
  status: 'scheduled' | 'marching' | 'arriving' | 'completed';
  type: 'normal' | 'deploy' | 'forceMarch' | 'retreat' | 'supply';
  scheduledTurn?: number;
  startTurn?: number;
  arrivalTurn?: number;
  progress?: number;
  isEnemy?: boolean;
  isVisible?: boolean;
}
