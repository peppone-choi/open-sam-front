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
      <div 
        className={styles.selectInput}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? (
          <span>
            {selectedOption.simpleName}
            {selectedOption.notAvailable && (
              <span className={styles.notAvailable}> (불가)</span>
            )}
          </span>
        ) : (
          <span className={styles.placeholder}>도시 선택</span>
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
            {filteredOptions.map(opt => (
              <div
                key={opt.value}
                className={`${styles.option} ${opt.value === value ? styles.selected : ''} ${opt.notAvailable ? styles.notAvailable : ''}`}
                onClick={() => handleSelect(opt)}
              >
                <span>
                  {opt.title}
                  {opt.info && <span className={styles.info}> ({opt.info})</span>}
                  {opt.notAvailable && <span className={styles.notAvailable}> (불가)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

