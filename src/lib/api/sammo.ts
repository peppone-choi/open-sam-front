// 클라이언트 사이드에서는 환경 변수 또는 기본 백엔드 URL 사용
// 서버 사이드에서는 rewrites를 사용하므로 상대 경로 가능
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' ? 'http://localhost:8080' : '');

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
      no: number;
      name: string;
      npc: number;
    } | null>;
  } | null;
  recentRecord: {
    history: any[];
    global: any[];
    general: any[];
  };
  cityConstMap?: Record<number, { name: string }>;
}

export interface GetMapResponse {
  success: boolean;
  result: boolean;
  cityList: number[][];
  nationList: Array<[number, string, string, number]>;
  myCity: number | null;
  myNation: number | null;
  spyList: Record<number, number>;
  shownByGeneralList: number[];
  startYear: number;
  year: number;
  month: number;
  version: number;
}

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

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    
    console.log('[API Request]', {
      url,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      baseURL: this.baseURL
    });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    
    // 토큰이 있으면 Authorization 헤더에 추가
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[API Request] Authorization 헤더 추가됨');
    } else {
      console.warn('[API Request] 토큰 없음!');
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      });
      
      console.log('[API Response]', {
        url,
        status: response.status,
        ok: response.ok
      });

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

      return response.json();
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
    lastGeneralRecordID?: number;
    lastWorldHistoryID?: number;
  }): Promise<GetFrontInfoResponse> {
    const query = new URLSearchParams();
    query.append('serverID', params.serverID);
    if (params.lastNationNoticeDate) query.append('lastNationNoticeDate', params.lastNationNoticeDate);
    if (params.lastGeneralRecordID) query.append('lastGeneralRecordID', String(params.lastGeneralRecordID));
    if (params.lastWorldHistoryID) query.append('lastWorldHistoryID', String(params.lastWorldHistoryID));
    
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
    data: any;
  }> {
    return this.request('/api/global/get-const', {
      method: 'GET',
    });
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

  static async GlobalGetNationList(): Promise<{
    result: boolean;
    nationList: Array<[number, string, string, number]>;
  }> {
    return this.request('/api/global/get-nation-list', {
      method: 'GET',
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
    turnTime: string;
    turnTerm: number;
    year: number;
    month: number;
    date: string;
    autorun_limit?: number | null;
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
    
    return this.request(`/api/command/reserve-command?${query.toString()}`, {
      method: 'POST',
      body: JSON.stringify({
        general_id: params.general_id,
        turn_idx: params.turn_idx,
        action: params.action,
        arg: params.arg || {},
        brief: params.brief,
      }),
    });
  }

  static async CommandPushCommand(params: {
    command: string;
    args: any;
    turnList: number[];
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/command/push', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Nation API
  static async NationGetNationInfo(): Promise<{
    result: boolean;
    nation: any;
  }> {
    return this.request('/api/nation/info', {
      method: 'POST',
    });
  }

  static async NationSetNotice(msg: string): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/nation/set-notice', {
      method: 'POST',
      body: JSON.stringify({ msg }),
    });
  }

  static async NationSetScoutMsg(msg: string): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/nation/set-scout-msg', {
      method: 'POST',
      body: JSON.stringify({ msg }),
    });
  }

  static async NationSetRate(amount: number): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/nation/set-rate', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  static async NationSetBill(amount: number): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/nation/set-bill', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  static async NationSetSecretLimit(amount: number): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/nation/set-secret-limit', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  static async NationSetBlockWar(value: boolean): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/nation/set-block-war', {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  }

  static async NationSetBlockScout(value: boolean): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/nation/set-block-scout', {
      method: 'POST',
      body: JSON.stringify({ value }),
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
  static async BettingGetBettingList(): Promise<{
    result: boolean;
    bettings: any[];
  }> {
    return this.request('/api/betting/get-list', {
      method: 'POST',
    });
  }

  static async GetBettingDetail(params: {
    betting_id: number;
  }): Promise<{
    success: boolean;
    result: boolean;
    bettingDetail?: any;
    myBetting?: any;
    reason?: string;
  }> {
    return this.request(`/api/betting/get-betting-detail?betting_id=${params.betting_id}`, {
      method: 'GET',
    });
  }

  static async BettingBet(params: {
    bettingID: number;
    targetNationID: number;
    gold: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/betting/bet', {
      method: 'POST',
      body: JSON.stringify(params),
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
  }): Promise<{
    result: boolean;
    reason?: string;
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

  static async GetServerStatus(): Promise<{
    result: boolean;
    server: Array<{
      color: string;
      korName: string;
      name: string;
      exists: boolean;
      enable: boolean;
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
    result: boolean;
    generals?: any[];
    generalList?: any[];
  }> {
    return this.request('/api/game/general-list', {
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
    npcID: number;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/game/select-npc', {
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

  static async GetMyBossInfo(): Promise<{
    result: boolean;
    bossInfo: any;
  }> {
    return this.request('/api/general/get-boss-info', {
      method: 'GET',
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
    accept: boolean;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/diplomacy/respond-letter', {
      method: 'POST',
      body: JSON.stringify(params),
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
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/command/reserve-bulk', {
      method: 'POST',
      body: JSON.stringify(params),
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
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/command/repeat', {
      method: 'POST',
      body: JSON.stringify(params),
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
    return this.request('/api/command/push-command', {
      method: 'POST',
      body: JSON.stringify(params),
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
    return this.request('/api/command/pull-command', {
      method: 'POST',
      body: JSON.stringify(params),
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
    return this.request('/api/command/delete-command', {
      method: 'POST',
      body: JSON.stringify(params),
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

  static async GetCurrentCity(): Promise<{
    result: boolean;
    city: any;
  }> {
    return this.request('/api/game/current-city', {
      method: 'POST',
    });
  }

  static async InfoGetCity(params: {
    serverID: string;
    cityID: number;
  }): Promise<{
    result: boolean;
    city: any;
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
    city: any;
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
  }): Promise<{
    result: boolean;
    history: any;
  }> {
    return this.request('/api/game/history', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Board API
  static async GetBoardArticles(params: {
    isSecret?: boolean;
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
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/board/post-article', {
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
    units: Array<{
      id: string;
      x: number;
      y: number;
      name: string;
      type: 'attacker' | 'defender';
      crew: number;
    }>;
  }): Promise<{
    result: boolean;
    simulation: any;
    reason?: string;
  }> {
    return this.request('/api/battle/simulate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Inherit API
  static async GetInheritPoint(): Promise<{
    result: boolean;
    totalPoint: number;
    inheritList: any[];
  }> {
    return this.request('/api/inherit/get-point', {
      method: 'POST',
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
  static async GetNPCControl(): Promise<{
    result: boolean;
    npcControl: any;
  }> {
    return this.request('/api/npc/get-control', {
      method: 'POST',
    });
  }

  static async SetNPCControl(params: {
    settings: any;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/npc/set-control', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Battle Center API
  static async GetBattleCenter(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    success: boolean;
    result: boolean;
    battles?: any[];
    message?: string;
  }> {
    return this.request('/api/battle/center', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  // Chief API
  static async GetChiefCenter(): Promise<{
    result: boolean;
    commands: any[];
  }> {
    return this.request('/api/chief/center', {
      method: 'POST',
    });
  }

  // Join API
  static async GetJoinNations(params?: {
    serverID?: string;
    session_id?: string;
  }): Promise<{
    result: boolean;
    nations: any[];
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
    userID: number;
    action: string;
    data?: any;
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
  static async NationGetBetting(): Promise<{
    result: boolean;
    bettings: any[];
  }> {
    return this.request('/api/nation/betting', {
      method: 'POST',
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
    return this.request('/api/nation/general-list', {
      method: 'POST',
      body: JSON.stringify(params || {}),
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

  static async NationGetStratFinan(): Promise<{
    result: boolean;
    stratFinan: any;
  }> {
    return this.request('/api/nation/stratfinan', {
      method: 'POST',
    });
  }

  // Server Admin API
  static async AdminGetDiplomacy(): Promise<{
    result: boolean;
    diplomacyList: any[];
  }> {
    return this.request('/api/admin/diplomacy', {
      method: 'POST',
    });
  }

  static async AdminGetGameInfo(): Promise<{
    result: boolean;
    gameInfo: any;
  }> {
    return this.request('/api/admin/game-info', {
      method: 'POST',
    });
  }

  static async AdminUpdateGame(params: {
    action: string;
    data: any;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/admin/update-game', {
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
  static async GetBettingInfo(): Promise<{
    result: boolean;
    bettingList: any[];
  }> {
    return this.request('/api/info/betting', {
      method: 'POST',
    });
  }

  static async GetGeneralInfo(params: {
    generalID?: number;
  }): Promise<{
    result: boolean;
    general: any;
  }> {
    return this.request('/api/info/general', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async GetOfficerInfo(): Promise<{
    result: boolean;
    officer: any;
  }> {
    return this.request('/api/info/officer', {
      method: 'POST',
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
  }): Promise<{
    result: boolean;
    commandData: any;
    reason?: string;
  }> {
    return this.request('/api/processing/command', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async SubmitCommand(params: {
    command: string;
    turnList?: number[];
    isChief?: boolean;
    data: any;
  }): Promise<{
    result: boolean;
    reason?: string;
  }> {
    return this.request('/api/processing/submit-command', {
      method: 'POST',
      body: JSON.stringify(params),
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
}
