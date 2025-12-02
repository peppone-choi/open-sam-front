/**
 * sammoStore 테스트
 * Zustand 삼국지 게임 상수 스토어 테스트
 */

import { useSammoStore, getSammoGameConst } from '@/stores/sammoStore';

// SammoAPI 모킹
jest.mock('@/lib/api/sammo', () => ({
  SammoAPI: {
    GlobalGetConst: jest.fn(),
  },
}));

import { SammoAPI } from '@/lib/api/sammo';

const mockSammoAPI = SammoAPI as jest.Mocked<typeof SammoAPI>;

describe('sammoStore', () => {
  // 각 테스트 전 스토어 리셋
  beforeEach(() => {
    useSammoStore.getState().reset();
    jest.clearAllMocks();
  });

  // ============================================================================
  // 초기 상태 테스트
  // ============================================================================

  describe('초기 상태', () => {
    it('모든 상태가 초기값이어야 함', () => {
      const state = useSammoStore.getState();
      
      expect(state.isLoading).toBe(false);
      expect(state.isLoaded).toBe(false);
      expect(state.error).toBeNull();
      expect(state.gameConst).toBeNull();
      expect(state.gameUnitConst).toBeNull();
      expect(state.cityConst).toBeNull();
      expect(state.cityConstMap).toBeNull();
      expect(state.iActionInfo).toBeNull();
      expect(state.iActionKeyMap).toBeNull();
      expect(state.version).toBeNull();
    });
  });

  // ============================================================================
  // loadGameConst 테스트
  // ============================================================================

  describe('loadGameConst', () => {
    it('성공적으로 게임 상수를 로드해야 함', async () => {
      const mockData = {
        result: true,
        data: {
          gameConst: { turnTerm: 300, maxTurn: 1000 },
          gameUnitConst: {
            1: { id: 1, type: 'infantry', name: '보병' },
            2: { id: 2, type: 'cavalry', name: '기병' },
          },
          cityConst: {
            1: { id: 1, name: '낙양', region: 1, level: 3 },
          },
          cityConstMap: {
            region: { 1: '중원' },
            level: { 3: '대도시' },
          },
          iActionInfo: {
            common: {
              move: { name: '이동', category: 'common' },
            },
          },
          iActionKeyMap: {
            move: 'common',
          },
          version: '1.0.0',
        },
      };

      mockSammoAPI.GlobalGetConst.mockResolvedValue(mockData);

      await useSammoStore.getState().loadGameConst();

      const state = useSammoStore.getState();
      
      expect(state.isLoading).toBe(false);
      expect(state.isLoaded).toBe(true);
      expect(state.error).toBeNull();
      expect(state.gameConst?.turnTerm).toBe(300);
      expect(state.version).toBe('1.0.0');
    });

    it('이미 로드된 경우 다시 로드하지 않아야 함', async () => {
      useSammoStore.setState({ 
        isLoaded: true, 
        gameConst: { turnTerm: 300 } 
      });

      await useSammoStore.getState().loadGameConst();

      expect(mockSammoAPI.GlobalGetConst).not.toHaveBeenCalled();
    });

    it('로딩 중일 때 중복 호출을 방지해야 함', async () => {
      useSammoStore.setState({ isLoading: true });

      await useSammoStore.getState().loadGameConst();

      expect(mockSammoAPI.GlobalGetConst).not.toHaveBeenCalled();
    });

    it('API 에러 시 에러 상태를 설정해야 함', async () => {
      mockSammoAPI.GlobalGetConst.mockRejectedValue(new Error('Network error'));

      await useSammoStore.getState().loadGameConst();

      const state = useSammoStore.getState();
      
      expect(state.isLoading).toBe(false);
      expect(state.isLoaded).toBe(false);
      expect(state.error).toBe('Network error');
    });

    it('result가 false인 경우 에러를 설정해야 함', async () => {
      mockSammoAPI.GlobalGetConst.mockResolvedValue({
        result: false,
        data: null,
      });

      await useSammoStore.getState().loadGameConst();

      const state = useSammoStore.getState();
      
      expect(state.isLoaded).toBe(false);
      expect(state.error).toBe('게임 상수를 가져오지 못했습니다.');
    });

    it('data가 null인 경우 에러를 설정해야 함', async () => {
      mockSammoAPI.GlobalGetConst.mockResolvedValue({
        result: true,
        data: null,
      });

      await useSammoStore.getState().loadGameConst();

      const state = useSammoStore.getState();
      
      expect(state.isLoaded).toBe(false);
      expect(state.error).toBe('게임 상수를 가져오지 못했습니다.');
    });
  });

  // ============================================================================
  // reset 테스트
  // ============================================================================

  describe('reset', () => {
    it('모든 상태를 초기값으로 리셋해야 함', () => {
      // 먼저 상태를 변경
      useSammoStore.setState({
        isLoading: true,
        isLoaded: true,
        error: 'some error',
        gameConst: { turnTerm: 300 },
        version: '1.0.0',
      });

      useSammoStore.getState().reset();

      const state = useSammoStore.getState();
      
      expect(state.isLoading).toBe(false);
      expect(state.isLoaded).toBe(false);
      expect(state.error).toBeNull();
      expect(state.gameConst).toBeNull();
      expect(state.version).toBeNull();
    });
  });

  // ============================================================================
  // 헬퍼 함수 테스트
  // ============================================================================

  describe('헬퍼 함수', () => {
    beforeEach(() => {
      useSammoStore.setState({
        isLoaded: true,
        gameUnitConst: {
          1: { id: 1, type: 'infantry', name: '보병' },
          2: { id: 2, type: 'cavalry', name: '기병' },
        },
        cityConst: {
          1: { id: 1, name: '낙양', region: 1, level: 3 },
          2: { id: 2, name: '장안', region: 2, level: 2 },
        },
        cityConstMap: {
          region: { 1: '중원', 2: '서량' },
          level: { 2: '중도시', 3: '대도시' },
        },
        iActionInfo: {
          common: {
            move: { name: '이동', category: 'common' },
            rest: { name: '휴식', category: 'common' },
          },
          battle: {
            attack: { name: '공격', category: 'battle' },
          },
        },
        iActionKeyMap: {
          move: 'common',
          rest: 'common',
          attack: 'battle',
        },
      });
    });

    describe('getUnitByType', () => {
      it('존재하는 병종을 반환해야 함', () => {
        const unit = useSammoStore.getState().getUnitByType(1);
        
        expect(unit).not.toBeNull();
        expect(unit?.name).toBe('보병');
      });

      it('존재하지 않는 병종에 대해 null을 반환해야 함', () => {
        const unit = useSammoStore.getState().getUnitByType(999);
        
        expect(unit).toBeNull();
      });

      it('gameUnitConst가 없을 때 null을 반환해야 함', () => {
        useSammoStore.setState({ gameUnitConst: null });
        
        const unit = useSammoStore.getState().getUnitByType(1);
        
        expect(unit).toBeNull();
      });
    });

    describe('getCityById', () => {
      it('존재하는 도시를 반환해야 함', () => {
        const city = useSammoStore.getState().getCityById(1);
        
        expect(city).not.toBeNull();
        expect(city?.name).toBe('낙양');
      });

      it('존재하지 않는 도시에 대해 null을 반환해야 함', () => {
        const city = useSammoStore.getState().getCityById(999);
        
        expect(city).toBeNull();
      });

      it('cityConst가 없을 때 null을 반환해야 함', () => {
        useSammoStore.setState({ cityConst: null });
        
        const city = useSammoStore.getState().getCityById(1);
        
        expect(city).toBeNull();
      });
    });

    describe('getActionInfo', () => {
      it('존재하는 액션 정보를 반환해야 함', () => {
        const action = useSammoStore.getState().getActionInfo('move');
        
        expect(action).not.toBeNull();
        expect(action?.name).toBe('이동');
      });

      it('다른 카테고리의 액션도 찾을 수 있어야 함', () => {
        const action = useSammoStore.getState().getActionInfo('attack');
        
        expect(action).not.toBeNull();
        expect(action?.name).toBe('공격');
        expect(action?.category).toBe('battle');
      });

      it('존재하지 않는 액션에 대해 null을 반환해야 함', () => {
        const action = useSammoStore.getState().getActionInfo('nonexistent');
        
        expect(action).toBeNull();
      });

      it('iActionInfo가 없을 때 null을 반환해야 함', () => {
        useSammoStore.setState({ iActionInfo: null });
        
        const action = useSammoStore.getState().getActionInfo('move');
        
        expect(action).toBeNull();
      });

      it('iActionKeyMap이 없을 때 null을 반환해야 함', () => {
        useSammoStore.setState({ iActionKeyMap: null });
        
        const action = useSammoStore.getState().getActionInfo('move');
        
        expect(action).toBeNull();
      });
    });

    describe('getRegionName', () => {
      it('존재하는 지역명을 반환해야 함', () => {
        const regionName = useSammoStore.getState().getRegionName(1);
        
        expect(regionName).toBe('중원');
      });

      it('존재하지 않는 지역에 대해 undefined를 문자열로 반환해야 함', () => {
        const regionName = useSammoStore.getState().getRegionName(999);
        
        // cityConstMap.region[999]가 undefined이므로 String(undefined) = "undefined"
        expect(regionName).toBe('undefined');
      });

      it('cityConstMap이 없을 때 ID를 문자열로 반환해야 함', () => {
        useSammoStore.setState({ cityConstMap: null });
        
        const regionName = useSammoStore.getState().getRegionName(1);
        
        expect(regionName).toBe('1');
      });
    });

    describe('getCityLevelName', () => {
      it('존재하는 레벨명을 반환해야 함', () => {
        const levelName = useSammoStore.getState().getCityLevelName(3);
        
        expect(levelName).toBe('대도시');
      });

      it('존재하지 않는 레벨에 대해 undefined를 문자열로 반환해야 함', () => {
        const levelName = useSammoStore.getState().getCityLevelName(999);
        
        // cityConstMap.level[999]가 undefined이므로 String(undefined) = "undefined"
        expect(levelName).toBe('undefined');
      });

      it('cityConstMap이 없을 때 레벨을 문자열로 반환해야 함', () => {
        useSammoStore.setState({ cityConstMap: null });
        
        const levelName = useSammoStore.getState().getCityLevelName(3);
        
        expect(levelName).toBe('3');
      });
    });
  });

  // ============================================================================
  // getSammoGameConst 헬퍼 함수 테스트
  // ============================================================================

  describe('getSammoGameConst', () => {
    it('로드되지 않은 경우 loadGameConst를 호출해야 함', async () => {
      const mockData = {
        result: true,
        data: {
          gameConst: { turnTerm: 300 },
          version: '1.0.0',
        },
      };

      mockSammoAPI.GlobalGetConst.mockResolvedValue(mockData);

      await getSammoGameConst();

      expect(mockSammoAPI.GlobalGetConst).toHaveBeenCalled();
    });

    it('이미 로드된 경우 바로 상태를 반환해야 함', async () => {
      useSammoStore.setState({
        isLoaded: true,
        gameConst: { turnTerm: 300 },
      });

      const result = await getSammoGameConst();

      expect(mockSammoAPI.GlobalGetConst).not.toHaveBeenCalled();
      expect(result.isLoaded).toBe(true);
    });
  });

  // ============================================================================
  // 상태 일관성 테스트
  // ============================================================================

  describe('상태 일관성', () => {
    it('부분 데이터 로드 시에도 안정적이어야 함', async () => {
      const mockData = {
        result: true,
        data: {
          gameConst: { turnTerm: 300 },
          // 다른 필드는 undefined
        },
      };

      mockSammoAPI.GlobalGetConst.mockResolvedValue(mockData);

      await useSammoStore.getState().loadGameConst();

      const state = useSammoStore.getState();
      
      expect(state.isLoaded).toBe(true);
      expect(state.gameConst?.turnTerm).toBe(300);
      expect(state.gameUnitConst).toBeNull();
      expect(state.cityConst).toBeNull();
    });

    it('연속적인 reset과 load가 올바르게 작동해야 함', async () => {
      const mockData = {
        result: true,
        data: {
          gameConst: { turnTerm: 300 },
          version: '1.0.0',
        },
      };

      mockSammoAPI.GlobalGetConst.mockResolvedValue(mockData);

      await useSammoStore.getState().loadGameConst();
      expect(useSammoStore.getState().isLoaded).toBe(true);

      useSammoStore.getState().reset();
      expect(useSammoStore.getState().isLoaded).toBe(false);

      await useSammoStore.getState().loadGameConst();
      expect(useSammoStore.getState().isLoaded).toBe(true);
      expect(mockSammoAPI.GlobalGetConst).toHaveBeenCalledTimes(2);
    });
  });
});

