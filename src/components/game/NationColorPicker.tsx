'use client';

import React from 'react';
import NationFlag from './NationFlag';

// 선택 가능한 국가 색상 (연한 회색 #d3d3d3 제외)
export const NATION_COLORS = [
  { hex: '#dc143c', name: '진홍색' },
  { hex: '#1e90ff', name: '파랑색' },
  { hex: '#32cd32', name: '초록색' },
  { hex: '#ffd700', name: '금색' },
  { hex: '#ba55d3', name: '보라색' },
  { hex: '#ff8c00', name: '주황색' },
  { hex: '#ff69b4', name: '분홍색' },
  { hex: '#00ced1', name: '청록색' },
  { hex: '#ff4500', name: '적주황색' },
  { hex: '#9370db', name: '중간보라색' },
  { hex: '#20b2aa', name: '밝은 바다색' },
  { hex: '#daa520', name: '황금색' },
  { hex: '#ff6347', name: '토마토색' },
  { hex: '#4169e1', name: '로열블루' },
  { hex: '#8b008b', name: '진보라색' },
  { hex: '#b22222', name: '벽돌색' },
] as const;

interface NationColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  className?: string;
  disabledColors?: string[]; // 이미 사용 중인 색상들
}

/**
 * 국가 색상 선택 컴포넌트
 * 
 * @example
 * <NationColorPicker 
 *   selectedColor={color}
 *   onColorChange={setColor}
 *   disabledColors={['#dc143c', '#1e90ff']}
 * />
 */
export default function NationColorPicker({
  selectedColor,
  onColorChange,
  className = '',
  disabledColors = []
}: NationColorPickerProps) {
  return (
    <div className={`nation-color-picker ${className}`}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '12px',
        padding: '12px'
      }}>
        {NATION_COLORS.map(({ hex, name }) => {
          const isSelected = selectedColor === hex;
          const isDisabled = disabledColors.includes(hex);
          
          return (
            <button
              key={hex}
              type="button"
              onClick={() => !isDisabled && onColorChange(hex)}
              disabled={isDisabled}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '8px',
                border: isSelected ? '3px solid #fff' : '1px solid #666',
                borderRadius: '8px',
                background: isSelected ? '#333' : '#222',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.4 : 1,
                transition: 'all 0.2s',
              }}
              title={isDisabled ? '이미 사용 중인 색상' : name}
              onMouseEnter={(e) => {
                if (!isDisabled && !isSelected) {
                  e.currentTarget.style.background = '#2a2a2a';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled && !isSelected) {
                  e.currentTarget.style.background = '#222';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <NationFlag color={hex} size={40} animate={isSelected} />
              <span style={{ 
                fontSize: '11px', 
                color: isDisabled ? '#666' : '#aaa',
                textAlign: 'center',
                lineHeight: 1.2
              }}>
                {name}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* 선택된 색상 미리보기 */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#1a1a1a',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ color: '#aaa' }}>선택된 색상:</span>
        <NationFlag color={selectedColor} size={48} />
        <span style={{ 
          color: '#fff', 
          fontWeight: 'bold',
          fontFamily: 'monospace'
        }}>
          {selectedColor}
        </span>
      </div>
    </div>
  );
}
