'use client';

import React, { useEffect, useState } from 'react';
import styles from './CommandSelectDialog.module.css';
import type { ColorSystem } from '@/types/colorSystem';

export interface CommandItem {
  value: string;
  simpleName: string;
  reqArg: number;
  possible: boolean;
  compensation: number;
  title: string;
}

export interface CommandTableCategory {
  category: string;
  values: CommandItem[];
}

interface CommandSelectFormProps {
  commandTable: CommandTableCategory[];
  onClose?: () => void;
  onSelectCommand: (command: CommandItem) => void;
  turnIndex?: number | null;
  turnYear?: number;
  turnMonth?: number;
  turnTime?: string;
  colorSystem?: ColorSystem;
  style?: React.CSSProperties;
  className?: string;
  hideHeader?: boolean;
}

export default function CommandSelectForm({
  commandTable,
  onClose,
  onSelectCommand,
  turnIndex = null,
  turnYear,
  turnMonth,
  turnTime,
  colorSystem,
  style,
  className,
  hideHeader = false,
}: CommandSelectFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    if (!selectedCategory && commandTable.length > 0) {
      setSelectedCategory(commandTable[0].category);
    }
  }, [commandTable, selectedCategory]);

  if (commandTable.length === 0) {
    return (
      <div className={`${styles.dialog} ${className || ''}`} style={style}>
        {!hideHeader && (
          <div className={styles.header}>
            <h3 id="command-select-form-title">명령 선택</h3>
            {onClose && (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="명령 선택 닫기"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>
          명령 테이블을 불러오는 중입니다...
        </div>
      </div>
    );
  }

  const resolvedCategory =
    commandTable.find((cat) => cat.category === selectedCategory) || commandTable[0];

  const handleCommandClick = (command: CommandItem) => {
    if (!command.possible) {
      return;
    }
    onSelectCommand(command);
  };

  return (
    <div
      className={`${styles.dialog} ${className || ''}`}
      style={{
        backgroundColor: colorSystem?.pageBg,
        borderColor: colorSystem?.border,
        color: colorSystem?.text,
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {!hideHeader && (
        <div className={styles.header}>
          <h3
            id="command-select-form-title"
            style={{ color: colorSystem?.text }}
          >
            명령 선택
            {turnIndex !== null && (
              <span
                id="command-select-form-description"
                style={{
                  fontSize: '0.85em',
                  fontWeight: 'normal',
                  marginLeft: '0.5rem',
                  color: colorSystem?.textMuted,
                }}
              >
                - {turnIndex + 1}턴
                {turnYear && turnMonth
                  ? ` (${turnYear}年 ${turnMonth}月${turnTime ? ` ${turnTime}` : ''})`
                  : ''}
              </span>
            )}
          </h3>
          {onClose && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="명령 선택 닫기"
            >
              ×
            </button>
          )}
        </div>
      )}

      <div className={styles.categoryButtons}>
        {commandTable.map((category) => (
          <button
            key={category.category}
            type="button"
            className={`${styles.categoryButton} ${
              resolvedCategory.category === category.category ? styles.active : ''
            }`}
            onClick={() => setSelectedCategory(category.category)}
          >
            {category.category}
          </button>
        ))}
      </div>

      <div className={styles.commandList}>
        {resolvedCategory.values.map((command) => (
          <div
            key={command.value}
            className={`${styles.commandItem} ${!command.possible ? styles.disabled : ''}`}
            onClick={() => handleCommandClick(command)}
            title={command.title}
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
                  : command.title || ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      {onClose && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.closeFooterButton}
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
