import React from 'react';
import type { UnitType } from '@/utils/unitTypeMapping';

interface TroopIconProps {
  type: UnitType;
  size?: number;
  className?: string;
}

/**
 * 삼국지 조조전 스타일 병종 아이콘
 * 도트 그래픽 느낌의 16x16 픽셀 아트 스타일
 */
export const TroopIcon: React.FC<TroopIconProps> = ({ type, size = 32, className = '' }) => {
  const renderIcon = () => {
    switch (type) {
      case 'FOOTMAN':
        return <FootmanIcon />;
      case 'SPEARMAN':
        return <SpearmanIcon />;
      case 'ARCHER':
        return <ArcherIcon />;
      case 'CAVALRY':
        return <CavalryIcon />;
      case 'SIEGE':
        return <SiegeIcon />;
      case 'WIZARD':
        return <WizardIcon />;
      case 'MIXED':
        return <MixedIcon />;
      case 'CASTLE':
        return <CastleIcon />;
      default:
        return <FootmanIcon />;
    }
  };

  return (
    <div 
      className={`troop-icon ${className}`}
      style={{ 
        width: size, 
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        imageRendering: 'pixelated'
      }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated' }}
      >
        {renderIcon()}
      </svg>
    </div>
  );
};

// 보병 (劍) - 검을 든 병사
const FootmanIcon: React.FC = () => (
  <>
    {/* 갑옷 (회색-파랑) */}
    <rect x="6" y="5" width="4" height="6" fill="#4A5568" />
    <rect x="7" y="6" width="2" height="4" fill="#5A6C7D" />
    
    {/* 머리 (살색) */}
    <rect x="6" y="3" width="4" height="2" fill="#E8B896" />
    <rect x="7" y="4" width="2" height="1" fill="#D4A574" />
    
    {/* 투구 (금속) */}
    <rect x="6" y="2" width="4" height="1" fill="#8B7355" />
    <rect x="7" y="1" width="2" height="1" fill="#A0826D" />
    
    {/* 검 (은색) */}
    <rect x="11" y="5" width="1" height="5" fill="#C0C0C0" />
    <rect x="11" y="4" width="1" height="1" fill="#E8E8E8" />
    
    {/* 다리 */}
    <rect x="6" y="11" width="2" height="3" fill="#4A5568" />
    <rect x="8" y="11" width="2" height="3" fill="#4A5568" />
    
    {/* 발 */}
    <rect x="6" y="14" width="2" height="1" fill="#2D3748" />
    <rect x="8" y="14" width="2" height="1" fill="#2D3748" />
  </>
);

// 창병 (槍) - 긴 창을 든 병사
const SpearmanIcon: React.FC = () => (
  <>
    {/* 갑옷 (진한 파랑) */}
    <rect x="6" y="5" width="4" height="6" fill="#2C5282" />
    <rect x="7" y="6" width="2" height="4" fill="#3C6BA0" />
    
    {/* 머리 */}
    <rect x="6" y="3" width="4" height="2" fill="#E8B896" />
    
    {/* 투구 */}
    <rect x="6" y="2" width="4" height="1" fill="#8B7355" />
    <rect x="7" y="1" width="2" height="1" fill="#A0826D" />
    
    {/* 창 - 대각선으로 긴 창 */}
    <rect x="11" y="1" width="1" height="1" fill="#8B7355" />
    <rect x="10" y="2" width="1" height="1" fill="#8B7355" />
    <rect x="11" y="3" width="1" height="1" fill="#8B7355" />
    <rect x="10" y="4" width="1" height="1" fill="#8B7355" />
    <rect x="11" y="5" width="1" height="1" fill="#8B7355" />
    
    {/* 창날 (은색) */}
    <rect x="12" y="0" width="1" height="1" fill="#C0C0C0" />
    <rect x="11" y="0" width="1" height="1" fill="#E8E8E8" />
    
    {/* 다리 */}
    <rect x="6" y="11" width="2" height="3" fill="#2C5282" />
    <rect x="8" y="11" width="2" height="3" fill="#2C5282" />
    
    {/* 발 */}
    <rect x="6" y="14" width="2" height="1" fill="#1A365D" />
    <rect x="8" y="14" width="2" height="1" fill="#1A365D" />
  </>
);

// 궁병 (弓) - 활을 든 병사
const ArcherIcon: React.FC = () => (
  <>
    {/* 옷 (갈색) */}
    <rect x="6" y="5" width="4" height="6" fill="#8B6F47" />
    <rect x="7" y="6" width="2" height="4" fill="#9C7E52" />
    
    {/* 머리 */}
    <rect x="6" y="3" width="4" height="2" fill="#E8B896" />
    
    {/* 모자 (녹색) */}
    <rect x="6" y="2" width="4" height="1" fill="#4A7C59" />
    <rect x="7" y="1" width="2" height="1" fill="#5A8C69" />
    
    {/* 활 */}
    <rect x="11" y="3" width="1" height="5" fill="#8B6F47" />
    <rect x="12" y="4" width="1" height="3" fill="#8B6F47" />
    
    {/* 활시위 */}
    <rect x="12" y="3" width="1" height="1" fill="#E8E8E8" />
    <rect x="12" y="7" width="1" height="1" fill="#E8E8E8" />
    
    {/* 화살통 */}
    <rect x="5" y="6" width="1" height="3" fill="#6B4423" />
    <rect x="5" y="5" width="1" height="1" fill="#D4A574" />
    
    {/* 다리 */}
    <rect x="6" y="11" width="2" height="3" fill="#8B6F47" />
    <rect x="8" y="11" width="2" height="3" fill="#8B6F47" />
    
    {/* 발 */}
    <rect x="6" y="14" width="2" height="1" fill="#6B4423" />
    <rect x="8" y="14" width="2" height="1" fill="#6B4423" />
  </>
);

// 기병 (騎) - 말을 탄 병사
const CavalryIcon: React.FC = () => (
  <>
    {/* 말 머리 */}
    <rect x="2" y="6" width="3" height="3" fill="#8B6F47" />
    <rect x="1" y="7" width="1" height="1" fill="#6B4423" />
    
    {/* 말 귀 */}
    <rect x="2" y="5" width="1" height="1" fill="#8B6F47" />
    
    {/* 기수 갑옷 (붉은색) */}
    <rect x="6" y="4" width="4" height="4" fill="#C53030" />
    <rect x="7" y="5" width="2" height="2" fill="#E53E3E" />
    
    {/* 기수 머리 */}
    <rect x="7" y="2" width="2" height="2" fill="#E8B896" />
    
    {/* 투구 */}
    <rect x="7" y="1" width="2" height="1" fill="#8B7355" />
    
    {/* 창 */}
    <rect x="10" y="2" width="1" height="6" fill="#8B7355" />
    <rect x="10" y="1" width="1" height="1" fill="#C0C0C0" />
    
    {/* 말 몸통 */}
    <rect x="3" y="8" width="7" height="3" fill="#8B6F47" />
    <rect x="4" y="9" width="5" height="1" fill="#9C7E52" />
    
    {/* 말 다리 */}
    <rect x="4" y="11" width="1" height="3" fill="#6B4423" />
    <rect x="6" y="11" width="1" height="3" fill="#6B4423" />
    <rect x="8" y="11" width="1" height="3" fill="#6B4423" />
    
    {/* 말 발굽 */}
    <rect x="4" y="14" width="1" height="1" fill="#4A4A4A" />
    <rect x="6" y="14" width="1" height="1" fill="#4A4A4A" />
    <rect x="8" y="14" width="1" height="1" fill="#4A4A4A" />
  </>
);

// 공성병 (車) - 투석기/노포
const SiegeIcon: React.FC = () => (
  <>
    {/* 투석기 바퀴 */}
    <rect x="3" y="12" width="3" height="3" fill="#6B4423" />
    <rect x="10" y="12" width="3" height="3" fill="#6B4423" />
    
    {/* 바퀴 중심 */}
    <rect x="4" y="13" width="1" height="1" fill="#8B6F47" />
    <rect x="11" y="13" width="1" height="1" fill="#8B6F47" />
    
    {/* 투석기 몸체 */}
    <rect x="4" y="7" width="8" height="5" fill="#8B6F47" />
    <rect x="5" y="8" width="6" height="3" fill="#9C7E52" />
    
    {/* 투석 팔 */}
    <rect x="7" y="2" width="2" height="5" fill="#6B4423" />
    <rect x="8" y="3" width="1" height="2" fill="#8B6F47" />
    
    {/* 투석주머니 */}
    <rect x="6" y="1" width="4" height="2" fill="#4A5568" />
    <rect x="7" y="0" width="2" height="1" fill="#5A6C7D" />
    
    {/* 바위/탄환 */}
    <rect x="7" y="1" width="2" height="1" fill="#718096" />
    
    {/* 조작 병사 (작게) */}
    <rect x="11" y="8" width="2" height="2" fill="#C53030" />
    <rect x="11" y="7" width="2" height="1" fill="#E8B896" />
  </>
);

// 귀병/도사 (仙) - 마법사
const WizardIcon: React.FC = () => (
  <>
    {/* 도포 (보라색) */}
    <rect x="5" y="5" width="6" height="7" fill="#6B46C1" />
    <rect x="6" y="6" width="4" height="5" fill="#7C3AED" />
    
    {/* 머리 */}
    <rect x="6" y="3" width="4" height="2" fill="#E8B896" />
    
    {/* 도사 모자 */}
    <rect x="5" y="1" width="6" height="2" fill="#2D3748" />
    <rect x="6" y="0" width="4" height="1" fill="#4A5568" />
    
    {/* 지팡이 */}
    <rect x="11" y="4" width="1" height="8" fill="#8B6F47" />
    
    {/* 지팡이 끝 (구슬) */}
    <rect x="10" y="3" width="3" height="2" fill="#48BB78" />
    <rect x="11" y="4" width="1" height="1" fill="#68D391" />
    
    {/* 수염 */}
    <rect x="6" y="5" width="4" height="1" fill="#F7FAFC" />
    
    {/* 마법 효과 (반짝이) */}
    <rect x="3" y="6" width="1" height="1" fill="#F6E05E" />
    <rect x="4" y="8" width="1" height="1" fill="#F6E05E" />
    <rect x="2" y="9" width="1" height="1" fill="#F6E05E" />
    
    {/* 다리 (도포 안) */}
    <rect x="6" y="12" width="2" height="2" fill="#553C9A" />
    <rect x="8" y="12" width="2" height="2" fill="#553C9A" />
    
    {/* 발 */}
    <rect x="6" y="14" width="2" height="1" fill="#2D3748" />
    <rect x="8" y="14" width="2" height="1" fill="#2D3748" />
  </>
);

// 복합병 (混) - 특수 병종
const MixedIcon: React.FC = () => (
  <>
    {/* 갑옷 (청록색) */}
    <rect x="6" y="5" width="4" height="6" fill="#2C7A7B" />
    <rect x="7" y="6" width="2" height="4" fill="#319795" />
    
    {/* 머리 */}
    <rect x="6" y="3" width="4" height="2" fill="#E8B896" />
    
    {/* 투구 */}
    <rect x="6" y="2" width="4" height="1" fill="#8B7355" />
    <rect x="7" y="1" width="2" height="1" fill="#A0826D" />
    
    {/* 복합 무기 - 좌측 검 */}
    <rect x="4" y="5" width="1" height="4" fill="#C0C0C0" />
    <rect x="4" y="4" width="1" height="1" fill="#E8E8E8" />
    
    {/* 우측 활 */}
    <rect x="11" y="4" width="1" height="4" fill="#8B6F47" />
    <rect x="12" y="5" width="1" height="2" fill="#8B6F47" />
    
    {/* 활시위 */}
    <rect x="12" y="4" width="1" height="1" fill="#E8E8E8" />
    <rect x="12" y="7" width="1" height="1" fill="#E8E8E8" />
    
    {/* 다리 */}
    <rect x="6" y="11" width="2" height="3" fill="#2C7A7B" />
    <rect x="8" y="11" width="2" height="3" fill="#2C7A7B" />
    
    {/* 발 */}
    <rect x="6" y="14" width="2" height="1" fill="#1A5560" />
    <rect x="8" y="14" width="2" height="1" fill="#1A5560" />
  </>
);

// 성벽 (城) - 성곽
const CastleIcon: React.FC = () => (
  <>
    {/* 성벽 기초 */}
    <rect x="2" y="10" width="12" height="5" fill="#718096" />
    <rect x="3" y="11" width="10" height="3" fill="#A0AEC0" />
    
    {/* 성문 */}
    <rect x="6" y="11" width="4" height="4" fill="#4A5568" />
    <rect x="7" y="12" width="2" height="2" fill="#2D3748" />
    
    {/* 문빗장 */}
    <rect x="6" y="13" width="4" height="1" fill="#8B6F47" />
    
    {/* 성벽 상단 */}
    <rect x="2" y="7" width="12" height="3" fill="#A0AEC0" />
    <rect x="3" y="8" width="10" height="1" fill="#CBD5E0" />
    
    {/* 망루 - 좌 */}
    <rect x="1" y="4" width="4" height="3" fill="#718096" />
    <rect x="2" y="5" width="2" height="1" fill="#A0AEC0" />
    
    {/* 망루 - 우 */}
    <rect x="11" y="4" width="4" height="3" fill="#718096" />
    <rect x="12" y="5" width="2" height="1" fill="#A0AEC0" />
    
    {/* 깃발 - 좌 */}
    <rect x="3" y="1" width="1" height="3" fill="#8B6F47" />
    <rect x="4" y="1" width="2" height="2" fill="#E53E3E" />
    
    {/* 깃발 - 우 */}
    <rect x="12" y="1" width="1" height="3" fill="#8B6F47" />
    <rect x="10" y="1" width="2" height="2" fill="#E53E3E" />
    
    {/* 성벽 돌 질감 */}
    <rect x="4" y="8" width="1" height="1" fill="#718096" />
    <rect x="7" y="9" width="1" height="1" fill="#718096" />
    <rect x="11" y="8" width="1" height="1" fill="#718096" />
    
    {/* 여장 (성가퀴) */}
    <rect x="2" y="6" width="2" height="1" fill="#A0AEC0" />
    <rect x="5" y="6" width="2" height="1" fill="#A0AEC0" />
    <rect x="9" y="6" width="2" height="1" fill="#A0AEC0" />
    <rect x="12" y="6" width="2" height="1" fill="#A0AEC0" />
  </>
);

export default TroopIcon;
