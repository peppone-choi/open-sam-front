'use client';

import React, { useState, useMemo } from 'react';
import { convertSearch초성 } from '@/lib/utils/game/convertSearch초성';
import styles from './SelectNation.module.css';
import type { ProcNationItem } from './SelectGeneral';

interface SelectedNation {
  value: number;
  searchText: string;
  title: string;
  simpleName: string;
  info?: string;
  notAvailable?: boolean;
}

interface SelectNationProps {
  value: number;
  nations: Map<number, ProcNationItem>;
  searchable?: boolean;
  onChange: (value: number) => void;
}

export default function SelectNation({
  value,
  nations,
  searchable = true,
  onChange
}: SelectNationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(() => {
    const list: SelectedNation[] = [];
    
    for (const nation of nations.values()) {
      list.push({
        value: nation.id,
        title: nation.name,
        simpleName: nation.name,
        info: nation.info,
        searchText: convertSearch초성(nation.name).join('|'),
        notAvailable: nation.notAvailable
      });
    }
    
    return list;
  }, [nations]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    
    const searchLower = searchTerm.toLowerCase();
    return options.filter(opt => 
      opt.searchText.toLowerCase().includes(searchLower) ||
      opt.simpleName.toLowerCase().includes(searchLower)
    );
  }, [options, searchTerm]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (option: SelectedNation) => {
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
          <span className={styles.placeholder}>국가 선택</span>
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

