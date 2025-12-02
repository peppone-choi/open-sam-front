'use client';

/**
 * 전투 에러 바운더리 컴포넌트
 * 
 * 전투 렌더링 중 발생하는 에러를 포착하고 처리합니다.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

// ============================================================================
// 타입 정의
// ============================================================================

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// 컴포넌트
// ============================================================================

export default class BattleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('전투 렌더링 에러:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // 외부 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoBack = (): void => {
    // 브라우저 뒤로가기
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // 커스텀 폴백이 있으면 사용
      if (fallback) {
        return fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900/80 border border-red-500/30 rounded-2xl p-8 text-center">
            {/* 에러 아이콘 */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="text-4xl">💥</span>
            </div>

            {/* 에러 메시지 */}
            <h2 className="text-xl font-bold text-red-400 mb-3">
              전투 렌더링 오류
            </h2>
            <p className="text-gray-400 mb-6">
              전투 화면을 표시하는 중 문제가 발생했습니다.
              {error && (
                <span className="block mt-2 text-sm text-gray-500 font-mono">
                  {error.message}
                </span>
              )}
            </p>

            {/* 버튼 */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
              >
                🔄 다시 시도
              </button>
              <button
                onClick={this.handleGoBack}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl border border-white/10 transition-colors"
              >
                ◀ 뒤로가기
              </button>
            </div>

            {/* 추가 정보 (개발 모드) */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
                  🔧 개발자 정보
                </summary>
                <pre className="mt-2 p-3 bg-black/50 rounded-lg text-xs text-gray-400 overflow-x-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}
