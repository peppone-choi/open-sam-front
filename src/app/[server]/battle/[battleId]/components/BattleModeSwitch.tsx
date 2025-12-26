'use client';

/**
 * 전투 모드 전환 컴포넌트
 * 2D와 3D 복셀 모드 간 전환 버튼
 */

import React, { useState } from 'react';

// ============================================================================
// 타입 정의
// ============================================================================

interface BattleModeSwitchProps {
  currentMode: '2d' | 'mug';
  onModeChange: (mode: '2d' | 'mug') => void;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// 컴포넌트
// ============================================================================

export default function BattleModeSwitch({
  currentMode,
  onModeChange,
  disabled = false,
  className = '',
}: BattleModeSwitchProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    const nextMode = currentMode === '2d' ? 'mug' : '2d';
    onModeChange(nextMode);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
          transition-all duration-200
          ${disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-white/10'
          }
        `}
      >
        {/* 아이콘 */}
        <span className="text-lg">
          {currentMode === 'mug' ? '📜' : '📊'}
        </span>

        {/* 현재 모드 표시 */}
        <span className="hidden sm:inline">
          {currentMode === 'mug' ? 'Mug 클래식' : '2D 맵'}
        </span>

        {/* 전환 아이콘 */}
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </button>

      {/* 툴팁 */}
      {isHovered && !disabled && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span>{currentMode === 'mug' ? '📊' : '📜'}</span>
            <span>
              {currentMode === 'mug'
                ? '2D 전투 맵으로 전환'
                : 'Mug 클래식으로 전환'}
            </span>
          </div>
          {/* 화살표 */}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 border-l border-t border-white/10 transform rotate-45" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 인라인 스위치 변형 (토글 스타일)
// ============================================================================

interface BattleModeSwitchToggleProps extends BattleModeSwitchProps { }

export function BattleModeSwitchToggle({
  currentMode,
  onModeChange,
  disabled = false,
  className = '',
}: BattleModeSwitchToggleProps) {
  return (
    <div className={`inline-flex items-center gap-1 p-1 bg-gray-800/80 rounded-lg ${className}`}>
      <button
        onClick={() => onModeChange('2d')}
        disabled={disabled}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${currentMode === '2d'
            ? 'bg-gray-700 text-white shadow-sm'
            : 'text-gray-400 hover:text-white'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        📊 2D
      </button>


      <button
        onClick={() => onModeChange('mug')}
        disabled={disabled}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${currentMode === 'mug'
            ? 'bg-yellow-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-white'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        📜 Mug
      </button>
    </div>
  );
}





