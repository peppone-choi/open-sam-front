'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { convertSearch초성 } from '@/lib/utils/game/convertSearch초성';
import styles from './SelectCity.module.css';

interface CityItem {
  name: string;
  info?: string;
}

interface SelectedCity {
  value: number;
  searchText: string;
  title: string;
  simpleName: string;
  info?: string;
  notAvailable?: boolean;
}

interface SelectCityProps {
  value: number;
  cities: Map<number, CityItem>;
  searchable?: boolean;
  onChange: (value: number) => void;
  notAvailableCities?: Set<number>; // 사용 불가능한 도시 ID 목록
}

export default function SelectCity({
  value,
  cities,
  searchable = true,
  onChange,
  notAvailableCities
}: SelectCityProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(() => {
    const list: SelectedCity[] = [];
    const notAvailableSet = notAvailableCities || new Set<number>();
    
    for (const [cityID, city] of cities.entries()) {
      list.push({
        value: cityID,
        title: city.name,
        simpleName: city.name,
        info: city.info,
        searchText: convertSearch초성(city.name).join('|'),
        notAvailable: notAvailableSet.has(cityID)
      });
    }
    
    return list;
  }, [cities, notAvailableCities]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    
    const searchLower = searchTerm.toLowerCase();
    return options.filter(opt => 
      opt.searchText.toLowerCase().includes(searchLower) ||
      opt.simpleName.toLowerCase().includes(searchLower)
    );
  }, [options, searchTerm]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (option: SelectedCity) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={styles.selectContainer}>
      <button 
        type="button"
        className="flex items-center justify-between w-full min-h-[44px] px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white cursor-pointer hover:bg-black/60 transition-colors text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="도시 선택 메뉴 열기"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedOption ? (
          <span className="truncate">
            {selectedOption.simpleName}
            {selectedOption.notAvailable && (
              <span className="text-red-400 opacity-80 text-xs ml-1"> (불가)</span>
            )}
          </span>
        ) : (
          <span className="text-white/40">도시 선택</span>
        )}
        <span className="text-white/40 text-xs ml-2" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden shadow-xl max-h-[400px] flex flex-col" role="listbox" aria-label="도시 목록">
          {searchable && (
            <input
              type="text"
              className="w-full p-3 bg-black/20 border-b border-white/10 text-white text-sm focus:outline-none focus:bg-black/40"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              aria-label="도시 검색"
            />
          )}

          <div className="overflow-y-auto max-h-[350px]">
            {filteredOptions.map(opt => (
              <button
                type="button"
                key={opt.value}
                className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-0 transition-colors flex items-center justify-between
                  ${opt.value === value ? 'bg-primary/20 text-blue-400 font-medium' : 'hover:bg-white/10 text-gray-300'}
                  ${opt.notAvailable ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                onClick={() => handleSelect(opt)}
                role="option"
                aria-selected={opt.value === value}
                aria-disabled={opt.notAvailable}
                disabled={opt.notAvailable}
              >
                <span>
                  {opt.title}
                  {opt.notAvailable && <span className="text-red-400 text-xs ml-1"> (불가)</span>}
                </span>
                {opt.info && <span className="text-xs text-white/30 ml-2"> {opt.info}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

