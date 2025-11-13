'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './CommandSelectDialog.module.css';
import type { ColorSystem } from '@/types/colorSystem';

interface CommandItem {
  value: string;
  simpleName: string;
  reqArg: number;
  possible: boolean;
  compensation: number;
  title: string;
}

interface CommandTableCategory {
  category: string;
  values: CommandItem[];
}

interface CommandSelectDialogProps {
  commandTable: CommandTableCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (command: CommandItem) => void;
  turnIndex?: number | null;
  turnYear?: number;
  turnMonth?: number;
  turnTime?: string;
  nationColor?: string;
  colorSystem?: ColorSystem;
}

export default function CommandSelectDialog({
  commandTable,
  isOpen,
  onClose,
  onSelectCommand,
  turnIndex = null,
  turnYear,
  turnMonth,
  turnTime,
  nationColor,
  colorSystem,
}: CommandSelectDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && commandTable.length > 0) {
      setSelectedCategory(commandTable[0].category);
    }
  }, [isOpen, commandTable]);

  // Auto-focus dialog when opened
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  // 명령 테이블이 없으면 메시지 표시
  if (commandTable.length === 0) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h3>명령 선택</h3>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>
            명령 테이블을 불러오는 중입니다...
          </div>
        </div>
      </div>
    );
  }

  const selectedCategoryData = commandTable.find(cat => cat.category === selectedCategory);

  const handleCommandClick = (command: CommandItem) => {
    if (!command.possible) {
      return; // 불가능한 명령은 클릭 불가
    }
    onSelectCommand(command);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        ref={dialogRef} 
        tabIndex={-1} 
        className={styles.dialog} 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: colorSystem?.pageBg,
          borderColor: colorSystem?.border,
          color: colorSystem?.text,
        }}
      >
        <div className={styles.header}>
          <h3 style={{ color: colorSystem?.text }}>
            명령 선택
            {turnIndex !== null && (
              <span style={{ fontSize: '0.85em', fontWeight: 'normal', marginLeft: '0.5rem', color: colorSystem?.textMuted }}>
                - {turnIndex + 1}턴{turnYear && turnMonth ? ` (${turnYear}年 ${turnMonth}月${turnTime ? ` ${turnTime}` : ''})` : ''}
              </span>
            )}
          </h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.categoryButtons}>
          {commandTable.map((category) => (
            <button
              key={category.category}
              className={`${styles.categoryButton} ${selectedCategory === category.category ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category.category)}
              style={{
                backgroundColor: selectedCategory === category.category ? colorSystem?.buttonActive : colorSystem?.buttonBg,
                borderColor: colorSystem?.border,
                color: colorSystem?.buttonText,
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.category) {
                  e.currentTarget.style.backgroundColor = colorSystem?.buttonHover || '';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.category) {
                  e.currentTarget.style.backgroundColor = colorSystem?.buttonBg || '';
                }
              }}
            >
              {category.category}
            </button>
          ))}
        </div>

        <div className={styles.commandList}>
          {selectedCategoryData && selectedCategoryData.values.map((command) => (
            <div
              key={command.value}
              className={`${styles.commandItem} ${!command.possible ? styles.disabled : ''}`}
              onClick={() => handleCommandClick(command)}
              title={command.title}
              style={{
                backgroundColor: command.possible ? colorSystem?.buttonBg : colorSystem?.borderLight,
                borderColor: colorSystem?.borderLight,
                color: command.possible ? colorSystem?.buttonText : colorSystem?.textDim,
              }}
              onMouseEnter={(e) => {
                if (command.possible) {
                  e.currentTarget.style.backgroundColor = colorSystem?.buttonHover || '';
                }
              }}
              onMouseLeave={(e) => {
                if (command.possible) {
                  e.currentTarget.style.backgroundColor = colorSystem?.buttonBg || '';
                }
              }}
            >
              <div className={styles.commandBody}>
                <div className={styles.commandName}>
                  {command.simpleName}
                  {command.compensation > 0 && (
                    <span className={styles.compensatePositive}>▲</span>
                  )}
                  {command.compensation < 0 && (
                    <span className={styles.compensateNegative}>▼</span>
                  )}
                </div>
                <div className={styles.commandTitle}>
                  {typeof command.title === 'string' && command.title.startsWith(command.simpleName)
                    ? command.title.substring(command.simpleName.length)
                    : (command.title || '')}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.closeFooterButton} 
            onClick={onClose}
            style={{
              backgroundColor: colorSystem?.buttonBg,
              color: colorSystem?.buttonText,
              borderColor: colorSystem?.border,
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

