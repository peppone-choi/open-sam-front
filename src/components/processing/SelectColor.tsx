'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import styles from './SelectColor.module.css';

interface SelectedColor {
  value: number;
  title: string;
}

interface SelectColorProps {
  value: number;
  colors: string[];
  onChange: (value: number) => void;
  placeholder?: string;
}

/**
 * 국가 색상 선택 컴포넌트
 * Vue의 SelectColor.vue를 React로 변환
 */
export default function SelectColor({
  value,
  colors,
  onChange,
  placeholder = '색상 선택'
}: SelectColorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    return colors.map((title, index) => ({
      value: index,
      title
    }));
  }, [colors]);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: SelectedColor) => {
    onChange(option.value);
    setIsOpen(false);
  };

  /**
   * 색상 코드 추출 (예: "#FF0000" -> "FF0000")
   * Vue에서는 sam-color-{colorCode} 클래스를 사용
   */
  const getColorCode = (title: string): string => {
    if (title.startsWith('#')) {
      return title.slice(1);
    }
    return title;
  };

  return (
    <div className={styles.selectContainer} ref={containerRef}>
      <div 
        className={styles.selectInput}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? (
          <div 
            className={styles.colorPreview}
            data-color={selectedOption.value}
            style={{ 
              backgroundColor: selectedOption.title.startsWith('#') 
                ? selectedOption.title 
                : undefined 
            }}
          >
            {selectedOption.title}
          </div>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.options}>
            {options.map(opt => (
              <div
                key={opt.value}
                className={`${styles.option} ${opt.value === value ? styles.selected : ''}`}
                onClick={() => handleSelect(opt)}
              >
                <div 
                  className={styles.colorBox}
                  data-color={opt.value}
                  style={{ 
                    backgroundColor: opt.title.startsWith('#') 
                      ? opt.title 
                      : undefined 
                  }}
                >
                  {opt.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

