import React from 'react';
import { TroopIcon } from './TroopIcon';
import { getUnitTypeInfo, type UnitType } from '@/utils/unitTypeMapping';

interface TroopIconDisplayProps {
  crewtype: number;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

/**
 * crewtype을 받아서 자동으로 병종 타입을 결정하고 아이콘을 표시하는 컴포넌트
 */
export const TroopIconDisplay: React.FC<TroopIconDisplayProps> = ({ 
  crewtype, 
  size = 32, 
  className = '',
  showLabel = false 
}) => {
  const unitMeta = getUnitTypeInfo(crewtype);
  const unitType: UnitType = unitMeta.type;

  if (showLabel) {
    return (
      <div className={`troop-icon-display ${className}`} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <TroopIcon type={unitType} size={size} />
        <span style={{ fontSize: '12px', fontWeight: 500 }}>{unitMeta.name}</span>
      </div>
    );
  }

  return <TroopIcon type={unitType} size={size} className={className} />;
};

export default TroopIconDisplay;
