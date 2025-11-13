import React from 'react';
import { TroopIcon } from './TroopIcon';

type UnitType = 'FOOTMAN' | 'SPEARMAN' | 'ARCHER' | 'CAVALRY' | 'SIEGE' | 'WIZARD' | 'MIXED' | 'CASTLE';

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
  const getUnitType = (crewtype: number): UnitType => {
    // 0-4 간단 매핑
    if (crewtype >= 0 && crewtype <= 4) {
      const simpleMap: Record<number, UnitType> = {
        0: 'FOOTMAN',
        1: 'ARCHER',
        2: 'CAVALRY',
        3: 'WIZARD',
        4: 'SIEGE',
      };
      return simpleMap[crewtype] || 'FOOTMAN';
    }

    // units.json 정확한 매핑
    const unitTypeMapping: Record<number, UnitType> = {
      1000: 'CASTLE',
      1100: 'FOOTMAN', 1101: 'FOOTMAN', 1102: 'FOOTMAN', 1103: 'FOOTMAN', 1104: 'FOOTMAN',
      1105: 'FOOTMAN', 1106: 'FOOTMAN', 1107: 'FOOTMAN', 1108: 'FOOTMAN', 1109: 'FOOTMAN',
      1110: 'FOOTMAN', 1111: 'FOOTMAN', 1112: 'FOOTMAN', 1113: 'FOOTMAN', 1114: 'FOOTMAN',
      1115: 'FOOTMAN', 1116: 'FOOTMAN', 1117: 'FOOTMAN',
      1200: 'ARCHER',
      1201: 'SPEARMAN', 1202: 'SPEARMAN', 1203: 'SPEARMAN', 1204: 'SPEARMAN', 1205: 'SPEARMAN',
      1206: 'SPEARMAN', 1207: 'SPEARMAN', 1208: 'SPEARMAN', 1209: 'SPEARMAN', 1210: 'SPEARMAN',
      1211: 'SPEARMAN',
      1300: 'CAVALRY',
      1301: 'ARCHER', 1302: 'ARCHER', 1303: 'ARCHER', 1304: 'ARCHER', 1305: 'ARCHER',
      1306: 'ARCHER', 1307: 'ARCHER', 1308: 'ARCHER', 1309: 'ARCHER', 1310: 'ARCHER',
      1401: 'CAVALRY', 1402: 'CAVALRY', 1403: 'CAVALRY', 1404: 'CAVALRY', 1405: 'CAVALRY',
      1406: 'CAVALRY', 1407: 'CAVALRY', 1408: 'CAVALRY',
      1500: 'SIEGE',
      1501: 'MIXED', 1502: 'MIXED', 1503: 'MIXED', 1504: 'MIXED',
      1601: 'SIEGE', 1602: 'SIEGE',
      1701: 'WIZARD', 1702: 'WIZARD', 1703: 'WIZARD',
    };

    return unitTypeMapping[crewtype] || 'FOOTMAN';
  };

  const getUnitName = (type: UnitType): string => {
    const nameMap: Record<UnitType, string> = {
      'FOOTMAN': '보병',
      'SPEARMAN': '창병',
      'ARCHER': '궁병',
      'CAVALRY': '기병',
      'SIEGE': '공성',
      'WIZARD': '귀병',
      'MIXED': '복합',
      'CASTLE': '성벽',
    };
    return nameMap[type];
  };

  const unitType = getUnitType(crewtype);
  const unitName = getUnitName(unitType);

  if (showLabel) {
    return (
      <div className={`troop-icon-display ${className}`} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <TroopIcon type={unitType} size={size} />
        <span style={{ fontSize: '12px', fontWeight: 500 }}>{unitName}</span>
      </div>
    );
  }

  return <TroopIcon type={unitType} size={size} className={className} />;
};

export default TroopIconDisplay;
