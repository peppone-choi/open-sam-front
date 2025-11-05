'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getNPCColor } from '@/lib/utils/game/getNPCColor';
import { convertSearch초성 } from '@/lib/utils/game/convertSearch초성';
import styles from './SelectGeneral.module.css';

// Export types for use in other components
export type ProcGeneralItem = {
  no: number;
  name: string;
  nationID?: number;
  officerLevel: number;
  npc: number;
  gold?: number;
  rice?: number;
  leadership: number;
  strength: number;
  intel: number;
  cityID?: number;
  crew?: number;
  train?: number;
  atmos?: number;
  troopID?: number;
}

export type ProcNationItem = {
  id: number;
  name: string;
  color: string;
  power: number;
  scoutMsg?: string;
  info?: string;
  notAvailable?: boolean;
}

interface SelectedGeneral {
  value: number;
  searchText: string;
  title: string;
  simpleName: string;
  obj: ProcGeneralItem;
}

interface SelectGeneralProps {
  value: number;
  generals: ProcGeneralItem[];
  groupByNation?: Map<number, ProcNationItem>;
  textHelper?: (item: ProcGeneralItem) => string;
  searchable?: boolean;
  troops?: Record<number, { troop_leader: number; nation: number; name: string }>;
  onChange: (value: number) => void;
}

export default function SelectGeneral({
  value,
  generals,
  groupByNation,
  textHelper,
  searchable = true,
  troops,
  onChange
}: SelectGeneralProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // 검색 가능한 목록 생성
  const options = useMemo(() => {
    const groups = new Map<number, SelectedGeneral[]>();
    const flatList: SelectedGeneral[] = [];

    for (const gen of generals) {
      const nameColor = getNPCColor(gen.npc);
      const name = nameColor 
        ? `<span style="color:${nameColor}">${gen.name}</span>` 
        : gen.name;

      const searchText = convertSearch초성(gen.name).join('|');
      let finalSearchText = searchText;
      
      if (gen.no === gen.troopID && troops && gen.no in troops) {
        const troopName = troops[gen.no].name;
        finalSearchText += '|' + convertSearch초성(troopName).join('|');
      }

      const title = textHelper 
        ? textHelper(gen)
        : `${name} (${gen.leadership}/${gen.strength}/${gen.intel})`;

      const option: SelectedGeneral = {
        value: gen.no,
        title,
        simpleName: gen.name,
        searchText: finalSearchText,
        obj: gen
      };

      if (groupByNation) {
        const nationID = gen.nationID ?? 0;
        if (!groups.has(nationID)) {
          groups.set(nationID, []);
        }
        groups.get(nationID)!.push(option);
      } else {
        flatList.push(option);
      }
    }

    return { groups, flatList };
  }, [generals, groupByNation, textHelper, troops]);

  // 검색 필터링
  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options;
    }

    const searchLower = searchTerm.toLowerCase();
    const filteredGroups = new Map<number, SelectedGeneral[]>();
    const filteredFlat: SelectedGeneral[] = [];

    const matches = (opt: SelectedGeneral) => {
      return opt.searchText.toLowerCase().includes(searchLower) ||
             opt.simpleName.toLowerCase().includes(searchLower);
    };

    if (groupByNation) {
      for (const [nationID, opts] of options.groups.entries()) {
        const filtered = opts.filter(matches);
        if (filtered.length > 0) {
          filteredGroups.set(nationID, filtered);
        }
      }
    } else {
      filteredFlat.push(...options.flatList.filter(matches));
    }

    return { groups: filteredGroups, flatList: filteredFlat };
  }, [options, searchTerm, groupByNation]);

  // 선택된 항목 찾기
  const selectedOption = useMemo(() => {
    if (groupByNation) {
      for (const opts of options.groups.values()) {
        const found = opts.find(opt => opt.value === value);
        if (found) return found;
      }
    } else {
      return options.flatList.find(opt => opt.value === value);
    }
    return null;
  }, [options, value, groupByNation]);

  const handleSelect = (option: SelectedGeneral) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={styles.selectContainer}>
      <div 
        className={styles.selectInput}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? (
          <span dangerouslySetInnerHTML={{ __html: selectedOption.simpleName }} />
        ) : (
          <span className={styles.placeholder}>장수 선택</span>
        )}
        {groupByNation && selectedOption && (
          <span className={styles.nationBadge}>
            [{groupByNation.get(selectedOption.obj.nationID ?? 0)?.name}]
          </span>
        )}
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {searchable && (
            <input
              type="text"
              className={styles.searchInput}
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <div className={styles.options}>
            {groupByNation ? (
              // 국가별 그룹화
              Array.from(filteredOptions.groups.entries()).map(([nationID, opts]) => {
                const nation = groupByNation.get(nationID);
                if (!nation) return null;

                const isBright = isBrightColor(nation.color);
                
                return (
                  <div key={nationID}>
                    <div 
                      className={styles.groupHeader}
                      style={{
                        backgroundColor: nation.color,
                        color: isBright ? 'black' : 'white'
                      }}
                    >
                      {nation.name}
                    </div>
                    {opts.map(opt => (
                      <div
                        key={opt.value}
                        className={`${styles.option} ${opt.value === value ? styles.selected : ''}`}
                        onClick={() => handleSelect(opt)}
                      >
                        <span dangerouslySetInnerHTML={{ __html: opt.title }} />
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              // 평면 목록
              filteredOptions.flatList.map(opt => (
                <div
                  key={opt.value}
                  className={`${styles.option} ${opt.value === value ? styles.selected : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  <span dangerouslySetInnerHTML={{ __html: opt.title }} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function isBrightColor(color: string): boolean {
  if (!color) return false;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

