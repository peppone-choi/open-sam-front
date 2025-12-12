/**
 * 명예의 전당 역사 페이지 컴포넌트 테스트
 * 역대 통일 기록이 올바르게 렌더링되는지 검증합니다.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// 모킹할 API 함수들
jest.mock('@/lib/api/ranking', () => ({
  getHistory: jest.fn(),
}));

// 모킹할 next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/history',
}));

import HistoryPage from '@/app/history/page';
import { getHistory } from '@/lib/api/ranking';

const mockHistoryData = {
  success: true,
  history: [
    {
      _id: 'history-001',
      session_id: 'test-session-001',
      nation_id: 0,
      year: 220,
      month: 3,
      text: '<b>유비</b>가 천하를 통일하였습니다.',
    },
    {
      _id: 'history-002',
      session_id: 'test-session-001',
      nation_id: 1,
      year: 220,
      month: 2,
      text: '<b>촉한</b>이 위나라를 멸망시켰습니다.',
    },
    {
      _id: 'history-003',
      session_id: 'test-session-001',
      nation_id: 1,
      year: 220,
      month: 1,
      text: '<b>촉한</b>이 오나라를 멸망시켰습니다.',
    },
    {
      _id: 'history-004',
      session_id: 'test-session-001',
      nation_id: 0,
      year: 219,
      month: 12,
      text: '<b>관우</b>가 오관참장의 업적을 달성했습니다.',
    },
  ],
};

describe('HistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getHistory as jest.Mock).mockResolvedValue(mockHistoryData);
  });

  // ============================================================================
  // 기본 렌더링 테스트
  // ============================================================================

  describe('기본 렌더링', () => {
    it('페이지 제목이 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('명예의 전당 · 역사')).toBeInTheDocument();
      });
    });

    it('통일 역사 타임라인 제목이 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('통일 역사 타임라인')).toBeInTheDocument();
      });
    });

    it('세션별 주요 기록 부제가 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('세션별 주요 기록')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // 데이터 렌더링 테스트
  // ============================================================================

  describe('역사 데이터 렌더링', () => {
    it('역사 기록이 타임라인에 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        // 텍스트에서 HTML 태그 제거된 내용 확인
        expect(screen.getByText(/유비.*천하를 통일/)).toBeInTheDocument();
      });
    });

    it('연도/월 정보가 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('220년 3월')).toBeInTheDocument();
        expect(screen.getByText('220년 2월')).toBeInTheDocument();
      });
    });

    it('기록 수가 InfoSummaryCard에 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('4건')).toBeInTheDocument();
      });
    });

    it('최신 시점이 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        // 최신 기록의 시점 (가장 최근 연도/월)
        expect(screen.getByText('220년 3월')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // 필터 테스트
  // ============================================================================

  describe('필터 기능', () => {
    it('세션 ID 필터 입력 필드가 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('미입력 시 최신 세션')).toBeInTheDocument();
      });
    });

    it('국가 ID 필터 입력 필드가 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('0=전역, 비우면 전체')).toBeInTheDocument();
      });
    });

    it('조회 버튼이 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '조회' })).toBeInTheDocument();
      });
    });

    it('조회 버튼 클릭 시 API가 호출되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(getHistory).toHaveBeenCalled();
      });

      const queryButton = screen.getByRole('button', { name: '조회' });
      fireEvent.click(queryButton);

      await waitFor(() => {
        // 초기 로드 + 조회 버튼 클릭
        expect(getHistory).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ============================================================================
  // 로딩 상태 테스트
  // ============================================================================

  describe('로딩 상태', () => {
    it('데이터 로딩 중 스켈레톤 UI가 표시되어야 함', async () => {
      (getHistory as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockHistoryData), 100))
      );

      render(<HistoryPage />);

      // 스켈레톤 UI 확인
      const skeletons = document.querySelectorAll('.bg-white\\/5');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 에러 상태 테스트
  // ============================================================================

  describe('에러 상태', () => {
    it('API 에러 시 에러 메시지가 표시되어야 함', async () => {
      (getHistory as jest.Mock).mockResolvedValue({
        success: false,
        message: '연혁 데이터를 불러오지 못했습니다.',
        history: [],
      });

      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('연혁 데이터를 불러오지 못했습니다.')).toBeInTheDocument();
      });
    });

    it('데이터 없음 시 빈 상태 메시지가 표시되어야 함', async () => {
      (getHistory as jest.Mock).mockResolvedValue({
        success: true,
        history: [],
      });

      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('표시할 연혁 데이터가 없습니다.')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // InfoSummaryCard 테스트
  // ============================================================================

  describe('요약 정보 카드', () => {
    it('세션 정보 카드가 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('세션')).toBeInTheDocument();
        expect(screen.getByText('조회 중인 게임 세션')).toBeInTheDocument();
      });
    });

    it('기록 수 카드가 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('기록 수')).toBeInTheDocument();
        expect(screen.getByText('월별/국가별 기록')).toBeInTheDocument();
      });
    });

    it('최신 시점 카드가 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('최신 시점')).toBeInTheDocument();
        expect(screen.getByText('가장 최근 기록')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // 카테고리 구분 테스트
  // ============================================================================

  describe('카테고리 구분', () => {
    it('전역/국가 기록 구분 안내가 표시되어야 함', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/전역 기록은.*파란색.*국가 기록은.*초록색/)
        ).toBeInTheDocument();
      });
    });
  });
});








