/**
 * gameStore 테스트
 * Zustand 게임 상태 관리 테스트
 */

import { useGameStore } from '@/stores/gameStore';

describe('gameStore', () => {
  // 각 테스트 전 스토어를 기본 상태로 리셋
  beforeEach(() => {
    useGameStore.setState({
      gameState: { year: 796, month: 1, day: 1, hour: 12 },
      userProfile: {
        id: 'u1',
        name: 'Yang Wen-li',
        rank: 'Commodore',
        faction: 'alliance',
        pcp: 100,
        mcp: 120,
        maxPcp: 100,
        maxMcp: 150,
        jobCards: [
          { id: 'c1', title: '13th Fleet Commander', rankReq: 'Rear Admiral', commands: ['warp', 'attack', 'supply'] }
        ]
      },
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedGrid: null,
      selectedObject: null,
      selectedUnitId: null,
      starSystems: [],
      fleets: [],
      isLoadingGalaxy: false,
      galaxyError: null,
    });
  });

  // ============================================================================
  // 초기 상태 테스트
  // ============================================================================

  describe('초기 상태', () => {
    it('게임 상태가 올바르게 초기화되어야 함', () => {
      const state = useGameStore.getState();
      
      expect(state.gameState.year).toBe(796);
      expect(state.gameState.month).toBe(1);
      expect(state.gameState.day).toBe(1);
      expect(state.gameState.hour).toBe(12);
    });

    it('사용자 프로필이 올바르게 설정되어야 함', () => {
      const state = useGameStore.getState();
      
      expect(state.userProfile).not.toBeNull();
      expect(state.userProfile?.name).toBe('Yang Wen-li');
      expect(state.userProfile?.faction).toBe('alliance');
      expect(state.userProfile?.pcp).toBe(100);
      expect(state.userProfile?.mcp).toBe(120);
    });

    it('뷰포트가 초기 위치로 설정되어야 함', () => {
      const state = useGameStore.getState();
      
      expect(state.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });

    it('선택 상태가 null이어야 함', () => {
      const state = useGameStore.getState();
      
      expect(state.selectedGrid).toBeNull();
      expect(state.selectedObject).toBeNull();
      expect(state.selectedUnitId).toBeNull();
    });

    it('로딩 상태가 false이어야 함', () => {
      const state = useGameStore.getState();
      
      expect(state.isLoadingGalaxy).toBe(false);
      expect(state.galaxyError).toBeNull();
    });
  });

  // ============================================================================
  // 뷰포트 액션 테스트
  // ============================================================================

  describe('뷰포트 액션', () => {
    it('setViewport가 x, y 좌표를 업데이트해야 함', () => {
      useGameStore.getState().setViewport(10, 20);
      
      const state = useGameStore.getState();
      expect(state.viewport.x).toBe(10);
      expect(state.viewport.y).toBe(20);
      expect(state.viewport.zoom).toBe(1); // 기존 줌 유지
    });

    it('setViewport가 줌도 함께 업데이트할 수 있어야 함', () => {
      useGameStore.getState().setViewport(10, 20, 2);
      
      const state = useGameStore.getState();
      expect(state.viewport.x).toBe(10);
      expect(state.viewport.y).toBe(20);
      expect(state.viewport.zoom).toBe(2);
    });

    it('줌을 지정하지 않으면 기존 줌 값을 유지해야 함', () => {
      useGameStore.getState().setViewport(0, 0, 1.5);
      useGameStore.getState().setViewport(5, 5);
      
      const state = useGameStore.getState();
      expect(state.viewport.zoom).toBe(1.5);
    });
  });

  // ============================================================================
  // 선택 액션 테스트
  // ============================================================================

  describe('선택 액션', () => {
    it('selectGrid가 그리드를 선택하고 객체 선택을 초기화해야 함', () => {
      // 먼저 객체를 선택
      useGameStore.getState().selectObject('fleet', 'f1');
      expect(useGameStore.getState().selectedObject).not.toBeNull();
      
      // 그리드 선택
      useGameStore.getState().selectGrid(5, 10);
      
      const state = useGameStore.getState();
      expect(state.selectedGrid).toEqual({ x: 5, y: 10 });
      expect(state.selectedObject).toBeNull(); // 객체 선택 초기화
    });

    it('selectObject가 객체를 선택해야 함', () => {
      useGameStore.getState().selectObject('fleet', 'fleet-001');
      
      const state = useGameStore.getState();
      expect(state.selectedObject).toEqual({ type: 'fleet', id: 'fleet-001' });
    });

    it('selectObject가 system 타입도 선택할 수 있어야 함', () => {
      useGameStore.getState().selectObject('system', 'sys-astarte');
      
      const state = useGameStore.getState();
      expect(state.selectedObject).toEqual({ type: 'system', id: 'sys-astarte' });
    });

    it('selectUnit이 유닛 ID를 설정해야 함', () => {
      useGameStore.getState().selectUnit('unit-123');
      
      expect(useGameStore.getState().selectedUnitId).toBe('unit-123');
    });

    it('selectUnit에 null을 전달하면 선택이 해제되어야 함', () => {
      useGameStore.getState().selectUnit('unit-123');
      useGameStore.getState().selectUnit(null);
      
      expect(useGameStore.getState().selectedUnitId).toBeNull();
    });
  });

  // ============================================================================
  // 사용자 프로필 액션 테스트
  // ============================================================================

  describe('사용자 프로필 액션', () => {
    it('refreshUserProfile이 프로필을 업데이트해야 함', () => {
      const newProfile = {
        id: 'u2',
        name: 'Reinhard von Lohengramm',
        rank: 'Admiral',
        faction: 'empire' as const,
        pcp: 150,
        mcp: 200,
        maxPcp: 150,
        maxMcp: 200,
        jobCards: []
      };
      
      useGameStore.getState().refreshUserProfile(newProfile);
      
      const state = useGameStore.getState();
      expect(state.userProfile?.name).toBe('Reinhard von Lohengramm');
      expect(state.userProfile?.faction).toBe('empire');
      expect(state.userProfile?.pcp).toBe(150);
    });

    it('updateCP가 포인트를 증가시켜야 함', () => {
      useGameStore.getState().updateCP(10, 20);
      
      const state = useGameStore.getState();
      expect(state.userProfile?.pcp).toBe(110); // 100 + 10
      expect(state.userProfile?.mcp).toBe(140); // 120 + 20
    });

    it('updateCP가 포인트를 감소시켜야 함', () => {
      useGameStore.getState().updateCP(-30, -50);
      
      const state = useGameStore.getState();
      expect(state.userProfile?.pcp).toBe(70); // 100 - 30
      expect(state.userProfile?.mcp).toBe(70); // 120 - 50
    });

    it('updateCP가 음수가 되지 않도록 0으로 제한해야 함', () => {
      useGameStore.getState().updateCP(-150, -200);
      
      const state = useGameStore.getState();
      expect(state.userProfile?.pcp).toBe(0);
      expect(state.userProfile?.mcp).toBe(0);
    });

    it('userProfile이 null일 때 updateCP가 아무것도 하지 않아야 함', () => {
      useGameStore.setState({ userProfile: null });
      
      // 에러 없이 실행되어야 함
      useGameStore.getState().updateCP(10, 10);
      
      expect(useGameStore.getState().userProfile).toBeNull();
    });
  });

  // ============================================================================
  // 목업 데이터 로드 테스트
  // ============================================================================

  describe('목업 데이터 로드', () => {
    it('loadMockData가 별 시스템과 함대를 로드해야 함', () => {
      useGameStore.getState().loadMockData();
      
      const state = useGameStore.getState();
      
      // 별 시스템 확인
      expect(state.starSystems.length).toBeGreaterThan(0);
      expect(state.starSystems.some(s => s.name === 'Astarte')).toBe(true);
      expect(state.starSystems.some(s => s.name === 'Odin')).toBe(true);
      
      // 함대 확인
      expect(state.fleets.length).toBeGreaterThan(0);
      expect(state.fleets.some(f => f.commanderName === 'Yang Wen-li')).toBe(true);
      expect(state.fleets.some(f => f.commanderName === 'Reinhard von Lohengramm')).toBe(true);
    });

    it('loadMockData가 올바른 faction을 설정해야 함', () => {
      useGameStore.getState().loadMockData();
      
      const state = useGameStore.getState();
      
      const astarte = state.starSystems.find(s => s.name === 'Astarte');
      const odin = state.starSystems.find(s => s.name === 'Odin');
      
      expect(astarte?.faction).toBe('alliance');
      expect(odin?.faction).toBe('empire');
    });

    it('loadMockData 후 함대가 올바른 상태를 가져야 함', () => {
      useGameStore.getState().loadMockData();
      
      const state = useGameStore.getState();
      
      const yangFleet = state.fleets.find(f => f.commanderName === 'Yang Wen-li');
      expect(yangFleet?.status).toBe('idle');
      
      const reinhardFleet = state.fleets.find(f => f.commanderName === 'Reinhard von Lohengramm');
      expect(reinhardFleet?.status).toBe('moving');
    });
  });

  // ============================================================================
  // 갤럭시 데이터 로드 테스트 (에러 케이스)
  // ============================================================================

  describe('갤럭시 데이터 로드', () => {
    it('loadGalaxyData 호출 시 로딩 상태가 설정되어야 함', async () => {
      // API 모킹 - 에러 발생 케이스
      const originalImport = jest.requireActual('@/lib/api/logh');
      jest.mock('@/lib/api/logh', () => ({
        loghApi: {
          getGalaxyViewport: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      }));

      // 로딩 시작 전 상태 확인
      expect(useGameStore.getState().isLoadingGalaxy).toBe(false);
      
      // loadGalaxyData 호출 (실패할 것임)
      try {
        await useGameStore.getState().loadGalaxyData('test-session');
      } catch {
        // 에러 무시
      }
      
      // API 에러 발생 시에도 로딩이 완료되어야 함
      const state = useGameStore.getState();
      expect(state.isLoadingGalaxy).toBe(false);
    });
  });

  // ============================================================================
  // 상태 일관성 테스트
  // ============================================================================

  describe('상태 일관성', () => {
    it('여러 액션을 연속으로 실행해도 상태가 일관되어야 함', () => {
      useGameStore.getState().loadMockData();
      useGameStore.getState().setViewport(10, 10, 1.5);
      useGameStore.getState().selectGrid(5, 5);
      useGameStore.getState().selectObject('fleet', 'f1');
      useGameStore.getState().updateCP(-10, 20);
      
      const state = useGameStore.getState();
      
      // 모든 상태가 올바르게 유지되어야 함
      expect(state.starSystems.length).toBeGreaterThan(0);
      expect(state.viewport).toEqual({ x: 10, y: 10, zoom: 1.5 });
      expect(state.selectedObject).toEqual({ type: 'fleet', id: 'f1' });
      // selectObject는 selectedGrid를 변경하지 않음
      expect(state.selectedGrid).toEqual({ x: 5, y: 5 });
      expect(state.userProfile?.pcp).toBe(90);
      expect(state.userProfile?.mcp).toBe(140);
    });
  });
});

