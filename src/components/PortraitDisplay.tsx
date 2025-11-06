/**
 * Portrait Display Component
 * HOI4 스타일 포트레잇 표시 컴포넌트 (26:35 비율)
 */

import React from 'react';

interface PortraitDisplayProps {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  frame?: 'none' | 'gold' | 'silver' | 'bronze';
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  small: { width: 78, height: 105 },    // 50%
  medium: { width: 156, height: 210 },  // 100% (기본)
  large: { width: 234, height: 315 },   // 150%
  xlarge: { width: 312, height: 420 }   // 200%
};

const frameStyles = {
  none: '',
  gold: 'border-4 border-yellow-500 shadow-lg shadow-yellow-500/50',
  silver: 'border-4 border-gray-300 shadow-lg shadow-gray-300/50',
  bronze: 'border-4 border-orange-700 shadow-lg shadow-orange-700/50'
};

export const PortraitDisplay: React.FC<PortraitDisplayProps> = ({
  src,
  alt,
  size = 'medium',
  frame = 'none',
  className = '',
  onClick
}) => {
  const { width, height } = sizeMap[size];
  const frameClass = frameStyles[frame];

  return (
    <div
      className={`portrait-container inline-block ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`object-cover ${frameClass} rounded`}
        style={{
          aspectRatio: '26 / 35',
          imageRendering: 'crisp-edges'
        }}
      />
    </div>
  );
};

/**
 * 포트레잇 그리드 표시 (여러 장수)
 */
interface PortraitGridProps {
  portraits: Array<{
    id: number;
    src: string;
    name: string;
    frame?: 'none' | 'gold' | 'silver' | 'bronze';
  }>;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onPortraitClick?: (id: number) => void;
}

export const PortraitGrid: React.FC<PortraitGridProps> = ({
  portraits,
  size = 'small',
  onPortraitClick
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {portraits.map((portrait) => (
        <div key={portrait.id} className="flex flex-col items-center">
          <PortraitDisplay
            src={portrait.src}
            alt={portrait.name}
            size={size}
            frame={portrait.frame}
            onClick={() => onPortraitClick?.(portrait.id)}
          />
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 text-center">
            {portrait.name}
          </p>
        </div>
      ))}
    </div>
  );
};
