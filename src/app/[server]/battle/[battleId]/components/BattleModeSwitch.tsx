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
  currentMode: '2d' | 'voxel';
  onModeChange: (mode: '2d' | 'voxel') => void;
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
    const newMode = currentMode === '2d' ? 'voxel' : '2d';
    onModeChange(newMode);
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
            : currentMode === 'voxel'
              ? 'bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-white/10'
          }
        `}
      >
        {/* 아이콘 */}
        <span className="text-lg">
          {currentMode === 'voxel' ? '🎮' : '📊'}
        </span>

        {/* 현재 모드 표시 */}
        <span className="hidden sm:inline">
          {currentMode === 'voxel' ? '3D 복셀' : '2D 맵'}
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
            <span>{currentMode === 'voxel' ? '📊' : '🎮'}</span>
            <span>
              {currentMode === 'voxel' 
                ? '2D 전투 맵으로 전환'
                : '3D 복셀 전투로 전환'}
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

interface BattleModeSwitchToggleProps extends BattleModeSwitchProps {}

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
        onClick={() => onModeChange('voxel')}
        disabled={disabled}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${currentMode === 'voxel'
            ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-sm'
            : 'text-gray-400 hover:text-white'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        🎮 3D
      </button>
    </div>
  );
}





