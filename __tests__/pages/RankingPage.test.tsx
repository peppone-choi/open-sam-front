/**
 * 랭킹 페이지 컴포넌트 테스트
 * Agent 13이 구현한 랭킹 테이블이 데이터를 올바르게 렌더링하는지 검증합니다.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 모킹할 API 함수들
jest.mock('@/lib/api/ranking', () => ({
  getGeneralRanking: jest.fn(),
  getNationRanking: jest.fn(),
}));

// 모킹할 next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/ranking',
}));

import RankingPage from '@/app/ranking/page';
import { getGeneralRanking, getNationRanking } from '@/lib/api/ranking';

const mockGeneralRanking = {
  success: true,
  sort: 'killnum',
  session_id: 'test-session-001',
  page: 1,
  limit: 20,
  total: 100,
  totalPages: 5,
  data: [
    {
      rank: 1,
      generalNo: 1,
      type: 'killnum',
      value: 150,
      season: 1,
      scenario: 1,
      owner: 1,
      serverId: 'test-session-001',
      aux: { name: '관우', nationName: '촉한' },
    },
    {
      rank: 2,
      generalNo: 2,
      type: 'killnum',
      value: 120,
      season: 1,
      scenario: 1,
      owner: 2,
      serverId: 'test-session-001',
      aux: { name: '장비', nationName: '촉한' },
    },
    {
      rank: 3,
      generalNo: 3,
      type: 'killnum',
      value: 100,
      season: 1,
      scenario: 1,
      owner: 3,
      serverId: 'test-session-001',
      aux: { name: '조운', nationName: '촉한' },
    },
  ],
};

const mockNationRanking = {
  success: true,
  nations: [
    {
      _id: 'nation-001',
      session_id: 'test-session-001',
      nation: 1,
      name: '촉한',
      color: '#FF0000',
      rate: 5000,
      gold: 100000,
      rice: 80000,
      gennum: 20,
    },
    {
      _id: 'nation-002',
      session_id: 'test-session-001',
      nation: 2,
      name: '위나라',
      color: '#0000FF',
      rate: 4500,
      gold: 90000,
      rice: 70000,
      gennum: 18,
    },
    {
      _id: 'nation-003',
      session_id: 'test-session-001',
      nation: 3,
      name: '오나라',
      color: '#00FF00',
      rate: 4000,
      gold: 80000,
      rice: 60000,
      gennum: 15,
    },
  ],
};

describe('RankingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getGeneralRanking as jest.Mock).mockResolvedValue(mockGeneralRanking);
    (getNationRanking as jest.Mock).mockResolvedValue(mockNationRanking);
  });

  // ============================================================================
  // 기본 렌더링 테스트
  // ============================================================================

  describe('기본 렌더링', () => {
    it('페이지 제목이 표시되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByText('명예의 전당 · 랭킹')).toBeInTheDocument();
      });
    });

    it('장수/국가 탭이 표시되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '장수 랭킹' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '국가 랭킹' })).toBeInTheDocument();
      });
    });

    it('기본적으로 장수 랭킹 탭이 활성화되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(getGeneralRanking).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // 장수 랭킹 테스트
  // ============================================================================

  describe('장수 랭킹', () => {
    it('장수 랭킹 데이터가 테이블에 렌더링되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByText('관우')).toBeInTheDocument();
        expect(screen.getByText('장비')).toBeInTheDocument();
        expect(screen.getByText('조운')).toBeInTheDocument();
      });
    });

    it('장수 랭킹에 순위가 올바르게 표시되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');
        
        // 헤더 제외한 데이터 행
        expect(rows.length).toBeGreaterThan(1);
      });
    });

    it('장수 랭킹에 국가명이 표시되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        const cells = screen.getAllByText('촉한');
        expect(cells.length).toBeGreaterThan(0);
      });
    });

    it('정렬 옵션이 표시되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByText('킬 수')).toBeInTheDocument();
      });
    });

    it('세션 정보가 InfoSummaryCard에 표시되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByText('test-session-001')).toBeInTheDocument();
      });
    });

    it('총 랭킹 수가 표시되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByText('100명')).toBeInTheDocument();
      });
    });

    it('페이지네이션 정보가 표시되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByText('1/5')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // 국가 랭킹 테스트
  // ============================================================================

  describe('국가 랭킹', () => {
    it('국가 탭 클릭 시 국가 랭킹 데이터가 로드되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '국가 랭킹' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: '국가 랭킹' }));

      await waitFor(() => {
        expect(getNationRanking).toHaveBeenCalled();
      });
    });

    it('국가 랭킹 데이터가 테이블에 렌더링되어야 함', async () => {
      render(<RankingPage />);

      fireEvent.click(screen.getByRole('button', { name: '국가 랭킹' }));

      await waitFor(() => {
        expect(screen.getByText('촉한')).toBeInTheDocument();
        expect(screen.getByText('위나라')).toBeInTheDocument();
        expect(screen.getByText('오나라')).toBeInTheDocument();
      });
    });

    it('국가별 국력이 표시되어야 함', async () => {
      render(<RankingPage />);

      fireEvent.click(screen.getByRole('button', { name: '국가 랭킹' }));

      await waitFor(() => {
        expect(screen.getByText('5,000')).toBeInTheDocument();
        expect(screen.getByText('4,500')).toBeInTheDocument();
        expect(screen.getByText('4,000')).toBeInTheDocument();
      });
    });

    it('국가 수가 표시되어야 함', async () => {
      render(<RankingPage />);

      fireEvent.click(screen.getByRole('button', { name: '국가 랭킹' }));

      await waitFor(() => {
        expect(screen.getByText('3국')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // 탭 전환 테스트
  // ============================================================================

  describe('탭 전환', () => {
    it('장수 탭에서 국가 탭으로 전환할 수 있어야 함', async () => {
      render(<RankingPage />);

      // 장수 랭킹 로드 대기
      await waitFor(() => {
        expect(screen.getByText('관우')).toBeInTheDocument();
      });

      // 국가 랭킹 탭 클릭
      fireEvent.click(screen.getByRole('button', { name: '국가 랭킹' }));

      // 국가 랭킹 데이터 확인
      await waitFor(() => {
        expect(screen.getByText('촉한')).toBeInTheDocument();
      });
    });

    it('국가 탭에서 장수 탭으로 전환할 수 있어야 함', async () => {
      render(<RankingPage />);

      // 국가 랭킹 탭 클릭
      fireEvent.click(screen.getByRole('button', { name: '국가 랭킹' }));

      await waitFor(() => {
        expect(screen.getByText('촉한')).toBeInTheDocument();
      });

      // 장수 랭킹 탭 클릭
      fireEvent.click(screen.getByRole('button', { name: '장수 랭킹' }));

      await waitFor(() => {
        expect(screen.getByText('관우')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // 로딩 상태 테스트
  // ============================================================================

  describe('로딩 상태', () => {
    it('데이터 로딩 중 스켈레톤 UI가 표시되어야 함', async () => {
      // 느린 응답 시뮬레이션
      (getGeneralRanking as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockGeneralRanking), 100))
      );

      render(<RankingPage />);

      // 스켈레톤 UI 확인 (bg-white/5 클래스가 있는 div)
      const skeletons = document.querySelectorAll('.bg-white\\/5');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 에러 상태 테스트
  // ============================================================================

  describe('에러 상태', () => {
    it('API 에러 시 에러 메시지가 표시되어야 함', async () => {
      (getGeneralRanking as jest.Mock).mockResolvedValue({
        success: false,
        message: '서버 오류가 발생했습니다.',
        data: [],
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 20,
        sort: 'killnum',
      });

      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByText('서버 오류가 발생했습니다.')).toBeInTheDocument();
      });
    });

    it('데이터 없음 시 빈 상태 메시지가 표시되어야 함', async () => {
      (getGeneralRanking as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 20,
        sort: 'killnum',
      });

      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByText('표시할 랭킹이 없습니다.')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // 페이지네이션 테스트
  // ============================================================================

  describe('페이지네이션', () => {
    it('이전/다음 버튼이 표시되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '이전' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
      });
    });

    it('첫 페이지에서 이전 버튼이 비활성화되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: '이전' });
        expect(prevButton).toBeDisabled();
      });
    });

    it('다음 버튼 클릭 시 다음 페이지 데이터가 로드되어야 함', async () => {
      const page2Data = {
        ...mockGeneralRanking,
        page: 2,
        data: [
          {
            rank: 4,
            generalNo: 4,
            type: 'killnum',
            value: 90,
            season: 1,
            scenario: 1,
            owner: 4,
            serverId: 'test-session-001',
            aux: { name: '마초', nationName: '촉한' },
          },
        ],
      };

      (getGeneralRanking as jest.Mock)
        .mockResolvedValueOnce(mockGeneralRanking)
        .mockResolvedValueOnce(page2Data);

      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByText('관우')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: '다음' }));

      await waitFor(() => {
        expect(getGeneralRanking).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ============================================================================
  // 필터 테스트
  // ============================================================================

  describe('필터', () => {
    it('세션 ID 입력 필드가 표시되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('미입력 시 최신 세션')).toBeInTheDocument();
      });
    });

    it('조회 버튼이 표시되어야 함', async () => {
      render(<RankingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '조회' })).toBeInTheDocument();
      });
    });
  });
});








